use crate::state::{AppState, Reindeer};
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::State;

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
        .arg("--version")
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    let version_str = String::from_utf8_lossy(&output.stdout);
    let version_str = version_str.trim();

    let parts: Vec<&str> = version_str.split_whitespace().collect();

    // Handle both formats:
    // - 3 parts: "santa-lang Comet 0.0.13" (name_part at [1], version at [2])
    // - 2 parts: "Comet 0.0.13" or "santa-lang-comet 0.0.13" (name_part at [0], version at [1])
    let (name_part, version) = if parts.len() >= 3 && parts[0] == "santa-lang" {
        (parts[1].to_lowercase(), parts[2].to_string())
    } else if parts.len() >= 2 {
        (parts[0].to_lowercase(), parts[1].to_string())
    } else {
        return Err("Could not parse version output".to_string());
    };

    let (name, codename) = if name_part.contains("comet") || name_part == "comet" {
        ("Comet".to_string(), "comet".to_string())
    } else if name_part.contains("blitzen") || name_part == "blitzen" {
        ("Blitzen".to_string(), "blitzen".to_string())
    } else if name_part.contains("dasher") || name_part == "dasher" {
        ("Dasher".to_string(), "dasher".to_string())
    } else if name_part.contains("donner") || name_part == "donner" {
        ("Donner".to_string(), "donner".to_string())
    } else if name_part.contains("prancer") || name_part == "prancer" {
        ("Prancer".to_string(), "prancer".to_string())
    } else {
        ("Unknown".to_string(), "unknown".to_string())
    };

    Ok((name, codename, version))
}
