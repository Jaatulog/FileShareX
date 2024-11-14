# File Sharing Web App

A web application that allows users to upload, share, and download files securely. This app includes features like file expiration, secure downloads, user-uploaded profile pictures, and progress bars for file upload and download in a command-line inspired style.

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

## Live Demo

Check out the live application [here](https://filesharex-o8ss.onrender.com/) (replace with your actual link).

## Features

- **File Upload & Expiration**: Upload files with an option to set an expiration time in minutes.
- **Download and Delete Options**: Users can download or delete files directly from the app.
- **Upload/Download Progress Bars**: Real-time progress bars for uploading and downloading files with a terminal-like interface.
- **User Profile**: Each file upload includes a profile picture, allowing for a personalized touch.
- **Responsive UI**: Clean, modern, and mobile-responsive design.

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3
  - JavaScript
  - EJS (Embedded JavaScript Templates)

- **Backend**:
  - Node.js
  - Express.js

- **Other**:
  - Multer (for file uploads)
  - JavaScript XMLHTTPRequest (for AJAX file upload and download progress)
  
## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14.x or later)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/Tanmay-Tiwaricyber/FileShareX.git
    cd FileShareX
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Run the Application**:
    ```bash
    npm start
    ```

   The app will be running on `http://localhost:3000`.

### Environment Variables

To connect the app to a file storage or a database (if you need one), configure the `.env` file with appropriate credentials:

```plaintext
PORT=3000
```

## Usage

1. Open the app in your web browser (`http://localhost:3000`).
2. Enter your name, select a file to upload, and set an expiration time.
3. Click "Upload" to start uploading the file.
4. Monitor the upload progress in the command-line style progress bar.
5. Download files directly from the list with a similar progress indicator.

### Screenshots

1. **File Upload Page**  
   ![Upload Screen](path/to/upload_screenshot.png)

2. **Progress Bars**  
   ![Progress Bars](path/to/progress_bars_screenshot.png)

## Folder Structure

```plaintext
.
├── public               # Static files (CSS, client-side JavaScript, images)
├── views                # EJS templates
├── routes               # API routes
├── uploads              # Folder to store uploaded files
├── .env                 # Environment variables
└── server.js            # Main server file
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or suggestions.

### Steps to Contribute

1. Fork the repository.
2. Create a new branch for your feature (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m 'Add a new feature'`).
4. Push to your branch (`git push origin feature-name`).
5. Open a pull request.
