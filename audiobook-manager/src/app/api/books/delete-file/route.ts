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
    const { bookTitle, fileName } = await request.json();

    if (!bookTitle || !fileName) {
      return NextResponse.json({ error: 'Book title and file name are required.' }, { status: 400 });
    }

    const bookToUpdate = await prisma.audiobook.findUnique({
      where: { title: bookTitle },
    });

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

    await prisma.audiobook.update({
      where: { title: bookTitle },
      data: { files: bookToUpdate.files },
    });

    return NextResponse.json({ message: `Audio file '${fileName}' deleted successfully from '${bookTitle}'.` });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return NextResponse.json({ error: 'Error deleting audio file.' }, { status: 500 });
  }
}
