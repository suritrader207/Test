const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Data file for books
const DB_FILE = path.join(dataDir, 'db.json');

// Initialize db.json if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ books: [] }, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// API to get all books
app.get('/api/books', (req, res) => {
    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read books data.' });
        }
        res.json(JSON.parse(data).books);
    });
});

// API to create a new book
app.post('/api/books', (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Book title is required.' });
    }

    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read books data.' });
        }
        const db = JSON.parse(data);
        const newBook = {
            id: Date.now().toString(),
            title,
            audioFiles: []
        };
        db.books.push(newBook);
        fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to save new book.' });
            }
            res.status(201).json(newBook);
        });
    });
});

// API to upload audio files for a specific book
app.post('/api/books/:id/upload', upload.array('audioFiles'), (req, res) => {
    const bookId = req.params.id;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No audio files uploaded.' });
    }

    const uploadedFilePaths = req.files.map(file => `/uploads/${file.filename}`);

    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read books data.' });
        }
        const db = JSON.parse(data);
        const bookIndex = db.books.findIndex(book => book.id === bookId);

        if (bookIndex === -1) {
            // Clean up uploaded files if book not found
            uploadedFilePaths.forEach(filePath => {
                fs.unlink(path.join(uploadsDir, path.basename(filePath)), (unlinkErr) => {
                    if (unlinkErr) console.error(`Failed to delete uploaded file: ${filePath}`, unlinkErr);
                });
            });
            return res.status(404).json({ error: 'Book not found.' });
        }

        db.books[bookIndex].audioFiles.push(...uploadedFilePaths);

        fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), (err) => {
            if (err) {
                // Clean up uploaded files on save error
                uploadedFilePaths.forEach(filePath => {
                    fs.unlink(path.join(uploadsDir, path.basename(filePath)), (unlinkErr) => {
                        if (unlinkErr) console.error(`Failed to delete uploaded file: ${filePath}`, unlinkErr);
                    });
                });
                return res.status(500).json({ error: 'Failed to save audio file paths to book.' });
            }
            res.status(200).json({ message: 'Audio files uploaded and linked successfully.', files: uploadedFilePaths });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
