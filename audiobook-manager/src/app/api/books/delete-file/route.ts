import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';

interface Audiobook {
  title: string;
  author: string;
  imageUrl: string;
  files: string[];
}

export async function DELETE(request: NextRequest) {
  try {
    const { bookTitle, fileName } = await request.json();

    if (!bookTitle || !fileName) {
      return NextResponse.json({ error: 'Book title and file name are required.' }, { status: 400 });
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

    const fileIndex = bookToUpdate.files.indexOf(fileName);
    if (fileIndex === -1) {
      return NextResponse.json({ error: 'Audio file not found in this book.' }, { status: 404 });
    }

    // Remove file from the book's files array
    bookToUpdate.files.splice(fileIndex, 1);

    // Delete the actual audio file from the uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await unlink(path.join(uploadDir, fileName));
    } catch (fileError: unknown) {
      if (fileError instanceof Error && 'code' in fileError && fileError.code !== 'ENOENT') {
        console.warn(`Could not delete physical file ${fileName}:`, fileError);
      }
    }

    await writeFile(booksFilePath, JSON.stringify(audiobooks, null, 2));

    return NextResponse.json({ message: `Audio file '${fileName}' deleted successfully from '${bookTitle}'.` });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return NextResponse.json({ error: 'Error deleting audio file.' }, { status: 500 });
  }
}
