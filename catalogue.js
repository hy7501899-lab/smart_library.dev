// Catalogue page. Books, My Books and Favorites come from the Flask API.

// const booksGrid = document.getElementById("booksGrid");
// const searchInput = document.getElementById("searchInput");
// const categoryFilter = document.getElementById("categoryFilter");
// const resultsCount = document.getElementById("resultsCount");

// // Links such as catalogue.html?category=artificial-intelligence
// const CATEGORY_SLUGS = {
//     "programming": "Programming",
//     "artificial-intelligence": "AI",
//     "ai": "AI",
//     "design": "Design",
//     "data-science": "Data Science",
//     "business": "Business",
//     "technology": "Technology"
// };

// let books = [];
// let ownedIds = new Set();
// let favoriteIds = new Set();

// function escapeHTML(value) {
//     return String(value ?? "").replace(/[&<>"']/g, character => ({
//         "&": "&amp;",
//         "<": "&lt;",
//         ">": "&gt;",
//         '"': "&quot;",
//         "'": "&#39;"
//     })[character]);
// }

// function formatPrice(price) {
//     return Number(price || 0).toLocaleString("en-US", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2
//     }) + " EGP";
// }

// async function loadBooks() {
//     try {
//         const data = await api("/api/books");
//         books = data.books;
//     } catch (error) {
//         booksGrid.innerHTML =
//             `<p class="empty-message">${escapeHTML(error.message)}</p>`;
//         resultsCount.textContent = "";
//         return;
//     }

//     if (isLoggedIn()) {
//         try {
//             const [mine, favorites] = await Promise.all([
//                 api("/api/me/books"),
//                 api("/api/me/favorites")
//             ]);

//             ownedIds = new Set(mine.books.map(book => book.id));
//             favoriteIds = new Set(favorites.books.map(book => book.id));
//         } catch {
//             // Not logged in anymore; the catalogue still works.
//         }
//     }

//     displayBooks();
// }

// function displayBooks() {
//     const searchText = searchInput.value.toLowerCase().trim();
//     const selectedCategory = categoryFilter.value;

//     const filteredBooks = books.filter(book => {
//         const matchesSearch =
//             book.title.toLowerCase().includes(searchText) ||
//             book.author.toLowerCase().includes(searchText);

//         const matchesCategory =
//             selectedCategory === "all" ||
//             book.category === selectedCategory;

//         return matchesSearch && matchesCategory;
//     });

//     resultsCount.textContent =
//         `${filteredBooks.length} books found`;

//     if (filteredBooks.length === 0) {
//         booksGrid.innerHTML =
//             '<p class="empty-message">No books found. Try another search.</p>';
//         return;
//     }

//     booksGrid.innerHTML = filteredBooks.map(book => {
//         const owned = ownedIds.has(book.id);
//         const favorite = favoriteIds.has(book.id);

//         return `
//         <article class="book-card">
//             <div class="book-cover" style="background:${escapeHTML(book.color)}">
//                 <span>${escapeHTML(book.icon)}</span>
//                 <small>${escapeHTML(book.category)}</small>
//             </div>

//             <div class="book-info">
//                 <h3>${escapeHTML(book.title)}</h3>
//                 <p class="book-author">By ${escapeHTML(book.author)}</p>
//                 <p class="book-description">${escapeHTML(book.description)}</p>
//                 <p class="book-price">${formatPrice(book.price)}</p>

//                 <button class="book-btn" data-action="details"
//                         data-book-id="${book.id}">
//                     View Details →
//                 </button>

//                 <div class="book-actions">
//                     <button class="book-btn secondary" data-action="own"
//                             data-book-id="${book.id}" ${owned ? "disabled" : ""}>
//                         ${owned ? "✓ In My Books" : "+ Add to My Books"}
//                     </button>
//                     <button class="book-btn secondary fav ${favorite ? "active" : ""}"
//                             data-action="favorite" data-book-id="${book.id}"
//                             aria-label="${favorite ? "Remove from" : "Add to"} favorites"
//                             aria-pressed="${favorite}">
//                         ${favorite ? "♥" : "♡"}
//                     </button>
//                 </div>
//             </div>
//         </article>`;
//     }).join("");
// }

// function requireLogin() {
//     if (isLoggedIn()) {
//         return true;
//     }

//     alert("Please log in first.");
//     window.location.href = "login.html";
//     return false;
// }

// booksGrid.addEventListener("click", async event => {
//     const button = event.target.closest("[data-action]");

//     if (!button) {
//         return;
//     }

//     const bookId = Number(button.dataset.bookId);
//     const book = books.find(item => item.id === bookId);

//     if (!book) {
//         return;
//     }

//     if (button.dataset.action === "details") {
//         alert(
//             `${book.title}\n\nAuthor: ${book.author}\n` +
//             `Category: ${book.category}\n` +
//             `Price: ${formatPrice(book.price)}\n\n${book.description}`
//         );
//         return;
//     }

//     if (!requireLogin()) {
//         return;
//     }

//     try {
//         if (button.dataset.action === "own") {
//             await api("/api/me/books", {
//                 method: "POST",
//                 body: { book_id: bookId }
//             });
//             ownedIds.add(bookId);
//         }

//         if (button.dataset.action === "favorite") {
//             if (favoriteIds.has(bookId)) {
//                 await api(`/api/me/favorites/${bookId}`, { method: "DELETE" });
//                 favoriteIds.delete(bookId);
//             } else {
//                 await api("/api/me/favorites", {
//                     method: "POST",
//                     body: { book_id: bookId }
//                 });
//                 favoriteIds.add(bookId);
//             }
//         }

//         displayBooks();
//     } catch (error) {
//         if (error.status === 401) {
//             window.location.href = "login.html";
//             return;
//         }

//         alert(error.message);
//     }
// });

// searchInput.addEventListener("input", displayBooks);
// categoryFilter.addEventListener("change", displayBooks);

// // Preselect the category from the URL (?category=design)
// const requestedCategory = CATEGORY_SLUGS[
//     (new URLSearchParams(window.location.search).get("category") || "")
//         .toLowerCase()
// ];

// if (requestedCategory) {
//     categoryFilter.value = requestedCategory;
// }

// loadBooks();




  const booksData = [
            { id: 1, title: "Clean Code", author: "Robert C. Martin", category: "programming", cover: "https://m.media-amazon.com/images/I/71sBtM3Yi5L._AC_UF1000,1000_QL80_.jpg", desc: "A Handbook of Agile Software Craftsmanship.", pdfUrl: "https://mozilla.github.io/pdf.js/web/viewer.html" },
            { id: 2, title: "Python Crash Course", author: "Eric Matthes", category: "programming", cover: "https://m.media-amazon.com/images/I/71V23u65J6L._AC_UF1000,1000_QL80_.jpg", desc: "A Hands-On, Project-Based Introduction to Programming.", pdfUrl: "https://ehmatthes.github.io/pcc_3e/" },
            { id: 3, title: "The Pragmatic Programmer", author: "Andrew Hunt & David Thomas", category: "programming", cover: "https://m.media-amazon.com/images/I/71f743sOPmL._AC_UF1000,1000_QL80_.jpg", desc: "Your Journey to Software Mastery.", pdfUrl: "https://eloquentjavascript.net/Eloquent_JavaScript.pdf" },
            { id: 4, title: "Eloquent JavaScript", author: "Marijn Haverbeke", category: "programming", cover: "https://m.media-amazon.com/images/I/51INjpz6ZtL._AC_UF1000,1000_QL80_.jpg", desc: "A Modern Introduction to Programming in JavaScript.", pdfUrl: "https://eloquentjavascript.net/Eloquent_JavaScript.pdf" },
            { id: 5, title: "You Don't Know JS", author: "Kyle Simpson", category: "programming", cover: "https://m.media-amazon.com/images/I/7186Y6d70+L._AC_UF1000,1000_QL80_.jpg", desc: "Deep dive into the core mechanics of JavaScript.", pdfUrl: "https://eloquentjavascript.net/" },
            { id: 6, title: "Hands-On Machine Learning", author: "Aurélien Géron", category: "artificial-intelligence", cover: "https://m.media-amazon.com/images/I/81kqrWpORFL._AC_UF1000,1000_QL80_.jpg", desc: "Concepts and Tools to Build Intelligent Systems.", pdfUrl: "https://www.deeplearningbook.org/" },
            { id: 7, title: "Deep Learning Textbook", author: "Ian Goodfellow", category: "artificial-intelligence", cover: "https://m.media-amazon.com/images/I/61ScEipC3-L._AC_UF1000,1000_QL80_.jpg", desc: "An MIT Press foundational textbook on Deep Neural Nets.", pdfUrl: "https://www.deeplearningbook.org/" },
            { id: 8, title: "Artificial Intelligence: Modern Approach", author: "Stuart Russell & Peter Norvig", category: "artificial-intelligence", cover: "https://m.media-amazon.com/images/I/81m9B-40jpL._AC_UF1000,1000_QL80_.jpg", desc: "The standard textbook in AI used worldwide.", pdfUrl: "https://www.deeplearningbook.org/" },
            { id: 9, title: "Pattern Recognition & ML", author: "Christopher Bishop", category: "artificial-intelligence", cover: "https://m.media-amazon.com/images/I/71u+L2513yL._AC_UF1000,1000_QL80_.jpg", desc: "Comprehensive guide to Bayesian stats and ML algorithms.", pdfUrl: "https://www.microsoft.com/en-us/research/uploads/prod/2006/01/Bishop-Pattern-Recognition-and-Machine-Learning-2006.pdf" },
            { id: 10, title: "The Design of Everyday Things", author: "Don Norman", category: "design", cover: "https://m.media-amazon.com/images/I/71T0y2XJ7BL._AC_UF1000,1000_QL80_.jpg", desc: "Fundamental principles of user-centered design.", pdfUrl: "https://rcompanion.org/handbook/" },
            { id: 11, title: "Don't Make Me Think", author: "Steve Krug", category: "design", cover: "https://m.media-amazon.com/images/I/71f76G3y9SL._AC_UF1000,1000_QL80_.jpg", desc: "A Common Sense Approach to Web Usability.", pdfUrl: "https://rcompanion.org/handbook/" },
            { id: 12, title: "About Face: Interaction Design", author: "Alan Cooper", category: "design", cover: "https://m.media-amazon.com/images/I/71nFw5e75uL._AC_UF1000,1000_QL80_.jpg", desc: "The definitive guide to digital product design.", pdfUrl: "https://rcompanion.org/handbook/" },
            { id: 13, title: "Python for Data Analysis", author: "Wes McKinney", category: "data-science", cover: "https://m.media-amazon.com/images/I/81w--G4UuLL._AC_UF1000,1000_QL80_.jpg", desc: "Data Wrangling with Pandas, NumPy, and Jupyter.", pdfUrl: "https://wesmckinney.com/book/" },
            { id: 14, title: "Hands-On Data Science with R", author: "Sal Mangiafico", category: "data-science", cover: "https://m.media-amazon.com/images/I/71sKxI7l1SL._AC_UF1000,1000_QL80_.jpg", desc: "Solving data science problems using R statistical software.", pdfUrl: "https://rcompanion.org/handbook/" },
            { id: 15, title: "Storytelling with Data", author: "Cole Knaflic", category: "data-science", cover: "https://m.media-amazon.com/images/I/71v27fVl-nL._AC_UF1000,1000_QL80_.jpg", desc: "A Data Visualization Guide for Business Professionals.", pdfUrl: "https://wesmckinney.com/book/" },
            { id: 16, title: "The Lean Startup", author: "Eric Ries", category: "business", cover: "https://m.media-amazon.com/images/I/81vvgZqCskL._AC_UF1000,1000_QL80_.jpg", desc: "How Constant Innovation Creates Successful Businesses.", pdfUrl: "https://ehmatthes.github.io/pcc_3e/" },
            { id: 17, title: "Zero to One", author: "Peter Thiel", category: "business", cover: "https://m.media-amazon.com/images/I/71m-2tqY0mL._AC_UF1000,1000_QL80_.jpg", desc: "Notes on Startups, or How to Build the Future.", pdfUrl: "https://ehmatthes.github.io/pcc_3e/" },
            { id: 18, title: "Introduction to Algorithms (CLRS)", author: "Thomas Cormen", category: "technology", cover: "https://m.media-amazon.com/images/I/71FXjX8M9qL._AC_UF1000,1000_QL80_.jpg", desc: "The comprehensive textbook on algorithms and data structures.", pdfUrl: "https://eloquentjavascript.net/Eloquent_JavaScript.pdf" },
            { id: 19, title: "Computer Networking", author: "James Kurose", category: "technology", cover: "https://m.media-amazon.com/images/I/811mZl2LzPL._AC_UF1000,1000_QL80_.jpg", desc: "Modern internet architecture and networking protocols.", pdfUrl: "https://eloquentjavascript.net/Eloquent_JavaScript.pdf" },
            { id: 20, title: "Code: The Hidden Language", author: "Charles Petzold", category: "technology", cover: "https://m.media-amazon.com/images/I/717F4sF+j1L._AC_UF1000,1000_QL80_.jpg", desc: "How computers work from ground up.", pdfUrl: "https://eloquentjavascript.net/Eloquent_JavaScript.pdf" }
        ];

        let borrowedBooks = JSON.parse(localStorage.getItem('smart_borrowed_books')) || [];

        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');

        if (categoryParam) {
            const activeBtn = document.getElementById(`cat-${categoryParam}`);
            if (activeBtn) activeBtn.classList.add('active');
        } else {
            document.getElementById('cat-all').classList.add('active');
        }

        const grid = document.getElementById('booksGrid');
        let displayedBooks = categoryParam ? booksData.filter(b => b.category === categoryParam) : booksData;

        function renderBooks() {
            if (displayedBooks.length === 0) {
                grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #777; padding: 40px;">No books found in this category.</p>`;
                return;
            }

            grid.innerHTML = displayedBooks.map(book => {
                const isBorrowed = borrowedBooks.includes(book.id);
                return `
                    <div class="book-card">
                        <img src="${book.cover}" class="book-cover" alt="${book.title}">
                        <div class="book-info">
                            <h3 class="book-title">${book.title}</h3>
                            <p class="book-author">${book.author}</p>
                            <p class="book-desc">${book.desc}</p>
                            <div class="btn-group">
                                <button type="button" class="btn btn-read" onclick="openReader(${book.id})">Read Book 📖</button>
                                <button type="button" class="btn btn-borrow ${isBorrowed ? 'borrowed' : ''}" onclick="toggleBorrow(${book.id})">
                                    ${isBorrowed ? 'Borrowed ✓' : 'Borrow'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function openReader(id) {
            const book = booksData.find(b => b.id === id);
            if (book) {
                document.getElementById('modalTitle').innerText = book.title;
                document.getElementById('modalAuthor').innerText = "By: " + book.author;
                document.getElementById('pdfFrame').src = book.pdfUrl;
                document.getElementById('readerModal').style.display = 'flex';
            }
        }

        function closeReader() {
            document.getElementById('readerModal').style.display = 'none';
            document.getElementById('pdfFrame').src = '';
        }

        function toggleBorrow(id) {
            const index = borrowedBooks.indexOf(id);
            if (index === -1) {
                borrowedBooks.push(id);
            } else {
                borrowedBooks.splice(index, 1);
            }
            localStorage.setItem('smart_borrowed_books', JSON.stringify(borrowedBooks));
            renderBooks();
        }

        renderBooks();
