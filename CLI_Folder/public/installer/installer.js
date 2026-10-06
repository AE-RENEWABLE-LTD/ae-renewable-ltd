"use strict";

/*
=========================================================
AE RENEWABLE NETWORK
INSTALLER PORTAL
installer.js
=========================================================
*/

/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE = "/api";

const ENDPOINTS = {
    installer: `${API_BASE}/installers/me`,
    login: "/installer/login.html"
};


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {
    installer: null,
    loading: false,
    saving: false
};


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}


/* =========================================================
   VALUE HELPERS
========================================================= */

function safeValue(value, fallback = "â€”") {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return fallback;
    }

    return String(value);
}


function firstValue(...values) {
    for (const value of values) {
        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return null;
}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(value) {
    if (!value) {
        return "â€”";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return safeValue(value);
    }

    return new Intl.DateTimeFormat("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}


/* =========================================================
   STATUS FORMATTER
========================================================= */

function formatStatus(value) {
    if (!value) {
        return "Pending";
    }

    return String(value)
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase());
}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(name) {
    if (!name) {
        return "AE";
    }

    const words = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 1) {
        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(message, type = "success") {
    const container = $("messageContainer");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const element =
        document.createElement("div");

    element.className =
        `message ${type}`;

    element.textContent =
        message;

    container.appendChild(element);

    window.clearTimeout(
        showMessage.timeout
    );

    showMessage.timeout =
        window.setTimeout(() => {
            element.remove();
        }, 5000);
}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {
    state.loading = true;

    $("loadingState")
        ?.classList
        .remove("hidden");

    $("portalContent")
        ?.classList
        .add("hidden");
}


function hideLoading() {
    state.loading = false;

    $("loadingState")
        ?.classList
        .add("hidden");

    $("portalContent")
        ?.classList
        .remove("hidden");
}


/* =========================================================
   AUTH OVERLAY
========================================================= */

function showAuthOverlay(message) {
    const overlay =
        $("authOverlay");

    if (!overlay) {
        return;
    }

    if ($("authMessage")) {
        $("authMessage").textContent =
            message ||
            "Your installer session is unavailable.";
    }

    overlay.classList.remove("hidden");
}


function hideAuthOverlay() {
    $("authOverlay")
        ?.classList
        .add("hidden");
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    url,
    options = {}
) {
    const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token");

    const requestOptions = {
        credentials: "include",
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.headers || {})
        }
    };

    /*
     * Attach JWT authentication.
     */

    if (token) {
        requestOptions.headers.Authorization =
            `Bearer ${token}`;
    }

    /*
     * Automatically convert JavaScript objects
     * into JSON request bodies.
     */

    if (
        requestOptions.body &&
        typeof requestOptions.body !== "string"
    ) {
        requestOptions.body =
            JSON.stringify(
                requestOptions.body
            );

        requestOptions.headers[
            "Content-Type"
        ] = "application/json";
    }

    const response =
        await fetch(
            url,
            requestOptions
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
   LOAD CURRENT INSTALLER
========================================================= */

async function loadInstaller() {
    showLoading();

    try {
        const response =
            await apiRequest(
                ENDPOINTS.installer,
                {
                    method: "GET"
                }
            );

        if (
            !response ||
            response.success !== true ||
            !response.data
        ) {
            throw new Error(
                response?.message ||
                "Installer profile could not be loaded."
            );
        }

        state.installer =
            response.data;

        renderInstaller(
            state.installer
        );

        hideLoading();
        hideAuthOverlay();

    } catch (error) {
        console.error(
            "Installer load error:",
            error
        );

        hideLoading();

        if (
            error.status === 401 ||
            error.status === 403
        ) {
            showAuthOverlay(
                "Your installer session has expired or you are not authorized to access this portal."
            );

            return;
        }

        showMessage(
            error.message ||
            "Unable to load installer profile.",
            "error"
        );
    }
}


/* =========================================================
   RENDER INSTALLER
========================================================= */

function renderInstaller(installer) {
    if (!installer) {
        return;
    }

    renderHeader(installer);
    renderDashboard(installer);
    renderProfileForm(installer);
    renderCompanyForm(installer);
    renderVerification(installer);
    renderBankingForm(installer);
}


/* =========================================================
   HEADER
========================================================= */

function renderHeader(installer) {
    const name =
        firstValue(
            installer.contact_name,
            installer.contactName,
            installer.company_name,
            installer.companyName,
            "Installer"
        );

    const code =
        firstValue(
            installer.installer_code,
            installer.installerCode,
            "â€”"
        );

    setText(
        "headerInstallerName",
        name
    );

    setText(
        "headerInstallerCode",
        code
    );

    setText(
        "welcomeName",
        name
    );

    if ($("userAvatar")) {
        $("userAvatar").textContent =
            getInitials(name);
    }
}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard(installer) {
    const verification =
        firstValue(
            installer.verification_status,
            installer.verificationStatus,
            "pending"
        );

    const status =
        firstValue(
            installer.status,
            "pending"
        );

    const code =
        firstValue(
            installer.installer_code,
            installer.installerCode
        );

    const registrationDate =
        firstValue(
            installer.registration_date,
            installer.registrationDate
        );

    const contactName =
        firstValue(
            installer.contact_name,
            installer.contactName
        );

    const email =
        firstValue(
            installer.email,
            installer.user_email
        );

    const phone =
        firstValue(
            installer.phone,
            installer.user_phone
        );

    const company =
        firstValue(
            installer.company_name,
            installer.companyName
        );

    const location = [
        installer.city,
        installer.state
    ]
        .filter(Boolean)
        .join(", ");

    setText(
        "statInstallerCode",
        safeValue(code)
    );

    setText(
        "statVerification",
        formatStatus(verification)
    );

    setText(
        "statStatus",
        formatStatus(status)
    );

    setText(
        "statRegistrationDate",
        formatDate(registrationDate)
    );

    setText(
        "infoContactName",
        safeValue(contactName)
    );

    setText(
        "infoEmail",
        safeValue(email)
    );

    setText(
        "infoPhone",
        safeValue(phone)
    );

    setText(
        "infoLocation",
        safeValue(location)
    );

    setText(
        "infoCompanyName",
        safeValue(company)
    );

    setText(
        "infoRcNumber",
        safeValue(
            firstValue(
                installer.rc_number,
                installer.rcNumber
            )
        )
    );

    setText(
        "infoState",
        safeValue(
            installer.state
        )
    );

    setText(
        "infoLocalGovernment",
        safeValue(
            firstValue(
                installer.local_government,
                installer.localGovernment
            )
        )
    );

    setText(
        "welcomeStatus",
        formatStatus(status)
    );

    renderSpecializations(
        installer.specializations
    );
}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(id, value) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.textContent =
        safeValue(value);
}


/* =========================================================
   SPECIALIZATIONS
========================================================= */

function renderSpecializations(
    specializations
) {
    const container =
        $("specializationsList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(specializations) ||
        specializations.length === 0
    ) {
        const empty =
            document.createElement("span");

        empty.className =
            "empty-state";

        empty.textContent =
            "No specializations added.";

        container.appendChild(empty);

        return;
    }

    specializations.forEach(
        specialization => {
            const tag =
                document.createElement("span");

            tag.className = "tag";

            tag.textContent =
                formatStatus(
                    specialization
                );

            container.appendChild(tag);
        }
    );
}


/* =========================================================
   PROFILE FORM
========================================================= */

function renderProfileForm(installer) {
    setInput(
        "contactName",
        firstValue(
            installer.contact_name,
            installer.contactName
        )
    );

    setInput(
        "installerEmail",
        firstValue(
            installer.email,
            installer.user_email
        )
    );

    setInput(
        "installerPhone",
        firstValue(
            installer.phone,
            installer.user_phone
        )
    );

    setInput(
        "installerCode",
        firstValue(
            installer.installer_code,
            installer.installerCode
        )
    );
}


/* =========================================================
   COMPANY FORM
========================================================= */

function renderCompanyForm(installer) {
    setInput(
        "companyName",
        firstValue(
            installer.company_name,
            installer.companyName
        )
    );

    setInput(
        "rcNumber",
        firstValue(
            installer.rc_number,
            installer.rcNumber
        )
    );

    setInput(
        "companyEmail",
        installer.email
    );

    setInput(
        "companyPhone",
        installer.phone
    );

    setInput(
        "country",
        installer.country ||
        "Nigeria"
    );

    setInput(
        "state",
        installer.state
    );

    setInput(
        "localGovernment",
        firstValue(
            installer.local_government,
            installer.localGovernment
        )
    );

    setInput(
        "city",
        installer.city
    );

    setInput(
        "address",
        installer.address
    );
}


/* =========================================================
   INPUT HELPER
========================================================= */

function setInput(id, value) {
    const element = $(id);

    if (!element) {
        return;
    }

    element.value =
        value === null ||
        value === undefined
            ? ""
            : value;
}


/* =========================================================
   VERIFICATION
========================================================= */

function renderVerification(installer) {
    const verification =
        firstValue(
            installer.verification_status,
            installer.verificationStatus,
            "pending"
        );

    setText(
        "verificationStatus",
        formatStatus(verification)
    );

    setText(
        "verificationRegistrationDate",
        formatDate(
            firstValue(
                installer.registration_date,
                installer.registrationDate
            )
        )
    );

    setText(
        "verificationApprovalDate",
        formatDate(
            firstValue(
                installer.approval_date,
                installer.approvalDate
            )
        )
    );

    configureDocumentLink(
        "cacCertificateLink",
        firstValue(
            installer.cac_certificate_url,
            installer.cacCertificateUrl
        )
    );

    configureDocumentLink(
        "professionalCertificateLink",
        firstValue(
            installer.professional_certificate_url,
            installer.professionalCertificateUrl
        )
    );
}


/* =========================================================
   DOCUMENT LINKS
========================================================= */

function configureDocumentLink(id, url) {
    const element = $(id);

    if (!element) {
        return;
    }

    /*
    Remove previous listeners by replacing
    the element with a clone.
    */

    const fresh =
        element.cloneNode(true);

    element.replaceWith(fresh);

    if (!url) {
        fresh.href = "#";

        fresh.classList.add(
            "disabled"
        );

        fresh.addEventListener(
            "click",
            event => {
                event.preventDefault();

                showMessage(
                    "This document has not been uploaded yet.",
                    "warning"
                );
            }
        );

        return;
    }

    fresh.href = url;

    fresh.classList.remove(
        "disabled"
    );
}


/* =========================================================
   BANKING FORM
========================================================= */

function renderBankingForm(installer) {
    setInput(
        "bankName",
        firstValue(
            installer.bank_name,
            installer.bankName
        )
    );

    setInput(
        "accountName",
        firstValue(
            installer.account_name,
            installer.accountName
        )
    );

    setInput(
        "accountNumber",
        firstValue(
            installer.account_number,
            installer.accountNumber
        )
    );
}


/* =========================================================
   SECTION NAVIGATION
========================================================= */

function navigateToSection(sectionName) {
    if (!sectionName) {
        return;
    }

    const target =
        $(`section-${sectionName}`);

    if (!target) {
        console.warn(
            `Unknown portal section: ${sectionName}`
        );

        return;
    }

    $all(".portal-section")
        .forEach(section => {
            section.classList.remove(
                "active"
            );
        });

    target.classList.add(
        "active"
    );

    /*
    Update navigation buttons.
    */

    $all("[data-section-target]")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.sectionTarget ===
                sectionName
            );
        });

    updatePageTitle(
        sectionName
    );

    closeMobileSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   PAGE TITLES
========================================================= */

function updatePageTitle(sectionName) {
    const titles = {
        dashboard:
            "Installer Dashboard",

        profile:
            "My Profile",

        company:
            "Company Information",

        verification:
            "Verification",

        banking:
            "Payment Information"
    };

    setText(
        "pageTitle",
        titles[sectionName] ||
        "Installer Dashboard"
    );
}


/* =========================================================
   NAVIGATION INITIALIZATION
========================================================= */

function initializeNavigation() {
    $all(
        "[data-section-target]"
    ).forEach(button => {
        button.addEventListener(
            "click",
            event => {
                event.preventDefault();

                navigateToSection(
                    button.dataset.sectionTarget
                );
            }
        );
    });
}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function initializeMobileMenu() {
    const button =
        $("menuButton");

    const shell =
        document.querySelector(
            ".app-shell"
        );

    if (!button || !shell) {
        return;
    }

    button.addEventListener(
        "click",
        () => {
            shell.classList.toggle(
                "sidebar-open"
            );
        }
    );
}


function closeMobileSidebar() {
    document
        .querySelector(".app-shell")
        ?.classList
        .remove(
            "sidebar-open"
        );
}


/* =========================================================
   PROFILE SAVE
========================================================= */

async function handleProfileSubmit(event) {
    event.preventDefault();

    if (state.saving) {
        return;
    }

    state.saving = true;

    const button =
        $("profileSaveButton");

    setButtonLoading(
        button,
        "Saving..."
    );

    try {
        const payload = {
            contactName:
                $("contactName")
                    ?.value
                    .trim(),

            email:
                $("installerEmail")
                    ?.value
                    .trim(),

            phone:
                $("installerPhone")
                    ?.value
                    .trim()
        };

        const response =
            await apiRequest(
                ENDPOINTS.installer,
                {
                    method: "PATCH",
                    body: payload
                }
            );

        if (
            response.success !== true ||
            !response.data
        ) {
            throw new Error(
                response.message ||
                "Profile update failed."
            );
        }

        state.installer =
            response.data;

        renderInstaller(
            state.installer
        );

        showMessage(
            "Profile updated successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Profile update error:",
            error
        );

        handleApiError(
            error,
            "Unable to update your profile."
        );

    } finally {
        state.saving = false;

        restoreButton(
            button,
            "Save Changes"
        );
    }
}


/* =========================================================
   COMPANY SAVE
========================================================= */

async function handleCompanySubmit(event) {
    event.preventDefault();

    if (state.saving) {
        return;
    }

    state.saving = true;

    const button =
        $("companySaveButton");

    setButtonLoading(
        button,
        "Saving..."
    );

    try {
        const payload = {
            companyName:
                $("companyName")
                    ?.value
                    .trim(),

            rcNumber:
                $("rcNumber")
                    ?.value
                    .trim(),

            email:
                $("companyEmail")
                    ?.value
                    .trim(),

            phone:
                $("companyPhone")
                    ?.value
                    .trim(),

            country:
                $("country")
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

            city:
                $("city")
                    ?.value
                    .trim(),

            address:
                $("address")
                    ?.value
                    .trim()
        };

        const response =
            await apiRequest(
                ENDPOINTS.installer,
                {
                    method: "PATCH",
                    body: payload
                }
            );

        if (
            response.success !== true ||
            !response.data
        ) {
            throw new Error(
                response.message ||
                "Company update failed."
            );
        }

        state.installer =
            response.data;

        renderInstaller(
            state.installer
        );

        showMessage(
            "Company information updated successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Company update error:",
            error
        );

        handleApiError(
            error,
            "Unable to update company information."
        );

    } finally {
        state.saving = false;

        restoreButton(
            button,
            "Save Company Details"
        );
    }
}


/* =========================================================
   BANKING SAVE
========================================================= */

async function handleBankingSubmit(event) {
    event.preventDefault();

    if (state.saving) {
        return;
    }

    state.saving = true;

    const button =
        $("bankingSaveButton");

    setButtonLoading(
        button,
        "Saving..."
    );

    try {
        const payload = {
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

        const response =
            await apiRequest(
                ENDPOINTS.installer,
                {
                    method: "PATCH",
                    body: payload
                }
            );

        if (
            response.success !== true ||
            !response.data
        ) {
            throw new Error(
                response.message ||
                "Banking update failed."
            );
        }

        state.installer =
            response.data;

        renderInstaller(
            state.installer
        );

        showMessage(
            "Banking details updated successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Banking update error:",
            error
        );

        handleApiError(
            error,
            "Unable to update banking details."
        );

    } finally {
        state.saving = false;

        restoreButton(
            button,
            "Save Banking Details"
        );
    }
}


/* =========================================================
   BUTTON STATES
========================================================= */

function setButtonLoading(button, text) {
    if (!button) {
        return;
    }

    button.disabled = true;

    button.dataset.originalText =
        button.textContent;

    button.textContent =
        text;
}


function restoreButton(button, text) {
    if (!button) {
        return;
    }

    button.disabled = false;

    button.textContent =
        text;
}


/* =========================================================
   API ERROR HANDLER
========================================================= */

function handleApiError(error, fallback) {
    if (
        error.status === 401 ||
        error.status === 403
    ) {
        showAuthOverlay(
            "Your installer session has expired or you are not authorized to perform this action."
        );

        return;
    }

    showMessage(
        error.message ||
        fallback,
        "error"
    );
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {
    /*
    The backend authentication system may use
    HTTP-only cookies or client-side tokens.

    Clear any client-side remnants first.
    */

    try {
        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "accessToken"
        );

        sessionStorage.removeItem(
            "token"
        );

        sessionStorage.removeItem(
            "accessToken"
        );

    } catch (error) {
        console.warn(
            "Unable to clear local authentication data:",
            error
        );
    }

    window.location.href =
        ENDPOINTS.login;
}


/* =========================================================
   AUTH REDIRECT
========================================================= */

function initializeAuthRedirect() {
    const button =
        $("loginRedirectButton");

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {
            window.location.href =
                ENDPOINTS.login;
        }
    );
}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function initializeLogout() {
    $all(
        "#logoutButton, .logout-button"
    ).forEach(button => {
        button.addEventListener(
            "click",
            event => {
                event.preventDefault();

                logout();
            }
        );
    });
}


/* =========================================================
   FORM EVENTS
========================================================= */

function initializeForms() {
    $("profileForm")
        ?.addEventListener(
            "submit",
            handleProfileSubmit
        );

    $("companyForm")
        ?.addEventListener(
            "submit",
            handleCompanySubmit
        );

    $("bankingForm")
        ?.addEventListener(
            "submit",
            handleBankingSubmit
        );
}


/* =========================================================
   INITIAL SECTION
========================================================= */

function initializeDefaultSection() {
    navigateToSection(
        "dashboard"
    );
}


/* =========================================================
   APPLICATION INITIALIZATION
========================================================= */

async function initializeInstallerPortal() {
    initializeNavigation();

    initializeMobileMenu();

    initializeForms();

    initializeAuthRedirect();

    initializeLogout();

    initializeDefaultSection();

    await loadInstaller();
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
        initializeInstallerPortal
    );
} else {
    initializeInstallerPortal();
}
