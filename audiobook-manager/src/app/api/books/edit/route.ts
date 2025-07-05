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

export async function PUT(request: NextRequest) {
  try {
    const { oldTitle, newTitle, newAuthor, newImageUrl } = await request.json();

    if (!oldTitle || !newTitle) {
      return NextResponse.json({ error: 'Old and new book titles are required.' }, { status: 400 });
    }

    const audiobooks: Audiobook[] = await readDb();

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

    await writeDb(audiobooks);

    return NextResponse.json({ message: `Book title updated from '${oldTitle}' to '${newTitle}'.` });
  } catch (error) {
    console.error('Error updating book title:', error);
    return NextResponse.json({ error: 'Error updating book title.' }, { status: 500 });
  }
}