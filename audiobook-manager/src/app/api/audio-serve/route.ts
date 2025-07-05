import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required.' }, { status: 400 });
  }

  // Assuming fileName is already the full Blob URL
  // In a real app, you might validate the URL or construct it from a base URL + filename
  return NextResponse.redirect(fileName);
}
