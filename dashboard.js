// ========================================
// SMART LIBRARY - DASHBOARD JAVASCRIPT
// ========================================

"use strict";

// التحقق من تسجيل الدخول
if (typeof isLoggedIn === "function" && !isLoggedIn()) {
    window.location.replace("login.html");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[character] || character;
    });
}

function formatMoney(value) {
    return (Number(value) || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

let myBooks = [];
let favorites = [];

// ========================================
// 1. ACCOUNT INFORMATION (Local Storage)
// ========================================

const accountForm = document.getElementById("accountForm");
const accountMessage = document.getElementById("accountMessage");

function fillAccount(account) {
    const nameInput = document.getElementById("userName");
    const emailInput = document.getElementById("userEmail");
    const phoneInput = document.getElementById("userPhone");

    if (nameInput) nameInput.value = account.name || "";
    if (emailInput) emailInput.value = account.email || "";
    if (phoneInput) phoneInput.value = account.phone || "";
}

function loadAccount() {
    const user = typeof getUser === "function" ? getUser() : JSON.parse(localStorage.getItem("smart_library_user") || "{}");
    fillAccount(user);
}

if (accountForm) {
    accountForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("userName").value.trim();
        const email = document.getElementById("userEmail").value.trim();
        const phone = document.getElementById("userPhone").value.trim();

        if (!name || !email) {
            if (accountMessage) {
                accountMessage.style.color = "red";
                accountMessage.textContent = "Please enter your name and email.";
            }
            return;
        }

        const currentUser = typeof getUser === "function" ? getUser() : {};
        const updatedUser = {
            ...currentUser,
            name: name,
            email: email,
            phone: phone
        };

        if (typeof saveSession === "function" && typeof getToken === "function") {
            saveSession(getToken(), updatedUser);
        } else {
            localStorage.setItem("smart_library_user", JSON.stringify(updatedUser));
        }

        fillAccount(updatedUser);

        if (accountMessage) {
            accountMessage.style.color = "green";
            accountMessage.textContent = "Account information saved successfully!";
        }
    });
}

// ========================================
// 2. BOOK LISTS & PAYMENTS
// ========================================

function renderMyBooks() {
    const booksList = document.getElementById("myBooksList");
    const booksCount = document.getElementById("booksCount");

    if (booksCount) booksCount.textContent = myBooks.length;
    if (!booksList) return;

    if (myBooks.length === 0) {
        booksList.innerHTML = `<p class="empty-message">You haven't added any books yet.</p>`;
        return;
    }

    booksList.innerHTML = myBooks.map(book => `
        <article class="book-item">
            <div class="book-cover" style="background:${escapeHTML(book.color || '#2563eb')}">
                ${escapeHTML(book.icon || '📚')}
            </div>
            <div class="book-info">
                <h3>${escapeHTML(book.title)}</h3>
                <p>${escapeHTML(book.author)} - ${escapeHTML(book.category)}</p>
            </div>
        </article>
    `).join("");
}

function renderFavorites() {
    const favoritesList = document.getElementById("favoritesList");
    const favoritesCount = document.getElementById("favoritesCount");

    if (favoritesCount) favoritesCount.textContent = favorites.length;
    if (!favoritesList) return;

    if (favorites.length === 0) {
        favoritesList.innerHTML = `<p class="empty-message">You haven't added any favorite books yet.</p>`;
        return;
    }

    favoritesList.innerHTML = favorites.map(book => `
        <article class="book-item">
            <div class="book-cover" style="background:${escapeHTML(book.color || '#2563eb')}">
                ${escapeHTML(book.icon || '♥')}
            </div>
            <div class="book-info">
                <h3>${escapeHTML(book.title)}</h3>
                <p>${escapeHTML(book.author)} - ${escapeHTML(book.category)}</p>
            </div>
        </article>
    `).join("");
}

function renderPayments() {
    const paymentsList = document.getElementById("paymentsList");
    const paymentsCount = document.getElementById("paymentsCount");
    const completedCount = document.getElementById("completedCount");
    const totalPayments = document.getElementById("totalPayments");

    if (paymentsCount) paymentsCount.textContent = "0";
    if (completedCount) completedCount.textContent = "0";
    if (totalPayments) totalPayments.textContent = "0.00 EGP";
    if (paymentsList) {
        paymentsList.innerHTML = `<p class="empty-message">You haven't made any payments yet.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadAccount();
    renderMyBooks();
    renderFavorites();
    renderPayments();
});
