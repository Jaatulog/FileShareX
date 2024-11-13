const express = require('express');
const multer = require('multer');
const session = require('express-session');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const app = express();
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
    const profilePics = fs.readdirSync(profileDir).filter(file => {
        // Filter to only include image files (jpg, png, etc.)
        return /\.(jpg|jpeg|png|gif)$/i.test(file);
    });
    // Randomly select one profile picture
    const randomPic = profilePics[Math.floor(Math.random() * profilePics.length)];
    return path.join('profile', randomPic); // Return the relative path to the profile picture
}

// Function to check and delete expired files
function checkAndDeleteExpiredFiles(req) {
    const currentTime = moment();
    req.session.files = req.session.files || [];

    // Remove expired files from session and filesystem
    req.session.files = req.session.files.filter(file => {
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
}

// Route to display uploaded files
app.get('/', (req, res) => {
    checkAndDeleteExpiredFiles(req);
    res.render('index', { files: req.session.files || [] });
});

// Route to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    const { name, expiresInMinutes } = req.body;
    if (!name || !req.file || !expiresInMinutes) {
        return res.status(400).send('Please provide a name, file, and expiration time.');
    }

    const fileData = {
        name,
        profilePic: getRandomProfilePic(), // Assign random profile picture
        originalname: req.file.originalname,
        filename: req.file.filename,
        fileType: path.extname(req.file.originalname).toLowerCase(),
        uploadedAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        expiresIn: moment().add(expiresInMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    };

    req.session.files = req.session.files || [];
    req.session.files.push(fileData);

    res.redirect('/');
});

// Route to handle file download
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'public/uploads', req.params.filename);

    // Check if the file exists before attempting to download
    fs.exists(filePath, exists => {
        if (exists) {
            res.download(filePath);
        } else {
            res.status(404).send('File not found.');
        }
    });
});

// Route to handle file deletion
app.post('/delete/:filename', (req, res) => {
    const filename = req.params.filename;

    // Remove file data from session
    req.session.files = req.session.files.filter(file => file.filename !== filename);

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
