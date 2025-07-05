'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';



import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AudiobookFile {
  title: string;
  author: string;
  imageUrl: string;
  files: string[];
  originalFileNames: string[];
}

interface SortableItemProps {
  file: { fileUrl: string; originalFileName: string };
  bookTitle: string;
  onDelete: (fileName: string) => void;
}

function SortableItem({ file, bookTitle, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.fileUrl }); // attributes are spread onto the li element

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayName = file.originalFileName;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex flex-col sm:flex-row items-center justify-between bg-gray-700 p-4 rounded-lg shadow-md cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center flex-grow min-w-0">
        {/* Drag handle - apply listeners here */}
        <div className="mr-3 text-gray-400 cursor-grab" {...listeners}>
          &#x2261; {/* Unicode for three horizontal lines (hamburger icon) */}
        </div>
        <span className="text-gray-200 font-medium text-lg truncate min-w-0">{displayName}</span>
      </div>
      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
        <audio controls className="w-full sm:w-64 h-10">
          <source src={file.fileUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag from triggering delete
            console.log(`Delete button clicked for file: ${file.fileUrl}`);
            onDelete(file.fileUrl);
          }}
          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [book, setBook] = useState<AudiobookFile | null>(null);
  const [message, setMessage] = useState<string>('');
  const [addingFilesToBook, setAddingFilesToBook] = useState<string | null>(null);
  const [filesToAdd, setFilesToAdd] = useState<FileList | null>(null);
  const [editingBook, setEditingBook] = useState<boolean>(false);
  const [newBookTitle, setNewBookTitle] = useState<string>('');
  const [newBookAuthor, setNewBookAuthor] = useState<string>('');
  const [newBookImageUrl, setNewBookImageUrl] = useState<string>('');
  const [audioFiles, setAudioFiles] = useState<{ fileUrl: string; originalFileName: string }[]>([]);
  const [hasOrderChanged, setHasOrderChanged] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchBookDetails = useCallback(async () => {
    try {
      const response = await fetch('/api/audiobooks');
      if (response.ok) {
        const data = await response.json();
        const foundBook = data.audiobooks.find((b: AudiobookFile) => b.title === (params.bookTitle ? decodeURIComponent(params.bookTitle as string) : ''));
        setBook(foundBook || null);
        if (!foundBook) {
          setMessage('Book not found.');
        }
      } else {
        console.error('Failed to fetch audiobooks');
        setMessage('Failed to load book details.');
      }
    } catch (error) {
      console.error('Error fetching audiobooks:', error);
      setMessage('An error occurred while loading book details.');
    }
  }, [params.bookTitle]);

  useEffect(() => {
    if (params.bookTitle) {
      fetchBookDetails();
    }
  }, [params.bookTitle, fetchBookDetails]);

  useEffect(() => {
    if (book) {
      // Combine files and originalFileNames into a single array of objects
      const combinedFiles = book.files.map((fileUrl, index) => ({
        fileUrl: fileUrl,
        originalFileName: book.originalFileNames[index] || 'Unknown File',
      }));
      setAudioFiles(combinedFiles);
      setHasOrderChanged(false);
    }
  }, [book]);

  const handleFilesToAddChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilesToAdd(event.target.files);
  };

  const handleUploadAdditionalFiles = async () => {
    const bookTitle = params.bookTitle ? decodeURIComponent(params.bookTitle as string) : '';

    if (!filesToAdd || filesToAdd.length === 0) {
      setMessage('Please select files to add.');
      return;
    }

    if (!bookTitle.trim()) {
      setMessage('Book title is missing.');
      return;
    }

    setMessage('Uploading additional files...');
    let allUploadsSuccessful = true;

    for (let i = 0; i < filesToAdd.length; i++) {
      const file = filesToAdd[i];
      const formData = new FormData();
      formData.append('bookTitle', bookTitle);
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
      setMessage('Additional files uploaded successfully!');
      setAddingFilesToBook(null);
      setFilesToAdd(null);
      fetchBookDetails();
    }
  };

  const handleCancelAddFiles = () => {
    setAddingFilesToBook(null);
    setFilesToAdd(null);
  };

  const handleDeleteBook = async () => {
    if (!book || !confirm(`Are you sure you want to delete the book '${book.title}' and all its audio files?`)) {
      return;
    }

    try {
      const response = await fetch('/api/books/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookTitle: book.title }),
      });

      if (response.ok) {
        setMessage(`Book '${book.title}' deleted successfully.`);
        router.push('/');
      } else {
        const errorData = await response.json();
        setMessage(`Failed to delete book: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      setMessage('An error occurred during book deletion.');
    }
  };

  const handleDeleteAudioFile = async (fileUrlToDelete: string) => {
    console.log(`handleDeleteAudioFile called for: ${fileUrlToDelete}`);
    if (!book || !confirm(`Are you sure you want to delete the audio file '${fileUrlToDelete}' from '${book.title}'?`)) {
      return;
    }

    try {
      const response = await fetch('/api/books/delete-file', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookTitle: book.title, fileName: fileUrlToDelete }),
      });

      if (response.ok) {
        setMessage(`Audio file '${fileUrlToDelete}' deleted successfully.`);
        fetchBookDetails();
      } else {
        const errorData = await response.json();
        setMessage(`Failed to delete audio file: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting audio file:', error);
      setMessage('An error occurred during audio file deletion.');
    }
  };

  const handleEditClick = () => {
    if (book) {
      setEditingBook(true);
      setNewBookTitle(book.title);
      setNewBookAuthor(book.author);
      setNewBookImageUrl(book.imageUrl);
    }
  };

  const handleSaveEdit = async () => {
    if (!book || !newBookTitle.trim()) {
      setMessage('New book title cannot be empty.');
      return;
    }

    try {
      const response = await fetch('/api/books/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldTitle: book.title, newTitle: newBookTitle, newAuthor: newBookAuthor, newImageUrl: newBookImageUrl }),
      });

      if (response.ok) {
        setMessage(`Book '${book.title}' updated to '${newBookTitle}'.`);
        setEditingBook(false);
        fetchBookDetails();
        if (book.title !== newBookTitle) {
          router.replace(`/book/${encodeURIComponent(newBookTitle)}`);
        }
      } else {
        const errorData = await response.json();
        setMessage(`Failed to update book: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      setMessage('An error occurred during book update.');
    }
  };

  const handleCancelEdit = () => {
    setEditingBook(false);
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookImageUrl('');
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setAudioFiles((items) => {
        const oldIndex = items.findIndex(item => item.fileUrl === (active.id as string));
        const newIndex = items.findIndex(item => item.fileUrl === (over.id as string));
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        setHasOrderChanged(true);
        return newItems;
      });
    }
  }

  const handleSaveOrder = async () => {
    if (!book) return;

    setMessage('Saving new order...');
    try {
      const response = await fetch('/api/books/reorder-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookTitle: book.title, newOrder: audioFiles.map(item => item.fileUrl) }),
      });

      if (response.ok) {
        setMessage('Order saved successfully!');
        setHasOrderChanged(false);
        fetchBookDetails();
      } else {
        const errorData = await response.json();
        setMessage(`Failed to save order: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setMessage('An error occurred while saving order.');
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
        <h1 className="text-5xl font-extrabold text-white mb-8 tracking-tight">Book Details</h1>
        {message ? (
          <p className="text-red-400 text-lg">{message}</p>
        ) : (
          <p className="text-gray-400 text-lg">Loading book details...</p>
        )}
        <button
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-3 bg-red-700 text-white rounded-lg shadow-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-lg font-semibold transition-colors duration-200"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <button
        onClick={() => router.push('/')}
        className="self-start mb-8 px-6 py-3 bg-red-700 text-white rounded-lg shadow-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-lg font-semibold transition-colors duration-200"
      >
        &larr; Back to Library
      </button>

      {message && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md mb-8 text-center text-lg font-medium animate-fade-in-down">
          {message}
        </div>
      )}

      <div className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-gray-800 mb-12 flex flex-col md:flex-row items-center md:items-start">
        <Image
          src={book.imageUrl || '/default-book-cover.svg'}
          alt={book.title}
          width={192} // w-48 * 4 = 192px
          height={192} // h-48 * 4 = 192px
          className="object-cover rounded-lg shadow-lg md:mr-8 mb-6 md:mb-0 w-32 h-32 sm:w-48 sm:h-48"
          priority
        />
        <div className="flex-grow text-center md:text-left">
          {editingBook ? (
            <div className="flex flex-col space-y-3 mb-4">
              <input
                type="text"
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
                placeholder="Book Title"
              />
              <input
                type="text"
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
                placeholder="Author"
              />
              <input
                type="text"
                value={newBookImageUrl}
                onChange={(e) => setNewBookImageUrl(e.target.value)}
                className="p-3 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-400"
                placeholder="Image URL"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">{book.title}</h1>
              <p className="text-gray-300 text-xl mb-4">by {book.author}</p>
              <div className="flex justify-center md:justify-start space-x-3 mb-4">
                <button
                  onClick={handleEditClick}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-lg font-semibold"
                >
                  Edit Book
                </button>
                <button
                  onClick={handleDeleteBook}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-lg font-semibold"
                >
                  Delete Book
                </button>
              </div>
              <button
                onClick={() => setAddingFilesToBook(book.title)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-lg font-semibold"
              >
                + Add Audio Files
              </button>
            </>
          )}
        </div>
      </div>

      {addingFilesToBook === book.title && (
        <div className="w-full max-w-4xl bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-800 mb-12 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-3">Add Files to &quot;{book.title}&quot;</h2>
          <input
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFilesToAddChange}
            className="block w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-red-600 file:text-white
              hover:file:bg-red-700 cursor-pointer"
          />
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={handleUploadAdditionalFiles}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-lg font-semibold"
            >
              Upload Selected
            </button>
            <button
              onClick={handleCancelAddFiles}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 text-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-gray-800">
        <h2 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Audio Files</h2>
        {audioFiles.length === 0 ? (
          <p className="text-gray-400 text-lg text-center py-8">No audio files for this book yet. Add some above!</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={audioFiles.map(item => item.fileUrl)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-4">
                {audioFiles.map((file) => (
                  <SortableItem key={file.fileUrl} file={file} bookTitle={book.title} onDelete={handleDeleteAudioFile} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        {hasOrderChanged && audioFiles.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveOrder}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-lg font-semibold"
            >
              Save Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}