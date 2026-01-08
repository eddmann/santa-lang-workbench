use crate::state::AppState;
use serde::Serialize;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::Mutex;
use tauri::{Emitter, State, Window};

#[derive(Clone, Serialize)]
pub struct ExecutionEvent {
    pub execution_id: String,
    pub event_type: String, // "initial", "patch", "console", "complete", "error"
    pub data: serde_json::Value,
}

#[tauri::command]
pub async fn run_execution(
    window: Window,
    state: State<'_, Mutex<AppState>>,
    execution_id: String,
    impl_id: String,
    source: String,
    mode: String, // "run", "test", "script"
    working_dir: Option<String>,
) -> Result<(), String> {
    let (reindeer_path, aoc_token, debug_mode) = {
        let state = state.lock().map_err(|e| e.to_string())?;
        let reindeer = state.reindeer.get(&impl_id).ok_or("Reindeer not found")?;
        (
            reindeer.path.clone(),
            state.settings.aoc_session_token.clone(),
            state.settings.debug_mode,
        )
    };

    // Build command arguments
    let mut args = vec!["-o".to_string(), "jsonl".to_string()];

    match mode.as_str() {
        "test" => {
            args.push("-t".to_string());
        }
        "test-slow" => {
            args.push("-t".to_string());
            args.push("-s".to_string());
        }
        _ => {}
    }

    // Write source to a temporary file
    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join(format!("santa-workbench-{}.santa", uuid::Uuid::new_v4()));
    std::fs::write(&temp_file, &source).map_err(|e| e.to_string())?;

    args.push(temp_file.to_string_lossy().to_string());

    // Spawn the process
    let mut cmd = Command::new(&reindeer_path);
    cmd.args(&args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Set working directory if provided
    if let Some(dir) = working_dir {
        cmd.current_dir(dir);
    }

    // Set AoC session token if available
    if let Some(token) = aoc_token {
        cmd.env("SANTA_CLI_SESSION_TOKEN", token);
    }

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn process: {}", e))?;

    // Store process ID for potential cancellation (keyed by execution_id)
    let pid = child.id();
    {
        let mut state = state.lock().map_err(|e| e.to_string())?;
        state.running_processes.insert(execution_id.clone(), pid);
    }

    // Read stdout line by line
    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let reader = BufReader::new(stdout);

    let mut is_first_line = true;

    for line in reader.lines() {
        match line {
            Ok(line) => {
                let line = line.trim();
                if line.is_empty() {
                    continue;
                }

                // Try to parse as JSON
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                    let event = if is_first_line {
                        is_first_line = false;
                        ExecutionEvent {
                            execution_id: execution_id.clone(),
                            event_type: "initial".to_string(),
                            data: json,
                        }
                    } else {
                        // Subsequent lines are JSON Patch arrays
                        ExecutionEvent {
                            execution_id: execution_id.clone(),
                            event_type: "patch".to_string(),
                            data: json,
                        }
                    };

                    let _ = window.emit("execution-event", &event);
                } else {
                    // Non-JSON lines are console output (from puts())
                    let _ = window.emit(
                        "execution-event",
                        ExecutionEvent {
                            execution_id: execution_id.clone(),
                            event_type: "console".to_string(),
                            data: serde_json::json!({ "message": line }),
                        },
                    );
                }
            }
            Err(e) => {
                let _ = window.emit(
                    "execution-event",
                    ExecutionEvent {
                        execution_id: execution_id.clone(),
                        event_type: "error".to_string(),
                        data: serde_json::json!({ "message": e.to_string() }),
                    },
                );
            }
        }
    }

    // Wait for process to complete
    let status = child.wait().map_err(|e| e.to_string())?;
    let exit_code = status.code().unwrap_or(-1);

    // Remove from running processes
    {
        let mut state = state.lock().map_err(|e| e.to_string())?;
        state.running_processes.remove(&execution_id);
    }

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_file);

    // Build command string for debug mode
    let command = if debug_mode {
        Some(format!("{} {}", reindeer_path.display(), args.join(" ")))
    } else {
        None
    };

    // Emit completion event
    let _ = window.emit(
        "execution-event",
        ExecutionEvent {
            execution_id: execution_id.clone(),
            event_type: "complete".to_string(),
            data: serde_json::json!({
                "exit_code": exit_code,
                "command": command
            }),
        },
    );

    Ok(())
}

#[tauri::command]
pub fn cancel_execution(
    state: State<'_, Mutex<AppState>>,
    execution_id: String,
) -> Result<(), String> {
    let pid = {
        let state = state.lock().map_err(|e| e.to_string())?;
        state.running_processes.get(&execution_id).copied()
    };

    if let Some(pid) = pid {
        #[cfg(unix)]
        {
            use std::process::Command;
            let _ = Command::new("kill").args(["-9", &pid.to_string()]).output();
        }

        #[cfg(windows)]
        {
            use std::process::Command;
            let _ = Command::new("taskkill")
                .args(["/F", "/PID", &pid.to_string()])
                .output();
        }

        let mut state = state.lock().map_err(|e| e.to_string())?;
        state.running_processes.remove(&execution_id);
    }

    Ok(())
}
