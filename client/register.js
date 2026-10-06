"use strict";


/* =========================================================
   AE RENEWABLE NETWORK
   CLIENT REGISTRATION ENGINE
========================================================= */


/* =========================================================
   API CONFIGURATION
========================================================= */

const CLIENT_REGISTER_API =
    "/api/auth/register-client";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const registerForm =
    document.getElementById(
        "clientRegisterForm"
    );

const registerAlert =
    document.getElementById(
        "registerAlert"
    );

const registerButton =
    document.getElementById(
        "registerButton"
    );

const buttonText =
    registerButton
        ? registerButton.querySelector(
            ".button-text"
        )
        : null;

const buttonLoader =
    registerButton
        ? registerButton.querySelector(
            ".button-loader"
        )
        : null;

const buttonArrow =
    registerButton
        ? registerButton.querySelector(
            ".button-arrow"
        )
        : null;

const clientType =
    document.getElementById(
        "clientType"
    );

const businessFields =
    document.getElementById(
        "businessFields"
    );

const companyName =
    document.getElementById(
        "companyName"
    );

const registrationNumber =
    document.getElementById(
        "registrationNumber"
    );

const password =
    document.getElementById(
        "password"
    );

const confirmPassword =
    document.getElementById(
        "confirmPassword"
    );

const passwordStrength =
    document.getElementById(
        "passwordStrength"
    );

const passwordHint =
    document.getElementById(
        "passwordHint"
    );

const currentYear =
    document.getElementById(
        "currentYear"
    );


/* =========================================================
   INITIALIZE YEAR
========================================================= */

if (currentYear) {

    currentYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   SHOW / HIDE ALERT
========================================================= */

function showAlert(
    message,
    type = "error"
) {

    if (!registerAlert) {
        return;
    }

    registerAlert.hidden = false;

    registerAlert.className =
        `auth-alert ${type}`;

    registerAlert.textContent =
        message;

}


function hideAlert() {

    if (!registerAlert) {
        return;
    }

    registerAlert.hidden = true;

    registerAlert.textContent = "";

    registerAlert.className =
        "auth-alert";

}


/* =========================================================
   FIELD ERROR HANDLING
========================================================= */

function setFieldError(
    fieldId,
    message
) {

    const errorElement =
        document.getElementById(
            `${fieldId}Error`
        );

    const field =
        document.getElementById(
            fieldId
        );


    if (errorElement) {

        errorElement.textContent =
            message || "";

    }


    if (field) {

        if (message) {

            field.classList.add(
                "input-error"
            );

            field.setAttribute(
                "aria-invalid",
                "true"
            );

        } else {

            field.classList.remove(
                "input-error"
            );

            field.removeAttribute(
                "aria-invalid"
            );

        }

    }

}


function clearFieldErrors() {

    const errorElements =
        document.querySelectorAll(
            ".field-error"
        );

    errorElements.forEach(
        element => {
            element.textContent = "";
        }
    );


    const invalidFields =
        document.querySelectorAll(
            ".input-error"
        );

    invalidFields.forEach(
        field => {

            field.classList.remove(
                "input-error"
            );

            field.removeAttribute(
                "aria-invalid"
            );

        }
    );

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function setupPasswordToggles() {

    const toggleButtons =
        document.querySelectorAll(
            ".password-toggle"
        );


    toggleButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset.target;

                    const target =
                        document.getElementById(
                            targetId
                        );

                    if (!target) {
                        return;
                    }


                    if (
                        target.type ===
                        "password"
                    ) {

                        target.type =
                            "text";

                        button.textContent =
                            "HIDE";

                        button.setAttribute(
                            "aria-label",
                            "Hide password"
                        );

                    } else {

                        target.type =
                            "password";

                        button.textContent =
                            "SHOW";

                        button.setAttribute(
                            "aria-label",
                            "Show password"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

function calculatePasswordStrength(
    value
) {

    let score = 0;


    if (value.length >= 8) {
        score++;
    }


    if (/[a-z]/.test(value)) {
        score++;
    }


    if (/[A-Z]/.test(value)) {
        score++;
    }


    if (
        /[0-9]/.test(value) ||
        /[^A-Za-z0-9]/.test(value)
    ) {
        score++;
    }


    return score;

}


function updatePasswordStrength() {

    if (!password) {
        return;
    }

    const value =
        password.value;

    const score =
        calculatePasswordStrength(
            value
        );


    if (passwordStrength) {

        const bars =
            passwordStrength.querySelectorAll(
                "span"
            );


        bars.forEach(
            (bar, index) => {

                bar.classList.remove(
                    "active"
                );

                if (
                    index < score
                ) {

                    bar.classList.add(
                        "active"
                    );

                }

            }
        );

    }


    if (passwordHint) {

        if (!value) {

            passwordHint.textContent =
                "Use at least 8 characters.";

        } else if (score === 1) {

            passwordHint.textContent =
                "Weak password.";

        } else if (score === 2) {

            passwordHint.textContent =
                "Fair password.";

        } else if (score === 3) {

            passwordHint.textContent =
                "Good password.";

        } else {

            passwordHint.textContent =
                "Strong password.";

        }

    }

}


/* =========================================================
   BUSINESS FIELD VISIBILITY
========================================================= */

function updateBusinessFields() {

    if (
        !clientType ||
        !businessFields
    ) {
        return;
    }


    const selectedType =
        clientType.value;


    const requiresBusinessInformation =
        selectedType !== "" &&
        selectedType !== "individual";


    businessFields.hidden =
        !requiresBusinessInformation;


    if (
        companyName
    ) {

        companyName.required =
            requiresBusinessInformation;

    }

}


/* =========================================================
   BASIC EMAIL VALIDATION
========================================================= */

function isValidEmail(
    email
) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(
        email
    );

}


/* =========================================================
   FORM VALIDATION
========================================================= */

function validateForm() {

    clearFieldErrors();

    hideAlert();


    if (!registerForm) {
        return false;
    }


    const firstName =
        document.getElementById(
            "firstName"
        ).value.trim();

    const lastName =
        document.getElementById(
            "lastName"
        ).value.trim();

    const email =
        document.getElementById(
            "email"
        ).value.trim()
        .toLowerCase();

    const phone =
        document.getElementById(
            "phone"
        ).value.trim();

    const selectedClientType =
        clientType
            ? clientType.value
            : "";

    const passwordValue =
        password
            ? password.value
            : "";

    const confirmPasswordValue =
        confirmPassword
            ? confirmPassword.value
            : "";

    const terms =
        document.getElementById(
            "terms"
        );


    let valid = true;


    /* =====================================================
       FIRST NAME
    ===================================================== */

    if (!firstName) {

        setFieldError(
            "firstName",
            "First name is required."
        );

        valid = false;

    }


    /* =====================================================
       LAST NAME
    ===================================================== */

    if (!lastName) {

        setFieldError(
            "lastName",
            "Last name is required."
        );

        valid = false;

    }


    /* =====================================================
       EMAIL
    ===================================================== */

    if (!email) {

        setFieldError(
            "email",
            "Email address is required."
        );

        valid = false;

    } else if (!isValidEmail(email)) {

        setFieldError(
            "email",
            "Please enter a valid email address."
        );

        valid = false;

    }


    /* =====================================================
       PHONE
    ===================================================== */

    if (!phone) {

        setFieldError(
            "phone",
            "Phone number is required."
        );

        valid = false;

    }


    /* =====================================================
       PASSWORD
    ===================================================== */

    if (!passwordValue) {

        setFieldError(
            "password",
            "Password is required."
        );

        valid = false;

    } else if (
        passwordValue.length < 8
    ) {

        setFieldError(
            "password",
            "Password must contain at least 8 characters."
        );

        valid = false;

    }


    /* =====================================================
       CONFIRM PASSWORD
    ===================================================== */

    if (!confirmPasswordValue) {

        setFieldError(
            "confirmPassword",
            "Please confirm your password."
        );

        valid = false;

    } else if (
        passwordValue !==
        confirmPasswordValue
    ) {

        setFieldError(
            "confirmPassword",
            "Passwords do not match."
        );

        valid = false;

    }


    /* =====================================================
       CLIENT TYPE
    ===================================================== */

    if (!selectedClientType) {

        setFieldError(
            "clientType",
            "Please select an account type."
        );

        valid = false;

    }


    /* =====================================================
       BUSINESS INFORMATION
    ===================================================== */

    if (
        selectedClientType !==
        "individual"
    ) {

        const companyValue =
            companyName
                ? companyName.value.trim()
                : "";


        if (!companyValue) {

            setFieldError(
                "companyName",
                "Company or organization name is required."
            );

            valid = false;

        }

    }


    /* =====================================================
       TERMS
    ===================================================== */

    if (
        !terms ||
        !terms.checked
    ) {

        setFieldError(
            "terms",
            "You must accept the Terms of Service and Privacy Policy."
        );

        valid = false;

    }


    if (!valid) {

        showAlert(
            "Please review the highlighted fields and correct the errors."
        );

    }


    return valid;

}


/* =========================================================
   BUTTON LOADING STATE
========================================================= */

function setLoading(
    loading
) {

    if (!registerButton) {
        return;
    }


    registerButton.disabled =
        loading;


    if (buttonText) {

        buttonText.hidden =
            loading;

    }


    if (buttonLoader) {

        buttonLoader.hidden =
            !loading;

    }


    if (buttonArrow) {

        buttonArrow.hidden =
            loading;

    }

}


/* =========================================================
   COLLECT FORM DATA
========================================================= */

function collectFormData() {

    const firstName =
        document.getElementById(
            "firstName"
        ).value.trim();

    const lastName =
        document.getElementById(
            "lastName"
        ).value.trim();

    const email =
        document.getElementById(
            "email"
        ).value.trim()
        .toLowerCase();

    const phone =
        document.getElementById(
            "phone"
        ).value.trim();

    const passwordValue =
        password.value;

    const selectedClientType =
        clientType.value;

    const companyValue =
        companyName
            ? companyName.value.trim()
            : "";

    const registrationValue =
        registrationNumber
            ? registrationNumber.value.trim()
            : "";


    return {

        firstName,

        lastName,

        email,

        phone,

        password:
            passwordValue,

        clientType:
            selectedClientType,

        companyName:
            companyValue || null,

        registrationNumber:
            registrationValue || null,

        country:
            "Nigeria"

    };

}


/* =========================================================
   REGISTER CLIENT
========================================================= */

async function registerClient() {

    if (!validateForm()) {
        return;
    }


    const payload =
        collectFormData();


    setLoading(true);

    hideAlert();


    try {

        const response =
            await fetch(
                CLIENT_REGISTER_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch (jsonError) {

            result = null;

        }


        if (!response.ok) {

            const message =
                result &&
                result.message
                    ? result.message
                    : "Registration failed. Please try again.";


            throw new Error(
                message
            );

        }


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Registration could not be completed."
            );

        }


        /* =================================================
           SUCCESS
        ================================================== */

        showAlert(
            "Your client account has been created successfully. Redirecting to the Client Portal...",
            "success"
        );


        registerForm.reset();

        updateBusinessFields();

        updatePasswordStrength();


        /*
         * Store the returned client information
         * for the next frontend stage.
         */

        if (
            result.data &&
            result.data.client
        ) {

            try {

                sessionStorage.setItem(
                    "aeRenewableClient",
                    JSON.stringify(
                        result.data.client
                    )
                );

            } catch (storageError) {

                console.warn(
                    "Client session storage unavailable.",
                    storageError
                );

            }

        }


        /*
         * Redirect after successful registration.
         *
         * The client login route will be added
         * to server.js before final testing.
         */

        setTimeout(
            () => {

                window.location.href =
                    "/client/login";

            },
            1500
        );


    } catch (error) {

        console.error(
            "Client registration error:",
            error
        );


        showAlert(
            error.message ||
            "Unable to create your account. Please try again."
        );


    } finally {

        setLoading(false);

    }

}


/* =========================================================
   FORM SUBMISSION
========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            registerClient();

        }
    );

}


/* =========================================================
   CLIENT TYPE CHANGE
========================================================= */

if (clientType) {

    clientType.addEventListener(
        "change",
        updateBusinessFields
    );

}


/* =========================================================
   PASSWORD INPUT
========================================================= */

if (password) {

    password.addEventListener(
        "input",
        updatePasswordStrength
    );

}


/* =========================================================
   CONFIRM PASSWORD INPUT
========================================================= */

if (confirmPassword) {

    confirmPassword.addEventListener(
        "input",
        () => {

            if (
                confirmPassword.value &&
                password.value !==
                confirmPassword.value
            ) {

                setFieldError(
                    "confirmPassword",
                    "Passwords do not match."
                );

            } else {

                setFieldError(
                    "confirmPassword",
                    ""
                );

            }

        }
    );

}


/* =========================================================
   PASSWORD TOGGLE INITIALIZATION
========================================================= */

setupPasswordToggles();


/* =========================================================
   INITIAL UI STATE
========================================================= */

updateBusinessFields();

updatePasswordStrength();


/* =========================================================
   PREVENT DOUBLE SUBMISSION
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            registerButton &&
            registerButton.disabled
        ) {

            registerButton.disabled =
                false;

        }

    }
);