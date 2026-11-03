// ========================================
// SMART LIBRARY - SESSION & API HELPER (Static Version)
// ========================================

// 1. جلب التوكين المحفوظ
function getToken() {
    return localStorage.getItem("smart_library_token");
}

// 2. جلب بيانات المستخدم بأمان بدون أخطاء (الوقاية من خطأ reading 'name')
function getUser() {
    try {
        const item = localStorage.getItem("smart_library_user");
        if (!item || item === "undefined" || item === "null") {
            return { id: 1, name: "Yara", email: "yara@example.com", phone: "" };
        }
        return JSON.parse(item);
    } catch (e) {
        return { id: 1, name: "Yara", email: "yara@example.com", phone: "" };
    }
}

// 3. التحقق من حالة تسجيل الدخول
function isLoggedIn() {
    return Boolean(getToken() && getUser());
}

// 4. حفظ بيانات الجلسة محلياً
function saveSession(token, user) {
    localStorage.setItem("smart_library_token", token);
    localStorage.setItem("smart_library_user", JSON.stringify(user));
}

// 5. مسح بيانات الجلسة (تسجيل الخروج)
function clearSession() {
    localStorage.removeItem("smart_library_token");
    localStorage.removeItem("smart_library_user");
}

// 6. دالة api وهمية لتوافق الصفحات التي تطلب طلبات شبكة
async function api(endpoint, options = {}) {
    const user = getUser();
    if (endpoint.includes("/api/auth/login") || endpoint.includes("/api/auth/register")) {
        return { token: "demo-token-123", user: user };
    }
    if (endpoint.includes("/api/me")) {
        return user;
    }
    if (endpoint.includes("/api/books") || endpoint.includes("/api/me/books")) {
        return { books: [] };
    }
    if (endpoint.includes("/api/me/favorites")) {
        return { favorites: [] };
    }
    if (endpoint.includes("/api/me/payments")) {
        return { payments: [] };
    }
    return { ok: true };
}

// 7. تحديث عناصر الـ Navbar تلقائياً بناءً على الجلسة
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
