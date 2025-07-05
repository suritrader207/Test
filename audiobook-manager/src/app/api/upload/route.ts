'use server';

import { writeFile, readFile } from 'fs/promises';
import * as fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const DB_FILE_PATH = path.join('/tmp', 'mock-db.json');

interface Audiobook {
  title: string;
  author: string; // New field
  imageUrl: string; // New field
  files: string[];
}

async function readDb(): Promise<Audiobook[]> {
  try {
    const data = await readFile(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error) {
      return [];
    }
    console.error('Error reading database:', error);
    throw error;
  }
}

async function writeDb(data: Audiobook[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true });
    await writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bookTitle = formData.get('bookTitle') as string;
    const author = formData.get('author') as string; // New field
    const imageUrl = formData.get('imageUrl') as string; // New field

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (!bookTitle) {
      return NextResponse.json({ error: 'Book title is required.' }, { status: 400 });
    }

    // Author and imageUrl are optional for now, but can be made required if needed

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const uploadDir = path.join('/tmp', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true }); // Ensure directory exists
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const audiobooks: Audiobook[] = await readDb();

    let book = audiobooks.find(b => b.title === bookTitle);
    if (!book) {
      book = { title: bookTitle, author: author || 'Unknown Author', imageUrl: imageUrl || '/default-book-cover.svg', files: [] }; // Default values
      audiobooks.push(book);
    } else {
      // Update author and imageUrl if provided for existing book
      if (author) book.author = author;
      if (imageUrl) book.imageUrl = imageUrl;
    }
    book.files.push(filename);

    await writeDb(audiobooks);

    return NextResponse.json({ message: 'File uploaded successfully!', filename, bookTitle });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file.' }, { status: 500 });
  }
}
