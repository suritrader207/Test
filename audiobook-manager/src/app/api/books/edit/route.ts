import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface Audiobook {
  title: string;
  author: string;
  imageUrl: string;
  files: string[];
}

export async function PUT(request: NextRequest) {
  try {
    const { oldTitle, newTitle, newAuthor, newImageUrl } = await request.json();

    if (!oldTitle || !newTitle) {
      return NextResponse.json({ error: 'Old and new book titles are required.' }, { status: 400 });
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

    const bookToUpdate = audiobooks.find(b => b.title === oldTitle);

    if (!bookToUpdate) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    // Check if new title already exists
    if (audiobooks.some(b => b.title === newTitle && b.title !== oldTitle)) {
      return NextResponse.json({ error: 'New title already exists.' }, { status: 409 });
    }

    bookToUpdate.title = newTitle;
    if (newAuthor !== undefined) bookToUpdate.author = newAuthor;
    if (newImageUrl !== undefined) bookToUpdate.imageUrl = newImageUrl;

    await writeFile(booksFilePath, JSON.stringify(audiobooks, null, 2));

    return NextResponse.json({ message: `Book title updated from '${oldTitle}' to '${newTitle}'.` });
  } catch (error) {
    console.error('Error updating book title:', error);
    return NextResponse.json({ error: 'Error updating book title.' }, { status: 500 });
  }
}