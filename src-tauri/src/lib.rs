mod commands;
mod config;
mod state;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let state = state::AppState::load(app.handle())?;
            app.manage(std::sync::Mutex::new(state));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::implementations::get_implementations,
            commands::implementations::add_implementation,
            commands::implementations::remove_implementation,
            commands::implementations::detect_implementation,
            commands::github::get_github_releases,
            commands::github::download_implementation,
            commands::execution::run_execution,
            commands::execution::cancel_execution,
            commands::settings::get_settings,
            commands::settings::save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
