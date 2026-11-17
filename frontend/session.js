// ========================================
// SMART LIBRARY - SHARED SESSION + API HELPERS
// Load this file BEFORE auth.js, catalogue.js and dashboard.js
// ========================================

const SESSION_KEY = "smartLibraryCurrentUser";
const TOKEN_KEY = "smartLibraryToken";

function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
        return "";
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
        return null;
    }
}

function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
    try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
    } catch {
        // ignore
    }
}

function isLoggedIn() {
    return Boolean(getToken() && getCurrentUser());
}

// ----------------------------------------------------------------------
// Where is the Flask server?
//  1. window.API_BASE if you set it (e.g. the deployed backend URL)
//  2. the same site, when Flask serves this page (http://localhost:10000)
//  3. otherwise http://localhost:10000, so the pages also work when opened
//     from Live Server (port 5500) or by double-clicking the .html file.
// ----------------------------------------------------------------------
const DEFAULT_LOCAL_API = "http://localhost:10000";
let apiBase = null;

async function resolveApiBase() {
    if (apiBase !== null) {
        return apiBase;
    }

    if (window.API_BASE) {
        apiBase = String(window.API_BASE).replace(/\/$/, "");
        return apiBase;
    }

    if (window.location.protocol !== "file:") {
        try {
            const response = await fetch("/api/health");
            const type = response.headers.get("content-type") || "";

            if (response.ok && type.includes("json")) {
                apiBase = "";
                return apiBase;
            }
        } catch {
            // not served by Flask, use the local default below
        }
    }

    apiBase = DEFAULT_LOCAL_API;
    return apiBase;
}

// Call the Flask API. Returns the parsed JSON, or throws an Error whose
// message comes from the server and whose .status is the HTTP status.
async function api(path, { method = "GET", body } = {}) {
    const headers = {};
    const token = getToken();

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let response;
    let base = "";

    try {
        base = await resolveApiBase();

        response = await fetch(base + path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch {
        // Forget the guess so the next try detects the server again.
        apiBase = null;

        const networkError = new Error(
            "Could not reach the server at " +
            (base || window.location.origin) +
            ". Start it with 'python app.py' and make sure the address " +
            "and port match, then try again."
        );
        networkError.status = 0;
        throw networkError;
    }

    let data = {};

    try {
        data = await response.json();
    } catch {
        // empty or non-JSON body
    }

    if (!response.ok) {
        // An expired/invalid token means the user must log in again.
        if (response.status === 401 && token) {
            clearSession();
        }

        const requestError = new Error(
            data.error || `Request failed (${response.status}).`
        );
        requestError.status = response.status;
        throw requestError;
    }

    return data;
}

// Navbar: show the user name and a logout link when logged in.
document.addEventListener("DOMContentLoaded", function () {
    const authLink = document.getElementById("authLink");
    const registerLink = document.getElementById("registerLink");
    const logoutLink = document.getElementById("logoutLink");

    const currentUser = isLoggedIn() ? getCurrentUser() : null;

    if (currentUser && authLink) {
        authLink.textContent = `Hi, ${currentUser.name}`;
        authLink.href = "dashboard.html";
    }

    if (currentUser && registerLink) {
        registerLink.textContent = "Logout";
        registerLink.href = "#";
        registerLink.classList.add("nav-btn");

        registerLink.addEventListener("click", function (event) {
            event.preventDefault();
            clearSession();
            window.location.href = "home.html";
        });
    }

    if (logoutLink) {
        logoutLink.addEventListener("click", function () {
            clearSession();
        });
    }
});
