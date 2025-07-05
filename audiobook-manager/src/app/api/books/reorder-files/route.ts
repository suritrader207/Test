import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface Audiobook {
  title: string;
  author: string;
  imageUrl: string;
  files: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, newOrder } = await request.json();

    if (!bookTitle || !newOrder || !Array.isArray(newOrder)) {
      return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
    }

    const booksFilePath = path.join(process.cwd(), 'public', 'books.json');
    let audiobooks: Audiobook[] = [];

    try {
      const data = await readFile(booksFilePath, 'utf-8');
      audiobooks = JSON.parse(data);
    } catch (readError: unknown) {
      if (readError instanceof Error && 'code' in readError && readError.code === 'ENOENT') {
        return NextResponse.json({ error: 'No books found.' }, { status: 404 });
      }
      console.error('Error reading books.json:', readError);
      return NextResponse.json({ error: 'Error processing books data.' }, { status: 500 });
    }

    const bookToUpdate = audiobooks.find(b => b.title === bookTitle);

    if (!bookToUpdate) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    // Validate that all files in newOrder exist in the book's current files
    const currentFilesSet = new Set(bookToUpdate.files);
    const isValidOrder = newOrder.every(file => currentFilesSet.has(file));
    if (newOrder.length !== bookToUpdate.files.length || !isValidOrder) {
      return NextResponse.json({ error: 'New order contains invalid or missing files.' }, { status: 400 });
    }

    bookToUpdate.files = newOrder; // Update the order

    await writeFile(booksFilePath, JSON.stringify(audiobooks, null, 2));

    return NextResponse.json({ message: `Audio files for '${bookTitle}' reordered successfully.` });
  } catch (error) {
    console.error('Error reordering files:', error);
    return NextResponse.json({ error: 'Error reordering files.' }, { status: 500 });
  }
}
