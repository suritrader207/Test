'use server';

import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export async function DELETE(request: NextRequest) {
  try {
    const { bookTitle } = await request.json();

    if (!bookTitle) {
      return NextResponse.json({ error: 'Book title is required.' }, { status: 400 });
    }

    const bookToDelete = await prisma.audiobook.findUnique({
      where: { title: bookTitle },
    });

    if (!bookToDelete) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    // Delete associated audio files (from /tmp/uploads for now)
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

    await prisma.audiobook.delete({
      where: { title: bookTitle },
    });

    return NextResponse.json({ message: `Book '${bookTitle}' and its files deleted successfully.` });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Error deleting book.' }, { status: 500 });
  }
}
