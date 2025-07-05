'use server';

import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    console.log('Attempting to read audiobooks from Prisma.');
    try {
      const audiobooks = await prisma.audiobook.findMany();
      console.log('Successfully read audiobooks from Prisma.');
      return NextResponse.json({ audiobooks });
    } catch (dbError) {
      console.error('Database query failed:', dbError);
      return NextResponse.json({ error: 'Failed to query database.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in /api/audiobooks GET (outer catch):', error);
    return NextResponse.json({ error: 'Error listing audiobooks.' }, { status: 500 });
  }
}