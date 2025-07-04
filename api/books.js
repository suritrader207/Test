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

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const books = await Book.find({});
      res.status(200).json({ success: true, data: books });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const book = await Book.create(req.body);
      res.status(201).json({ success: true, data: book });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
}
