"use strict";

/*
=========================================================
AE RENEWABLE NETWORK
INSTALLER LOGIN
login.js
=========================================================
*/

const API_ENDPOINT = "/api/auth/login";
const DASHBOARD_URL = "/installer/installer.html";

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");


/* =========================================================
   MESSAGE
========================================================= */

function showLoginMessage(message, type = "error") {
    if (!loginMessage) {
        return;
    }

    loginMessage.hidden = false;
    loginMessage.textContent = message;
    loginMessage.className = `login-message ${type}`;
}


/* =========================================================
   BUTTON
========================================================= */

function setLoading(loading) {
    if (!loginButton) {
        return;
    }

    loginButton.disabled = loading;

    if (loginButtonText) {
        loginButtonText.textContent =
            loading ? "Signing In..." : "Sign In";
    }
}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

togglePassword?.addEventListener("click", () => {
    if (!passwordInput) {
        return;
    }

    const showing =
        passwordInput.type === "text";

    passwordInput.type =
        showing ? "password" : "text";

    togglePassword.textContent =
        showing ? "Show" : "Hide";
});


/* =========================================================
   LOGIN
========================================================= */

loginForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const email =
        document.getElementById("email")
            ?.value
            .trim();

    const password =
        passwordInput?.value || "";

    if (!email || !password) {
        showLoginMessage(
            "Please enter your email and password.",
            "error"
        );

        return;
    }

    setLoading(true);

    if (loginMessage) {
        loginMessage.hidden = true;
    }

    try {
        const response =
            await fetch(
                API_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            data.success !== true ||
            !data.data?.token
        ) {
            throw new Error(
                data.message ||
                "Login failed."
            );
        }

        const token =
            data.data.token;

        /*
         * Store the JWT where installer.js
         * can retrieve it for authenticated API requests.
         */

        localStorage.setItem(
            "token",
            token
        );

        localStorage.setItem(
            "accessToken",
            token
        );

        /*
         * Store basic authenticated user information.
         */

        if (data.data.user) {
            localStorage.setItem(
                "user",
                JSON.stringify(
                    data.data.user
                )
            );
        }

        showLoginMessage(
            "Login successful. Redirecting...",
            "success"
        );

        window.location.href =
            DASHBOARD_URL;

    } catch (error) {
        console.error(
            "Installer login error:",
            error
        );

        showLoginMessage(
            error.message ||
            "Unable to connect to the server.",
            "error"
        );

        setLoading(false);
    }
});
