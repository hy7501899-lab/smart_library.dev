// ========================================
// SMART LIBRARY - DASHBOARD JAVASCRIPT
// All data comes from the Flask API (see session.js for api()).
// ========================================

"use strict";

// The dashboard is for logged-in users only.
if (!isLoggedIn()) {
    window.location.replace("login.html");
}

// Safely display text inside HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function formatMoney(value) {
    return (Number(value) || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// If the server says the session is no longer valid, go to the login page.
function handleError(error) {
    if (error.status === 401) {
        window.location.replace("login.html");
        return;
    }

    alert(error.message);
}

let myBooks = [];
let favorites = [];

// ========================================
// 1. ACCOUNT INFORMATION
// ========================================

const accountForm = document.getElementById("accountForm");
const accountMessage = document.getElementById("accountMessage");

function fillAccount(account) {
    document.getElementById("userName").value = account.name || "";
    document.getElementById("userEmail").value = account.email || "";
    document.getElementById("userPhone").value = account.phone || "";
}

async function loadAccount() {
    const data = await api("/api/me");

    fillAccount(data.user);
    // Keep the navbar name in sync.
    saveSession(getToken(), data.user);
}

if (accountForm) {
    accountForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("userName").value.trim();
        const email = document.getElementById("userEmail").value.trim();
        const phone = document.getElementById("userPhone").value.trim();

        if (!name || !email) {
            accountMessage.textContent =
                "Please enter your name and email.";

            return;
        }

        try {
            const data = await api("/api/me", {
                method: "PUT",
                body: { name, email, phone }
            });

            saveSession(getToken(), data.user);
            fillAccount(data.user);

            accountMessage.textContent =
                "Account information saved successfully!";
        } catch (error) {
            if (error.status === 401) {
                handleError(error);
                return;
            }

            accountMessage.textContent = error.message;
        }
    });
}

// ========================================
// 2. BOOK LISTS (My Books + Favorites)
// ========================================

function bookItemHTML(book, actions) {
    return `
        <article class="book-item">
            <div class="book-cover" style="background:${escapeHTML(book.color)}">
                ${escapeHTML(book.icon)}
            </div>

            <div class="book-info">
                <h3>${escapeHTML(book.title)}</h3>
                <p>${escapeHTML(book.author)} · ${escapeHTML(book.category)}</p>
            </div>

            <div class="item-actions">${actions}</div>
        </article>
    `;
}

function renderMyBooks() {
    const booksList = document.getElementById("myBooksList");
    const booksCount = document.getElementById("booksCount");

    booksCount.textContent = myBooks.length;

    if (myBooks.length === 0) {
        booksList.innerHTML = `
            <p class="empty-message">
                📖 You haven't added any books yet.
            </p>
        `;
        return;
    }

    booksList.innerHTML = myBooks.map(book => {
        const isFavorite = favorites.some(item => item.id === book.id);

        const favoriteButton = isFavorite
            ? ""
            : `<button class="text-action" data-action="add-favorite"
                       data-id="${book.id}">♥ Favorite</button>`;

        return bookItemHTML(book, `
            ${favoriteButton}
            <button class="text-action remove-action"
                    data-action="delete-book"
                    data-id="${book.id}">Remove</button>
        `);
    }).join("");
}

function renderFavorites() {
    const favoritesList = document.getElementById("favoritesList");
    const favoritesCount = document.getElementById("favoritesCount");

    favoritesCount.textContent = favorites.length;

    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <p class="empty-message">
                💜 You haven't added any favorite books yet.
            </p>
        `;
        return;
    }

    favoritesList.innerHTML = favorites.map(book => bookItemHTML(book, `
        <button class="text-action remove-action"
                data-action="delete-favorite"
                data-id="${book.id}">Remove</button>
    `)).join("");
}

// ========================================
// 3. PAYMENT HISTORY
// ========================================

function renderPayments(payments) {
    const paymentsList = document.getElementById("paymentsList");

    document.getElementById("paymentsCount").textContent = payments.length;

    const completedPayments = payments.filter(
        payment => payment.status === "completed"
    );

    document.getElementById("completedCount").textContent =
        completedPayments.length;

    // The total counts completed payments only
    const total = completedPayments.reduce(
        (sum, payment) => sum + (Number(payment.amount) || 0),
        0
    );

    document.getElementById("totalPayments").textContent =
        formatMoney(total) + " EGP";

    if (payments.length === 0) {
        paymentsList.innerHTML = `
            <p class="empty-message">
                💳 You haven't made any payments yet.
            </p>
        `;
        return;
    }

    paymentsList.innerHTML = payments.map(payment => {
        const status = ["completed", "pending", "failed"]
            .includes(payment.status) ? payment.status : "pending";

        return `
            <article class="payment-item">
                <div>
                    <h3>${escapeHTML(payment.title || "Library purchase")}</h3>
                    <p>${escapeHTML(payment.date || "Date not available")}</p>
                </div>

                <div class="payment-right">
                    <strong>${formatMoney(payment.amount)} EGP</strong>
                    <span class="status ${status}">${status}</span>
                </div>
            </article>
        `;
    }).join("");
}

async function loadLists() {
    const [mine, favs, payments] = await Promise.all([
        api("/api/me/books"),
        api("/api/me/favorites"),
        api("/api/me/payments")
    ]);

    myBooks = mine.books;
    favorites = favs.books;

    renderMyBooks();
    renderFavorites();
    renderPayments(payments.payments);
}

// ========================================
// 4. BUTTON ACTIONS
// ========================================

document.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const bookId = Number(button.dataset.id);

    if (!Number.isInteger(bookId)) {
        return;
    }

    try {
        if (action === "delete-book") {
            await api(`/api/me/books/${bookId}`, { method: "DELETE" });
            myBooks = myBooks.filter(book => book.id !== bookId);
            renderMyBooks();
        }

        if (action === "add-favorite") {
            const data = await api("/api/me/favorites", {
                method: "POST",
                body: { book_id: bookId }
            });

            favorites.unshift(data.book);
            renderFavorites();
            renderMyBooks();
        }

        if (action === "delete-favorite") {
            await api(`/api/me/favorites/${bookId}`, { method: "DELETE" });
            favorites = favorites.filter(book => book.id !== bookId);
            renderFavorites();
            renderMyBooks();
        }
    } catch (error) {
        handleError(error);
    }
});

// ========================================
// 5. INITIALIZE DASHBOARD
// ========================================

document.addEventListener("DOMContentLoaded", async function () {
    if (!isLoggedIn()) {
        return;
    }

    try {
        await Promise.all([loadAccount(), loadLists()]);
    } catch (error) {
        handleError(error);
    }
});
