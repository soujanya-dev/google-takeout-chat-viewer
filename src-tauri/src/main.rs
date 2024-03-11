// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;

mod commands;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                // open devtools on launch
                let window = app.get_window("main").unwrap();
                window.open_devtools();
                let _ = window.center();
                //for mac os only when yoou are sung vs code on fullscreen mode and want to prevent the app opening over the vs code
                //run only on mac os
                #[cfg(target_os = "macos")]
                {
                    // make the window fullscreen
                    let _ = window.set_fullscreen(true);
                    // set the window to normal size after 1 seconds
                    let window_ = window.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_secs(1));
                        let done = window_.set_fullscreen(false);
                        if done.is_err() {
                            println!("Failed to set window to normal size");
                        }
                        done.unwrap();
                    });
                    let current_desktop = window.current_monitor().unwrap();
                    println!("Current desktop: {:?}", current_desktop);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::greet, commands::process_chat_folder, commands::process_chat_file, commands::search_chat_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
