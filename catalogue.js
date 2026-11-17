// Catalogue page. Books, My Books and Favorites come from the Flask API.

const booksGrid = document.getElementById("booksGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const resultsCount = document.getElementById("resultsCount");

// Links such as catalogue.html?category=artificial-intelligence
const CATEGORY_SLUGS = {
    "programming": "Programming",
    "artificial-intelligence": "AI",
    "ai": "AI",
    "design": "Design",
    "data-science": "Data Science",
    "business": "Business",
    "technology": "Technology"
};

let books = [];
let ownedIds = new Set();
let favoriteIds = new Set();

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatPrice(price) {
    return Number(price || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + " EGP";
}

async function loadBooks() {
    try {
        const data = await api("/api/books");
        books = data.books;
    } catch (error) {
        booksGrid.innerHTML =
            `<p class="empty-message">${escapeHTML(error.message)}</p>`;
        resultsCount.textContent = "";
        return;
    }

    if (isLoggedIn()) {
        try {
            const [mine, favorites] = await Promise.all([
                api("/api/me/books"),
                api("/api/me/favorites")
            ]);

            ownedIds = new Set(mine.books.map(book => book.id));
            favoriteIds = new Set(favorites.books.map(book => book.id));
        } catch {
            // Not logged in anymore; the catalogue still works.
        }
    }

    displayBooks();
}

function displayBooks() {
    const searchText = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    const filteredBooks = books.filter(book => {
        const matchesSearch =
            book.title.toLowerCase().includes(searchText) ||
            book.author.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            book.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    resultsCount.textContent =
        `${filteredBooks.length} books found`;

    if (filteredBooks.length === 0) {
        booksGrid.innerHTML =
            '<p class="empty-message">No books found. Try another search.</p>';
        return;
    }

    booksGrid.innerHTML = filteredBooks.map(book => {
        const owned = ownedIds.has(book.id);
        const favorite = favoriteIds.has(book.id);

        return `
        <article class="book-card">
            <div class="book-cover" style="background:${escapeHTML(book.color)}">
                <span>${escapeHTML(book.icon)}</span>
                <small>${escapeHTML(book.category)}</small>
            </div>

            <div class="book-info">
                <h3>${escapeHTML(book.title)}</h3>
                <p class="book-author">By ${escapeHTML(book.author)}</p>
                <p class="book-description">${escapeHTML(book.description)}</p>
                <p class="book-price">${formatPrice(book.price)}</p>

                <button class="book-btn" data-action="details"
                        data-book-id="${book.id}">
                    View Details →
                </button>

                <div class="book-actions">
                    <button class="book-btn secondary" data-action="own"
                            data-book-id="${book.id}" ${owned ? "disabled" : ""}>
                        ${owned ? "✓ In My Books" : "+ Add to My Books"}
                    </button>
                    <button class="book-btn secondary fav ${favorite ? "active" : ""}"
                            data-action="favorite" data-book-id="${book.id}"
                            aria-label="${favorite ? "Remove from" : "Add to"} favorites"
                            aria-pressed="${favorite}">
                        ${favorite ? "♥" : "♡"}
                    </button>
                </div>
            </div>
        </article>`;
    }).join("");
}

function requireLogin() {
    if (isLoggedIn()) {
        return true;
    }

    alert("Please log in first.");
    window.location.href = "login.html";
    return false;
}

booksGrid.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const bookId = Number(button.dataset.bookId);
    const book = books.find(item => item.id === bookId);

    if (!book) {
        return;
    }

    if (button.dataset.action === "details") {
        alert(
            `${book.title}\n\nAuthor: ${book.author}\n` +
            `Category: ${book.category}\n` +
            `Price: ${formatPrice(book.price)}\n\n${book.description}`
        );
        return;
    }

    if (!requireLogin()) {
        return;
    }

    try {
        if (button.dataset.action === "own") {
            await api("/api/me/books", {
                method: "POST",
                body: { book_id: bookId }
            });
            ownedIds.add(bookId);
        }

        if (button.dataset.action === "favorite") {
            if (favoriteIds.has(bookId)) {
                await api(`/api/me/favorites/${bookId}`, { method: "DELETE" });
                favoriteIds.delete(bookId);
            } else {
                await api("/api/me/favorites", {
                    method: "POST",
                    body: { book_id: bookId }
                });
                favoriteIds.add(bookId);
            }
        }

        displayBooks();
    } catch (error) {
        if (error.status === 401) {
            window.location.href = "login.html";
            return;
        }

        alert(error.message);
    }
});

searchInput.addEventListener("input", displayBooks);
categoryFilter.addEventListener("change", displayBooks);

// Preselect the category from the URL (?category=design)
const requestedCategory = CATEGORY_SLUGS[
    (new URLSearchParams(window.location.search).get("category") || "")
        .toLowerCase()
];

if (requestedCategory) {
    categoryFilter.value = requestedCategory;
}

loadBooks();
