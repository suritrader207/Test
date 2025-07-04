document.addEventListener('DOMContentLoaded', () => {
    const newBookTitleInput = document.getElementById('newBookTitle');
    const addBookBtn = document.getElementById('addBookBtn');
    const booksContainer = document.getElementById('booksContainer');

    const fetchBooks = async () => {
        const response = await fetch('/api/books');
        const books = await response.json();
        renderBooks(books);
    };

    const renderBooks = (books) => {
        booksContainer.innerHTML = '';
        books.forEach(book => {
            const li = document.createElement('li');
            li.innerHTML = `
                <h3>${book.title}</h3>
                <div class="audio-files">
                    <h4>Audio Files:</h4>
                    <ul id="audioList-${book.id}">
                        ${book.audioFiles.map(file => `
                            <li>
                                <audio controls src="${file}"></audio>
                                <span>${file.split('/').pop()}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="upload-section">
                    <input type="file" multiple accept="audio/*" id="audioUpload-${book.id}">
                    <button data-book-id="${book.id}" class="upload-btn">Upload Audio</button>
                </div>
            `;
            booksContainer.appendChild(li);

            // Add event listener for upload button
            const uploadBtn = li.querySelector(`.upload-btn[data-book-id="${book.id}"]`);
            uploadBtn.addEventListener('click', async (event) => {
                const bookId = event.target.dataset.bookId;
                const audioInput = document.getElementById(`audioUpload-${bookId}`);
                const files = audioInput.files;

                if (files.length === 0) {
                    alert('Please select audio files to upload.');
                    return;
                }

                const formData = new FormData();
                for (let i = 0; i < files.length; i++) {
                    formData.append('audioFiles', files[i]);
                }

                const response = await fetch(`/api/books/${bookId}/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    alert('Audio files uploaded successfully!');
                    fetchBooks(); // Refresh the list
                } else {
                    const errorData = await response.json();
                    alert(`Error uploading files: ${errorData.error}`);
                }
            });
        });
    };

    addBookBtn.addEventListener('click', async () => {
        const title = newBookTitleInput.value.trim();
        if (title) {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title }),
            });
            if (response.ok) {
                newBookTitleInput.value = '';
                fetchBooks();
            } else {
                const errorData = await response.json();
                alert(`Error adding book: ${errorData.error}`);
            }
        } else {
            alert('Please enter a book title.');
        }
    });

    // Initial fetch of books
    fetchBooks();
});
