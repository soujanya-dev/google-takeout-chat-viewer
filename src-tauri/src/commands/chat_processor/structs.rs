use serde::{Serialize, Deserialize};

// define the structure of the  search results
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct SearchStructure {
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub data: Option<SearchData>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct SearchData {
    pub path: Option<SearchVarText>,
    pub lines: Option<SearchVarText>,
    pub line_number: Option<u32>,
    pub absolute_offset: Option<u32>,
    pub submatches: Option<Vec<SearchSubmatch>>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub enum SearchVarText {
    #[serde(rename = "text")]
    Text(String),
    #[serde(rename = "bytes")]
    Bytes(String),
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct SearchSubmatch {
    pub match_: Option<SearchVarText>,
    pub start: Option<u32>,
    pub end: Option<u32>,
}

// define the structure of the user info
#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct UserInfo {
    pub user: User,
    pub membership_info: Vec<MembershipInfo>,
    #[serde(default)]
    pub base_path: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct User {
    #[serde(default)]
    pub user_id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub email: String,
    #[serde(default)]
    pub user_type: String,
}

impl Default for User {
    fn default() -> Self {
        User {
            user_id: String::default(),
            name: String::default(),
            email: String::default(),
            user_type: String::default(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct MembershipInfo {
    #[serde(default)]
    pub group_name: String,
    #[serde(default)]
    pub group_members: Vec<User>,
    pub group_id: String,
    #[serde(default)]
    pub path: String,
    pub membership_state: String,
    #[serde(default)]
    pub last_message_date: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct GroupMembers {
    pub members: Vec<User>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct ChatData {
    pub messages: Vec<ChatDataMessages>,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct ChatDataMessages {
    #[serde(default)]
    pub creator: User,
    #[serde(default)]
    pub created_date: String,
    #[serde(default)]
    pub text: String,
    #[serde(default)]
    pub attached_files: Vec<AttachedFiles>,
    #[serde(default)]
    pub quoted_message_metadata: Option<QuotedMessageMetadata>,
    #[serde(default)]
    pub topic_id: String,
    #[serde(default)]
    pub message_id: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct AttachedFiles {
    #[serde(default)]
    pub original_name: String,
    #[serde(default)]
    pub export_name: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct QuotedMessageMetadata {
    #[serde(default)]
    pub creator: User,
    #[serde(default)]
    pub text: String,
    #[serde(default)]
    pub message_id: String,
}
