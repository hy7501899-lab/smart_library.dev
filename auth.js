// Auth logic for Static GitHub Pages (Frontend-Only)

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

// تسجيل حساب جديد وهمي
if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const message = document.getElementById("registerMessage");

        if (!name || !email) {
            message.textContent = "Please complete all fields.";
            return;
        }

        // حفظ بيانات المستخدم مؤقتاً في المتصفح
        const dummyUser = { id: 1, name: name, email: email, phone: "" };
        localStorage.setItem("smart_library_user", JSON.stringify(dummyUser));
        localStorage.setItem("smart_library_token", "demo-token-123");

        message.textContent = "Account created successfully! Redirecting...";

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);
    });
}

// تسجيل الدخول الوهمي
if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const message = document.getElementById("loginMessage");

        // حفظ بيانات جلسة دخول للمتصفح
        const dummyUser = { id: 1, name: email.split("@")[0] || "User", email: email, phone: "" };
        localStorage.setItem("smart_library_user", JSON.stringify(dummyUser));
        localStorage.setItem("smart_library_token", "demo-token-123");

        message.textContent = "Login successful!";

        setTimeout(() => {
            window.location.href = "home.html";
        }, 700);
    });
}
