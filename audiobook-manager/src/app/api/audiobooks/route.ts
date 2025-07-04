import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const booksFilePath = path.join(process.cwd(), 'public', 'books.json');
    const data = await readFile(booksFilePath, 'utf-8');
    const audiobooks = JSON.parse(data);
    return NextResponse.json({ audiobooks });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // books.json doesn't exist yet, return empty array
      return NextResponse.json({ audiobooks: [] });
    }
    console.error('Error listing audiobooks:', error);
    return NextResponse.json({ error: 'Error listing audiobooks.' }, { status: 500 });
  }
}