'use server';

import { NextRequest, NextResponse } from 'next/server';
import { unlink, readFile, writeFile } from 'fs/promises';
import path from 'path';
import * as fs from 'fs/promises';

const DB_FILE_PATH = path.join('/tmp', 'mock-db.json');

interface Audiobook {
  title: string;
  author: string;
  imageUrl: string;
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

export async function DELETE(request: NextRequest) {
  try {
    const { bookTitle, fileName } = await request.json();

    if (!bookTitle || !fileName) {
      return NextResponse.json({ error: 'Book title and file name are required.' }, { status: 400 });
    }

    const audiobooks: Audiobook[] = await readDb();

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
    const uploadDir = path.join('/tmp', 'uploads');
    try {
      await unlink(path.join(uploadDir, fileName));
    } catch (fileError: unknown) {
      if (fileError instanceof Error && 'code' in fileError && fileError.code !== 'ENOENT') {
        console.warn(`Could not delete physical file ${fileName}:`, fileError);
      }
    }

    await writeDb(audiobooks);

    return NextResponse.json({ message: `Audio file '${fileName}' deleted successfully from '${bookTitle}'.` });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return NextResponse.json({ error: 'Error deleting audio file.' }, { status: 500 });
  }
}
