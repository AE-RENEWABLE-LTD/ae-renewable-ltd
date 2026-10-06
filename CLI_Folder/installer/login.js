"use strict";

/* =========================================================
   AE RENEWABLE LTD
   INSTALLER NETWORK
   LOGIN + PASSWORD RECOVERY ENGINE
========================================================= */


/* =========================================================
   API CONFIGURATION
========================================================= */

const API_ENDPOINT =
    "/api/auth/login";

const RESEND_ENDPOINT =
    "/api/auth/resend-verification";

const PASSWORD_RESET_REQUEST_ENDPOINT =
    "/api/auth/request-password-reset";

const PASSWORD_RESET_VERIFY_ENDPOINT =
    "/api/auth/verify-password-reset";

const PASSWORD_RESET_ENDPOINT =
    "/api/auth/reset-password";

const VERIFICATION_URL =
    "/installer/register?verify=1";

const DASHBOARD_URL =
    "/installer/portal";

const TOKEN_KEY =
    "token";

const ACCESS_TOKEN_KEY =
    "accessToken";

const USER_KEY =
    "user";

const PENDING_VERIFICATION_EMAIL_KEY =
    "aeInstallerVerificationEmail";

const RESEND_COOLDOWN_SECONDS =
    60;


/* =========================================================
   DOM — LOGIN
========================================================= */

const loginView =
    document.getElementById("loginView");

const resetView =
    document.getElementById("resetView");

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const forgotPasswordLink =
    document.getElementById("forgotPasswordLink");

const loginButton =
    document.getElementById("loginButton");

const loginButtonText =
    document.getElementById("loginButtonText");

const loginButtonLoader =
    document.getElementById("loginButtonLoader");

const loginButtonIcon =
    document.getElementById("loginButtonIcon");

const loginMessage =
    document.getElementById("loginMessage");

const loginMessageIcon =
    document.getElementById("loginMessageIcon");

const loginMessageText =
    document.getElementById("loginMessageText");

const verificationAction =
    document.getElementById("verificationAction");

const resendVerificationButton =
    document.getElementById(
        "resendVerificationButton"
    );

const resendVerificationText =
    document.getElementById(
        "resendVerificationText"
    );


/* =========================================================
   DOM — PASSWORD RESET
========================================================= */

const resetTitle =
    document.getElementById("resetTitle");

const resetSubtitle =
    document.getElementById("resetSubtitle");

const resetMessage =
    document.getElementById("resetMessage");

const resetMessageIcon =
    document.getElementById("resetMessageIcon");

const resetMessageText =
    document.getElementById("resetMessageText");

const resetRequestForm =
    document.getElementById("resetRequestForm");

const resetEmail =
    document.getElementById("resetEmail");

const resetRequestButton =
    document.getElementById("resetRequestButton");

const resetRequestButtonText =
    document.getElementById(
        "resetRequestButtonText"
    );

const resetRequestButtonLoader =
    document.getElementById(
        "resetRequestButtonLoader"
    );

const resetVerifyForm =
    document.getElementById("resetVerifyForm");

const resetCode =
    document.getElementById("resetCode");

const resetCodeDestination =
    document.getElementById(
        "resetCodeDestination"
    );

const resetVerifyButton =
    document.getElementById(
        "resetVerifyButton"
    );

const resetVerifyButtonText =
    document.getElementById(
        "resetVerifyButtonText"
    );

const resetVerifyButtonLoader =
    document.getElementById(
        "resetVerifyButtonLoader"
    );

const resendResetCodeButton =
    document.getElementById(
        "resendResetCodeButton"
    );

const resendResetCodeText =
    document.getElementById(
        "resendResetCodeText"
    );

const resetPasswordForm =
    document.getElementById(
        "resetPasswordForm"
    );

const newPassword =
    document.getElementById(
        "newPassword"
    );

const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );

const toggleNewPassword =
    document.getElementById(
        "toggleNewPassword"
    );

const toggleConfirmPassword =
    document.getElementById(
        "toggleConfirmPassword"
    );

const resetPasswordButton =
    document.getElementById(
        "resetPasswordButton"
    );

const resetPasswordButtonText =
    document.getElementById(
        "resetPasswordButtonText"
    );

const resetPasswordButtonLoader =
    document.getElementById(
        "resetPasswordButtonLoader"
    );

const resetSuccess =
    document.getElementById(
        "resetSuccess"
    );

const returnToLoginButton =
    document.getElementById(
        "returnToLoginButton"
    );

const backToLoginButton =
    document.getElementById(
        "backToLoginButton"
    );

const currentYear =
    document.getElementById(
        "currentYear"
    );


/* =========================================================
   APPLICATION STATE
========================================================= */

let verificationEmail =
    "";

let resendAvailableAt =
    0;

let resendTimer =
    null;

let resendInProgress =
    false;

let resetResendAvailableAt =
    0;

let resetResendTimer =
    null;

let resetRequestInProgress =
    false;

let resetVerificationInProgress =
    false;

let resetPasswordInProgress =
    false;

/*
 * Deliberately memory-only.
 *
 * The reset token must never be persisted in browser storage.
 */

let resetToken =
    "";


/* =========================================================
   HELPERS
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


function normalizeEmail(email) {

    return String(
        email || ""
    )
        .trim()
        .toLowerCase();

}


function isValidPassword(password) {

    return (
        typeof password === "string" &&
        password.length >= 8 &&
        password.length <= 128
    );

}


function isValidResetCode(code) {

    return /^\d{6}$/.test(
        String(code || "").trim()
    );

}


/* =========================================================
   API RESPONSE
========================================================= */

async function readResponse(response) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    if (
        contentType
            .toLowerCase()
            .includes(
                "application/json"
            )
    ) {

        try {

            return await response.json();

        } catch (error) {

            console.error(
                "AE Renewable JSON parsing error:",
                error
            );

            return {
                success: false,
                message:
                    "The server returned invalid JSON."
            };

        }

    }


    const text =
        await response.text();


    return {
        success: false,
        message:
            text ||
            "The server returned an unexpected response."
    };

}


function getApiMessage(
    data,
    fallback
) {

    return (
        data?.message ||
        data?.error ||
        data?.details?.message ||
        data?.data?.message ||
        fallback
    );

}


function getApiData(data) {

    if (
        data?.data &&
        typeof data.data === "object"
    ) {

        return data.data;

    }


    return {};

}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(
    element,
    iconElement,
    textElement,
    text,
    type = "error"
) {

    if (!element) {
        return;
    }


    if (textElement) {

        textElement.textContent =
            String(
                text ||
                "Something went wrong."
            );

    }


    element.className =
        `login-message ${type}`;


    element.hidden =
        false;


    if (iconElement) {

        const icons = {

            error:
                "fa-solid fa-circle-exclamation",

            warning:
                "fa-solid fa-triangle-exclamation",

            success:
                "fa-solid fa-circle-check",

            info:
                "fa-solid fa-circle-info"

        };


        iconElement.className =
            icons[type] ||
            icons.error;

    }


    element.classList.remove(
        "message-enter"
    );


    void element.offsetWidth;


    element.classList.add(
        "message-enter"
    );

}


function hideMessage(element) {

    if (!element) {
        return;
    }


    element.hidden =
        true;

}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    text,
    type = "error"
) {

    showMessage(
        loginMessage,
        loginMessageIcon,
        loginMessageText,
        text,
        type
    );

}


function hideLoginMessage() {

    hideMessage(
        loginMessage
    );

}


/* =========================================================
   RESET MESSAGE
========================================================= */

function showResetMessage(
    text,
    type = "error"
) {

    showMessage(
        resetMessage,
        resetMessageIcon,
        resetMessageText,
        text,
        type
    );

}


function hideResetMessage() {

    hideMessage(
        resetMessage
    );

}


/* =========================================================
   BUTTON STATE
========================================================= */

function setButtonLoading(
    button,
    textElement,
    loaderElement,
    loading,
    loadingText,
    normalText
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.classList.toggle(
        "loading",
        loading
    );


    if (textElement) {

        textElement.textContent =
            loading
                ? loadingText
                : normalText;

    }


    if (loaderElement) {

        loaderElement.style.display =
            loading
                ? "block"
                : "";

    }

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function setupPasswordToggle(
    button,
    input
) {

    button?.addEventListener(
        "click",
        () => {

            if (!input) {
                return;
            }


            const show =
                input.type === "password";


            input.type =
                show
                    ? "text"
                    : "password";


            button.setAttribute(
                "aria-pressed",
                String(show)
            );


            button.setAttribute(
                "aria-label",
                show
                    ? "Hide password"
                    : "Show password"
            );


            button.innerHTML =
                show

                    ? `
                        <i
                            class="fa-regular fa-eye-slash"
                            aria-hidden="true"
                        ></i>
                      `

                    : `
                        <i
                            class="fa-regular fa-eye"
                            aria-hidden="true"
                        ></i>
                      `;

        }
    );

}


setupPasswordToggle(
    togglePassword,
    passwordInput
);

setupPasswordToggle(
    toggleNewPassword,
    newPassword
);

setupPasswordToggle(
    toggleConfirmPassword,
    confirmPassword
);


/* =========================================================
   VERIFICATION REQUIREMENT
========================================================= */

function requiresEmailVerification(
    response,
    data
) {

    const combined =
        JSON.stringify(
            data || {}
        ).toLowerCase();


    const message =
        getApiMessage(
            data,
            ""
        ).toLowerCase();


    if (
        data?.emailVerified === false ||
        data?.email_verified === false ||
        data?.data?.emailVerified === false ||
        data?.data?.email_verified === false
    ) {

        return true;

    }


    if (
        data?.requiresVerification === true ||
        data?.requiresEmailVerification === true ||
        data?.data?.requiresVerification === true ||
        data?.data?.requiresEmailVerification === true
    ) {

        return true;

    }


    const verificationCodes = [

        "email_not_verified",
        "email_unverified",
        "email_verification_required",
        "verification_required",
        "account_not_verified",
        "unverified_email"

    ];


    if (
        verificationCodes.some(
            code =>
                combined.includes(code)
        )
    ) {

        return true;

    }


    const verificationPhrases = [

        "email address has not been verified",
        "email has not been verified",
        "email is not verified",
        "email is unverified",
        "please verify your email",
        "verify your email address",
        "email verification required",
        "verification required",
        "account is not verified",
        "account has not been verified",
        "please verify your email address"

    ];


    return verificationPhrases.some(
        phrase =>
            message.includes(phrase) ||
            combined.includes(phrase)
    );

}


/* =========================================================
   VERIFICATION ACTION
========================================================= */

function showVerificationAction() {

    if (!verificationAction) {
        return;
    }


    verificationAction.hidden =
        false;

    verificationAction.classList.add(
        "show"
    );

}


function hideVerificationAction() {

    if (!verificationAction) {
        return;
    }


    verificationAction.hidden =
        true;

    verificationAction.classList.remove(
        "show"
    );

}


/* =========================================================
   PENDING VERIFICATION EMAIL
========================================================= */

function savePendingVerificationEmail(
    email
) {

    const normalized =
        normalizeEmail(email);


    if (!normalized) {
        return;
    }


    verificationEmail =
        normalized;


    try {

        localStorage.setItem(
            PENDING_VERIFICATION_EMAIL_KEY,
            normalized
        );

    } catch (error) {

        console.warn(
            "Unable to save pending verification email:",
            error
        );

    }

}


function getPendingVerificationEmail() {

    if (verificationEmail) {
        return verificationEmail;
    }


    try {

        return (
            localStorage.getItem(
                PENDING_VERIFICATION_EMAIL_KEY
            ) || ""
        );

    } catch (error) {

        console.warn(
            "Unable to read pending verification email:",
            error
        );

        return "";

    }

}


function clearPendingVerificationEmail() {

    verificationEmail =
        "";


    try {

        localStorage.removeItem(
            PENDING_VERIFICATION_EMAIL_KEY
        );

    } catch (error) {

        console.warn(
            "Unable to clear pending verification email:",
            error
        );

    }

}


/* =========================================================
   VERIFICATION RESEND
========================================================= */

function stopResendTimer() {

    if (resendTimer) {

        clearInterval(
            resendTimer
        );

        resendTimer =
            null;

    }

}


function startResendCooldown(
    seconds = RESEND_COOLDOWN_SECONDS
) {

    stopResendTimer();


    resendAvailableAt =
        Date.now() +
        Number(seconds) * 1000;


    updateResendState();


    resendTimer =
        window.setInterval(
            updateResendState,
            1000
        );

}


function updateResendState() {

    if (!resendVerificationButton) {
        return;
    }


    const remaining =
        Math.max(
            0,
            Math.ceil(
                (
                    resendAvailableAt -
                    Date.now()
                ) / 1000
            )
        );


    if (remaining <= 0) {

        stopResendTimer();


        resendVerificationButton.disabled =
            false;


        if (resendVerificationText) {

            resendVerificationText.textContent =
                "Resend code";

        }


        return;

    }


    resendVerificationButton.disabled =
        true;


    if (resendVerificationText) {

        resendVerificationText.textContent =
            `Resend in ${remaining}s`;

    }

}


/* =========================================================
   RESEND VERIFICATION CODE
========================================================= */

async function resendVerificationCode(
    email
) {

    if (resendInProgress) {
        return false;
    }


    const normalized =
        normalizeEmail(email);


    if (!isValidEmail(normalized)) {

        showLoginMessage(
            "Please enter a valid email address.",
            "error"
        );

        return false;

    }


    resendInProgress =
        true;


    resendVerificationButton.disabled =
        true;


    resendVerificationText.textContent =
        "Sending...";


    try {

        const response =
            await fetch(
                RESEND_ENDPOINT,
                {

                    method:
                        "POST",

                    credentials:
                        "same-origin",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            email:
                                normalized
                        })

                }
            );


        const data =
            await readResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                getApiMessage(
                    data,
                    "Unable to resend verification code."
                )
            );

        }


        if (data?.success === false) {

            throw new Error(
                getApiMessage(
                    data,
                    "Unable to resend verification code."
                )
            );

        }


        savePendingVerificationEmail(
            normalized
        );


        startResendCooldown();


        return true;

    } catch (error) {

        console.error(
            "AE Renewable resend verification error:",
            error
        );


        showLoginMessage(
            error?.message ||
            "Unable to resend verification code."
        );


        resendVerificationButton.disabled =
            false;


        resendVerificationText.textContent =
            "Resend code";


        return false;

    } finally {

        resendInProgress =
            false;

    }

}


/* =========================================================
   OPEN REGISTRATION VERIFICATION
========================================================= */

function openVerificationInterface() {

    const email =
        getPendingVerificationEmail();


    if (!email) {

        showLoginMessage(
            "Please enter your email address so we can continue verification."
        );

        emailInput?.focus();

        return;

    }


    savePendingVerificationEmail(
        email
    );


    if (passwordInput) {

        passwordInput.value =
            "";

    }


    window.location.assign(
        VERIFICATION_URL
    );

}


/* =========================================================
   RESEND VERIFICATION BUTTON
========================================================= */

resendVerificationButton?.addEventListener(
    "click",
    async () => {

        const email =
            normalizeEmail(
                emailInput?.value
            ) ||
            getPendingVerificationEmail();


        if (!isValidEmail(email)) {

            showLoginMessage(
                "Please enter a valid email address before requesting a verification code."
            );

            emailInput?.focus();

            return;

        }


        hideLoginMessage();


        const sent =
            await resendVerificationCode(
                email
            );


        if (!sent) {
            return;
        }


        showLoginMessage(
            "A new verification code has been sent to your email. Opening verification...",
            "success"
        );


        window.setTimeout(
            openVerificationInterface,
            500
        );

    }
);


/* =========================================================
   LOGIN FORM
========================================================= */

loginForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        hideLoginMessage();

        hideVerificationAction();


        const email =
            normalizeEmail(
                emailInput?.value
            );


        const password =
            passwordInput?.value ||
            "";


        if (!email) {

            showLoginMessage(
                "Please enter your email address."
            );

            emailInput?.focus();

            return;

        }


        if (!isValidEmail(email)) {

            showLoginMessage(
                "Please enter a valid email address."
            );

            emailInput?.focus();

            return;

        }


        if (!password) {

            showLoginMessage(
                "Please enter your password."
            );

            passwordInput?.focus();

            return;

        }


        savePendingVerificationEmail(
            email
        );


        setButtonLoading(
            loginButton,
            loginButtonText,
            loginButtonLoader,
            true,
            "Signing in...",
            "Sign in to portal"
        );


        try {

            const response =
                await fetch(
                    API_ENDPOINT,
                    {

                        method:
                            "POST",

                        credentials:
                            "include",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        body:
                            JSON.stringify({
                                email,
                                password
                            })

                    }
                );


            const data =
                await readResponse(
                    response
                );


            if (
                !response.ok &&
                requiresEmailVerification(
                    response,
                    data
                )
            ) {

                savePendingVerificationEmail(
                    email
                );


                setButtonLoading(
                    loginButton,
                    loginButtonText,
                    loginButtonLoader,
                    false,
                    "Signing in...",
                    "Sign in to portal"
                );


                showLoginMessage(
                    getApiMessage(
                        data,
                        "Your account exists, but your email address has not been verified yet."
                    ),
                    "warning"
                );


                showVerificationAction();


                return;

            }


            if (!response.ok) {

                throw new Error(
                    getApiMessage(
                        data,
                        "Invalid email or password."
                    )
                );

            }


            const token =
                data?.data?.token ||
                data?.data?.accessToken ||
                data?.token ||
                data?.accessToken;


            if (!token) {

                throw new Error(
                    "Login was successful, but no authentication token was returned."
                );

            }


            localStorage.setItem("token", token);
            localStorage.setItem("accessToken", token);
            localStorage.setItem("aeInstallerToken", token);
            localStorage.setItem("aeRenewableToken", token);

            const user =
                data?.data?.user ||
                data?.user;

            if (user) {
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("aeInstallerUser", JSON.stringify(user));
                localStorage.setItem("aeRenewableUser", JSON.stringify(user));
            }

            clearPendingVerificationEmail();
            try {
                sessionStorage.setItem("ae_installer_logged_in", "true");
            } catch {}

            showLoginMessage(
                "Authentication successful. Opening your workspace...",
                "success"
            );


            loginButton.classList.add(
                "success"
            );


            loginButtonText.textContent =
                "Welcome back";


            loginButtonLoader.style.display =
                "none";


            loginButtonIcon.innerHTML =
                `
                    <i
                        class="fa-solid fa-check"
                        aria-hidden="true"
                    ></i>
                `;


            window.setTimeout(
                () => {

                    window.location.assign(
                        DASHBOARD_URL
                    );

                },
                650
            );


        } catch (error) {

            console.error(
                "AE Renewable installer login error:",
                error
            );


            showLoginMessage(
                error?.message ||
                "Unable to connect to the server. Please try again."
            );


            setButtonLoading(
                loginButton,
                loginButtonText,
                loginButtonLoader,
                false,
                "Signing in...",
                "Sign in to portal"
            );

        }

    }
);


/* =========================================================
   PASSWORD RESET — VIEW
========================================================= */

function showResetView() {

    hideLoginMessage();

    hideVerificationAction();


    loginView.hidden =
        true;


    resetView.hidden =
        false;


    resetEmail.value =
        normalizeEmail(
            emailInput?.value
        );


    resetEmail.focus();


    resetToken =
        "";


    showResetStep(
        "request"
    );

}


function showLoginView() {

    hideResetMessage();


    resetView.hidden =
        true;


    loginView.hidden =
        false;


    resetToken =
        "";


    resetEmail.value =
        "";


    resetCode.value =
        "";


    newPassword.value =
        "";


    confirmPassword.value =
        "";


    showResetStep(
        "request"
    );


    emailInput.focus();

}


/* =========================================================
   RESET STEP CONTROL
========================================================= */

function showResetStep(
    step
) {

    resetRequestForm.hidden =
        step !== "request";


    resetVerifyForm.hidden =
        step !== "verify";


    resetPasswordForm.hidden =
        step !== "password";


    resetSuccess.hidden =
        step !== "success";


    backToLoginButton.hidden =
        step === "success";


    if (step === "request") {

        resetTitle.textContent =
            "Reset your password.";

        resetSubtitle.textContent =
            "Enter your installer email address and we'll send you a secure verification code.";

    }


    if (step === "verify") {

        resetTitle.textContent =
            "Verify your email.";

        resetSubtitle.textContent =
            "Enter the 6-digit verification code sent to your email.";

    }


    if (step === "password") {

        resetTitle.textContent =
            "Create a new password.";

        resetSubtitle.textContent =
            "Choose a new password for your installer account.";

    }


    if (step === "success") {

        resetTitle.textContent =
            "Password updated.";

        resetSubtitle.textContent =
            "Your installer credentials have been successfully updated.";

    }

}


/* =========================================================
   RESET REQUEST
========================================================= */

async function requestPasswordReset() {

    if (resetRequestInProgress) {
        return;
    }


    const email =
        normalizeEmail(
            resetEmail.value
        );


    hideResetMessage();


    if (!isValidEmail(email)) {

        showResetMessage(
            "Please enter a valid email address."
        );

        resetEmail.focus();

        return;

    }


    resetRequestInProgress =
        true;


    setButtonLoading(
        resetRequestButton,
        resetRequestButtonText,
        resetRequestButtonLoader,
        true,
        "Sending...",
        "Send verification code"
    );


    try {

        const response =
            await fetch(
                PASSWORD_RESET_REQUEST_ENDPOINT,
                {

                    method:
                        "POST",

                    credentials:
                        "same-origin",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            email
                        })

                }
            );


        const data =
            await readResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                getApiMessage(
                    data,
                    "Unable to process your password reset request."
                )
            );

        }


        if (data?.success === false) {

            throw new Error(
                getApiMessage(
                    data,
                    "Unable to process your password reset request."
                )
            );

        }


        resetEmail.value =
            email;


        resetCodeDestination.textContent =
            `A 6-digit verification code was sent to ${email}.`;


        showResetMessage(
            "If an installer account exists for this email, a verification code has been sent.",
            "success"
        );


        showResetStep(
            "verify"
        );


        resetCode.focus();


        startResetResendCooldown();


    } catch (error) {

        console.error(
            "AE Renewable password reset request error:",
            error
        );


        showResetMessage(
            error?.message ||
            "Unable to process your password reset request."
        );

    } finally {

        resetRequestInProgress =
            false;


        setButtonLoading(
            resetRequestButton,
            resetRequestButtonText,
            resetRequestButtonLoader,
            false,
            "Sending...",
            "Send verification code"
        );

    }

}


/* =========================================================
   RESET OTP VERIFICATION
========================================================= */

async function verifyPasswordResetCode() {

    if (resetVerificationInProgress) {
        return;
    }


    const email =
        normalizeEmail(
            resetEmail.value
        );


    const code =
        String(
            resetCode.value || ""
        ).trim();


    hideResetMessage();


    if (!isValidEmail(email)) {

        showResetMessage(
            "Please enter a valid email address."
        );

        showResetStep(
            "request"
        );

        resetEmail.focus();

        return;

    }


    if (!isValidResetCode(code)) {

        showResetMessage(
            "Please enter the 6-digit verification code."
        );

        resetCode.focus();

        return;

    }


    resetVerificationInProgress =
        true;


    setButtonLoading(
        resetVerifyButton,
        resetVerifyButtonText,
        resetVerifyButtonLoader,
        true,
        "Verifying...",
        "Verify code"
    );


    try {

        const response =
            await fetch(
                PASSWORD_RESET_VERIFY_ENDPOINT,
                {

                    method:
                        "POST",

                    credentials:
                        "same-origin",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            email,
                            code
                        })

                }
            );


        const data =
            await readResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                getApiMessage(
                    data,
                    "Invalid or expired verification code."
                )
            );

        }


        if (data?.success === false) {

            throw new Error(
                getApiMessage(
                    data,
                    "Invalid or expired verification code."
                )
            );

        }


        const responseData =
            getApiData(
                data
            );


        const token =
            responseData?.resetToken;


        if (!token) {

            throw new Error(
                "Verification succeeded, but no reset authorization was returned."
            );

        }


        /*
         * Keep resetToken memory-only.
         */

        resetToken =
            token;


        resetCode.value =
            "";


        showResetMessage(
            "Verification successful. You can now create a new password.",
            "success"
        );


        showResetStep(
            "password"
        );


        newPassword.focus();


    } catch (error) {

        console.error(
            "AE Renewable password reset verification error:",
            error
        );


        showResetMessage(
            error?.message ||
            "Invalid or expired verification code."
        );


        resetCode.focus();

    } finally {

        resetVerificationInProgress =
            false;


        setButtonLoading(
            resetVerifyButton,
            resetVerifyButtonText,
            resetVerifyButtonLoader,
            false,
            "Verifying...",
            "Verify code"
        );

    }

}


/* =========================================================
   RESET PASSWORD
========================================================= */

async function resetPassword() {

    if (resetPasswordInProgress) {
        return;
    }


    const email =
        normalizeEmail(
            resetEmail.value
        );


    const password =
        newPassword.value ||
        "";


    const confirmation =
        confirmPassword.value ||
        "";


    hideResetMessage();


    if (!resetToken) {

        showResetMessage(
            "Your password reset session has expired. Please request a new code."
        );

        showResetStep(
            "request"
        );

        return;

    }


    if (!isValidEmail(email)) {

        showResetMessage(
            "Please enter a valid email address."
        );

        return;

    }


    if (!isValidPassword(password)) {

        showResetMessage(
            "Your new password must contain between 8 and 128 characters."
        );

        newPassword.focus();

        return;

    }


    if (password !== confirmation) {

        showResetMessage(
            "The passwords do not match."
        );

        confirmPassword.focus();

        return;

    }


    resetPasswordInProgress =
        true;


    setButtonLoading(
        resetPasswordButton,
        resetPasswordButtonText,
        resetPasswordButtonLoader,
        true,
        "Updating...",
        "Reset password"
    );


    try {

        const response =
            await fetch(
                PASSWORD_RESET_ENDPOINT,
                {

                    method:
                        "POST",

                    credentials:
                        "same-origin",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            email,

                            resetToken,

                            newPassword:
                                password

                        })

                }
            );


        const data =
            await readResponse(
                response
            );


        if (!response.ok) {

            throw new Error(
                getApiMessage(
                    data,
                    "Unable to reset your password."
                )
            );

        }


        if (data?.success === false) {

            throw new Error(
                getApiMessage(
                    data,
                    "Unable to reset your password."
                )
            );

        }


        /*
         * Destroy the token immediately after successful use.
         */

        resetToken =
            "";


        newPassword.value =
            "";

        confirmPassword.value =
            "";


        showResetMessage(
            "Your password has been successfully updated.",
            "success"
        );


        showResetStep(
            "success"
        );


    } catch (error) {

        console.error(
            "AE Renewable password reset error:",
            error
        );


        showResetMessage(
            error?.message ||
            "Unable to reset your password."
        );

    } finally {

        resetPasswordInProgress =
            false;


        setButtonLoading(
            resetPasswordButton,
            resetPasswordButtonText,
            resetPasswordButtonLoader,
            false,
            "Updating...",
            "Reset password"
        );

    }

}


/* =========================================================
   RESET RESEND COOLDOWN
========================================================= */

function stopResetResendTimer() {

    if (resetResendTimer) {

        clearInterval(
            resetResendTimer
        );

        resetResendTimer =
            null;

    }

}


function startResetResendCooldown(
    seconds = RESEND_COOLDOWN_SECONDS
) {

    stopResetResendTimer();


    resetResendAvailableAt =
        Date.now() +
        Number(seconds) * 1000;


    updateResetResendState();


    resetResendTimer =
        window.setInterval(
            updateResetResendState,
            1000
        );

}


function updateResetResendState() {

    if (!resendResetCodeButton) {
        return;
    }


    const remaining =
        Math.max(
            0,
            Math.ceil(
                (
                    resetResendAvailableAt -
                    Date.now()
                ) / 1000
            )
        );


    if (remaining <= 0) {

        stopResetResendTimer();


        resendResetCodeButton.disabled =
            false;


        resendResetCodeText.textContent =
            "Resend code";


        return;

    }


    resendResetCodeButton.disabled =
        true;


    resendResetCodeText.textContent =
        `Resend in ${remaining}s`;

}


/* =========================================================
   RESET RESEND
========================================================= */

resendResetCodeButton?.addEventListener(
    "click",
    async () => {

        if (
            resetRequestInProgress ||
            resendResetCodeButton.disabled
        ) {

            return;

        }


        const email =
            normalizeEmail(
                resetEmail.value
            );


        if (!isValidEmail(email)) {

            showResetMessage(
                "Please enter a valid email address."
            );

            showResetStep(
                "request"
            );

            resetEmail.focus();

            return;

        }


        resetRequestInProgress =
            true;


        resendResetCodeButton.disabled =
            true;


        resendResetCodeText.textContent =
            "Sending...";


        try {

            const response =
                await fetch(
                    PASSWORD_RESET_REQUEST_ENDPOINT,
                    {

                        method:
                            "POST",

                        credentials:
                            "same-origin",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        body:
                            JSON.stringify({
                                email
                            })

                    }
                );


            const data =
                await readResponse(
                    response
                );


            if (!response.ok) {

                throw new Error(
                    getApiMessage(
                        data,
                        "Unable to send a new verification code."
                    )
                );

            }


            showResetMessage(
                "If an installer account exists for this email, a new verification code has been sent.",
                "success"
            );


            resetCode.value =
                "";


            startResetResendCooldown();


            resetCode.focus();


        } catch (error) {

            console.error(
                "AE Renewable password reset resend error:",
                error
            );


            showResetMessage(
                error?.message ||
                "Unable to send a new verification code."
            );


            resendResetCodeButton.disabled =
                false;


            resendResetCodeText.textContent =
                "Resend code";

        } finally {

            resetRequestInProgress =
                false;

        }

    }
);


/* =========================================================
   RESET FORMS
========================================================= */

resetRequestForm?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        requestPasswordReset();

    }
);


resetVerifyForm?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        verifyPasswordResetCode();

    }
);


resetPasswordForm?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        resetPassword();

    }
);


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forgotPasswordLink?.addEventListener(
    "click",
    () => {

        showResetView();

    }
);


/* =========================================================
   BACK TO LOGIN
========================================================= */

backToLoginButton?.addEventListener(
    "click",
    () => {

        showLoginView();

    }
);


returnToLoginButton?.addEventListener(
    "click",
    () => {

        showLoginView();

    }
);


/* =========================================================
   INPUT NORMALIZATION
========================================================= */

resetCode?.addEventListener(
    "input",
    () => {

        resetCode.value =
            resetCode.value
                .replace(/\D/g, "")
                .slice(0, 6);

        hideResetMessage();

    }
);


resetEmail?.addEventListener(
    "input",
    () => {

        hideResetMessage();

    }
);


newPassword?.addEventListener(
    "input",
    hideResetMessage
);


confirmPassword?.addEventListener(
    "input",
    hideResetMessage
);


/* =========================================================
   LOGIN INPUT INTERACTION
========================================================= */

emailInput?.addEventListener(
    "input",
    () => {

        hideLoginMessage();

        hideVerificationAction();

    }
);


passwordInput?.addEventListener(
    "input",
    hideLoginMessage
);


/* =========================================================
   REGISTER LINK
========================================================= */

document.querySelectorAll(
    'a[href="/installer/register"]'
).forEach(
    link => {

        link.addEventListener(
            "click",
            clearPendingVerificationEmail
        );

    }
);


/* =========================================================
   CURRENT YEAR
========================================================= */

if (currentYear) {

    currentYear.textContent =
        String(
            new Date().getFullYear()
        );

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        try {
            sessionStorage.removeItem("ae_installer_logged_in");
        } catch {}

        const pendingEmail =
            getPendingVerificationEmail();


        if (
            pendingEmail &&
            emailInput &&
            !emailInput.value
        ) {

            emailInput.value =
                pendingEmail;

        }


        emailInput?.focus();

    }
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "pagehide",
    () => {

        stopResendTimer();

        stopResetResendTimer();

        /*
         * Never retain a reset token after leaving the page.
         */

        resetToken =
            "";

    }
);


console.log(
    "AE Renewable installer login + password recovery engine loaded."
);