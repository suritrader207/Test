import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Busboy from 'busboy';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  audioFiles: [
    {
      fileName: String,
      s3Key: String,
      url: String,
    },
  ],
});

const Book = mongoose.models.Book || mongoose.model('Book', BookSchema);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  await dbConnect();

  const bookId = req.query.id; // Get book ID from query parameter
  if (!bookId) {
    return res.status(400).json({ success: false, error: 'Book ID is required.' });
  }

  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ success: false, error: 'Book not found.' });
  }

  const busboy = Busboy({ headers: req.headers });
  const uploadedFiles = [];

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const s3Key = `audio/${Date.now()}-${filename.filename}`;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: file,
      ContentType: mimetype,
    };

    s3Client.send(new PutObjectCommand(params))
      .then(() => {
        const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        uploadedFiles.push({ fileName: filename.filename, s3Key, url: fileUrl });
      })
      .catch(error => {
        console.error('S3 Upload Error:', error);
        // Handle error, maybe push an error object to uploadedFiles
      });
  });

  busboy.on('finish', async () => {
    try {
      book.audioFiles.push(...uploadedFiles);
      await book.save();
      res.status(200).json({ success: true, files: uploadedFiles });
    } catch (error) {
      console.error('Database Update Error:', error);
      res.status(500).json({ success: false, error: 'Failed to update book with audio files.' });
    }
  });

  req.pipe(busboy);
}
