'use server';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';

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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bookTitle = formData.get('bookTitle') as string;
    const author = formData.get('author') as string; // New field
    const imageUrl = formData.get('imageUrl') as string; // New field

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (!bookTitle) {
      return NextResponse.json({ error: 'Book title is required.' }, { status: 400 });
    }

    // Upload file to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    let book = await prisma.audiobook.findUnique({
      where: { title: bookTitle },
    });

    if (!book) {
      book = await prisma.audiobook.create({
        data: {
          title: bookTitle,
          author: author || 'Unknown Author',
          imageUrl: imageUrl || '/default-book-cover.svg',
          files: [blob.url],
        },
      });
    } else {
      // Update author and imageUrl if provided for existing book
      if (author) book.author = author;
      if (imageUrl) book.imageUrl = imageUrl;
      // Add new file to existing book
      const updatedFiles = [...book.files, blob.url];
      await prisma.audiobook.update({
        where: { title: bookTitle },
        data: { files: updatedFiles },
      });
    }

    return NextResponse.json({ message: 'File uploaded successfully!', filename: blob.url, bookTitle });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file.' }, { status: 500 });
  }
}
