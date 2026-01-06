mod commands;
mod config;
mod menu;
mod state;

use tauri::{Emitter, Manager};

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

            // Create and set native menu
            let menu = menu::create_menu(app.handle())?;
            app.set_menu(menu)?;

            // Handle menu events by emitting to frontend
            app.on_menu_event(|app_handle, event| {
                let _ = app_handle.emit("menu-event", event.id().0.as_str());
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::reindeer::get_reindeer,
            commands::reindeer::add_reindeer,
            commands::reindeer::remove_reindeer,
            commands::reindeer::detect_reindeer,
            commands::github::get_github_releases,
            commands::github::download_reindeer,
            commands::execution::run_execution,
            commands::execution::cancel_execution,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::formatter::get_formatter_status,
            commands::formatter::fetch_formatter_releases,
            commands::formatter::download_formatter,
            commands::formatter::format_code,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
