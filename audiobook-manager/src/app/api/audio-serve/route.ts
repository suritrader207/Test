import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required.' }, { status: 400 });
  }

  try {
    const filePath = path.join('/tmp', 'uploads', fileName);
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.ogg') contentType = 'audio/ogg';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`, // Use attachment for download, inline for streaming
      },
    });
  } catch (error) {
    console.error(`Error serving file ${fileName}:`, error);
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error serving file.' }, { status: 500 });
  }
}
