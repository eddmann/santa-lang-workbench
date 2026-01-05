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
