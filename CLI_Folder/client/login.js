"use strict";

/* =========================================================
   AE RENEWABLE NETWORK
   CLIENT LOGIN
========================================================= */

const API_BASE_URL = "/api";
const TOKEN_KEY = "aeRenewableToken";
const USER_KEY = "aeRenewableUser";
const CLIENT_DASHBOARD = "/client/dashboard";

const PASSWORD_RESET_REQUEST_ENDPOINT = "/api/auth/request-password-reset";
const PASSWORD_RESET_VERIFY_ENDPOINT = "/api/auth/verify-password-reset";
const PASSWORD_RESET_ENDPOINT = "/api/auth/reset-password";
const RESEND_COOLDOWN_SECONDS = 60;

const loginView = document.getElementById("loginView");
const resetView = document.getElementById("resetView");
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginSpinner = document.getElementById("loginSpinner");
const loginError = document.getElementById("loginError");
const togglePassword = document.getElementById("togglePassword");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

const resetTitle = document.getElementById("resetTitle");
const resetSubtitle = document.getElementById("resetSubtitle");
const resetMessage = document.getElementById("resetMessage");
const resetMessageText = document.getElementById("resetMessageText");
const resetRequestForm = document.getElementById("resetRequestForm");
const resetEmail = document.getElementById("resetEmail");
const resetRequestButton = document.getElementById("resetRequestButton");
const resetRequestButtonText = document.getElementById("resetRequestButtonText");
const resetVerifyForm = document.getElementById("resetVerifyForm");
const resetCode = document.getElementById("resetCode");
const resetCodeDestination = document.getElementById("resetCodeDestination");
const resetVerifyButton = document.getElementById("resetVerifyButton");
const resetVerifyButtonText = document.getElementById("resetVerifyButtonText");
const resendResetCodeButton = document.getElementById("resendResetCodeButton");
const resendResetCodeText = document.getElementById("resendResetCodeText");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const resetPasswordButton = document.getElementById("resetPasswordButton");
const resetPasswordButtonText = document.getElementById("resetPasswordButtonText");
const resetSuccess = document.getElementById("resetSuccess");
const returnToLoginButton = document.getElementById("returnToLoginButton");
const backToLoginButton = document.getElementById("backToLoginButton");
const backToLoginButtonVerify = document.getElementById("backToLoginButtonVerify");
const backToLoginButtonPassword = document.getElementById("backToLoginButtonPassword");

let resetToken = "";
let resetRequestInProgress = false;
let resetVerificationInProgress = false;
let resetPasswordInProgress = false;
let resetResendAvailableAt = 0;
let resetResendTimer = null;

document.addEventListener("DOMContentLoaded", initializeLogin);

function initializeLogin() {
    try {
        sessionStorage.removeItem("ae_client_logged_in");
    } catch {}
    // Note: Do NOT automatically redirect to client dashboard.
    // Clients arriving at login must explicitly enter their credentials.
    initializePasswordToggle();
    initializeResetPasswordToggle();
    bindResetFlowEvents();
}

function initializePasswordToggle() {
    if (!togglePassword) {
        return;
    }

    togglePassword.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        togglePassword.textContent = isPassword ? "Hide" : "Show";
        togglePassword.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    });
}

function initializeResetPasswordToggle() {
    const toggles = [
        { button: toggleNewPassword, input: newPassword },
        { button: toggleConfirmPassword, input: confirmPassword }
    ];

    toggles.forEach(({ button, input }) => {
        if (!button || !input) {
            return;
        }

        button.addEventListener("click", () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";
            button.textContent = isPassword ? "Hide" : "Show";
            button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
        });
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
}

function bindResetFlowEvents() {
    forgotPasswordLink?.addEventListener("click", (event) => {
        event.preventDefault();
        showResetView();
    });

    resetRequestForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        requestPasswordReset();
    });

    resetVerifyForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        verifyPasswordResetCode();
    });

    resetPasswordForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        resetPassword();
    });

    [backToLoginButton, backToLoginButtonVerify, backToLoginButtonPassword].forEach((button) => {
        button?.addEventListener("click", () => showLoginView());
    });

    returnToLoginButton?.addEventListener("click", () => showLoginView());

    resendResetCodeButton?.addEventListener("click", async () => {
        if (resetRequestInProgress || resendResetCodeButton.disabled) {
            return;
        }

        const email = normalizeEmail(resetEmail.value);

        if (!isValidEmail(email)) {
            showResetMessage("Please enter a valid email address.");
            showResetStep("request");
            resetEmail.focus();
            return;
        }

        resetRequestInProgress = true;
        resendResetCodeButton.disabled = true;
        resendResetCodeText.textContent = "Sending...";

        try {
            const response = await fetch(PASSWORD_RESET_REQUEST_ENDPOINT, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const data = await parseResponse(response);

            if (!response.ok || data?.success === false) {
                throw new Error(data?.message || "Unable to send a new verification code.");
            }

            resetCode.value = "";
            startResetResendCooldown();
            showResetMessage("A new verification code has been sent to your email.", "success");
            resetCode.focus();
        } catch (error) {
            console.error("Password reset resend error:", error);
            showResetMessage(error?.message || "Unable to send a new verification code.");
            resendResetCodeButton.disabled = false;
            resendResetCodeText.textContent = "Resend code";
        } finally {
            resetRequestInProgress = false;
        }
    });
}

async function handleLogin(event) {
    event.preventDefault();
    clearLoginError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
        showLoginError("Please enter your Client Name.");
        emailInput.focus();
        return;
    }

    // If an email format with @ is provided, validate domain format
    if (email.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showLoginError("Please enter a valid email address.");
        emailInput.focus();
        return;
    }

    if (!password) {
        showLoginError("Please enter your password.");
        passwordInput.focus();
        return;
    }

    setLoadingState(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const result = await parseResponse(response);

        if (!response.ok) {
            throw new Error(result.message || "Unable to sign in.");
        }

        if (!result.success || !result.data || !result.data.token) {
            throw new Error("Authentication response was invalid.");
        }

        const token = result.data.token;
        const user = result.data.user;

        if (user && user.role && !["client", "admin", "staff", "installer"].includes(user.role)) {
            throw new Error("This account does not have access to the Client Portal.");
        }

        // Set across all standard key namespaces
        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem("aeClientToken", token);

        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            localStorage.setItem("aeClientUser", JSON.stringify(user));
        }

        const client = await getCurrentClient(token);

        if (!client) {
            clearAuthentication();
            throw new Error("Your account is authenticated, but no Client profile was found. Please contact AE Renewable support.");
        }

        localStorage.setItem("aeRenewableClient", JSON.stringify(client));
        try {
            sessionStorage.setItem("ae_client_logged_in", "true");
        } catch {}
        window.location.href = CLIENT_DASHBOARD;
    } catch (error) {
        console.error("Client login error:", error);
        showLoginError(getFriendlyErrorMessage(error));
    } finally {
        setLoadingState(false);
    }
}

async function getCurrentClient(token) {
    const response = await fetch(`${API_BASE_URL}/clients/me`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    const result = await parseResponse(response);

    if (!response.ok) {
        throw new Error(result.message || "Unable to retrieve Client profile.");
    }

    if (!result.success || !result.data || !result.data.client) {
        return null;
    }

    return result.data.client;
}


function showResetView() {
    clearLoginError();
    loginView.hidden = true;
    resetView.hidden = false;
    resetEmail.value = normalizeEmail(emailInput?.value || "");
    resetToken = "";
    showResetStep("request");
    resetEmail.focus();
}

function showLoginView() {
    hideResetMessage();
    resetView.hidden = true;
    loginView.hidden = false;
    resetToken = "";
    resetEmail.value = "";
    resetCode.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    showResetStep("request");
    emailInput.focus();
}

let resolvedResetEmail = "";

function showResetStep(step) {
    resetRequestForm.hidden = step !== "request";
    resetVerifyForm.hidden = step !== "verify";
    resetPasswordForm.hidden = step !== "password";
    resetSuccess.hidden = step !== "success";

    if (step === "request") {
        resetTitle.textContent = "Reset your password";
        resetSubtitle.textContent = "Enter your Client Name, Email Address, or Project ID to receive a secure 6-digit verification code.";
    }

    if (step === "verify") {
        resetTitle.textContent = "Verify code";
        resetSubtitle.textContent = "Enter the 6-digit verification code sent to your registered email.";
    }

    if (step === "password") {
        resetTitle.textContent = "Create a new password";
        resetSubtitle.textContent = "Choose a new password for your client account.";
    }

    if (step === "success") {
        resetTitle.textContent = "Password updated";
        resetSubtitle.textContent = "Your client password has been successfully changed.";
    }
}

function showResetMessage(message, type = "error") {
    if (!resetMessage) {
        return;
    }

    resetMessageText.textContent = message;
    resetMessage.hidden = false;
    resetMessage.classList.toggle("success", type === "success");
    resetMessage.classList.toggle("error", type !== "success");
}

function hideResetMessage() {
    if (!resetMessage) {
        return;
    }

    resetMessage.hidden = true;
    resetMessageText.textContent = "";
    resetMessage.classList.remove("success", "error");
}

async function requestPasswordReset() {
    if (resetRequestInProgress) {
        return;
    }

    const identifier = String(resetEmail.value || "").trim();
    hideResetMessage();

    if (!identifier) {
        showResetMessage("Please enter your Client Name, Email Address, or Project ID.");
        resetEmail.focus();
        return;
    }

    resetRequestInProgress = true;
    resetRequestButton.disabled = true;
    resetRequestButtonText.textContent = "Sending...";

    try {
        const response = await fetch(PASSWORD_RESET_REQUEST_ENDPOINT, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email: identifier })
        });

        const data = await parseResponse(response);

        if (!response.ok || data?.success === false) {
            throw new Error(data?.message || "Unable to process your password reset request.");
        }

        const masked = data?.data?.maskedEmail || data?.data?.email || identifier;
        resolvedResetEmail = data?.data?.email || identifier;
        resetCodeDestination.textContent = `A 6-digit verification code was sent to ${masked}.`;
        showResetMessage(data?.message || "If an account exists, a verification code has been dispatched.", "success");
        showResetStep("verify");
        resetCode.focus();
        startResetResendCooldown();
    } catch (error) {
        console.error("Password reset request error:", error);
        showResetMessage(error?.message || "Unable to process your password reset request.");
    } finally {
        resetRequestInProgress = false;
        resetRequestButton.disabled = false;
        resetRequestButtonText.textContent = "Send Verification Code";
    }
}

async function verifyPasswordResetCode() {
    if (resetVerificationInProgress) {
        return;
    }

    const identifier = resolvedResetEmail || String(resetEmail.value || "").trim();
    const code = String(resetCode.value || "").trim();
    hideResetMessage();

    if (!identifier) {
        showResetMessage("Please provide your Client Name, Email, or Project ID.");
        showResetStep("request");
        resetEmail.focus();
        return;
    }

    if (!/^[0-9]{6}$/.test(code)) {
        showResetMessage("Please enter the 6-digit verification code.");
        resetCode.focus();
        return;
    }

    resetVerificationInProgress = true;
    resetVerifyButton.disabled = true;
    resetVerifyButtonText.textContent = "Verifying...";

    try {
        const response = await fetch(PASSWORD_RESET_VERIFY_ENDPOINT, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email: identifier, code })
        });

        const data = await parseResponse(response);

        if (!response.ok || data?.success === false) {
            throw new Error(data?.message || "Invalid or expired verification code.");
        }

        if (!data?.data?.resetToken) {
            throw new Error("Verification succeeded, but no reset authorization was returned.");
        }

        resetToken = data.data.resetToken;
        if (data.data.email) {
            resolvedResetEmail = data.data.email;
        }
        showResetMessage("Verification successful. You can now create a new password.", "success");
        showResetStep("password");
        newPassword.focus();
    } catch (error) {
        console.error("Password reset verification error:", error);
        showResetMessage(error?.message || "Invalid or expired verification code.");
        resetCode.focus();
    } finally {
        resetVerificationInProgress = false;
        resetVerifyButton.disabled = false;
        resetVerifyButtonText.textContent = "Verify Code";
    }
}

async function resetPassword() {
    if (resetPasswordInProgress) {
        return;
    }

    const identifier = resolvedResetEmail || String(resetEmail.value || "").trim();
    const password = newPassword.value || "";
    const confirmation = confirmPassword.value || "";
    hideResetMessage();

    if (!resetToken) {
        showResetMessage("Your password reset session has expired. Please request a new code.");
        showResetStep("request");
        return;
    }

    if (!identifier) {
        showResetMessage("Please enter a valid Client Name, Email, or Project ID.");
        return;
    }

    if (!isValidPassword(password)) {
        showResetMessage("Your new password must contain between 8 and 128 characters.");
        newPassword.focus();
        return;
    }

    if (password !== confirmation) {
        showResetMessage("The passwords do not match.");
        confirmPassword.focus();
        return;
    }

    resetPasswordInProgress = true;
    resetPasswordButton.disabled = true;
    resetPasswordButtonText.textContent = "Updating...";

    try {
        const response = await fetch(PASSWORD_RESET_ENDPOINT, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                email: identifier,
                resetToken,
                newPassword: password
            })
        });

        const data = await parseResponse(response);

        if (!response.ok || data?.success === false) {
            throw new Error(data?.message || "Unable to reset your password.");
        }

        resetToken = "";
        resolvedResetEmail = "";
        newPassword.value = "";
        confirmPassword.value = "";
        showResetStep("success");
        hideResetMessage();
        resetSuccess.hidden = false;
    } catch (error) {
        console.error("Password reset error:", error);
        showResetMessage(error?.message || "Unable to reset your password.");
    } finally {
        resetPasswordInProgress = false;
        resetPasswordButton.disabled = false;
        resetPasswordButtonText.textContent = "Reset Password";
    }
}

function startResetResendCooldown(seconds = RESEND_COOLDOWN_SECONDS) {
    if (resetResendTimer) {
        clearInterval(resetResendTimer);
    }

    resetResendAvailableAt = Date.now() + Number(seconds) * 1000;
    updateResetResendState();
    resetResendTimer = window.setInterval(updateResetResendState, 1000);
}

function updateResetResendState() {
    if (!resendResetCodeButton) {
        return;
    }

    const remaining = Math.max(0, Math.ceil((resetResendAvailableAt - Date.now()) / 1000));

    if (remaining <= 0) {
        clearInterval(resetResendTimer);
        resetResendTimer = null;
        resendResetCodeButton.disabled = false;
        resendResetCodeText.textContent = "Resend code";
        return;
    }

    resendResetCodeButton.disabled = true;
    resendResetCodeText.textContent = `Resend in ${remaining}s`;
}

async function parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch (error) {
            return {};
        }
    }

    const text = await response.text();
    return { success: false, message: text };
}

function isValidEmail(email) {
    if (/^[A-Za-z0-9_-]{3,50}$/.test(email)) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
    return password.length >= 8 && password.length <= 128;
}

function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
}

function setLoadingState(isLoading) {
    if (!loginButton) {
        return;
    }

    loginButton.disabled = isLoading;

    if (loginButtonText) {
        loginButtonText.textContent = isLoading ? "Signing In..." : "Sign In to Client Portal";
    }

    if (loginSpinner) {
        loginSpinner.hidden = !isLoading;
        loginSpinner.style.display = isLoading ? "inline-block" : "none";
    }
}

function showLoginError(message) {
    if (!loginError) {
        return;
    }

    loginError.textContent = message;
    loginError.hidden = false;
}

function clearLoginError() {
    if (!loginError) {
        return;
    }

    loginError.textContent = "";
    loginError.hidden = true;
}

function getFriendlyErrorMessage(error) {
    if (!error || !error.message) {
        return "Unable to sign in. Please try again.";
    }

    return error.message;
}

function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function clearAuthentication() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("aeRenewableClient");
}

window.AERenewableClientAuth = {
    getToken: getStoredToken,
    clearAuthentication
};
