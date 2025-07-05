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

export async function PUT(request: NextRequest) {
  try {
    const { oldTitle, newTitle, newAuthor, newImageUrl } = await request.json();

    if (!oldTitle || !newTitle) {
      return NextResponse.json({ error: 'Old and new book titles are required.' }, { status: 400 });
    }

    const bookToUpdate = await prisma.audiobook.findUnique({
      where: { title: oldTitle },
    });

    if (!bookToUpdate) {
      return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    }

    // Check if new title already exists
    if (newTitle !== oldTitle) {
      const existingBook = await prisma.audiobook.findUnique({
        where: { title: newTitle },
      });
      if (existingBook) {
        return NextResponse.json({ error: 'New title already exists.' }, { status: 409 });
      }
    }

    await prisma.audiobook.update({
      where: { title: oldTitle },
      data: {
        title: newTitle,
        author: newAuthor !== undefined ? newAuthor : bookToUpdate.author,
        imageUrl: newImageUrl !== undefined ? newImageUrl : bookToUpdate.imageUrl,
      },
    });

    return NextResponse.json({ message: `Book title updated from '${oldTitle}' to '${newTitle}'.` });
  } catch (error) {
    console.error('Error updating book title:', error);
    return NextResponse.json({ error: 'Error updating book title.' }, { status: 500 });
  }
}