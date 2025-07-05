'use server';

import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
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

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, newOrder } = await request.json();

    if (!bookTitle || !newOrder || !Array.isArray(newOrder)) {
      return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
    }

    const audiobooks: Audiobook[] = await readDb();

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

    await writeDb(audiobooks);

    return NextResponse.json({ message: `Audio files for '${bookTitle}' reordered successfully.` });
  } catch (error) {
    console.error('Error reordering files:', error);
    return NextResponse.json({ error: 'Error reordering files.' }, { status: 500 });
  }
}
