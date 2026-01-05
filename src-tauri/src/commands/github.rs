use crate::config::get_repo_for_codename;
use serde::{Deserialize, Serialize};

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
        .ok_or_else(|| format!("Unknown implementation: {}", codename))?;

    let url = format!("https://api.github.com/repos/{}/releases", repo);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("User-Agent", "santa-lang-studio")
        .header("Accept", "application/vnd.github.v3+json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let releases: Vec<Release> = response.json().await.map_err(|e| e.to_string())?;

    Ok(releases)
}

#[tauri::command]
pub async fn download_implementation(
    codename: String,
    asset_url: String,
    asset_name: String,
) -> Result<String, String> {
    // Determine download directory
    let download_dir = dirs::data_local_dir()
        .ok_or("Could not find local data directory")?
        .join("santa-lang-studio")
        .join("implementations")
        .join(&codename);

    std::fs::create_dir_all(&download_dir).map_err(|e| e.to_string())?;

    let dest_path = download_dir.join(&asset_name);

    // Download the file
    let client = reqwest::Client::new();
    let response = client
        .get(&asset_url)
        .header("User-Agent", "santa-lang-studio")
        .header("Accept", "application/octet-stream")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Download failed: {}", response.status()));
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    std::fs::write(&dest_path, &bytes).map_err(|e| e.to_string())?;

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
