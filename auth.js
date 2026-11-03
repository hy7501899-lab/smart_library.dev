// Auth logic for Static GitHub Pages (Frontend-Only)

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

// 1. تسجيل حساب جديد
if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const nameInput = document.getElementById("fullName");
        const emailInput = document.getElementById("registerEmail");
        const message = document.getElementById("registerMessage");

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim().toLowerCase() : "";

        if (!name || !email) {
            if (message) message.textContent = "Please complete all fields.";
            return;
        }

        // حفظ بيانات المستخدم الحقيقية في المتصفح
        const realUser = { id: Date.now(), name: name, email: email, phone: "" };
        localStorage.setItem("smart_library_user", JSON.stringify(realUser));
        localStorage.setItem("smart_library_token", "demo-token-" + Date.now());

        if (message) {
            message.style.color = "green";
            message.textContent = "Account created successfully! Redirecting...";
        }

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);
    });
}

// 2. تسجيل الدخول
if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const emailInput = document.getElementById("loginEmail");
        const message = document.getElementById("loginMessage");
        const email = emailInput ? emailInput.value.trim().toLowerCase() : "";

        if (!email) {
            if (message) message.textContent = "Please enter your email.";
            return;
        }

        // استخراج اسم ذكي من الإيميل إذا لم يكن موجوداً مسبقاً
        const username = email.split("@")[0] || "User";
        const formattedName = username.charAt(0).toUpperCase() + username.slice(1);

        const userSession = { id: Date.now(), name: formattedName, email: email, phone: "" };
        
        localStorage.setItem("smart_library_user", JSON.stringify(userSession));
        localStorage.setItem("smart_library_token", "demo-token-" + Date.now());

        if (message) {
            message.style.color = "green";
            message.textContent = "Login successful! Redirecting to dashboard...";
        }

        // التوجيه المباشر للداشبورد لعرض بيانات المستخدم
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 700);
    });
}
