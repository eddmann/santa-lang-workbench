use crate::state::{AppState, Implementation};
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn get_implementations(
    state: State<'_, Mutex<AppState>>,
) -> Result<Vec<Implementation>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.implementations.values().cloned().collect())
}

#[tauri::command]
pub fn add_implementation(
    state: State<'_, Mutex<AppState>>,
    app: tauri::AppHandle,
    path: String,
) -> Result<Implementation, String> {
    let path = PathBuf::from(&path);

    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let info = detect_implementation_info(&path)?;

    let id = uuid::Uuid::new_v4().to_string();
    let implementation = Implementation {
        id: id.clone(),
        name: info.0,
        codename: info.1,
        version: info.2,
        path,
    };

    {
        let mut state = state.lock().map_err(|e| e.to_string())?;
        state.implementations.insert(id, implementation.clone());
        state.save(&app).map_err(|e| e.to_string())?;
    }

    Ok(implementation)
}

#[tauri::command]
pub fn remove_implementation(
    state: State<'_, Mutex<AppState>>,
    app: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.implementations.remove(&id);
    state.save(&app).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn detect_implementation(path: String) -> Result<(String, String, String), String> {
    let path = PathBuf::from(&path);
    detect_implementation_info(&path)
}

fn detect_implementation_info(path: &PathBuf) -> Result<(String, String, String), String> {
    let output = Command::new(path)
        .arg("--version")
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    let version_str = String::from_utf8_lossy(&output.stdout);
    let version_str = version_str.trim();

    // Parse version output like "santa-lang-comet 0.0.13" or "Comet 0.0.13"
    let parts: Vec<&str> = version_str.split_whitespace().collect();

    if parts.len() >= 2 {
        let name_part = parts[0].to_lowercase();
        let version = parts[1].to_string();

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
        } else if name_part.contains("vixen") || name_part == "vixen" {
            ("Vixen".to_string(), "vixen".to_string())
        } else {
            ("Unknown".to_string(), "unknown".to_string())
        };

        Ok((name, codename, version))
    } else {
        Err("Could not parse version output".to_string())
    }
}
