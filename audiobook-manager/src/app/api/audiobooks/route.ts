import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const files = await readdir(uploadDir);
    const audiobooks = files.filter(file => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg'));

    return NextResponse.json({ audiobooks });
  } catch (error) {
    console.error('Error listing audiobooks:', error);
    return NextResponse.json({ error: 'Error listing audiobooks.' }, { status: 500 });
  }
}
