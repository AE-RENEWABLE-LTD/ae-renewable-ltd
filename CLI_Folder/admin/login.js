"use strict";

/* =========================================================
   AE RENEWABLE LTD
   ADMINISTRATION & OPERATIONS COMMAND CENTRE
   AUTHENTICATION & RECOVERY CONTROLLER
   ========================================================= */

const API_LOGIN = "/api/auth/login";
const API_REQUEST_RESET = "/api/auth/request-password-reset";
const API_VERIFY_RESET = "/api/auth/verify-password-reset";
const API_RESET_PASSWORD = "/api/auth/reset-password";
const ADMIN_URL = "/admin";

const TOKEN_KEY = "token";
const ACCESS_TOKEN_KEY = "accessToken";
const ADMIN_TOKEN_KEY = "aeAdminToken";
const USER_KEY = "user";
const ADMIN_USER_KEY = "aeAdminUser";

let activeRecoveryEmail = "";
let resendCooldownSeconds = 60;
let resendTimerInterval = null;
let otpExpiryMinutes = 10;
let otpExpiryInterval = null;

// Clean existing credentials
function clearAuthentication() {
    [TOKEN_KEY, ACCESS_TOKEN_KEY, ADMIN_TOKEN_KEY, USER_KEY, ADMIN_USER_KEY].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
    });
}

// Global Floating Toast
function showToast(message, type = "normal") {
    const toastBox = document.getElementById("adminToast");
    if (!toastBox) return;

    const toast = document.createElement("div");
    toast.className = `toast-item ${type}`;

    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "error") icon = "fa-circle-xmark";
    if (type === "warning") icon = "fa-triangle-exclamation";

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toastBox.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Show alert banner on view
function showFeedback(elementId, text, type = "error") {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (!text) {
        el.style.display = "none";
        el.textContent = "";
        return;
    }

    let icon = "fa-circle-exclamation";
    if (type === "success") icon = "fa-circle-check";
    if (type === "warning") icon = "fa-triangle-exclamation";

    el.className = `feedback-ribbon ${type}`;
    el.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${text}</span>`;
    el.style.display = "flex";
}

// View switcher
function switchView(viewId) {
    const views = ["viewLogin", "viewForgotStep1", "viewForgotStep2", "viewForgotSuccess"];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = (v === viewId) ? "block" : "none";
    });

    // Clear feedback ribbons
    ["loginMessage", "forgotMessage", "resetMessage"].forEach(id => {
        showFeedback(id, "");
    });
}

// Setup Password Eye Toggle
function setupPasswordToggle(buttonId, inputId) {
    const btn = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        const icon = btn.querySelector("i");
        if (icon) {
            icon.className = isPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
        }
    });
}

// Password Strength Evaluation
function evaluatePasswordStrength(password) {
    let score = 0;
    if (!password) return { score: 0, text: "Enter Password", color: "#64748b", percent: 0 };
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, text: "Weak Password", color: "#ef4444", percent: 25 };
    if (score === 2 || score === 3) return { score: 2, text: "Moderate Password", color: "#f4a600", percent: 65 };
    return { score: 3, text: "Strong Password", color: "#10b981", percent: 100 };
}

// Resend countdown timer
function startResendCooldown() {
    if (resendTimerInterval) clearInterval(resendTimerInterval);
    const btn = document.getElementById("btnResendCode");
    const countSpan = document.getElementById("resendCountdown");
    if (!btn || !countSpan) return;

    btn.disabled = true;
    resendCooldownSeconds = 60;
    countSpan.textContent = `${resendCooldownSeconds}s`;

    resendTimerInterval = setInterval(() => {
        resendCooldownSeconds--;
        if (resendCooldownSeconds <= 0) {
            clearInterval(resendTimerInterval);
            btn.disabled = false;
            countSpan.textContent = "Ready";
        } else {
            countSpan.textContent = `${resendCooldownSeconds}s`;
        }
    }, 1000);
}

// Expiry countdown timer (10 mins)
function startOtpExpiryTimer() {
    if (otpExpiryInterval) clearInterval(otpExpiryInterval);
    const display = document.getElementById("otpTimerDisplay");
    if (!display) return;

    let totalSeconds = 10 * 60;
    otpExpiryInterval = setInterval(() => {
        totalSeconds--;
        if (totalSeconds <= 0) {
            clearInterval(otpExpiryInterval);
            display.textContent = "Expired";
            showFeedback("resetMessage", "The verification code has expired. Please request a new code.", "warning");
        } else {
            const m = Math.floor(totalSeconds / 60);
            const s = totalSeconds % 60;
            display.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }
    }, 1000);
}


/* =========================================================
   DOM INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    try {
        sessionStorage.removeItem("ae_admin_logged_in");
    } catch {}

    // Password Toggles
    setupPasswordToggle("togglePassword", "adminPassword");
    setupPasswordToggle("toggleNewPassword", "newConsolePassword");

    // Live Password Strength Meter
    const newPasswordInput = document.getElementById("newConsolePassword");
    const strengthWrap = document.getElementById("strengthMeterWrap");
    const strengthFill = document.getElementById("strengthBarFill");
    const strengthLabel = document.getElementById("strengthLabel");

    if (newPasswordInput && strengthWrap && strengthFill && strengthLabel) {
        newPasswordInput.addEventListener("input", (e) => {
            const val = e.target.value;
            if (!val) {
                strengthWrap.style.display = "none";
                return;
            }
            strengthWrap.style.display = "block";
            const res = evaluatePasswordStrength(val);
            strengthFill.style.width = `${res.percent}%`;
            strengthFill.style.backgroundColor = res.color;
            strengthLabel.textContent = res.text;
            strengthLabel.style.color = res.color;
        });
    }

    // OTP Code input uppercase & digits only
    const otpInput = document.getElementById("resetOtpCode");
    if (otpInput) {
        otpInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
        });
    }

    // Navigation Switchers
    const btnForgot = document.getElementById("btnForgotPwdTrigger");
    if (btnForgot) {
        btnForgot.addEventListener("click", () => {
            const loginEmail = document.getElementById("adminEmail")?.value?.trim();
            const recEmailInput = document.getElementById("recoveryEmail");
            if (loginEmail && recEmailInput) {
                recEmailInput.value = loginEmail;
            }
            switchView("viewForgotStep1");
        });
    }

    const btnBack1 = document.getElementById("btnBackToLogin1");
    if (btnBack1) btnBack1.addEventListener("click", () => switchView("viewLogin"));

    const btnBack2 = document.getElementById("btnBackToLogin2");
    if (btnBack2) btnBack2.addEventListener("click", () => switchView("viewLogin"));

    const btnReturnSuccess = document.getElementById("btnReturnToLoginSuccess");
    if (btnReturnSuccess) {
        btnReturnSuccess.addEventListener("click", () => {
            if (activeRecoveryEmail) {
                const loginEmail = document.getElementById("adminEmail");
                if (loginEmail) loginEmail.value = activeRecoveryEmail;
            }
            switchView("viewLogin");
            document.getElementById("adminPassword")?.focus();
        });
    }


    /* =========================================================
       ACTION 1: ADMIN LOGIN SUBMISSION
       ========================================================= */

    const loginForm = document.getElementById("adminLoginForm");
    const loginBtn = document.getElementById("adminLoginButton");
    const loginSpinner = document.getElementById("loginSpinner");
    const loginIcon = document.getElementById("loginIcon");
    const loginBtnText = document.getElementById("loginButtonText");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            showFeedback("loginMessage", "");

            const email = document.getElementById("adminEmail")?.value?.trim()?.toLowerCase();
            const password = document.getElementById("adminPassword")?.value || "";

            if (!email) {
                showFeedback("loginMessage", "Please enter your administrator email address.", "error");
                document.getElementById("adminEmail")?.focus();
                return;
            }

            if (!password) {
                showFeedback("loginMessage", "Please enter your console password.", "error");
                document.getElementById("adminPassword")?.focus();
                return;
            }

            // Set loading state
            if (loginBtn) loginBtn.disabled = true;
            if (loginSpinner) loginSpinner.style.display = "inline-block";
            if (loginIcon) loginIcon.style.display = "none";
            if (loginBtnText) loginBtnText.textContent = "Verifying Enterprise Credentials...";

            try {
                const response = await fetch(API_LOGIN, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    if (response.status === 423) {
                        const mins = data?.remainingMinutes || (data?.message && data.message.match(/\d+/)?.[0]) || 15;
                        throw new Error(`Account temporarily locked. Try again in ${mins} minute${mins == 1 ? "" : "s"}.`);
                    }
                    throw new Error("Invalid email or password.");
                }

                const payload = data?.data || data;
                const token = payload?.token;
                const user = payload?.user;

                if (!token) {
                    throw new Error("Invalid email or password.");
                }

                if (!user || (user.role !== "admin" && user.role !== "staff")) {
                    clearAuthentication();
                    throw new Error("Invalid email or password.");
                }

                if (user.status && user.status !== "active") {
                    clearAuthentication();
                    throw new Error("Invalid email or password.");
                }

                // Store credentials
                localStorage.setItem(TOKEN_KEY, token);
                localStorage.setItem(ACCESS_TOKEN_KEY, token);
                localStorage.setItem(ADMIN_TOKEN_KEY, token);
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
                try {
                    sessionStorage.setItem("ae_admin_logged_in", "true");
                } catch {}

                showFeedback("loginMessage", "✓ Identity verified. Accessing Command Centre...", "success");
                showToast("Welcome back, Administrator. Redirecting...", "success");

                setTimeout(() => {
                    window.location.assign(ADMIN_URL);
                }, 400);

            } catch (err) {
                console.error("[Admin Login] Error:", err);
                const rawMsg = err.message || "Failed to sign in. Please verify your credentials.";
                showFeedback("loginMessage", rawMsg, "error");
                showToast(rawMsg.replace(/<[^>]*>?/gm, ""), "error");
            } finally {
                if (loginBtn) loginBtn.disabled = false;
                if (loginSpinner) loginSpinner.style.display = "none";
                if (loginIcon) loginIcon.style.display = "inline-block";
                if (loginBtnText) loginBtnText.textContent = "Access Operations Console";
            }
        });
    }


    /* =========================================================
       ACTION 2: REQUEST PASSWORD RESET (STEP 1)
       ========================================================= */

    const btnSendReset = document.getElementById("btnSendResetCode");
    const forgotSpinner1 = document.getElementById("forgotSpinner1");
    const forgotIcon1 = document.getElementById("forgotIcon1");
    const forgotBtnText1 = document.getElementById("forgotBtnText1");

    if (btnSendReset) {
        btnSendReset.addEventListener("click", async () => {
            showFeedback("forgotMessage", "");
            const email = document.getElementById("recoveryEmail")?.value?.trim()?.toLowerCase();

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showFeedback("forgotMessage", "Please enter a valid administrator email address.", "error");
                document.getElementById("recoveryEmail")?.focus();
                return;
            }

            if (btnSendReset) btnSendReset.disabled = true;
            if (forgotSpinner1) forgotSpinner1.style.display = "inline-block";
            if (forgotIcon1) forgotIcon1.style.display = "none";
            if (forgotBtnText1) forgotBtnText1.textContent = "Dispatching Security Code...";

            try {
                const response = await fetch(API_REQUEST_RESET, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        role: "admin",
                        portal: "admin"
                    })
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(data?.message || "Unable to process password reset request.");
                }

                activeRecoveryEmail = email;

                const emailDisplay = document.getElementById("recoveryEmailDisplay");
                if (emailDisplay) emailDisplay.textContent = email;

                showToast("6-digit security code dispatched!", "success");

                // Switch to Step 2
                switchView("viewForgotStep2");
                startResendCooldown();
                startOtpExpiryTimer();

                const otpField = document.getElementById("resetOtpCode");
                if (otpField) {
                    otpField.value = "";
                    setTimeout(() => otpField.focus(), 200);
                }

            } catch (err) {
                console.error("[Password Reset Request] Error:", err);
                showFeedback("forgotMessage", err.message || "Failed to send reset code. Please try again.", "error");
                showToast(err.message || "Error requesting reset code", "error");
            } finally {
                if (btnSendReset) btnSendReset.disabled = false;
                if (forgotSpinner1) forgotSpinner1.style.display = "none";
                if (forgotIcon1) forgotIcon1.style.display = "inline-block";
                if (forgotBtnText1) forgotBtnText1.textContent = "Send 6-Digit Code";
            }
        });
    }


    /* =========================================================
       ACTION 3: RESEND CODE (STEP 2)
       ========================================================= */

    const btnResend = document.getElementById("btnResendCode");
    if (btnResend) {
        btnResend.addEventListener("click", async () => {
            if (!activeRecoveryEmail) return;

            btnResend.disabled = true;
            showFeedback("resetMessage", "");

            try {
                const response = await fetch(API_REQUEST_RESET, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        email: activeRecoveryEmail,
                        role: "admin",
                        portal: "admin"
                    })
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(data?.message || "Failed to resend verification code.");
                }

                showToast("A new 6-digit code has been dispatched.", "success");
                showFeedback("resetMessage", "A new 6-digit code has been sent to your email address.", "success");
                startResendCooldown();
                startOtpExpiryTimer();

            } catch (err) {
                showFeedback("resetMessage", err.message || "Unable to resend code.", "error");
                showToast(err.message, "error");
                btnResend.disabled = false;
            }
        });
    }


    /* =========================================================
       ACTION 4: VERIFY OTP CODE & SET NEW PASSWORD (STEP 2)
       ========================================================= */

    const btnCompleteReset = document.getElementById("btnCompleteReset");
    const resetSpinner = document.getElementById("resetSpinner");
    const resetIcon = document.getElementById("resetIcon");
    const resetBtnText = document.getElementById("resetBtnText");

    if (btnCompleteReset) {
        btnCompleteReset.addEventListener("click", async () => {
            showFeedback("resetMessage", "");

            const code = document.getElementById("resetOtpCode")?.value?.trim();
            const newPassword = document.getElementById("newConsolePassword")?.value || "";
            const confirmPassword = document.getElementById("confirmConsolePassword")?.value || "";

            if (!code || code.length !== 6) {
                showFeedback("resetMessage", "Please enter the complete 6-digit verification code.", "error");
                document.getElementById("resetOtpCode")?.focus();
                return;
            }

            if (!newPassword || newPassword.length < 8) {
                showFeedback("resetMessage", "Password must be at least 8 characters in length.", "error");
                document.getElementById("newConsolePassword")?.focus();
                return;
            }

            if (newPassword !== confirmPassword) {
                showFeedback("resetMessage", "New password and confirmation do not match.", "error");
                document.getElementById("confirmConsolePassword")?.focus();
                return;
            }

            // Set loading state
            if (btnCompleteReset) btnCompleteReset.disabled = true;
            if (resetSpinner) resetSpinner.style.display = "inline-block";
            if (resetIcon) resetIcon.style.display = "none";
            if (resetBtnText) resetBtnText.textContent = "Verifying & Updating Password...";

            try {
                // Step A: Verify Code
                const verifyRes = await fetch(API_VERIFY_RESET, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        email: activeRecoveryEmail,
                        code: code,
                        role: "admin",
                        portal: "admin"
                    })
                });

                const verifyData = await verifyRes.json().catch(() => null);

                if (!verifyRes.ok) {
                    throw new Error(verifyData?.message || "Invalid or expired verification code.");
                }

                const resetToken = verifyData?.data?.resetToken || verifyData?.resetToken;
                if (!resetToken) {
                    throw new Error("Verification succeeded, but no reset authorization token was issued.");
                }

                // Step B: Set New Password
                const resetRes = await fetch(API_RESET_PASSWORD, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({
                        email: activeRecoveryEmail,
                        resetToken: resetToken,
                        newPassword: newPassword,
                        role: "admin",
                        portal: "admin"
                    })
                });

                const resetData = await resetRes.json().catch(() => null);

                if (!resetRes.ok) {
                    throw new Error(resetData?.message || "Failed to update administrator password.");
                }

                // Clean timers
                if (resendTimerInterval) clearInterval(resendTimerInterval);
                if (otpExpiryInterval) clearInterval(otpExpiryInterval);

                // Show success view
                switchView("viewForgotSuccess");
                showToast("Admin password reset successfully!", "success");

            } catch (err) {
                console.error("[Reset Password Execution] Error:", err);
                showFeedback("resetMessage", err.message || "Failed to complete password reset.", "error");
                showToast(err.message, "error");
            } finally {
                if (btnCompleteReset) btnCompleteReset.disabled = false;
                if (resetSpinner) resetSpinner.style.display = "none";
                if (resetIcon) resetIcon.style.display = "inline-block";
                if (resetBtnText) resetBtnText.textContent = "Update Admin Password";
            }
        });
    }
});