use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reindeer {
    pub id: String,
    pub name: String,
    pub codename: String,
    pub version: String,
    pub path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Settings {
    pub aoc_session_token: Option<String>,
    pub default_reindeer: Option<String>,
    pub theme: String,
    #[serde(default)]
    pub format_on_save: bool,
    pub formatter_path: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppState {
    pub reindeer: HashMap<String, Reindeer>,
    pub settings: Settings,
    #[serde(skip)]
    pub running_processes: HashMap<String, u32>,
}

impl AppState {
    pub fn load(app: &AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let config_path = Self::config_path(app)?;

        if config_path.exists() {
            let content = std::fs::read_to_string(&config_path)?;
            let state: AppState = serde_json::from_str(&content)?;
            Ok(state)
        } else {
            Ok(AppState {
                settings: Settings {
                    theme: "dark".to_string(),
                    ..Default::default()
                },
                ..Default::default()
            })
        }
    }

    pub fn save(&self, app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        let config_path = Self::config_path(app)?;

        if let Some(parent) = config_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(&config_path, content)?;
        Ok(())
    }

    fn config_path(app: &AppHandle) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let config_dir = dirs::config_dir().ok_or("Could not find config directory")?;
        let app_id = app.config().identifier.clone();
        Ok(config_dir.join(app_id).join("config.json"))
    }
}
