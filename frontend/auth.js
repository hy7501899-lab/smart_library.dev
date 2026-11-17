// Login and registration forms. Talks to the Flask API (see session.js).

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail")
            .value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");

        if (!name || !email) {
            message.textContent = "Please complete all fields.";
            return;
        }

        if (password.length < 8) {
            message.textContent =
                "Password must contain at least 8 characters.";
            return;
        }

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        const submitButton = registerForm.querySelector("button[type=submit]");
        submitButton.disabled = true;

        try {
            const data = await api("/api/auth/register", {
                method: "POST",
                body: { name, email, password }
            });

            // Registering also logs the user in.
            saveSession(data.token, data.user);

            message.textContent =
                "Account created successfully! Redirecting to your dashboard...";

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } catch (error) {
            message.textContent = error.message;
            submitButton.disabled = false;
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail")
            .value.trim().toLowerCase();
        const password =
            document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");

        const submitButton = loginForm.querySelector("button[type=submit]");
        submitButton.disabled = true;

        try {
            const data = await api("/api/auth/login", {
                method: "POST",
                body: { email, password }
            });

            saveSession(data.token, data.user);

            message.textContent = "Login successful!";

            setTimeout(() => {
                window.location.href = "home.html";
            }, 700);
        } catch (error) {
            message.textContent = error.message;
            submitButton.disabled = false;
        }
    });
}
