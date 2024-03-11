use glob::glob;

mod chat_processor;

#[tauri::command(rename_all = "snake_case")]
pub fn process_chat_folder(folder_path: String) -> Result<String, String> {
    println!("Processing chat data at path: {}", folder_path);
    let user_info_path = format!("{}/Users/User*/user_info.json", folder_path);
    let user_info_path = glob(&user_info_path);
    let mut chat_users = vec![];
    match user_info_path {
        Ok(data) => {
            for entry in data {
                match entry {
                    Ok(path) => {
                        // read the file and send the data to the frontend
                        let user_info = chat_processor::read_user_info_file(&path);
                        match user_info {
                            Ok(data) => {
                                chat_users.push(data);
                            }
                            Err(e) => {
                                return Err(format!("Error processing user info file: {:?}", e));
                            }
                        }
                    }
                    Err(e) => {
                        return Err(format!("Error processing user info file: {:?}", e));
                    }
                }
            }
            // if the length of chat_users is 0, return an error
            if chat_users.len() == 0 {
                return Err("No user_info.json found".to_string());
            }
            // send serialized user info to the frontend
            let chat_users = serde_json::to_string(&chat_users);
            match chat_users {
                Ok(data) => {
                    return Ok(data);
                }
                Err(e) => {
                    return Err(format!("Error serializing user info: {:?}", e));
                }
            }
        }
        
        Err(e) => {
            return Err(format!("User info file not found: {:?}", e));
        }
    }
    // for entry in glob(&user_info_path).expect("Failed to read glob pattern") {
    //     match entry {
    //         Ok(path) => {
    //             println!("Processing user info file: {:?}", path.display());
    //             // read the file and process the data
    //             let user_info = chat_processor::read_user_info_file(path.to_str().unwrap());
    //             match user_info {
    //                 Ok(data) => {
    //                     println!("User info data: {}", data);
    //                 }
    //                 Err(e) => {
    //                     println!("Error processing user info file: {:?}", e);
    //                 }
    //             }
    //             // search for "hello" in the chat data using grep
    //             let chat_data_path = format!("{}/Groups", folder_path);
    //             let chat_data = chat_processor::search_chat_data(&chat_data_path, "hello");
    //             success = true;
    //         }
    //         Err(e) => {
    //             println!("Error processing user info file: {:?}", e);
    //         }
    //     }
    // }
}

#[tauri::command]
pub fn process_chat_file(path: &str) -> String {
    println!("Reading chat data at path: {}", path);
    let chat_data = chat_processor::read_chat_file(path);
    match chat_data {
        Ok(data) => {
            // println!("Chat data: {}", data);
            return data;
        }
        Err(e) => {
            println!("Error processing chat data file: {:?}", e);
            return format!("Error processing chat data file: {:?}", e);
        }
    }
}

#[tauri::command]
pub fn search_chat_data(app: tauri::AppHandle, chat_path: &str, search_term: &str) -> String {
    // convert chat_path to a array of &str
    let chat_path = chat_path.split(',').collect::<Vec<&str>>();
    println!("Searching chat data at path: {:?} for term: {}", chat_path[0], search_term);
    let search_results = chat_processor::search_chat_data(app, chat_path, search_term);
    match search_results {
        Ok(data) => {
            println!("Search results: {}", data);
            return data;
        }
        Err(e) => {
            println!("Error searching chat data: {:?}", e);
            return format!("Error searching chat data: {:?}", e);
        }
    }
    
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}