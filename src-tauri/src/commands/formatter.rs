use crate::config::FORMATTER_REPO;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatterStatus {
    pub installed: bool,
    pub path: Option<String>,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatResult {
    pub success: bool,
    pub formatted: Option<String>,
    pub error: Option<FormatError>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatError {
    pub message: String,
    pub line: Option<u32>,
    pub column: Option<u32>,
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

fn detect_formatter_version(path: &PathBuf) -> Option<String> {
    let output = Command::new(path).arg("--version").output().ok()?;

    if !output.status.success() {
        return None;
    }

    let version_str = String::from_utf8_lossy(&output.stdout);
    let version_str = version_str.trim();

    // Parse version output, e.g., "santa-lang Comet 0.0.13" or "Comet 0.0.13"
    let parts: Vec<&str> = version_str.split_whitespace().collect();
    if parts.len() >= 2 {
        Some(parts.last()?.to_string())
    } else {
        None
    }
}

#[tauri::command]
pub fn get_formatter_status(state: State<'_, Mutex<AppState>>) -> Result<FormatterStatus, String> {
    let state = state.lock().map_err(|e| e.to_string())?;

    if let Some(ref path) = state.settings.formatter_path {
        if path.exists() {
            let version = detect_formatter_version(path);
            return Ok(FormatterStatus {
                installed: true,
                path: Some(path.to_string_lossy().to_string()),
                version,
            });
        }
    }

    Ok(FormatterStatus {
        installed: false,
        path: None,
        version: None,
    })
}

#[tauri::command]
pub async fn fetch_formatter_releases() -> Result<Vec<Release>, String> {
    let url = format!("https://api.github.com/repos/{}/releases", FORMATTER_REPO);

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

    Ok(releases)
}

#[tauri::command]
pub async fn download_formatter(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    asset_url: String,
    asset_name: String,
) -> Result<String, String> {
    // Determine download directory
    let download_dir = dirs::data_local_dir()
        .ok_or("Could not find local data directory")?
        .join("santa-lang-toy-shop")
        .join("formatter");

    std::fs::create_dir_all(&download_dir).map_err(|e| e.to_string())?;

    let dest_path = download_dir.join(&asset_name);

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

    // Update state with formatter path
    {
        let mut state = state.lock().map_err(|e| e.to_string())?;
        state.settings.formatter_path = Some(dest_path.clone());
        state.save(&app).map_err(|e| e.to_string())?;
    }

    Ok(dest_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn format_code(
    state: State<'_, Mutex<AppState>>,
    source: String,
) -> Result<FormatResult, String> {
    let state = state.lock().map_err(|e| e.to_string())?;

    let formatter_path = state
        .settings
        .formatter_path
        .as_ref()
        .ok_or("Formatter not installed")?;

    if !formatter_path.exists() {
        return Err("Formatter binary not found".to_string());
    }

    // Run formatter with source via stdin
    use std::process::Stdio;
    use std::io::Write;

    let mut child = Command::new(formatter_path)
        .arg("-f")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    // Write source to stdin
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(source.as_bytes()).map_err(|e| e.to_string())?;
    }

    let output = child.wait_with_output().map_err(|e| e.to_string())?;

    if output.status.success() {
        let formatted = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(FormatResult {
            success: true,
            formatted: Some(formatted),
            error: None,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        // Try to parse error location from stderr
        // Format is typically: "Error at line X, column Y: message"
        let (line, column, message) = parse_error_location(&stderr);

        Ok(FormatResult {
            success: false,
            formatted: None,
            error: Some(FormatError {
                message,
                line,
                column,
            }),
        })
    }
}

fn parse_error_location(stderr: &str) -> (Option<u32>, Option<u32>, String) {
    // Try to extract line/column from error message
    // Common formats:
    // - "Error at line 5, column 12: unexpected token"
    // - "[line 5] Error: unexpected token"
    // - "5:12: unexpected token"

    let stderr_trimmed = stderr.trim();

    // Try "line X, column Y" pattern
    if let Some(caps) = regex_lite::Regex::new(r"line\s+(\d+),?\s*column\s+(\d+)")
        .ok()
        .and_then(|re| re.captures(stderr_trimmed))
    {
        let line = caps.get(1).and_then(|m| m.as_str().parse().ok());
        let column = caps.get(2).and_then(|m| m.as_str().parse().ok());
        return (line, column, stderr_trimmed.to_string());
    }

    // Try "X:Y:" pattern (common in many compilers)
    if let Some(caps) = regex_lite::Regex::new(r"^(\d+):(\d+):")
        .ok()
        .and_then(|re| re.captures(stderr_trimmed))
    {
        let line = caps.get(1).and_then(|m| m.as_str().parse().ok());
        let column = caps.get(2).and_then(|m| m.as_str().parse().ok());
        return (line, column, stderr_trimmed.to_string());
    }

    // Fallback: no location info
    (None, None, stderr_trimmed.to_string())
}
