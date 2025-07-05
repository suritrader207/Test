'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';



interface AudiobookFile {
  title: string;
  author: string;
  imageUrl: string;
  files: string[];
}

export default function Home() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [bookAuthor, setBookAuthor] = useState<string>('');
  const [bookImageUrl, setBookImageUrl] = useState<string>('');
  const [audiobooks, setAudiobooks] = useState<AudiobookFile[]>([]);
  const [message, setMessage] = useState<string>('');
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);

  useEffect(() => {
    fetchAudiobooks();
  }, []);

  const fetchAudiobooks = async () => {
    console.log('Fetching audiobooks...');
    try {
      const response = await fetch('/api/audiobooks');
      if (response.ok) {
        console.log('Audiobooks API response OK.');
        const data = await response.json();
        if (data && Array.isArray(data.audiobooks)) {
          console.log('Audiobooks data valid.', data.audiobooks);
          setAudiobooks(data.audiobooks);
        } else {
          console.error('Invalid data format received from /api/audiobooks', data);
          setAudiobooks([]); // Set to empty array to prevent errors
        }
      } else {
        console.error('Failed to fetch audiobooks, response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching audiobooks:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleBookTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBookTitle(event.target.value);
  };

  const handleBookAuthorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBookAuthor(event.target.value);
  };

  const handleBookImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBookImageUrl(event.target.value);
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setMessage('Please select files to upload.');
      return;
    }

    if (!bookTitle.trim()) {
      setMessage('Please enter a book title.');
      return;
    }

    setMessage('Uploading...');

    let allUploadsSuccessful = true;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append('bookTitle', bookTitle);
      formData.append('author', bookAuthor);
      formData.append('imageUrl', bookImageUrl);
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          setMessage(`Upload failed for ${file.name}: ${errorData.error}`);
          allUploadsSuccessful = false;
          break;
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        setMessage(`An error occurred during upload for ${file.name}.`);
        allUploadsSuccessful = false;
        break;
      }
    }

    if (allUploadsSuccessful) {
      setMessage('All files uploaded successfully!');
      setSelectedFiles(null);
      setBookTitle('');
      setBookAuthor('');
      setBookImageUrl('');
      fetchAudiobooks();
    }
  };

  const handleBookClick = (bookTitle: string) => {
    router.push(`/book/${encodeURIComponent(bookTitle)}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <h1 className="text-5xl font-extrabold text-white mb-12 tracking-tight">My Library</h1>

      {message && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md mb-8 text-center text-lg font-medium animate-fade-in-down">
          {message}
        </div>
      )}

      <div className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-gray-800 mb-12">
        <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4"></h2>
        {audiobooks.length === 0 ? (
          <p className="text-gray-400 text-lg text-center py-8">No audiobooks uploaded yet. Click &quot;+ Add New Book&quot; to get started!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {audiobooks.map((book, bookIndex) => (
              <div key={bookIndex} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transform transition-transform duration-200 hover:scale-105 cursor-pointer"
                onClick={() => handleBookClick(book.title)}
              >
                <div className="relative h-48 w-full overflow-hidden flex items-center justify-center bg-gray-900">
                  <Image
                    src={book.imageUrl || '/default-book-cover.svg'}
                    alt={book.title}
                    width={192} // Example width, adjust as needed
                    height={192} // Example height, adjust as needed
                    className="max-w-full max-h-full object-contain"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
                  <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="text-xl font-bold text-white truncate">{book.title}</h3>
                    <p className="text-gray-400 text-sm truncate">{book.author}</p>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col">
                  {/* Edit and Delete buttons removed from here */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-md text-center mt-8">
        {!showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-8 py-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-lg font-semibold transition-colors duration-200"
          >
            + Add New Book
          </button>
        )}

        {showUploadForm && (
          <div className="bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto border border-gray-800 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Upload New Book</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Book Title"
                value={bookTitle}
                onChange={handleBookTitleChange}
                className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Author (optional)"
                value={bookAuthor}
                onChange={handleBookAuthorChange}
                className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={bookImageUrl}
                onChange={handleBookImageUrlChange}
                className="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
              />
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-red-600 file:text-white
                  hover:file:bg-red-700 cursor-pointer"
              />
            </div>
            <div className="flex flex-col space-y-3 mt-6">
              <button
                onClick={handleUpload}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-lg font-semibold transition-colors duration-200"
              >
                Upload Book
              </button>
              <button
                onClick={() => setShowUploadForm(false)}
                className="w-full bg-gray-700 text-white py-3 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 text-lg font-semibold transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}