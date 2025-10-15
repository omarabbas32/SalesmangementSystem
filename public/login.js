const API_BASE_URL = 'http://localhost:3000/api';


const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loadingSpinner = document.getElementById("loading-spinner");

// If already logged in, redirect to main app
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("authToken");
    if (token) {
        window.location.href = "index.html";
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.style.display = "none";
    loadingSpinner.style.display = "flex";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.");
        }

        // On successful login, store the token and redirect
        if (data.token) {
            localStorage.setItem("authToken", data.token);
            window.location.href = "index.html";
        } else {
            throw new Error("لم يتم استلام التوكن من الخادم.");
        }

    } catch (error) {
        loginError.textContent = error.message;
        loginError.style.display = "block";
    } finally {
        loadingSpinner.style.display = "none";
    }
});