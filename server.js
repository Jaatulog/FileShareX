const express = require('express');
const multer = require('multer');
const session = require('express-session');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const fileDataPath = path.join(__dirname, 'files.json'); // File metadata storage

// Middleware setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: 'secret-key',
        resave: false,
        saveUninitialized: true,
    })
);

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/uploads'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Utility: Get a random profile picture
const getRandomProfilePic = () => {
    const profileDir = path.join(__dirname, 'public/profile');
    const profilePics = fs.readdirSync(profileDir).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
    return path.join('profile', profilePics[Math.floor(Math.random() * profilePics.length)]);
};

// Utility: Load file data from JSON
const loadFileData = () => {
    try {
        return JSON.parse(fs.readFileSync(fileDataPath, 'utf8'));
    } catch {
        return [];
    }
};

// Utility: Save file data to JSON
const saveFileData = files => {
    fs.writeFileSync(fileDataPath, JSON.stringify(files, null, 2));
};

// Utility: Delete expired files
const checkAndDeleteExpiredFiles = () => {
    const files = loadFileData();
    const currentTime = moment();
    const updatedFiles = files.filter(file => {
        const isExpired = currentTime.isAfter(moment(file.expiresIn));
        if (isExpired) {
            const filePath = path.join(__dirname, 'public/uploads', file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Delete file from disk
        }
        return !isExpired; // Keep non-expired files
    });
    saveFileData(updatedFiles);
};

// Route: Home page to display uploaded files
app.get('/', (req, res) => {
    checkAndDeleteExpiredFiles();
    const files = loadFileData();
    res.render('index', { files });
});

// Route: Upload file
app.post('/upload', upload.single('file'), (req, res) => {
    const { name, description, expiresInMinutes, password } = req.body;

    // Validate required fields
    if (!name || !description || !expiresInMinutes || !password || !req.file) {
        return res.status(400).send('All fields (name, description, file, expiration time, and password) are required.');
    }

    // Create file metadata
    const fileData = {
        name,
        description,
        profilePic: getRandomProfilePic(),
        originalname: req.file.originalname,
        filename: req.file.filename,
        fileType: path.extname(req.file.originalname).toLowerCase(),
        uploadedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        expiresIn: moment().add(parseInt(expiresInMinutes), 'minutes').format('YYYY-MM-DD HH:mm:ss'),
        password,
    };

    // Save metadata
    const files = loadFileData();
    files.push(fileData);
    saveFileData(files);

    res.redirect('/');
});

// Route: Download file with progress tracking
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public/uploads', req.params.filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found.');
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

        if (start >= fileSize) {
            return res.status(416).send('Requested range not satisfiable.');
        }

        const chunkSize = end - start + 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'application/octet-stream',
        });

        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'application/octet-stream',
        });

        fs.createReadStream(filePath).pipe(res);
    }
});

// Route: Delete file
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
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.redirect('/');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
