// mod file to process chat data
use std::{
    error::Error,
    fs, io,
    path::PathBuf,
    thread,
};
use grep::{
    matcher::Matcher,
    printer::JSON,
    regex::RegexMatcherBuilder,
    searcher::{BinaryDetection, MmapChoice, SearcherBuilder},
};

use serde_jsonlines::JsonLinesReader;
use rev_lines::RevLines;
use tauri::Manager;

use self::structs::SearchVarText;

mod structs;

// fixed values
const MAX_CONTEXT_LINES: usize = 2000;

pub fn read_user_info_file(file_path: &PathBuf) -> Result<structs::UserInfo, String> {
    let user_info_file = fs::read_to_string(file_path);
    match user_info_file {
        Ok(data) => {
            // get user id from path
            match file_path.to_str() {
                Some(path) => {
                    let user_id = path.split("Users/User").collect::<Vec<&str>>()[1]
                        .split("/user_info.json")
                        .collect::<Vec<&str>>()[0];
                    let base_path = path.split("/Users/User").collect::<Vec<&str>>()[0];
                    // deserialize the user info file and return the user id
                    let user_info_result: Result<structs::UserInfo, serde_json::Error> =
                        serde_json::from_str(&data);
                    match user_info_result {
                        Ok(mut user_info) => {
                            user_info.user.user_id = user_id.trim().to_string();
                            // populate the path in membership_info
                            user_info
                                .membership_info
                                .iter_mut()
                                .for_each(|membership_info| {
                                    let path = format!(
                                        "{}/Groups/{}/messages.json",
                                        base_path, membership_info.group_id
                                    );
                                    // println!("Checking if path exists: {}", path);
                                    // check if the path exists
                                    match PathBuf::from(&path).try_exists() {
                                        Ok(exists) => {
                                            if exists {
                                                membership_info.path = path;
                                            } else {
                                                println!("Path does not exist: {}", path);
                                            }
                                        }
                                        Err(e) => {
                                            println!("Error checking if path exists: {:?}", e);
                                        }
                                    }
                                });
                            // filter out membership_info with empty path
                            user_info
                                .membership_info
                                .retain(|membership_info| !membership_info.path.is_empty());
                            user_info.base_path = base_path.to_string();
                            //get the group info for each group
                            for membership_info in user_info.membership_info.iter_mut() {
                                let group_info = get_user_list_for_groups(
                                    base_path.to_string() + "/Groups/" + &membership_info.group_id,
                                );
                                membership_info.group_members = group_info;
                                let last_chat_date = get_last_chat_date(
                                    base_path.to_string() + "/Groups/" + &membership_info.group_id,
                                );
                                membership_info.last_message_date = last_chat_date;
                            }
                            return Ok(user_info);
                        }
                        Err(e) => {
                            // println!("Error deserializing user info file: {:?}", e);
                            return Err(format!("Error deserializing user info file: {:?}", e));
                        }
                    }
                }
                None => {
                    return Err("Error getting user id from path".to_string());
                }
            }
        }
        Err(e) => {
            return Err(format!("Error reading user info file: {:?}", e));
        }
    }
}

fn get_user_list_for_groups(group_path: String) -> Vec<structs::User> {
    // println!("Going to get user list for group: {}", group_path);
    //read the group_info.json file and return the user list
    let group_info_file = fs::read_to_string(format!("{}/group_info.json", group_path));
    match group_info_file {
        Ok(data) => {
            let group_info_result: Result<structs::GroupMembers, serde_json::Error> =
                serde_json::from_str(&data);
            match group_info_result {
                Ok(mut group_info) => {
                    // check for "name": "Deleted User" in message.json file using grep when "Deleted User" is not in the group_info.members
                    if !group_info
                        .members
                        .iter()
                        .any(|user| user.name == "Deleted User")
                    {
                        let messages_path = format!("{}/messages.json", group_path);
                        let matcher = grep::regex::RegexMatcher::new_line_matcher(
                            r#""name": "Deleted User""#,
                        )
                        .unwrap();
                        let mut searcher = SearcherBuilder::new()
                            .binary_detection(BinaryDetection::quit(b'\x00')) // quit on binary files
                            .line_number(false)
                            .stop_on_nonmatch(true)
                            .build();
                        let mut printer = JSON::new(vec![]);
                        searcher
                            .search_file(
                                &matcher,
                                &fs::File::open(&messages_path).unwrap(),
                                printer.sink_with_path(&matcher, &messages_path),
                            )
                            .unwrap();
                        if printer.has_written() {
                            let printer = printer.into_inner();
                            let search_results = JsonLinesReader::new(&*printer);
                            let search_results = search_results
                                .read_all::<structs::SearchStructure>()
                                .collect::<Result<Vec<structs::SearchStructure>, io::Error>>();
                            match search_results {
                                Ok(search_results) => {
                                    // when search results are found, and the group_info.members does not contain "Deleted User", add it to the list
                                    if search_results.len() > 0 {
                                        group_info.members.push(structs::User {
                                            user_id: "".to_string(),
                                            name: "Deleted User".to_string(),
                                            email: "".to_string(),
                                            user_type: "Human".to_string(),
                                        });
                                    }
                                }
                                Err(e) => {
                                    // convert printer to string and print error
                                    let pointer_string = String::from_utf8(printer).unwrap();
                                    println!(
                                        "Error reading search results: {:?} and error: {:#?}",
                                        pointer_string, e
                                    );
                                }
                            }
                        }
                    }
                    return group_info.members;
                }
                Err(e) => {
                    println!("Error deserializing group info file: {:?}", e);
                    return vec![];
                }
            }
        }
        Err(e) => {
            println!(
                "Error reading group info file: {:?} , path: {}",
                e, group_path
            );
            return vec![];
        }
    }
}

fn get_last_chat_date(group_path: String) -> String {
    // println!("Going to get last chat date for group: {}", group_path);
    //read the messages.json file and return the user list
    let messages_file = fs::File::open(format!("{}/messages.json", group_path));
    match messages_file {
        Ok(file) => {
           let rev_lines = RevLines::new(file);
           
           for line in rev_lines {
                match line {
                     Ok(line) => {
                          if line.contains(r#""created_date": ""#) {
                            let created_date= line.split(r#""created_date": ""#).last().unwrap_or("").split(r#"","#).collect::<Vec<&str>>()[0];
                            if created_date.len() > 0 {
                                // println!("Created date: {}", created_date.to_string());
                                return created_date.to_string();
                            }
                            return created_date.to_string();
                        }
                     }
                     Err(e) => {
                          println!("Error reading messages file: {:?} , path: {}", e, group_path);
                     }
                }
           }
        }
        Err(e) => {
            println!(
                "Error reading messages file: {:?} , path: {}",
                e, group_path
            );
            return String::new();
        }
    }
    return String::new();
}

pub fn read_chat_file(file_path: &str) -> Result<String, String> {
    let chat_file = fs::read_to_string(file_path);
    match chat_file {
        Ok(data) => {
            // deserialize the chat file and return the data
            let chat_data: Result<structs::ChatData, serde_json::Error> =
                serde_json::from_str(&data);
            match chat_data {
                Ok(chat_data) => {
                    // println!("Chat data: {:?}", chat_data);
                    Ok(serde_json::to_string(&chat_data).unwrap())
                }
                Err(e) => Err(format!("Error deserializing chat file: {:?}", e)),
            }
        }
        Err(e) => Err(format!("Error reading chat file: {:?}", e)),
    }
}

pub fn search_chat_data(
    app: tauri::AppHandle,
    chat_path: Vec<&str>,
    search_term: &str,
) -> Result<String, Box<dyn Error>> {
    // common builder for matcher and searcher
    let mut search_term_inside_json = vec![];
    search_term_inside_json.push(search_term.to_owned());
    // buffer to contain words length less than 3
    let mut search_term_buffer = String::new();
    search_term.trim().split(" ").for_each(|term| {
        if term.len() > 3 {
            search_term_inside_json.push(term.to_string());
            if search_term_buffer.len() > 0 {
                search_term_inside_json.push(format!("{} {}", search_term_buffer, term));
                search_term_buffer = String::new();
            }
        } else {
            if search_term_buffer.len() > 0 {
                search_term_buffer = format!("{} {}", search_term_buffer, term);
            } else {
                search_term_buffer = term.to_string();
            }
            if search_term_buffer.len() > 3 {
                search_term_inside_json.push(search_term_buffer.clone());
                search_term_buffer = String::new();
            }
        }
    });
    if search_term_buffer.len() > 0 {
        // concatenate the buffer to the last search term
        let search_term_inside_json_len = search_term_inside_json.len();
        // println!("search_term_inside_json_len: {}", search_term_inside_json_len);
        if search_term_inside_json[search_term_inside_json_len - 1].trim()
            != search_term_buffer.trim()
        {
            search_term_inside_json[search_term_inside_json_len - 1] = format!(
                "{} {}",
                search_term_inside_json[search_term_inside_json_len - 1],
                search_term_buffer
            );
        }
    }
    // remove duplicates
    search_term_inside_json.sort();
    search_term_inside_json.dedup();
    // remove the exact search term from the list and add it to the beginning
    search_term_inside_json.retain(|term| term != search_term);
    let search_words = search_term_inside_json.clone().into_iter().map(|term| term.to_lowercase()).collect::<Vec<String>>();
    search_term_inside_json.insert(0, search_term.to_owned());

    // let search_words = search_term.split(" ").map(|term| term.to_string().to_lowercase()).collect::<Vec<String>>();

    println!("Final search term: {:#?}", search_term_inside_json);
    // return Ok("Search complete".to_string());
    // create a new matcher
    let matcher = RegexMatcherBuilder::new()
        .case_insensitive(true)
        .line_terminator(Some(b'\n'))
        .fixed_strings(true)
        .build_literals(&search_term_inside_json)
        .unwrap();
    // create a new searcher
    let searcher = SearcherBuilder::new()
        .binary_detection(BinaryDetection::quit(b'\x00')) // quit on binary files
        .line_number(true)
        .memory_map(unsafe { MmapChoice::auto() })
        // .multi_line(true)
        // .passthru(true)
        .before_context(MAX_CONTEXT_LINES)
        .after_context(MAX_CONTEXT_LINES)
        .build();
    // create a new matcher for "text": "
    let text_word_matcher = grep::regex::RegexMatcherBuilder::new()
        .build(r#"^\s+"text": ""#)
        .unwrap();
    // create a new matcher for "creator": {
    let creator_word_matcher = grep::regex::RegexMatcherBuilder::new()
        .build(r#"^\s+"creator": \{"#)
        .unwrap();
    // create a new matcher for "message_id": "*"
    let message_id_word_matcher = grep::regex::RegexMatcherBuilder::new()
        .build(r#"^\s+"message_id": ""#)
        .unwrap();

    // println!("regex matcher: {:#?}", matcher);
    // spawn a new thread to search each chat_path file for the search_term
    let _: Vec<_> = chat_path
        .into_iter()
        .map(|path| {
            let path = path.to_owned();
            let app = app.clone();
            let search_words: Vec<String> = search_words.to_owned();
            let matcher = matcher.clone();
            let searcher = searcher.clone();
            let text_word_matcher = text_word_matcher.clone();
            let creator_word_matcher = creator_word_matcher.clone();
            let message_id_word_matcher = message_id_word_matcher.clone();
            thread::spawn(move || {
                let result = search_single_file(
                    app,
                    &search_words,
                    &path,
                    matcher,
                    searcher,
                    text_word_matcher,
                    creator_word_matcher,
                    message_id_word_matcher,
                );
                match result {
                    Ok(_search_results) => {
                        // println!("Done searching file: {}", path);
                    }
                    Err(e) => {
                        println!("Error searching file: {:?}", e);
                    }
                }
            })
        })
        .collect();
    println!("Waiting for search to complete");
    // let mut search_results = vec![];
    // for received in rx {
    //     for result in received {
    //         // println!("Received search result: {:?}", result);
    //         search_results.push(result);
    //     }
    // }

    // for handle in handles {
    //     handle.join().unwrap();
    // }
    // println!("Search complete");
    // println!("here ");
    // println!("Search results: {:?}", search_results);
    Ok(search_term_inside_json.join("/~#sep#~/"))
}

fn search_single_file(
    app: tauri::AppHandle,
    search_words: &Vec<String>,
    file_path: &str,
    matcher: grep::regex::RegexMatcher,
    mut searcher: grep::searcher::Searcher,
    text_word_matcher: grep::regex::RegexMatcher,
    creator_word_matcher: grep::regex::RegexMatcher,
    message_id_word_matcher: grep::regex::RegexMatcher,
) -> Result<(), Box<dyn Error>> {
    let mut printer = JSON::new(vec![]);

    searcher
        .search_path(
            &matcher,
            &file_path,
            printer.sink_with_path(&matcher, &file_path),
        )
        .unwrap();

    // if printer is not empty, print the search results
    if printer.has_written() {
        let printer = printer.into_inner();
        let search_results = JsonLinesReader::new(&*printer);
        let search_results = search_results
            .read_all::<structs::SearchStructure>()
            .collect::<Result<Vec<structs::SearchStructure>, io::Error>>();
        match search_results {
            Ok(search_results) => {
                // println!("Search results: {:#?}", search_results);
                let mut json_string = String::new();
                let mut full_json_array: Vec<structs::ChatDataMessages> = vec![];
                let mut got_text_match = false;
                for (_index, search_result) in search_results.iter().enumerate() {
                    if search_result
                        .type_
                        .as_ref()
                        .is_some_and(|type_| type_ == "match" || type_ == "context")
                    {
                        let matched_text =
                            search_result.data.as_ref().unwrap().lines.as_ref().unwrap();
                        // println!("Matched text: {:#?}", matched_text);
                        match matched_text {
                            SearchVarText::Text(text) => {
                                // check if the matched text contains "creator": {
                                let is_creator_matched = creator_word_matcher
                                    .is_match(&text.as_bytes())
                                    .unwrap();
                                if is_creator_matched && !json_string.contains("quoted_message_metadata") {
                                    json_string = format!("{}{}", "{", text);
                                }
                                else {
                                    // check if the matched text contains "message_id": "*"
                                    let is_message_id_matched = message_id_word_matcher
                                        .is_match(&text.as_bytes())
                                        .unwrap();
                                    if is_message_id_matched {
                                        json_string = format!("{}{}{}", json_string, text, "}");
                                        // println!("end of json string. got_text_match: {}", got_text_match);
                                        if got_text_match {
                                            // try to parse the json string and add to the full_json_array
                                            let chat_data: Result<structs::ChatDataMessages, serde_json::Error> =
                                                serde_json::from_str(&json_string);
                                            match chat_data {
                                                Ok(chat_data) => {
                                                    full_json_array.push(chat_data);
                                                }
                                                Err(e) => {
                                                    println!("Error deserializing chat data: {:?} JSON: {:#?}", e, json_string);
                                                }
                                            }
                                        }
                                        json_string = String::new();
                                        got_text_match = false;
                                    }
                                    else {
                                        if json_string.len() > 0 {
                                            // add the text to the json_string
                                            json_string = format!("{}{}", json_string, text);
                                            // check if the matched text contains "text": "
                                            let is_text_matched = text_word_matcher
                                                .is_match(&text.as_bytes())
                                                .unwrap();
                                            // println!("is_text_matched: {} text: {} is type match? {}", is_text_matched, text, search_result.type_.as_ref().is_some_and(|type_| type_ == "match"));
                                            if is_text_matched && search_result.type_.as_ref().is_some_and(|type_| type_ == "match") {
                                                // check if the text contains all the search terms
                                                let is_all_search_words_matched = search_words.iter().all(|term| text.to_lowercase().contains(term));
                                                if is_all_search_words_matched {
                                                    // println!("type match found");
                                                    got_text_match = true;
                                                }
                                            }
                                        }
                                    }
                                }
                                
                            }
                            SearchVarText::Bytes(bytes) => {
                                println!("Bytes: {:#?}", bytes);
                            }
                        }
                    }
                }
                // println!("Full json array: {:#?}", full_json_array);
                // let search_results = search_results.iter().filter(|search_result| {
                //     if search_result.type_.as_ref().is_some_and(|type_| type_ == "match") {
                //         let matched_text = search_result.data.as_ref().unwrap().lines.as_ref().unwrap();
                //         match matched_text {
                //             SearchVarText::Text(text) => {
                //                 let is_text_matched = text_word_matcher.is_match(&text.as_bytes()).unwrap();
                //                 // if !is_text_matched

                //                 // is_text_matched
                //             }
                //             SearchVarText::Bytes(bytes) => {
                //                 let is_text_matched = text_word_matcher.is_match(&bytes.as_bytes()).unwrap();
                //                 // is_text_matched
                //             }
                //         }
                //         true
                //     }
                //     else if search_result.type_.as_ref().is_some_and(|type_| type_ == "context") {
                //         true
                //     }
                //     else {
                //         false
                //     }
                // }).collect::<Vec<&structs::SearchStructure>>();
                // println!("Not matched indices: {:#?}", not_matched_indices);
                if full_json_array.len() > 0 {
                    let _ = app.emit_all("search_chat_data_results", &full_json_array);
                }
                Ok(())
            }
            Err(e) => {
                // convert printer to string and print error
                let pointer_string = String::from_utf8(printer).unwrap();
                println!(
                    "Error reading search results: {:?} and error: {:#?}",
                    pointer_string, e
                );
                Err(Box::new(e))
            }
        }
    } else {
        Ok(())
    }
}
