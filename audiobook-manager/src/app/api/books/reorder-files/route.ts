'use server';

import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const { bookTitle, newOrder } = await request.json();

    if (!bookTitle || !newOrder || !Array.isArray(newOrder)) {
      return NextResponse.json({ error: 'Invalid request data.' }, { status: 400 });
    }

    const bookToUpdate = await prisma.audiobook.findUnique({
      where: { title: bookTitle },
    });

    if (!bookToUpdate) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    // Validate that all files in newOrder exist in the book's current files
    const currentFilesSet = new Set(bookToUpdate.files);
    const isValidOrder = newOrder.every(file => currentFilesSet.has(file));
    if (newOrder.length !== bookToUpdate.files.length || !isValidOrder) {
      return NextResponse.json({ error: 'New order contains invalid or missing files.' }, { status: 400 });
    }

    await prisma.audiobook.update({
      where: { title: bookTitle },
      data: { files: newOrder },
    });

    return NextResponse.json({ message: `Audio files for '${bookTitle}' reordered successfully.` });
  } catch (error) {
    console.error('Error reordering files:', error);
    return NextResponse.json({ error: 'Error reordering files.' }, { status: 500 });
  }
}
