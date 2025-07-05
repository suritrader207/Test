import { writeFile, readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

interface Audiobook {
  title: string;
  author: string; // New field
  imageUrl: string; // New field
  files: string[];
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

    // Author and imageUrl are optional for now, but can be made required if needed

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    await writeFile(filePath, buffer);

    const booksFilePath = path.join(process.cwd(), 'public', 'books.json');
    let audiobooks: Audiobook[] = [];

    try {
      const data = await readFile(booksFilePath, 'utf-8');
      audiobooks = JSON.parse(data);
    } catch (readError: unknown) {
      if (readError instanceof Error && 'code' in readError && readError.code !== 'ENOENT') {
        console.error('Error reading books.json:', readError);
        return NextResponse.json({ error: 'Error processing books data.' }, { status: 500 });
      }
      // If file doesn't exist, audiobooks remains an empty array, which is fine.
    }

    let book = audiobooks.find(b => b.title === bookTitle);
    if (!book) {
      book = { title: bookTitle, author: author || 'Unknown Author', imageUrl: imageUrl || '/default-book-cover.png', files: [] }; // Default values
      audiobooks.push(book);
    } else {
      // Update author and imageUrl if provided for existing book
      if (author) book.author = author;
      if (imageUrl) book.imageUrl = imageUrl;
    }
    book.files.push(filename);

    await writeFile(booksFilePath, JSON.stringify(audiobooks, null, 2));

    return NextResponse.json({ message: 'File uploaded successfully!', filename, bookTitle });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file.' }, { status: 500 });
  }
}
