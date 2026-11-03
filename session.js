// Smart Library - Frontend Session & API Helper

function getToken() {
    return localStorage.getItem("smart_library_token");
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem("smart_library_user"));
    } catch {
        return null;
    }
}

function isLoggedIn() {
    return Boolean(getToken() && getUser());
}

function saveSession(token, user) {
    localStorage.setItem("smart_library_token", token);
    localStorage.setItem("smart_library_user", JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem("smart_library_token");
    localStorage.removeItem("smart_library_user");
}

// دالة api الوهمية لتتوافق مع صفحات الواجهة الثابتة بدون سيرفر
async function api(endpoint, options = {}) {
    // محاكاة طلبات الـ API محلياً في المتصفح
    if (endpoint.includes("/api/auth/login") || endpoint.includes("/api/auth/register")) {
        return {
            token: "demo-token-123",
            user: { id: 1, name: "Yara", email: "yara@example.com", phone: "" }
        };
    }
    if (endpoint.includes("/api/me/books")) {
        return { books: [] };
    }
    if (endpoint.includes("/api/me/favorites")) {
        return { books: [] };
    }
    if (endpoint.includes("/api/me/payments")) {
        return { payments: [] };
    }
    if (endpoint.includes("/api/books")) {
        return { books: [] };
    }
    return { ok: true };
}

// تحديث روابط الـ Navbar بناءً على حالة تسجيل الدخول
document.addEventListener("DOMContentLoaded", () => {
    const authLink = document.getElementById("authLink");
    const registerLink = document.getElementById("registerLink");
    const logoutLink = document.getElementById("logoutLink");

    if (isLoggedIn()) {
        if (authLink) {
            authLink.textContent = "Dashboard";
            authLink.href = "dashboard.html";
        }
        if (registerLink) {
            registerLink.textContent = "Logout";
            registerLink.href = "#";
            registerLink.addEventListener("click", (e) => {
                e.preventDefault();
                clearSession();
                window.location.href = "home.html";
            });
        }
    }
    
    if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
            e.preventDefault();
            clearSession();
            window.location.href = "home.html";
        });
    }
});
