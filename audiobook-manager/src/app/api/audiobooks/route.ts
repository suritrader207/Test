import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const booksFilePath = path.join('/tmp', 'books.json');
    console.log(`Attempting to read books.json from: ${booksFilePath}`);
    const data = await readFile(booksFilePath, 'utf-8');
    console.log('Successfully read books.json');
    const audiobooks = JSON.parse(data);
    console.log('Successfully parsed books.json');
    return NextResponse.json({ audiobooks });
  } catch (error: unknown) {
    console.error('Error in /api/audiobooks GET:', error);
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        console.log('books.json not found, returning empty array.');
        return NextResponse.json({ audiobooks: [] });
      } else if (error instanceof SyntaxError) {
        console.warn('books.json is empty or contains invalid JSON. Returning empty array.', error);
        return NextResponse.json({ audiobooks: [] });
      }
    }
    return NextResponse.json({ error: 'Error listing audiobooks.' }, { status: 500 });
  }
}