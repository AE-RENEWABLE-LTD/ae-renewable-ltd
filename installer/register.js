"use strict";

/* =========================================================
   AE RENEWABLE LTD
   INSTALLER NETWORK
   REGISTRATION + EMAIL VERIFICATION
   register.js
========================================================= */

/* =========================================================
   CONFIGURATION
========================================================= */

const REGISTER_API =
    "/api/auth/register-installer";

const VERIFY_API =
    "/api/auth/verify-email";

const RESEND_API =
    "/api/auth/resend-verification";

const LOGIN_URL =
    "/installer/login";

const PORTAL_URL =
    "/installer/portal";

const INSTALLER_HOME_URL =
    "/installer/";

const ACCESS_TOKEN_KEY =
    "accessToken";

const TOKEN_KEY =
    "token";

const USER_KEY =
    "user";

const PENDING_VERIFICATION_EMAIL_KEY =
    "aeInstallerVerificationEmail";

const OTP_LENGTH =
    6;

const OTP_EXPIRY_SECONDS =
    10 * 60;

const RESEND_COOLDOWN_SECONDS =
    60;


/* =========================================================
   DOM
========================================================= */

const registrationForm =
    document.getElementById(
        "registrationForm"
    );

const registrationStep =
    document.getElementById(
        "registrationStep"
    );

const otpStep =
    document.getElementById(
        "otpStep"
    );

const registrationSuccess =
    document.getElementById(
        "registrationSuccess"
    );

const messageContainer =
    document.getElementById(
        "messageContainer"
    );

const registerButton =
    document.getElementById(
        "registerButton"
    );

const fullNameInput =
    document.getElementById(
        "fullName"
    );

const phoneInput =
    document.getElementById(
        "phone"
    );

const emailInput =
    document.getElementById(
        "email"
    );

const companyNameInput =
    document.getElementById(
        "companyName"
    );

const rcNumberInput =
    document.getElementById(
        "rcNumber"
    );

const specializationInput =
    document.getElementById(
        "specialization"
    );

const otherSpecializationGroup =
    document.getElementById(
        "otherSpecializationGroup"
    );

const otherSpecializationInput =
    document.getElementById(
        "otherSpecialization"
    );

const stateInput =
    document.getElementById(
        "state"
    );

const localGovernmentInput =
    document.getElementById(
        "localGovernment"
    );

const cityInput =
    document.getElementById(
        "city"
    );

const addressInput =
    document.getElementById(
        "address"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const repeatPasswordInput =
    document.getElementById(
        "repeatPassword"
    );

const termsInput =
    document.getElementById(
        "terms"
    );

const passwordStrengthLabel =
    document.getElementById(
        "passwordStrengthLabel"
    );

const strengthDescription =
    document.getElementById(
        "strengthDescription"
    );

const strengthVolume =
    document.getElementById(
        "strengthVolume"
    );

const passwordMatch =
    document.getElementById(
        "passwordMatch"
    );

const togglePassword =
    document.getElementById(
        "togglePassword"
    );

const toggleRepeatPassword =
    document.getElementById(
        "toggleRepeatPassword"
    );

const otpForm =
    document.getElementById(
        "otpForm"
    );

const otpCodeInput =
    document.getElementById(
        "otpCode"
    );

const otpEmail =
    document.getElementById(
        "otpEmail"
    );

const otpCountdown =
    document.getElementById(
        "otpCountdown"
    );

const otpTimer =
    document.getElementById(
        "otpTimer"
    );

const resendOtpButton =
    document.getElementById(
        "resendOtpButton"
    );

const resendStatus =
    document.getElementById(
        "resendStatus"
    );

const changeEmailButton =
    document.getElementById(
        "changeEmailButton"
    );

const verifyOtpButton =
    document.getElementById(
        "verifyOtpButton"
    );

const registrationProgress =
    document.getElementById(
        "registrationProgress"
    );

const portalButton =
    document.getElementById(
        "portalButton"
    );


/* =========================================================
   STATE
========================================================= */

let verificationEmail =
    "";

let otpExpiresAt =
    0;

let resendAvailableAt =
    0;

let countdownTimer =
    null;

let resendTimer =
    null;

let registrationData =
    null;

let verificationInProgress =
    false;

let registrationInProgress =
    false;

let resendInProgress =
    false;

let verificationOnlyMode =
    false;


/* =========================================================
   HELPERS
========================================================= */

function isVerificationMode() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return (
        params.get("verify") === "1"
    );
}


function normalizeEmail(value) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}


function normalizePhone(value) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /[\s\-().]/g,
            ""
        );
}


function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


function escapeHtml(value) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   API RESPONSE HELPERS
========================================================= */

async function readResponse(response) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {

        try {

            return await response.json();

        } catch {

            return {};
        }
    }

    try {

        const text =
            await response.text();

        return {
            message: text
        };

    } catch {

        return {};
    }
}


function getApiData(response) {

    if (
        response &&
        response.data &&
        typeof response.data === "object"
    ) {

        return response.data;
    }

    return response || {};
}


function getApiMessage(
    response,
    fallback
) {

    if (
        response &&
        typeof response.message === "string" &&
        response.message.trim()
    ) {

        return response.message.trim();
    }

    if (
        response &&
        response.error &&
        typeof response.error === "string"
    ) {

        return response.error.trim();
    }

    if (
        response &&
        response.errors &&
        Array.isArray(response.errors) &&
        response.errors.length
    ) {

        return response.errors
            .map(
                error => {

                    if (
                        typeof error === "string"
                    ) {

                        return error;
                    }

                    return (
                        error.message ||
                        error.msg ||
                        ""
                    );
                }
            )
            .filter(Boolean)
            .join(" ");
    }

    return fallback;
}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(
    message,
    type = "info"
) {

    if (!messageContainer) {
        return;
    }

    messageContainer.className =
        `message-container ${type}`;

    messageContainer.innerHTML = `
        <div class="message-content">
            <span class="message-icon" aria-hidden="true">
                ${
                    type === "success"
                        ? "✓"
                        : type === "error"
                            ? "!"
                            : "i"
                }
            </span>

            <span class="message-text">
                ${escapeHtml(message)}
            </span>
        </div>
    `;

    messageContainer.hidden =
        false;
}


function clearMessage() {

    if (!messageContainer) {
        return;
    }

    messageContainer.className =
        "message-container";

    messageContainer.innerHTML =
        "";

    messageContainer.hidden =
        true;
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText
) {

    if (!button) {
        return;
    }

    if (loading) {

        if (
            !button.dataset.originalHtml
        ) {

            button.dataset.originalHtml =
                button.innerHTML;
        }

        button.disabled =
            true;

        button.setAttribute(
            "aria-busy",
            "true"
        );

        button.innerHTML = `
            <span class="button-text">
                ${escapeHtml(
                    loadingText || "Please wait..."
                )}
            </span>

            <span
                class="button-arrow"
                aria-hidden="true"
            >
                …
            </span>
        `;

    } else {

        button.disabled =
            false;

        button.removeAttribute(
            "aria-busy"
        );

        if (
            button.dataset.originalHtml
        ) {

            button.innerHTML =
                button.dataset.originalHtml;

            delete button.dataset.originalHtml;
        }
    }
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function savePendingVerificationEmail(
    email
) {

    const normalized =
        normalizeEmail(email);

    if (!normalized) {
        return;
    }

    try {

        localStorage.setItem(
            PENDING_VERIFICATION_EMAIL_KEY,
            normalized
        );

    } catch (error) {

        console.warn(
            "Unable to save verification email:",
            error
        );
    }
}


function getPendingVerificationEmail() {

    try {

        return normalizeEmail(
            localStorage.getItem(
                PENDING_VERIFICATION_EMAIL_KEY
            )
        );

    } catch {

        return "";
    }
}


function clearPendingVerificationEmail() {

    try {

        localStorage.removeItem(
            PENDING_VERIFICATION_EMAIL_KEY
        );

    } catch (error) {

        console.warn(
            "Unable to clear verification email:",
            error
        );
    }
}


/* =========================================================
   REGISTRATION DATA
========================================================= */

function collectRegistrationData() {

    const fullName =
        fullNameInput?.value.trim() || "";

    const nameParts =
        fullName
            .split(/\s+/)
            .filter(Boolean);

    const firstName =
        nameParts.shift() || "";

    const lastName =
        nameParts.join(" ");

    const specialization =
        specializationInput?.value.trim() || "";

    const otherSpecialization =
        otherSpecializationInput?.value.trim() || "";

    return {

        firstName,

        lastName,

        fullName,

        email:
            normalizeEmail(
                emailInput?.value
            ),

        phone:
            normalizePhone(
                phoneInput?.value
            ),

        companyName:
            companyNameInput?.value.trim() || "",

        rcNumber:
            rcNumberInput?.value.trim() || "",

        specialization:
            specialization === "Other"
                ? otherSpecialization
                : specialization,

        state:
            stateInput?.value.trim() || "",

        localGovernment:
            localGovernmentInput?.value.trim() || "",

        city:
            cityInput?.value.trim() || "",

        address:
            addressInput?.value.trim() || "",

        password:
            passwordInput?.value || ""
    };
}


/* =========================================================
   REGISTRATION VALIDATION
========================================================= */

function validateRegistration(
    data
) {

    const errors = [];

    if (
        !data.firstName ||
        !data.lastName
    ) {

        errors.push(
            "Please enter your first and last name."
        );
    }

    if (
        data.phone.length < 10
    ) {

        errors.push(
            "Please enter a valid phone number."
        );
    }

    if (
        !isValidEmail(
            data.email
        )
    ) {

        errors.push(
            "Please enter a valid email address."
        );
    }

    if (
        !data.companyName
    ) {

        errors.push(
            "Please enter your company or business name."
        );
    }

    if (
        !data.state
    ) {

        errors.push(
            "Please enter your state."
        );
    }

    if (
        !data.localGovernment
    ) {

        errors.push(
            "Please enter your Local Government Area."
        );
    }

    if (
        !data.city
    ) {

        errors.push(
            "Please enter your city."
        );
    }

    if (
        data.password.length < 8
    ) {

        errors.push(
            "Your password must contain at least 8 characters."
        );
    }

    if (
        data.password !==
        (repeatPasswordInput?.value || "")
    ) {

        errors.push(
            "Your passwords do not match."
        );
    }

    if (
        termsInput &&
        !termsInput.checked
    ) {

        errors.push(
            "You must confirm the registration information before continuing."
        );
    }

   if (
    specializationInput?.value === "Other" &&
    !data.specialization
) {

    errors.push(
        "Please describe your specialization."
    );
}
    return errors;
}


/* =========================================================
   DUPLICATE ACCOUNT DETECTION
========================================================= */

function isDuplicateResponse(
    response,
    status
) {

    if (
        status === 409
    ) {

        return true;
    }

    const data =
        getApiData(
            response
        );

    const code =
        String(
            response?.code ||
            data?.code ||
            ""
        )
            .toLowerCase();

    const message =
        getApiMessage(
            response,
            ""
        )
            .toLowerCase();

    const duplicateCodes = [
        "email_exists",
        "email_already_exists",
        "duplicate_email",
        "phone_exists",
        "phone_already_exists",
        "duplicate_phone",
        "user_exists",
        "installer_exists"
    ];

    if (
        duplicateCodes.includes(
            code
        )
    ) {

        return true;
    }

    return (
        message.includes(
            "email already exists"
        ) ||
        message.includes(
            "email is already registered"
        ) ||
        message.includes(
            "phone already exists"
        ) ||
        message.includes(
            "phone is already registered"
        ) ||
        message.includes(
            "already registered"
        ) ||
        message.includes(
            "already exists"
        )
    );
}


/* =========================================================
   SPECIALIZATION
========================================================= */

function setupSpecialization() {

    if (
        !specializationInput ||
        !otherSpecializationGroup
    ) {

        return;
    }

    function update() {

        const isOther =
            specializationInput.value ===
            "Other";

        otherSpecializationGroup.classList.toggle(
            "hidden",
            !isOther
        );

        if (
            otherSpecializationInput
        ) {

            otherSpecializationInput.required =
                isOther;

            if (!isOther) {

                otherSpecializationInput.value =
                    "";
            }
        }
    }

    specializationInput.addEventListener(
        "change",
        update
    );

    update();
}


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

function calculatePasswordStrength(
    password
) {

    if (!password) {

        return {
            score: 0,
            label: "—",
            description: ""
        };
    }

    let score = 0;

    if (
        password.length >= 8
    ) {

        score++;
    }

    if (
        password.length >= 12
    ) {

        score++;
    }

    if (
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password)
    ) {

        score++;
    }

    if (
        /\d/.test(password)
    ) {

        score++;
    }

    if (
        /[^A-Za-z0-9]/.test(password)
    ) {

        score++;
    }

    if (
        password.length >= 16
    ) {

        score++;
    }

    score =
        Math.min(
            score,
            10
        );

    let label =
        "Weak";

    let description =
        "Use more characters and a combination of letters, numbers and symbols.";

    if (
        score >= 8
    ) {

        label =
            "Very strong";

        description =
            "Excellent password strength.";
    } else if (
        score >= 6
    ) {

        label =
            "Strong";

        description =
            "Good password. Adding more length can make it even stronger.";
    } else if (
        score >= 4
    ) {

        label =
            "Moderate";

        description =
            "Add uppercase letters, numbers, symbols or more characters.";
    }

    return {
        score,
        label,
        description
    };
}


function updatePasswordStrength() {

    if (
        !passwordInput
    ) {

        return;
    }

    const result =
        calculatePasswordStrength(
            passwordInput.value
        );

    if (
        passwordStrengthLabel
    ) {

        passwordStrengthLabel.textContent =
            result.label;
    }

    if (
        strengthDescription
    ) {

        strengthDescription.textContent =
            result.description;
    }

    if (
        strengthVolume
    ) {

        const segments =
            strengthVolume.querySelectorAll(
                "span"
            );

        segments.forEach(
            (segment, index) => {

                segment.classList.toggle(
                    "active",
                    index <
                        result.score
                );
            }
        );
    }
}


/* =========================================================
   PASSWORD MATCH
========================================================= */

function updatePasswordMatch() {

    if (
        !passwordMatch ||
        !repeatPasswordInput
    ) {

        return;
    }

    const password =
        passwordInput?.value || "";

    const repeat =
        repeatPasswordInput.value;

    passwordMatch.className =
        "password-match";

    if (!repeat) {

        passwordMatch.textContent =
            "";

        return;
    }

    if (
        password === repeat
    ) {

        passwordMatch.classList.add(
            "valid"
        );

        passwordMatch.textContent =
            "Passwords match.";

    } else {

        passwordMatch.classList.add(
            "invalid"
        );

        passwordMatch.textContent =
            "Passwords do not match.";
    }
}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function setupPasswordToggle(
    button,
    input
) {

    if (
        !button ||
        !input
    ) {

        return;
    }

    button.addEventListener(
        "click",
        () => {

            const showing =
                input.type ===
                "text";

            input.type =
                showing
                    ? "password"
                    : "text";

            button.textContent =
                showing
                    ? "Show"
                    : "Hide";

            button.setAttribute(
                "aria-label",
                showing
                    ? "Show password"
                    : "Hide password"
            );

            button.setAttribute(
                "aria-pressed",
                String(!showing)
            );
        }
    );
}


/* =========================================================
   PROGRESS UI
========================================================= */

function updateProgress(
    step
) {

    if (
        !registrationProgress
    ) {

        return;
    }

    const steps =
        registrationProgress.querySelectorAll(
            ".progress-step"
        );

    steps.forEach(
        item => {

            const number =
                Number(
                    item.dataset.step
                );

            item.classList.toggle(
                "active",
                number === step
            );

            item.classList.toggle(
                "completed",
                number < step
            );
        }
    );
}


/* =========================================================
   VIEW MANAGEMENT
========================================================= */

function showRegistrationStep() {

    verificationOnlyMode =
        false;

    registrationStep?.classList.remove(
        "hidden"
    );

    otpStep?.classList.add(
        "hidden"
    );

    registrationSuccess?.classList.add(
        "hidden"
    );

    updateProgress(1);

    clearMessage();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function showOtpStep(
    message = ""
) {

    registrationStep?.classList.add(
        "hidden"
    );

    otpStep?.classList.remove(
        "hidden"
    );

    registrationSuccess?.classList.add(
        "hidden"
    );

    updateProgress(2);

    if (
        emailInput &&
        !verificationEmail
    ) {

        verificationEmail =
            normalizeEmail(
                emailInput.value
            );
    }

    if (
        otpEmail
    ) {

        otpEmail.textContent =
            verificationEmail ||
            "your email address";
    }

    if (
        otpCodeInput
    ) {

        otpCodeInput.value =
            "";

        setTimeout(
            () => {
                otpCodeInput.focus();
            },
            100
        );
    }

    startOtpCountdown();

    startResendCooldown();

    if (message) {

        showMessage(
            message,
            "success"
        );
    } else {

        clearMessage();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function showSuccess(
    data = {}
) {

    registrationStep?.classList.add(
        "hidden"
    );

    otpStep?.classList.add(
        "hidden"
    );

    registrationSuccess?.classList.remove(
        "hidden"
    );

    updateProgress(2);

    clearPendingVerificationEmail();

    stopOtpCountdown();

    stopResendCooldown();

    const authenticated =
        data.authenticated === true ||
        data.loggedIn === true ||
        data.sessionCreated === true;

    if (
        authenticated
    ) {

        setTimeout(
            () => {
                window.location.assign(
                    PORTAL_URL
                );
            },
            900
        );
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   OTP COUNTDOWN
========================================================= */

function startOtpCountdown(
    seconds = OTP_EXPIRY_SECONDS
) {

    stopOtpCountdown();

    otpExpiresAt =
        Date.now() +
        seconds * 1000;

    updateOtpCountdown();

    countdownTimer =
        window.setInterval(
            updateOtpCountdown,
            1000
        );
}


function updateOtpCountdown() {

    if (
        !otpCountdown
    ) {

        return;
    }

    const remaining =
        Math.max(
            0,
            otpExpiresAt -
                Date.now()
        );

    const seconds =
        Math.ceil(
            remaining / 1000
        );

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remainder =
        seconds % 60;

    otpCountdown.textContent =
        `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;

    if (
        otpTimer
    ) {

        otpTimer.classList.toggle(
            "expired",
            seconds <= 0
        );
    }

    if (
        seconds <= 0
    ) {

        stopOtpCountdown();

        if (
            otpTimer
        ) {

            otpTimer.classList.add(
                "expired"
            );
        }

        if (
            resendStatus
        ) {

            resendStatus.textContent =
                "Your verification code has expired. Request a new code.";
        }
    }
}


function stopOtpCountdown() {

    if (
        countdownTimer
    ) {

        clearInterval(
            countdownTimer
        );

        countdownTimer =
            null;
    }
}


/* =========================================================
   RESEND COOLDOWN
========================================================= */

function startResendCooldown(
    seconds = RESEND_COOLDOWN_SECONDS
) {

    stopResendCooldown();

    resendAvailableAt =
        Date.now() +
        seconds * 1000;

    if (
        resendOtpButton
    ) {

        resendOtpButton.disabled =
            true;
    }

    updateResendCooldown();

    resendTimer =
        window.setInterval(
            updateResendCooldown,
            1000
        );
}


function updateResendCooldown() {

    const remaining =
        Math.max(
            0,
            resendAvailableAt -
                Date.now()
        );

    const seconds =
        Math.ceil(
            remaining / 1000
        );

    if (
        resendStatus
    ) {

        if (
            seconds > 0
        ) {

            resendStatus.textContent =
                `You can request another code in ${seconds}s.`;

        } else {

            resendStatus.textContent =
                "You can request another verification code.";
        }
    }

    if (
        resendOtpButton
    ) {

        resendOtpButton.disabled =
            seconds > 0 ||
            resendInProgress ||
            !verificationEmail;
    }

    if (
        seconds <= 0
    ) {

        stopResendCooldown();
    }
}


function stopResendCooldown() {

    if (
        resendTimer
    ) {

        clearInterval(
            resendTimer
        );

        resendTimer =
            null;
    }

    if (
        resendOtpButton &&
        !resendInProgress &&
        verificationEmail
    ) {

        resendOtpButton.disabled =
            false;
    }
}


/* =========================================================
   REGISTRATION
========================================================= */

async function submitRegistration() {

    if (
        registrationInProgress
    ) {

        return;
    }

    clearMessage();

    const data =
        collectRegistrationData();

    const errors =
        validateRegistration(
            data
        );

    if (
        errors.length
    ) {

        showMessage(
            errors[0],
            "error"
        );

        return;
    }

    registrationInProgress =
        true;

    setButtonLoading(
        registerButton,
        true,
        "Creating account..."
    );

    try {

        const response =
            await fetch(
                REGISTER_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    credentials: "same-origin",

                    body:
                        JSON.stringify(
                            data
                        )
                }
            );

        const result =
            await readResponse(
                response
            );

        const apiData =
            getApiData(
                result
            );

        if (
            isDuplicateResponse(
                result,
                response.status
            )
        ) {

            const message =
                getApiMessage(
                    result,
                    "An account with these details already exists."
                );

            showMessage(
                message +
                    " If you already registered, please sign in instead.",
                "error"
            );

            return;
        }

        if (
            !response.ok
        ) {

            throw new Error(
                getApiMessage(
                    result,
                    "We could not create your installer account. Please try again."
                )
            );
        }

        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                getApiMessage(
                    result,
                    "Registration could not be completed."
                )
            );
        }

        registrationData =
            apiData;

        verificationEmail =
            normalizeEmail(
                data.email
            );

        savePendingVerificationEmail(
            verificationEmail
        );

        const verificationSent =
            apiData.verificationSent !== false &&
            result.verificationSent !== false;

        if (
            !verificationSent
        ) {

            showMessage(
                "Your account was created, but the verification email could not be confirmed as sent. Please use Resend code.",
                "error"
            );
        }

        showOtpStep(
            verificationSent
                ? "Your installer account has been created. Check your email for the verification code."
                : ""
        );

    } catch (error) {

        console.error(
            "Installer registration error:",
            error
        );

        showMessage(
            error.message ||
                "Registration failed. Please try again.",
            "error"
        );

    } finally {

        registrationInProgress =
            false;

        setButtonLoading(
            registerButton,
            false
        );
    }
}


/* =========================================================
   OTP VERIFICATION
========================================================= */

async function verifyOtp() {

    if (
        verificationInProgress
    ) {

        return;
    }

    const code =
        String(
            otpCodeInput?.value || ""
        )
            .replace(
                /\D/g,
                ""
            )
            .slice(
                0,
                OTP_LENGTH
            );

    if (
        !verificationEmail
    ) {

        showMessage(
            "We could not determine the email address being verified. Please return to registration or sign in again.",
            "error"
        );

        return;
    }

    if (
        !isValidEmail(
            verificationEmail
        )
    ) {

        showMessage(
            "The verification email address is invalid. Please enter your email address again.",
            "error"
        );

        return;
    }

    if (
        code.length !== OTP_LENGTH
    ) {

        showMessage(
            "Enter the 6-digit verification code sent to your email.",
            "error"
        );

        otpCodeInput?.focus();

        return;
    }

    verificationInProgress =
        true;

    setButtonLoading(
        verifyOtpButton,
        true,
        "Verifying..."
    );

    clearMessage();

    try {

        const response =
            await fetch(
                VERIFY_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    credentials: "same-origin",

                    body:
                        JSON.stringify({
                            email:
                                verificationEmail,

                            code
                        })
                }
            );

        const result =
            await readResponse(
                response
            );

        const apiData =
            getApiData(
                result
            );

        if (
            !response.ok
        ) {

            throw new Error(
                getApiMessage(
                    result,
                    "The verification code could not be accepted."
                )
            );
        }

        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                getApiMessage(
                    result,
                    "The verification code could not be accepted."
                )
            );
        }

        /*
         * If the backend ever returns a token/session
         * as part of verification, preserve it.
         *
         * Otherwise verification remains separate
         * from authentication.
         */

        const token =
            apiData.token ||
            apiData.accessToken ||
            result.token ||
            result.accessToken;

        if (
            token
        ) {

            try {

                localStorage.setItem(
                    TOKEN_KEY,
                    token
                );

                localStorage.setItem(
                    ACCESS_TOKEN_KEY,
                    token
                );

            } catch (error) {

                console.warn(
                    "Unable to persist authentication token:",
                    error
                );
            }
        }

        const user =
            apiData.user ||
            result.user;

        if (
            user
        ) {

            try {

                localStorage.setItem(
                    USER_KEY,
                    JSON.stringify(
                        user
                    )
                );

            } catch (error) {

                console.warn(
                    "Unable to persist user:",
                    error
                );
            }
        }

        showSuccess(
            apiData
        );

    } catch (error) {

        console.error(
            "Email verification error:",
            error
        );

        showMessage(
            error.message ||
                "Verification failed. Please check the code and try again.",
            "error"
        );

        if (
            otpCodeInput
        ) {

            otpCodeInput.focus();

            otpCodeInput.select();
        }

    } finally {

        verificationInProgress =
            false;

        setButtonLoading(
            verifyOtpButton,
            false
        );
    }
}


/* =========================================================
   RESEND OTP
========================================================= */

async function resendOtp() {

    if (
        resendInProgress
    ) {

        return;
    }

    if (
        !verificationEmail
    ) {

        showMessage(
            "Enter the email address associated with your installer account before requesting a new code.",
            "error"
        );

        return;
    }

    if (
        Date.now() <
        resendAvailableAt
    ) {

        updateResendCooldown();

        return;
    }

    resendInProgress =
        true;

    if (
        resendOtpButton
    ) {

        resendOtpButton.disabled =
            true;

        resendOtpButton.setAttribute(
            "aria-busy",
            "true"
        );
    }

    clearMessage();

    try {

        const response =
            await fetch(
                RESEND_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    credentials: "same-origin",

                    body:
                        JSON.stringify({
                            email:
                                verificationEmail
                        })
                }
            );

        const result =
            await readResponse(
                response
            );

        if (
            !response.ok
        ) {

            throw new Error(
                getApiMessage(
                    result,
                    "We could not send a new verification code."
                )
            );
        }

        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                getApiMessage(
                    result,
                    "We could not send a new verification code."
                )
            );
        }

        savePendingVerificationEmail(
            verificationEmail
        );

        startOtpCountdown();

        startResendCooldown();

        if (
            otpCodeInput
        ) {

            otpCodeInput.value =
                "";

            otpCodeInput.focus();
        }

        showMessage(
            getApiMessage(
                result,
                "A new verification code has been sent to your email."
            ),
            "success"
        );

    } catch (error) {

        console.error(
            "Resend verification error:",
            error
        );

        showMessage(
            error.message ||
                "Unable to resend the verification code.",
            "error"
        );

        if (
            resendOtpButton
        ) {

            resendOtpButton.disabled =
                false;
        }

    } finally {

        resendInProgress =
            false;

        if (
            resendOtpButton
        ) {

            resendOtpButton.removeAttribute(
                "aria-busy"
            );
        }

        updateResendCooldown();
    }
}


/* =========================================================
   RECOVERY / VERIFY-ONLY MODE
========================================================= */

function initializeVerificationOnlyMode() {

    verificationOnlyMode =
        isVerificationMode();

    if (
        !verificationOnlyMode
    ) {

        return;
    }

    verificationEmail =
        getPendingVerificationEmail();

    /*
     * The OTP itself is deliberately NOT stored.
     *
     * Only the pending email address is recovered.
     */

    if (
        !verificationEmail
    ) {

        showRegistrationStep();

        showMessage(
            "No pending email verification was found. Please register an account first or sign in to request a new verification code.",
            "error"
        );

        return;
    }

    /*
     * We already have the email from login.js,
     * and login.js already requested the new OTP.
     *
     * Therefore:
     * DO NOT automatically call resendOtp()
     * here.
     */

    if (
        emailInput
    ) {

        emailInput.value =
            verificationEmail;
    }

    showOtpStep();

    if (
        resendStatus
    ) {

        resendStatus.textContent =
            "Enter the verification code sent to your email.";
    }
}


/* =========================================================
   CHANGE EMAIL
========================================================= */

function handleChangeEmail() {

    stopOtpCountdown();

    stopResendCooldown();

    clearPendingVerificationEmail();

    verificationEmail =
        "";

    verificationOnlyMode =
        false;

    if (
        emailInput
    ) {

        emailInput.value =
            "";
    }

    if (
        otpCodeInput
    ) {

        otpCodeInput.value =
            "";
    }

    showRegistrationStep();

    if (
        emailInput
    ) {

        setTimeout(
            () => {

                emailInput.focus();

            },
            100
        );
    }
}


/* =========================================================
   OTP INPUT
========================================================= */

function setupOtpInput() {

    if (
        !otpCodeInput
    ) {

        return;
    }

    otpCodeInput.addEventListener(
        "input",
        () => {

            otpCodeInput.value =
                otpCodeInput.value
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        OTP_LENGTH
                    );
        }
    );

    otpCodeInput.addEventListener(
        "paste",
        event => {

            event.preventDefault();

            const text =
                event.clipboardData
                    ?.getData(
                        "text"
                    ) || "";

            otpCodeInput.value =
                text
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        OTP_LENGTH
                    );

            if (
                otpCodeInput.value.length ===
                OTP_LENGTH
            ) {

                otpForm?.requestSubmit();
            }
        }
    );
}


/* =========================================================
   FORM EVENTS
========================================================= */

function setupEvents() {

    registrationForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            submitRegistration();
        }
    );

    otpForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            verifyOtp();
        }
    );

    resendOtpButton?.addEventListener(
        "click",
        () => {

            resendOtp();
        }
    );

    changeEmailButton?.addEventListener(
        "click",
        () => {

            handleChangeEmail();
        }
    );

    passwordInput?.addEventListener(
        "input",
        () => {

            updatePasswordStrength();
            updatePasswordMatch();
        }
    );

    repeatPasswordInput?.addEventListener(
        "input",
        () => {

            updatePasswordMatch();
        }
    );

    emailInput?.addEventListener(
        "input",
        () => {

            if (
                !verificationOnlyMode
            ) {

                verificationEmail =
                    normalizeEmail(
                        emailInput.value
                    );
            }
        }
    );

    portalButton?.addEventListener(
        "click",
        () => {

            clearPendingVerificationEmail();
        }
    );
}


/* =========================================================
   AUTOFILL / UX
========================================================= */

function setupInputBehavior() {

    const inputs =
        document.querySelectorAll(
            "input, textarea, select"
        );

    inputs.forEach(
        input => {

            input.addEventListener(
                "input",
                () => {

                    input.classList.remove(
                        "field-error"
                    );
                }
            );

            input.addEventListener(
                "change",
                () => {

                    input.classList.remove(
                        "field-error"
                    );
                }
            );
        }
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

function initialize() {

    setupSpecialization();

    setupPasswordToggle(
        togglePassword,
        passwordInput
    );

    setupPasswordToggle(
        toggleRepeatPassword,
        repeatPasswordInput
    );

    setupOtpInput();

    setupEvents();

    setupInputBehavior();

    updatePasswordStrength();

    updatePasswordMatch();

    initializeVerificationOnlyMode();

    /*
     * Normal registration mode:
     * restore a pending email only as a convenience.
     *
     * Verify-only mode is handled above.
     */

    if (
        !verificationOnlyMode
    ) {

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
    }

    /*
     * If the backend/frontend already authenticated
     * the installer, make the portal action explicit.
     */
    if (
        portalButton
    ) {

        portalButton.href =
            PORTAL_URL;
    }
}


/* =========================================================
   PAGE LIFECYCLE
========================================================= */

window.addEventListener(
    "pagehide",
    () => {

        stopOtpCountdown();

        stopResendCooldown();
    }
);


document.addEventListener(
    "DOMContentLoaded",
    initialize
);