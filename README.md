
# Google Takeout Chat Viewer

View your Google Chat history locally with ease.

## Introduction

Google Takeout Chat Viewer is a user-friendly desktop application designed to offer a seamless experience in browsing your Google Chat conversations. Built with the Tauri framework and Solid.js, this application ensures your privacy by processing all data locally, eliminating the need for data transmission to external servers. Its cross-platform compatibility means that you can use it on any desktop operating system with the same efficiency and ease.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Downloading Google Chat Data](#downloading-google-chat-data)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Manual Installation](#manual-installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Browse Google Chat Conversations:** Easily load and navigate through your Google Chat message history.
- **Search Conversations** Quickly search for texts in all conversations or filter for just one group/space.
- **Maintain Privacy:** All processing of chat data is done locally on your device, ensuring your information remains private.

## Downloading Google Chat Data

To make use of Google Takeout Chat Viewer, you first need to download your Google Chat data. Here's how:

1. Go to the Google Takeout website: [https://takeout.google.com](https://takeout.google.com).
2. Deselect all options, then scroll to find **"Google Chat"** and select it.
3. Choose your preferred delivery method (e.g., download link).
4. Click **"Create Export"**.
5. Wait for Google to prepare your download, which may take some time.
6. Once ready, download the export file and extract its contents.

## Installation

Download the latest binary for your OS from release section.

### Manual Installation

**Prerequisites**

- Node.js and npm.
- Rust and Cargo.

Follow these steps to manually install the Google Takeout Chat Viewer:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/soujanya-dev/google-takeout-chat-viewer
   ```

2. **Install dependencies:**

   Navigate to the cloned repository's directory and install the necessary dependencies:

   ```bash
   cd google-takeout-chat-viewer
   npm install
   ```

3. **Build the application:**


   ```bash
   npm run tauri build
   ```

## Usage

To use the application, follow these steps:

1. Launch the Google Takeout Chat Viewer application.
2. When prompted, select the folder containing your extracted Google Chat data. This is usually located within the "Google Takeout/Google Chat" directory.
3. Begin exploring your conversations!

## Contributing

Contributions to the Google Takeout Chat Viewer project are welcome! Whether it's reporting bugs, suggesting new features, or contributing to the code, your input is appreciated. Please refer to the project's GitHub issues section to see how you can contribute.

## License

This project is licensed under the MIT License. For more details, see the LICENSE file in the project repository.

---
