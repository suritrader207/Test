import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required.' }, { status: 400 });
  }

  try {
    // Fetch the audio file from the Blob URL
    const response = await fetch(fileName);

    if (!response.ok) {
      console.error(`Failed to fetch audio file from Blob URL: ${response.status} ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch audio file: ${response.statusText}` }, { status: response.status });
    }

    // Get the content type from the fetched response, or default to audio/mpeg
    const contentType = response.headers.get('Content-Type') || 'audio/mpeg';
    console.log('Fetched audio Content-Type:', contentType);

    // Stream the audio file back to the client
    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName.split('/').pop()}"`, // Suggest original filename
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    console.log('Response headers being sent:', headers);
    return new NextResponse(response.body, {
      headers: headers,
    });
  } catch (error) {
    console.error('Error serving audio file:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
