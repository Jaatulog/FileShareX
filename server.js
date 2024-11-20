const express = require('express');
const multer = require('multer');
const session = require('express-session');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const fileDataPath = path.join(__dirname, 'files.json'); // JSON file to store file metadata

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/uploads'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage });

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Function to get a random profile picture from the 'profile' folder
function getRandomProfilePic() {
    const profileDir = path.join(__dirname, 'public/profile');
    const profilePics = fs.readdirSync(profileDir).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
    return path.join('profile', profilePics[Math.floor(Math.random() * profilePics.length)]);
}

// Load file data from JSON
function loadFileData() {
    try {
        return JSON.parse(fs.readFileSync(fileDataPath, 'utf8'));
    } catch (err) {
        return [];
    }
}

// Save file data to JSON
function saveFileData(files) {
    fs.writeFileSync(fileDataPath, JSON.stringify(files, null, 2));
}

// Check and delete expired files
function checkAndDeleteExpiredFiles() {
    const files = loadFileData();
    const currentTime = moment();
    const updatedFiles = files.filter(file => {
        const isExpired = currentTime.isAfter(moment(file.expiresIn));
        if (isExpired) {
            const filePath = path.join(__dirname, 'public/uploads', file.filename);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Delete file from disk
                }
            } catch (err) {
                console.error('Error deleting expired file:', err);
            }
        }
        return !isExpired;
    });
    saveFileData(updatedFiles);
}

// Route to display uploaded files
app.get('/', (req, res) => {
    checkAndDeleteExpiredFiles();
    const files = loadFileData();
    res.render('index', { files });
});

// Route to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    const { name, expiresInMinutes, password } = req.body;
    if (!name || !req.file || !expiresInMinutes || !password) {
        return res.status(400).send('Please provide all required fields: name, file, expiration time, and password.');
    }

    const fileData = {
        name,
        profilePic: getRandomProfilePic(),
        originalname: req.file.originalname,
        filename: req.file.filename,
        fileType: path.extname(req.file.originalname).toLowerCase(),
        uploadedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        expiresIn: moment().add(expiresInMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
        password,
    };

    const files = loadFileData();
    files.push(fileData);
    saveFileData(files);

    res.redirect('/');
});

// Route to handle file download with progress tracking
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public/uploads', req.params.filename);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
            res.status(416).send('Requested range not satisfiable');
            return;
        }

        const chunkSize = (end - start) + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'application/octet-stream',
        });

        fileStream.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'application/octet-stream',
        });

        fs.createReadStream(filePath).pipe(res);
    }
});

// Route to handle file deletion
app.post('/delete/:filename', (req, res) => {
    const { filename } = req.params;
    const { deletePassword } = req.body;

    let files = loadFileData();
    const fileIndex = files.findIndex(file => file.filename === filename);

    if (fileIndex === -1) {
        return res.status(404).send('File not found.');
    }

    const file = files[fileIndex];
    if (file.password !== deletePassword) {
        return res.status(403).send('Incorrect password.');
    }

    files.splice(fileIndex, 1);
    saveFileData(files);

    const filePath = path.join(__dirname, 'public/uploads', filename);
    fs.unlink(filePath, err => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).send('Error deleting file.');
        }
        res.redirect('/');
    });
});

// Start server on port 3000
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
