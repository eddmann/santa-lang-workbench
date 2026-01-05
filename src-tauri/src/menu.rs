use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Wry,
};

pub fn create_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Menu<Wry>> {
    // File menu
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&MenuItemBuilder::with_id("new-tab", "New Tab").accelerator("CmdOrCtrl+N").build(app)?)
        .item(&MenuItemBuilder::with_id("open", "Open...").accelerator("CmdOrCtrl+O").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("save", "Save").accelerator("CmdOrCtrl+S").build(app)?)
        .item(&MenuItemBuilder::with_id("save-as", "Save As...").accelerator("CmdOrCtrl+Shift+S").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("close-tab", "Close Tab").accelerator("CmdOrCtrl+W").build(app)?)
        .build()?;

    // Edit menu (predefined items for native clipboard integration)
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&PredefinedMenuItem::undo(app, Some("Undo"))?)
        .item(&PredefinedMenuItem::redo(app, Some("Redo"))?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, Some("Cut"))?)
        .item(&PredefinedMenuItem::copy(app, Some("Copy"))?)
        .item(&PredefinedMenuItem::paste(app, Some("Paste"))?)
        .item(&PredefinedMenuItem::select_all(app, Some("Select All"))?)
        .build()?;

    // Run menu
    let run_menu = SubmenuBuilder::new(app, "Run")
        .item(&MenuItemBuilder::with_id("run", "Run").accelerator("CmdOrCtrl+R").build(app)?)
        .item(&MenuItemBuilder::with_id("test", "Run Tests").accelerator("CmdOrCtrl+Shift+T").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("stop", "Stop").accelerator("CmdOrCtrl+.").build(app)?)
        .build()?;

    // Window menu
    let window_menu = SubmenuBuilder::new(app, "Window")
        .item(&PredefinedMenuItem::minimize(app, Some("Minimize"))?)
        .item(&PredefinedMenuItem::maximize(app, Some("Zoom"))?)
        .separator()
        .item(&PredefinedMenuItem::close_window(app, Some("Close Window"))?)
        .build()?;

    // Help menu
    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&MenuItemBuilder::with_id("docs", "Santa Lang Documentation").build(app)?)
        .build()?;

    MenuBuilder::new(app)
        .items(&[&file_menu, &edit_menu, &run_menu, &window_menu, &help_menu])
        .build()
}
