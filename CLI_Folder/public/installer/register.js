"use strict";

/*
=========================================================
AE RENEWABLE NETWORK
INSTALLER REGISTRATION
register.js
=========================================================
*/

const API_BASE = "/api";

const ENDPOINTS = {
    register: `${API_BASE}/auth/register-installer`,
    login: "/installer/login.html"
};


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(message, type = "error") {
    const container = $("messageContainer");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const messageElement =
        document.createElement("div");

    messageElement.className =
        `message ${type}`;

    messageElement.textContent =
        message;

    container.appendChild(
        messageElement
    );
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(button, loading) {
    if (!button) {
        return;
    }

    if (loading) {
        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Submitting Registration...";
    } else {
        button.disabled = false;

        button.textContent =
            button.dataset.originalText ||
            "Register";
    }
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    url,
    options = {}
) {
    const response =
        await fetch(
            url,
            {
                credentials: "include",

                ...options,

                headers: {
                    Accept:
                        "application/json",

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );

    let payload = null;

    try {
        payload =
            await response.json();
    } catch {
        payload = null;
    }

    if (!response.ok) {
        const error =
            new Error(
                payload?.message ||
                `Request failed with status ${response.status}.`
            );

        error.status =
            response.status;

        error.payload =
            payload;

        throw error;
    }

    return payload;
}


/* =========================================================
   FORM VALIDATION
========================================================= */

function validateRegistration(data) {

    if (!data.email) {
        return "Email address is required.";
    }

    if (!data.password) {
        return "Password is required.";
    }

    if (data.password.length < 8) {
        return "Password must contain at least 8 characters.";
    }

    if (!data.firstName) {
        return "First name is required.";
    }

    if (!data.lastName) {
        return "Last name is required.";
    }

    if (!data.phone) {
        return "Phone number is required.";
    }

    if (!data.companyName) {
        return "Company name is required.";
    }

    if (!data.contactName) {
        return "Contact name is required.";
    }

    if (!data.rcNumber) {
        return "RC number is required.";
    }

    if (!data.address) {
        return "Address is required.";
    }

    if (!data.city) {
        return "City is required.";
    }

    if (!data.state) {
        return "State is required.";
    }

    if (!data.localGovernment) {
        return "Local Government is required.";
    }

    return null;
}


/* =========================================================
   COLLECT FORM DATA
========================================================= */

function collectFormData() {

    return {

        firstName:
            $("firstName")
                ?.value
                .trim(),

        lastName:
            $("lastName")
                ?.value
                .trim(),

        email:
            $("email")
                ?.value
                .trim(),

        password:
            $("password")
                ?.value,

        phone:
            $("phone")
                ?.value
                .trim(),

        companyName:
            $("companyName")
                ?.value
                .trim(),

        contactName:
            $("contactName")
                ?.value
                .trim(),

        rcNumber:
            $("rcNumber")
                ?.value
                .trim(),

        address:
            $("address")
                ?.value
                .trim(),

        city:
            $("city")
                ?.value
                .trim(),

        state:
            $("state")
                ?.value
                .trim(),

        localGovernment:
            $("localGovernment")
                ?.value
                .trim(),

        country:
            $("country")
                ?.value
                .trim() ||
            "Nigeria",

        bankName:
            $("bankName")
                ?.value
                .trim(),

        accountName:
            $("accountName")
                ?.value
                .trim(),

        accountNumber:
            $("accountNumber")
                ?.value
                .trim()
    };
}


/* =========================================================
   INSTALLER REGISTRATION
========================================================= */

async function handleRegistration(event) {

    event.preventDefault();

    const form =
        event.currentTarget;

    const button =
        $("registerButton");

    if (!form || !button) {
        return;
    }

    const data =
        collectFormData();

    const validationError =
        validateRegistration(data);

    if (validationError) {
        showMessage(
            validationError,
            "error"
        );

        return;
    }

    setButtonLoading(
        button,
        true
    );

    try {

        const response =
            await apiRequest(
                ENDPOINTS.register,
                {
                    method: "POST",
                    body:
                        JSON.stringify(data)
                }
            );

        if (
            !response ||
            response.success !== true
        ) {
            throw new Error(
                response?.message ||
                "Registration failed."
            );
        }

        showMessage(
            response.message ||
            "Installer registration submitted successfully.",
            "success"
        );

        form.reset();

        /*
         * Give the user a moment to see
         * the success message before redirecting.
         */

        window.setTimeout(
            () => {
                window.location.href =
                    ENDPOINTS.login;
            },
            1800
        );

    } catch (error) {

        console.error(
            "Installer registration error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to submit installer registration.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false
        );
    }
}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function initializePasswordToggle() {

    const password =
        $("password");

    const toggle =
        $("togglePassword");

    if (!password || !toggle) {
        return;
    }

    toggle.addEventListener(
        "click",
        () => {

            const isPassword =
                password.type === "password";

            password.type =
                isPassword
                    ? "text"
                    : "password";

            toggle.textContent =
                isPassword
                    ? "Hide"
                    : "Show";
        }
    );
}


/* =========================================================
   LOGIN LINK
========================================================= */

function initializeLoginLinks() {

    document
        .querySelectorAll(
            "[data-login-link]"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    window.location.href =
                        ENDPOINTS.login;
                }
            );
        });
}


/* =========================================================
   FORM INITIALIZATION
========================================================= */

function initializeRegistration() {

    const form =
        $("registrationForm");

    if (!form) {

        console.error(
            "Registration form #registrationForm was not found."
        );

        return;
    }

    form.addEventListener(
        "submit",
        handleRegistration
    );

    initializePasswordToggle();

    initializeLoginLinks();

    console.log(
        "AE Renewable installer registration initialized."
    );
}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeRegistration
    );

} else {

    initializeRegistration();
}