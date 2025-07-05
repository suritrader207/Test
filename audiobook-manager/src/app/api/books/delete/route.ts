import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';

interface Audiobook {
  title: string;
  files: string[];
}

export async function DELETE(request: NextRequest) {
  try {
    const { bookTitle } = await request.json();

    if (!bookTitle) {
      return NextResponse.json({ error: 'Book title is required.' }, { status: 400 });
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

    const bookToDelete = audiobooks.find(b => b.title === bookTitle);

    if (!bookToDelete) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    // Delete associated audio files
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    for (const file of bookToDelete.files) {
      try {
        await unlink(path.join(uploadDir, file));
      } catch (fileError: unknown) {
        if (fileError instanceof Error && 'code' in fileError && fileError.code !== 'ENOENT') {
          console.warn(`Could not delete file ${file}:`, fileError);
        }
      }
    }

    // Remove the book from the array
    const updatedAudiobooks = audiobooks.filter(b => b.title !== bookTitle);

    await writeFile(booksFilePath, JSON.stringify(updatedAudiobooks, null, 2));

    return NextResponse.json({ message: `Book '${bookTitle}' and its files deleted successfully.` });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Error deleting book.' }, { status: 500 });
  }
}
