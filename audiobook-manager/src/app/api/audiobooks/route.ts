'use server';

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
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

export async function GET() {
  try {
    console.log('Attempting to read audiobooks from DB.');
    const audiobooks = await readDb();
    console.log('Successfully read audiobooks from DB.');
    return NextResponse.json({ audiobooks });
  } catch (error) {
    console.error('Error in /api/audiobooks GET:', error);
    return NextResponse.json({ error: 'Error listing audiobooks.' }, { status: 500 });
  }
}