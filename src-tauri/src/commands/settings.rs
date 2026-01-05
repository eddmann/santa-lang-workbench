use crate::state::{AppState, Settings};
use std::sync::Mutex;
use tauri::State;

#[tauri::command]
pub fn get_settings(state: State<'_, Mutex<AppState>>) -> Result<Settings, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    Ok(state.settings.clone())
}

#[tauri::command]
pub fn save_settings(
    state: State<'_, Mutex<AppState>>,
    app: tauri::AppHandle,
    settings: Settings,
) -> Result<(), String> {
    let mut state = state.lock().map_err(|e| e.to_string())?;
    state.settings = settings;
    state.save(&app).map_err(|e| e.to_string())?;
    Ok(())
}
