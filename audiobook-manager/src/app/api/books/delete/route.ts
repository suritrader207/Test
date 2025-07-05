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
    const { bookTitle } = await request.json();

    if (!bookTitle) {
      return NextResponse.json({ error: 'Book title is required.' }, { status: 400 });
    }

    const audiobooks: Audiobook[] = await readDb();

    const bookToDelete = audiobooks.find(b => b.title === bookTitle);

    if (!bookToDelete) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    // Delete associated audio files
    const uploadDir = path.join('/tmp', 'uploads');
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

    await writeDb(updatedAudiobooks);

    return NextResponse.json({ message: `Book '${bookTitle}' and its files deleted successfully.` });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Error deleting book.' }, { status: 500 });
  }
}
