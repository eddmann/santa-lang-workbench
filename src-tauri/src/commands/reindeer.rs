use crate::state::{AppState, Reindeer};
use serde::Deserialize;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::State;

#[derive(Deserialize)]
struct VersionInfo {
    reindeer: String,
    version: String,
}

#[tauri::command]
pub fn get_reindeer(state: State<'_, Mutex<AppState>>) -> Result<Vec<Reindeer>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.reindeer.values().cloned().collect())
}

#[tauri::command]
pub fn add_reindeer(
    state: State<'_, Mutex<AppState>>,
    app: tauri::AppHandle,
    path: String,
) -> Result<Reindeer, String> {
    let path = PathBuf::from(&path);

    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let info = detect_reindeer_info(&path)?;

    let id = uuid::Uuid::new_v4().to_string();
    let reindeer = Reindeer {
        id: id.clone(),
        name: info.0,
        codename: info.1,
        version: info.2,
        path,
    };

    {
        let mut state = state.lock().map_err(|e| e.to_string())?;
        state.reindeer.insert(id, reindeer.clone());
        state.save(&app).map_err(|e| e.to_string())?;
    }

    Ok(reindeer)
}

#[tauri::command]
pub fn remove_reindeer(
    state: State<'_, Mutex<AppState>>,
    app: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.reindeer.remove(&id);
    state.save(&app).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn detect_reindeer(path: String) -> Result<(String, String, String), String> {
    let path = PathBuf::from(&path);
    detect_reindeer_info(&path)
}

fn detect_reindeer_info(path: &PathBuf) -> Result<(String, String, String), String> {
    let output = Command::new(path)
        .args(["--version", "-o", "json"])
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    if !output.status.success() {
        return Err("Version command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let info: VersionInfo = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse version JSON: {}", e))?;

    // Derive codename from reindeer name (lowercase)
    let codename = info.reindeer.to_lowercase();

    Ok((info.reindeer, codename, info.version))
}
