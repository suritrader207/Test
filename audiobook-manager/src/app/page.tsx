'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [audiobooks, setAudiobooks] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetchAudiobooks();
  }, []);

  const fetchAudiobooks = async () => {
    try {
      const response = await fetch('/api/audiobooks');
      if (response.ok) {
        const data = await response.json();
        setAudiobooks(data.audiobooks);
      } else {
        console.error('Failed to fetch audiobooks');
      }
    } catch (error) {
      console.error('Error fetching audiobooks:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setMessage('Please select files to upload.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('file', selectedFiles[i]);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setSelectedFiles(null); // Clear selected files after successful upload
        fetchAudiobooks(); // Refresh the list of audiobooks
      } else {
        const errorData = await response.json();
        setMessage(`Upload failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage('An error occurred during upload.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Audiobook Manager</h1>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Upload Audiobooks</h2>
        <input
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Upload
        </button>
        {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Audiobooks</h2>
        {audiobooks.length === 0 ? (
          <p className="text-gray-500">No audiobooks uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {audiobooks.map((book, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <span className="text-gray-800">{book}</span>
                <audio controls className="ml-4">
                  <source src={`/uploads/${book}`} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}