use crate::config::get_repo_for_codename;
use serde::{Deserialize, Serialize};

/// Check if a version tag represents >= 1.0.0
/// Handles tags like "v1.0.0", "1.0.0", "v1.2.3", etc.
fn is_version_gte_1_0_0(tag: &str) -> bool {
    let version = tag.strip_prefix('v').unwrap_or(tag);
    version
        .split('.')
        .next()
        .and_then(|s| s.parse::<u32>().ok())
        .map_or(false, |major| major >= 1)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Release {
    pub tag_name: String,
    pub name: String,
    pub published_at: String,
    pub assets: Vec<Asset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Asset {
    pub name: String,
    pub browser_download_url: String,
    pub size: u64,
}

#[tauri::command]
pub async fn get_github_releases(codename: String) -> Result<Vec<Release>, String> {
    let repo = get_repo_for_codename(&codename)
        .ok_or_else(|| format!("Unknown reindeer: {}", codename))?;

    let url = format!("https://api.github.com/repos/{}/releases", repo);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "santa-lang-toy-shop")
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let releases: Vec<Release> = response.json().await.map_err(|e| e.to_string())?;

    // Filter to only releases >= 1.0.0 (when JSONL support was added)
    let filtered: Vec<Release> = releases
        .into_iter()
        .filter(|r| is_version_gte_1_0_0(&r.tag_name))
        .collect();

    Ok(filtered)
}

#[tauri::command]
pub async fn download_reindeer(
    codename: String,
    asset_url: String,
    asset_name: String,
) -> Result<String, String> {
    // Determine download directory
    let download_dir = dirs::data_local_dir()
        .ok_or("Could not find local data directory")?
        .join("santa-lang-toy-shop")
        .join("reindeer")
        .join(&codename);

    std::fs::create_dir_all(&download_dir).map_err(|e| e.to_string())?;

    // Download the file
    let client = reqwest::Client::new();
    let response = client
        .get(&asset_url)
        .header("User-Agent", "santa-lang-toy-shop")
        .header("Accept", "application/octet-stream")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Download failed: {}", response.status()));
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;

    // Handle tar.gz archives (e.g., Donner)
    let dest_path = if asset_name.ends_with(".tar.gz") {
        extract_tarball(&bytes, &download_dir, &asset_name)?
    } else {
        let path = download_dir.join(&asset_name);
        std::fs::write(&path, &bytes).map_err(|e| e.to_string())?;
        path
    };

    // Make executable on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&dest_path)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&dest_path, perms).map_err(|e| e.to_string())?;
    }

    Ok(dest_path.to_string_lossy().to_string())
}

/// Extract a tar.gz archive and find the CLI binary inside
fn extract_tarball(
    data: &[u8],
    download_dir: &std::path::Path,
    _asset_name: &str,
) -> Result<std::path::PathBuf, String> {
    use flate2::read::GzDecoder;
    use tar::Archive;

    let decoder = GzDecoder::new(data);
    let mut archive = Archive::new(decoder);

    // Extract directly to download directory
    archive
        .unpack(download_dir)
        .map_err(|e| format!("Failed to extract archive: {}", e))?;

    // Find the CLI binary inside
    // macOS app bundle: santa-cli.app/Contents/MacOS/santa-cli (keep whole bundle)
    // Linux: santa-cli/bin/santa-cli
    let binary_path = if download_dir.join("santa-cli.app").exists() {
        // macOS: Keep the whole app bundle, return path to binary inside it
        download_dir.join("santa-cli.app/Contents/MacOS/santa-cli")
    } else if download_dir.join("santa-cli").exists() {
        // Linux: Return path to binary inside extracted directory
        download_dir.join("santa-cli/bin/santa-cli")
    } else {
        return Err("Could not find CLI binary in archive".to_string());
    };

    if !binary_path.exists() {
        return Err(format!(
            "Binary not found at expected path: {:?}",
            binary_path
        ));
    }

    Ok(binary_path)
}
