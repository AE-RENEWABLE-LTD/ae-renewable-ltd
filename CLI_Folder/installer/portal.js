/* =========================================================
   AE NETWORK
   INSTALLER PORTAL
   VERSION 5.0 PREMIUM
   FRONTEND ONLY
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

/* =========================================================
   STANDALONE SECURITY & ACCESS GUARD
   Ensure clients cannot access installer portal.
   Only certified installers and admin may proceed.
   ========================================================= */
(function guardInstallerPortal() {
    try {
        const token = localStorage.getItem("aeInstallerToken") || 
                      localStorage.getItem("token") || 
                      localStorage.getItem("accessToken") || 
                      localStorage.getItem("aeRenewableToken") || 
                      localStorage.getItem("aeAdminToken") || "";
        const rawUser = localStorage.getItem("aeInstallerUser") ||
                        localStorage.getItem("user") || 
                        localStorage.getItem("aeRenewableUser") || 
                        localStorage.getItem("aeAdminUser") || "{}";
        let user = {};
        try { user = JSON.parse(rawUser); } catch {}
        const role = user && user.role ? String(user.role).toLowerCase() : "";
        const allowed = ["installer", "admin", "staff"];

        if (token && (role === "admin" || role === "staff")) {
            try { sessionStorage.setItem("ae_installer_logged_in", "true"); } catch (_) {}
        }

        if (sessionStorage.getItem("ae_installer_logged_in") !== "true") {
            window.location.replace("/installer/login");
            return;
        }

        if (!token) {
            window.location.replace("/installer/login");
            return;
        }

        if (role === "client" && !localStorage.getItem("aeInstallerToken")) {
            window.location.replace("/client/dashboard");
            return;
        }

        if (!role || !allowed.includes(role)) {
            window.location.replace("/installer/login");
            return;
        }
    } catch (e) {
        console.warn("[Security Guard] Storage check error:", e);
    }
})();

const PORTAL_CONFIG = {

    storageKey:
        "aeInstallerSiteTracking20260926",

    installerName:
        "Eniola Abdulrasaq",

    installerId:
        "AEI-0001",

    projectId:
        "AE-PRJ-2026-018"

};


/* =========================================================
   PAGE TITLES
   ========================================================= */

const PAGE_TITLES = {

    dashboard:
        "Installer Dashboard",

    "available-jobs":
        "Available Jobs",

    "my-jobs":
        "My Jobs",

    "site-tracking":
        "Site Project Tracking",

    commissioning:
        "Commissioning",

    payouts:
        "Payouts",

    documents:
        "Documents",

    notifications:
        "Notifications",

    support:
        "Support",

    profile:
        "My Profile"

};


/* =========================================================
   INSTALLATION STAGES
   ========================================================= */

const INSTALLATION_STAGES = [

    {
        id:
            "starting",

        number:
            1,

        title:
            "Starting Site",

        shortTitle:
            "Starting Site",

        description:
            "Capture the site condition before installation work begins.",

        requirement:
            "Show the complete installation area before work starts.",

        action:
            "Confirm Starting Site",

        icon:
            "fa-house"

    },

    {
        id:
            "working",

        number:
            2,

        title:
            "Work in Progress",

        shortTitle:
            "Work in Progress",

        description:
            "Document the active installation work while the project is underway.",

        requirement:
            "Show installation activity, mounting, wiring or structural work.",

        action:
            "Confirm Work Progress",

        icon:
            "fa-person-digging"

    },

    {
        id:
            "panels",

        number:
            3,

        title:
            "Solar Panels Installed",

        shortTitle:
            "Solar Panels",

        description:
            "Capture the completed solar panel installation.",

        requirement:
            "Show the installed panels, mounting structure and array layout.",

        action:
            "Confirm Panels",

        icon:
            "fa-solar-panel"

    },

    {
        id:
            "inverter",

        number:
            4,

        title:
            "Inverter Installed",

        shortTitle:
            "Inverter",

        description:
            "Document the inverter installation and visible electrical connections.",

        requirement:
            "Show inverter placement, equipment label and cable termination.",

        action:
            "Confirm Inverter",

        icon:
            "fa-bolt"

    },

    {
        id:
            "battery",

        number:
            5,

        title:
            "Battery Installed",

        shortTitle:
            "Battery",

        description:
            "Capture the installed battery system and battery connection area.",

        requirement:
            "Show battery placement, labels and visible connections.",

        action:
            "Confirm Battery",

        icon:
            "fa-battery-full"

    },

    {
        id:
            "finishing",

        number:
            6,

        title:
            "Finishing Job",

        shortTitle:
            "Finishing",

        description:
            "Document the completed installation, cable management and site condition.",

        requirement:
            "Show the finished installation, clean work area and final appearance.",

        action:
            "Complete Installation",

        icon:
            "fa-circle-check"

    }

];


/* =========================================================
   STATE
   ========================================================= */

const SiteTracking = {

    stages:
        {},

    paymentRequested:
        false

};


INSTALLATION_STAGES.forEach(
    stage => {

        SiteTracking.stages[stage.id] = {

            images:
                [],

            notes:
                "",

            complete:
                false

        };

    }
);


/* =========================================================
   GLOBAL APP STATE
   ========================================================= */

const InstallerPortal = {

    currentPage:
        "dashboard",

    sidebarOpen:
        false

};


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(selector) {

    return document.querySelector(selector);

}


function $all(selector) {

    return Array.from(
        document.querySelectorAll(selector)
    );

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeInstallerProfile();

        loadTrackingState();

        initializeNavigation();

        initializeSidebar();

        initializeTopbar();

        initializeGlobalActions();

        renderTracking();

        showPage("dashboard");

    }
);


/* =========================================================
   PROFILE
   ========================================================= */

function initializeInstallerProfile() {

    const name =
        PORTAL_CONFIG.installerName;

    const initials =
        getInitials(name);


    setText(
        "#sidebarInstallerName",
        name
    );

    setText(
        "#footerInstallerName",
        name
    );

    setText(
        "#topInstallerName",
        name
    );

    setText(
        "#profileInstallerName",
        name
    );


    setText(
        "#sidebarAvatarInitials",
        initials
    );

    setText(
        "#footerAvatarInitials",
        initials
    );

    setText(
        "#topAvatarInitials",
        initials
    );

    setText(
        "#profileAvatarInitials",
        initials
    );

}


function getInitials(name) {

    if (!name) {
        return "AE";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            part =>
                part.charAt(0).toUpperCase()
        )
        .join("");

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    $all("[data-page]")
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        const page =
                            element.dataset.page;

                        if (!page) {
                            return;
                        }

                        showPage(page);

                    }
                );

            }
        );

}


function showPage(page) {

    if (
        !PAGE_TITLES[page]
    ) {
        return;
    }


    InstallerPortal.currentPage =
        page;


    $all(".portal-page")
        .forEach(
            section => {

                section.classList.remove(
                    "active"
                );

            }
        );


    const target =
        document.querySelector(
            `#page-${page}`
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    $all(".nav-item")
        .forEach(
            item => {

                item.classList.toggle(
                    "active",
                    item.dataset.page === page
                );

            }
        );


    $all(".profile-nav")
        .forEach(
            item => {

                if (
                    item.dataset.page === page
                ) {

                    item.classList.add(
                        "active"
                    );

                }

            }
        );


    setText(
        "#pageTitle",
        PAGE_TITLES[page]
    );


    closeSidebar();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (
        page === "site-tracking"
    ) {

        renderTracking();

    }

    if (
        page === "profile"
    ) {

        if (typeof loadInstallerProfileFromAPI === "function") {
            loadInstallerProfileFromAPI();
        }

    }

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function initializeSidebar() {

    const toggle =
        $("#sidebarToggle");

    const overlay =
        $("#sidebarOverlay");


    if (toggle) {

        toggle.addEventListener(
            "click",
            () => {

                toggleSidebar();

            }
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            () => {

                closeSidebar();

            }
        );

    }

}


function toggleSidebar() {

    const sidebar =
        $("#sidebar");

    const overlay =
        $("#sidebarOverlay");


    if (!sidebar) {
        return;
    }


    InstallerPortal.sidebarOpen =
        !InstallerPortal.sidebarOpen;


    sidebar.classList.toggle(
        "open",
        InstallerPortal.sidebarOpen
    );


    if (overlay) {

        overlay.classList.toggle(
            "visible",
            InstallerPortal.sidebarOpen
        );

    }

}


function closeSidebar() {

    const sidebar =
        $("#sidebar");

    const overlay =
        $("#sidebarOverlay");


    InstallerPortal.sidebarOpen =
        false;


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "visible"
        );

    }

}


/* =========================================================
   TOPBAR
   ========================================================= */

function initializeTopbar() {

    const profileButton =
        $("#topbarProfileButton");


    if (profileButton) {

        profileButton.addEventListener(
            "click",
            () => {

                showPage("profile");

            }
        );

    }


    const notificationButton =
        $("#notificationButton");


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                showPage("notifications");

            }
        );

    }

}


/* =========================================================
   GLOBAL ACTIONS
   ========================================================= */

function initializeGlobalActions() {

    document.addEventListener(
        "click",
        event => {

            const actionElement =
                event.target.closest(
                    "[data-action]"
                );


            if (!actionElement) {
                return;
            }


            const action =
                actionElement.dataset.action;


            handleAction(
                action,
                actionElement
            );

        }
    );


    const paymentButton =
        $("#requestPaymentButton");


    if (paymentButton) {

        paymentButton.addEventListener(
            "click",
            requestPayment
        );

    }


    const modalBackdrop =
        $("#modalBackdrop");

    const modalClose =
        $("#modalClose");


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closeModal
        );

    }


    if (modalBackdrop) {

        modalBackdrop.addEventListener(
            "click",
            event => {

                if (
                    event.target === modalBackdrop
                ) {

                    closeModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        }
    );

}


/* =========================================================
   ACTION HANDLER
   ========================================================= */

function handleAction(
    action,
    element
) {

    switch (action) {

        case "accept-job":

            acceptJob(
                element
            );

            break;


        case "view-job":

            showPage(
                "site-tracking"
            );

            break;


        case "save-commissioning":

            handleSaveCommissioning();

            break;


        case "support":

            showModal(
                `
                <div class="modal-heading">
                    <span class="eyebrow">
                        AE NETWORK SUPPORT
                    </span>

                    <h3>
                        Contact Operations
                    </h3>

                    <p>
                        Your support request can be connected to the
                        AE Network support workflow when the backend
                        endpoint is enabled.
                    </p>
                </div>

                <div style="
                    margin-top:18px;
                    padding:14px;
                    background:#f5f7fa;
                    border-radius:10px;
                    font-size:10px;
                    color:#738197;
                    line-height:1.6;
                ">
                    For urgent field issues, contact AE Network
                    operations directly.
                </div>

                <button
                    class="primary-btn"
                    style="width:100%;margin-top:18px;"
                    type="button"
                    onclick="closeModal()"
                >
                    Close
                </button>
                `
            );

            break;


        case "save-profile":

            showToast(
                "Profile changes saved locally.",
                "success"
            );

            break;


        default:

            break;

    }

}


/* =========================================================
   ACCEPT JOB
   ========================================================= */

function acceptJob(button) {

    if (!button) {
        return;
    }


    button.disabled =
        true;

    button.textContent =
        "Accepted";


    button.style.background =
        "#008000";


    button.style.color =
        "#fff";


    showToast(
        "Job accepted. It is now available under My Jobs.",
        "success"
    );

}


/* =========================================================
   TRACKING STATE
   ========================================================= */

function createFreshTrackingState() {

    const fresh = {

        stages: {},

        paymentRequested:
            false

    };


    INSTALLATION_STAGES.forEach(
        stage => {

            fresh.stages[stage.id] = {

                images: [],

                notes: "",

                complete: false

            };

        }
    );


    return fresh;

}


/* =========================================================
   LOAD STATE
   ========================================================= */

function loadTrackingState() {

    const fresh =
        createFreshTrackingState();


    try {

        const saved =
            localStorage.getItem(
                PORTAL_CONFIG.storageKey
            );


        if (!saved) {

            Object.assign(
                SiteTracking,
                fresh
            );

            return;

        }


        const parsed =
            JSON.parse(saved);


        INSTALLATION_STAGES.forEach(
            stage => {

                const savedStage =
                    parsed?.stages?.[stage.id];


                if (
                    savedStage
                ) {

                    SiteTracking.stages[
                        stage.id
                    ] = {

                        images:
                            Array.isArray(
                                savedStage.images
                            )
                                ? savedStage.images
                                : [],

                        notes:
                            savedStage.notes || "",

                        complete:
                            Boolean(
                                savedStage.complete
                            )

                    };

                }

            }
        );


        SiteTracking.paymentRequested =
            Boolean(
                parsed.paymentRequested
            );


    } catch (error) {

        console.warn(
            "Tracking state could not be loaded.",
            error
        );


        Object.assign(
            SiteTracking,
            fresh
        );

    }

}


/* =========================================================
   SAVE STATE
   ========================================================= */

function saveTrackingState() {

    try {

        const safeState = {

            stages: {},

            paymentRequested:
                SiteTracking.paymentRequested

        };


        INSTALLATION_STAGES.forEach(
            stage => {

                const current =
                    SiteTracking.stages[
                        stage.id
                    ];


                safeState.stages[
                    stage.id
                ] = {

                    images:
                        current.images.map(
                            image => ({
                                name:
                                    image.name,

                                size:
                                    image.size,

                                type:
                                    image.type
                            })
                        ),

                    notes:
                        current.notes,

                    complete:
                        current.complete

                };

            }
        );


        localStorage.setItem(
            PORTAL_CONFIG.storageKey,
            JSON.stringify(
                safeState
            )
        );


    } catch (error) {

        console.warn(
            "Tracking state could not be saved.",
            error
        );

    }

}


/* =========================================================
   TRACKING RENDER
   ========================================================= */

function renderTracking() {

    renderStageCards();

    renderTrackingSummary();

    renderPaymentPanel();

    updateProgressEverywhere();

}


/* =========================================================
   STAGE LOCK LOGIC
   ========================================================= */

function isStageUnlocked(index) {

    if (index === 0) {
        return true;
    }


    const previous =
        INSTALLATION_STAGES[
            index - 1
        ];


    return Boolean(
        SiteTracking
            .stages[
                previous.id
            ]
            .complete
    );

}


/* =========================================================
   STAGE RENDER
   ========================================================= */

function renderStageCards() {

    const container =
        $("#trackingStages");


    if (!container) {
        return;
    }


    container.innerHTML =
        INSTALLATION_STAGES
            .map(
                (
                    stage,
                    index
                ) =>
                    renderStage(
                        stage,
                        index
                    )
            )
            .join("");


    attachStageEvents();

}


/* =========================================================
   RENDER INDIVIDUAL STAGE
   ========================================================= */

function renderStage(
    stage,
    index
) {

    const state =
        SiteTracking.stages[
            stage.id
        ];


    const unlocked =
        isStageUnlocked(index);


    const completed =
        state.complete;


    const current =
        unlocked &&
        !completed;


    let statusClass =
        "locked";

    let statusText =
        "Locked";

    let statusIcon =
        "fa-lock";


    if (completed) {

        statusClass =
            "completed";

        statusText =
            "Completed";

        statusIcon =
            "fa-check";

    } else if (current) {

        statusClass =
            "current";

        statusText =
            "Current Stage";

        statusIcon =
            "fa-camera";

    }


    const disabled =
        !unlocked ||
        completed;


    const imageCount =
        state.images.length;


    return `
        <article
            class="
                stage-card
                ${completed ? "completed" : ""}
                ${current ? "current" : ""}
                ${!unlocked ? "locked" : ""}
            "
            data-stage-card="${stage.id}"
        >

            <div class="stage-top">

                <div class="stage-number">

                    ${
                        completed
                            ? `<i class="fa-solid fa-check"></i>`
                            : stage.number
                    }

                </div>


                <div class="stage-heading">

                    <h4>
                        ${escapeHtml(stage.title)}
                    </h4>

                    <p>
                        ${escapeHtml(stage.description)}
                    </p>

                </div>


                <span
                    class="
                        stage-status
                        ${statusClass}
                    "
                >

                    <i
                        class="
                            fa-solid
                            ${statusIcon}
                        "
                    ></i>

                    ${statusText}

                </span>

            </div>


            ${
                unlocked
                    ? `
                        <div class="stage-body">

                            <div class="stage-requirement">

                                <i class="fa-solid fa-camera"></i>

                                <span>
                                    ${escapeHtml(stage.requirement)}
                                </span>

                            </div>


                            <!-- DIRECT LIVE CAMERA EVIDENCE (USER REQUIREMENT) -->
                            <div class="stage-camera-action-box">
                                <div class="stage-camera-text">
                                    <div class="stage-cam-pulse-icon">
                                        <i class="fa-solid fa-camera"></i>
                                    </div>
                                    <div>
                                        <h5>Direct Live Camera Evidence</h5>
                                        <p>Capture direct live camera photo for ${escapeHtml(stage.shortTitle || stage.title)}.</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    class="btn-live-camera-capture"
                                    data-stage-camera="${stage.id}"
                                    ${disabled ? "disabled" : ""}
                                >
                                    <i class="fa-solid fa-camera"></i>
                                    Capture Live Photo
                                </button>
                            </div>

                            <div class="stage-camera-secondary-upload">
                                <span>Secondary option:</span>
                                <a href="javascript:void(0)" class="stage-browse-link" data-trigger-file="${stage.id}">Attach from gallery/files</a>
                                <input
                                    type="file"
                                    id="fileInput-${stage.id}"
                                    class="stage-file-input"
                                    data-stage="${stage.id}"
                                    accept="image/*"
                                    multiple
                                    style="display: none;"
                                    ${disabled ? "disabled" : ""}
                                >
                            </div>


                            <div
                                class="preview-grid"
                                id="preview-${stage.id}"
                            >
                                ${renderPreviews(state.images)}
                            </div>


                            <div class="stage-notes">

                                <label
                                    for="notes-${stage.id}"
                                >
                                    Installation Notes
                                </label>

                                <textarea
                                    id="notes-${stage.id}"
                                    class="stage-notes-input"
                                    data-stage="${stage.id}"
                                    placeholder="Add a short note about this stage..."
                                    ${
                                        disabled
                                            ? "disabled"
                                            : ""
                                    }
                                >${escapeHtml(state.notes)}</textarea>

                            </div>


                            <div class="stage-footer">

                                <div class="stage-evidence-count">

                                    <i class="fa-solid fa-images"></i>

                                    <span>
                                        ${
                                            imageCount
                                        }
                                        image${
                                            imageCount === 1
                                                ? ""
                                                : "s"
                                        }
                                        added
                                    </span>

                                </div>


                                <button
                                    class="
                                        primary-btn
                                        stage-action
                                    "
                                    type="button"
                                    data-stage-complete="${stage.id}"
                                    ${
                                        disabled
                                            ? "disabled"
                                            : ""
                                    }
                                >

                                    ${
                                        completed
                                            ? `
                                                <i class="fa-solid fa-check"></i>
                                                Completed
                                              `
                                            : `
                                                <i class="fa-solid fa-arrow-right"></i>
                                                ${escapeHtml(stage.action)}
                                              `
                                    }

                                </button>

                            </div>

                        </div>
                    `
                    : `
                        <div class="stage-body">

                            <div style="
                                display:flex;
                                align-items:center;
                                gap:9px;
                                padding:14px;
                                color:#7b8796;
                                background:#f5f7f9;
                                border-radius:9px;
                                font-size:9px;
                            ">

                                <i class="fa-solid fa-lock"></i>

                                <span>
                                    Complete the previous stage with
                                    required photo evidence to unlock this stage.
                                </span>

                            </div>

                        </div>
                    `
            }

        </article>
    `;

}


/* =========================================================
   PREVIEW RENDER
   ========================================================= */

function renderPreviews(
    images
) {

    if (
        !images ||
        !images.length
    ) {

        return "";

    }


    return images
        .map(
            (
                image,
                index
            ) => {

                const previewSource =
                    image.url ||
                    "";


                return `
                    <div class="preview-item">

                        ${
                            previewSource
                                ? `
                                    <img
                                        src="${previewSource}"
                                        alt="${escapeHtml(image.name || "Site evidence")}"
                                    >
                                  `
                                : `
                                    <div style="
                                        width:100%;
                                        height:100%;
                                        display:grid;
                                        place-items:center;
                                        color:#738197;
                                        font-size:8px;
                                        padding:10px;
                                        text-align:center;
                                    ">
                                        ${escapeHtml(image.name || "Evidence image")}
                                    </div>
                                  `
                        }


                        <button
                            type="button"
                            class="preview-remove"
                            data-remove-image="true"
                            data-stage=""
                            data-image-index="${index}"
                            title="Remove image"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>


                        <span class="preview-name">
                            ${escapeHtml(image.name || "Image")}
                        </span>

                    </div>
                `;

            }
        )
        .join("");

}


/* =========================================================
   STAGE EVENTS
   ========================================================= */

function attachStageEvents() {

    $all(".stage-file-input")
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    event => {

                        const stageId =
                            input.dataset.stage;


                        const files =
                            Array.from(
                                event.target.files || []
                            );


                        if (!files.length) {
                            return;
                        }


                        addImagesToStage(
                            stageId,
                            files
                        );


                        input.value =
                            "";

                    }
                );

            }
        );


    $all(".stage-notes-input")
        .forEach(
            textarea => {

                textarea.addEventListener(
                    "input",
                    () => {

                        const stageId =
                            textarea.dataset.stage;


                        if (
                            SiteTracking
                                .stages[
                                    stageId
                                ]
                        ) {

                            SiteTracking
                                .stages[
                                    stageId
                                ]
                                .notes =
                                textarea.value;


                            saveTrackingState();

                        }

                    }
                );

            }
        );


    $all("[data-stage-complete]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        completeStage(
                            button.dataset.stageComplete
                        );

                    }
                );

            }
        );


    $all("[data-remove-image]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        removeStageImage(
                            button.dataset.stage,
                            Number(
                                button.dataset.imageIndex
                            )
                        );
                    }
                );
            }
        );

    $all("[data-stage-camera]")
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        const stageId = button.dataset.stageCamera;
                        if (typeof openSiteEvidenceCamera === "function") {
                            openSiteEvidenceCamera(stageId);
                        }
                    }
                );
            }
        );

    $all("[data-trigger-file]")
        .forEach(
            link => {
                link.addEventListener(
                    "click",
                    () => {
                        const stageId = link.dataset.triggerFile;
                        const input = $(`#fileInput-${stageId}`);
                        if (input) input.click();
                    }
                );
            }
        );
}


/* =========================================================
   ADD IMAGES
   ========================================================= */

function addImagesToStage(
    stageId,
    files
) {

    const stage =
        SiteTracking.stages[
            stageId
        ];


    if (!stage) {
        return;
    }


    files.forEach(
        file => {

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showToast(
                    `${file.name} is not an image file.`,
                    "warning"
                );

                return;

            }


            const image = {

                name:
                    file.name,

                size:
                    file.size,

                type:
                    file.type,

                url:
                    URL.createObjectURL(
                        file
                    ),

                // Store the raw File object for backend upload
                _file: file

            };


            stage.images.push(
                image
            );

        }
    );


    saveTrackingState();

    renderTracking();


    showToast(
        `${files.length} image${files.length === 1 ? "" : "s"} added to ${getStageTitle(stageId)}.`,
        "success"
    );

}


/* =========================================================
   REMOVE IMAGE
   ========================================================= */

function removeStageImage(
    stageId,
    imageIndex
) {

    const stage =
        SiteTracking.stages[
            stageId
        ];


    if (!stage) {
        return;
    }


    const image =
        stage.images[
            imageIndex
        ];


    if (
        image &&
        image.url
    ) {

        try {

            URL.revokeObjectURL(
                image.url
            );

        } catch (_) {}

    }


    stage.images.splice(
        imageIndex,
        1
    );


    if (
        stage.complete &&
        stage.images.length === 0
    ) {

        stage.complete =
            false;

    }


    saveTrackingState();

    renderTracking();


    showToast(
        "Evidence image removed.",
        "warning"
    );

}


/* =========================================================
   COMPLETE STAGE
   ========================================================= */

function completeStage(
    stageId
) {

    const index =
        INSTALLATION_STAGES.findIndex(
            stage =>
                stage.id === stageId
        );


    if (index === -1) {
        return;
    }


    if (
        !isStageUnlocked(index)
    ) {

        showToast(
            "Complete the previous stage first.",
            "warning"
        );

        return;

    }


    const stage =
        SiteTracking.stages[
            stageId
        ];


    if (
        !stage.images.length
    ) {

        showToast(
            `Add at least one image before completing ${getStageTitle(stageId)}.`,
            "warning"
        );

        const card =
            document.querySelector(
                `[data-stage-card="${stageId}"]`
            );


        if (card) {

            card.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

        return;

    }


    stage.complete =
        true;


    saveTrackingState();

    renderTracking();

    if (typeof renderCommissioningChecklist === "function") {
        renderCommissioningChecklist(stageId);
        updateCommissioningStatus();
    }

    if (typeof COMMISSIONING_ITEMS !== "undefined") {
        const commItem = COMMISSIONING_ITEMS.find(c => c.stageId === stageId);
        if (commItem) {
            showToast(`✓ Commissioning Checklist: "${commItem.specName}" automatically verified!`, "success");
        }
    }


    // ====================================================
    // BACKEND SYNC: Upload evidence images to the DB
    // ====================================================
    const projectId = PORTAL_CONFIG.projectId;
    if (projectId) {
        const stageImages = stage.images.filter(img => img._file);
        if (stageImages.length > 0) {
            // Upload each image as evidence for this stage
            Promise.all(stageImages.map(async (img) => {
                try {
                    const formData = new FormData();
                    formData.append("image", img._file);
                    formData.append("stage_type", stageId);
                    formData.append("caption", img.name || stageId);
                    formData.append("notes", stage.notes || "");

                    const token = InstallerAPI.getToken();
                    const res = await fetch(`/api/projects/${projectId}/evidence`, {
                        method: "POST",
                        credentials: "include",
                        headers: { Authorization: "Bearer " + token },
                        body: formData
                    });
                    const result = await res.json();
                    if (!result.success) {
                        console.warn("[AE Installer] Evidence upload issue:", result.message);
                    }
                    return result;
                } catch (err) {
                    console.warn("[AE Installer] Evidence upload error:", err.message);
                }
            })).then(results => {
                const ok = results.filter(r => r?.success).length;
                if (ok > 0) {
                    console.log(`[AE Installer] ${ok} evidence image(s) synced to admin panel.`);
                    showToast(`Evidence synced to Admin: ${ok} image(s) uploaded.`, "success");
                }
            });
        } else {
            // No File objects (e.g., restored from localStorage) — submit a text-only evidence record
            InstallerAPI.post(`/api/projects/${projectId}/evidence`, {
                stage_type: stageId,
                caption: getStageTitle(stageId) + " completed",
                notes: stage.notes || "Stage marked complete by installer."
            }).catch(err => console.warn("[AE Installer] Evidence text-sync error:", err.message));
        }
    }


    const next =
        INSTALLATION_STAGES[
            index + 1
        ];


    if (next) {

        showToast(
            `${getStageTitle(stageId)} completed. ${next.title} is now unlocked.`,
            "success"
        );

        setTimeout(
            () => {

                const nextCard =
                    document.querySelector(
                        `[data-stage-card="${next.id}"]`
                    );


                if (nextCard) {

                    nextCard.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

            },
            150
        );

    } else {

        showToast(
            "All installation evidence stages are complete. Payment request is now available.",
            "success"
        );

    }

}


/* =========================================================
   GET STAGE TITLE
   ========================================================= */

function getStageTitle(
    stageId
) {

    const stage =
        INSTALLATION_STAGES.find(
            item =>
                item.id === stageId
        );


    return stage
        ? stage.title
        : "Stage";

}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderTrackingSummary() {

    const container =
        $("#trackingSummary");


    if (!container) {
        return;
    }


    const completedCount =
        getCompletedStageCount();


    const percentage =
        getTrackingPercentage();


    const currentIndex =
        getCurrentStageIndex();


    container.innerHTML = `

        <span class="eyebrow">
            PROJECT STATUS
        </span>

        <h3 class="summary-title">
            Installation Evidence
        </h3>


        <div class="summary-progress">

            <div class="summary-progress-top">

                <span>
                    Overall completion
                </span>

                <strong>
                    ${percentage}%
                </strong>

            </div>

            <div class="progress">
                <span
                    style="width:${percentage}%"
                ></span>
            </div>

        </div>


        <div class="summary-stats">

            <div class="summary-stat">

                <span>
                    Completed
                </span>

                <strong>
                    ${completedCount}/6
                </strong>

            </div>


            <div class="summary-stat">

                <span>
                    Images
                </span>

                <strong>
                    ${getTotalImageCount()}
                </strong>

            </div>

        </div>


        <div class="summary-stages">

            ${
                INSTALLATION_STAGES
                    .map(
                        (
                            stage,
                            index
                        ) => {

                            const state =
                                SiteTracking
                                    .stages[
                                        stage.id
                                    ];


                            const done =
                                state.complete;


                            const active =
                                !done &&
                                index === currentIndex;


                            return `
                                <div
                                    class="
                                        summary-stage
                                        ${done ? "done" : ""}
                                        ${active ? "active" : ""}
                                    "
                                >

                                    <div class="summary-stage-icon">

                                        ${
                                            done
                                                ? `<i class="fa-solid fa-check"></i>`
                                                : index + 1
                                        }

                                    </div>

                                    <span>
                                        ${escapeHtml(stage.shortTitle)}
                                    </span>

                                    ${
                                        done
                                            ? `
                                                <i class="fa-solid fa-check"></i>
                                              `
                                            : ""
                                    }

                                </div>
                            `;

                        }
                    )
                    .join("")
            }

        </div>

    `;

}


/* =========================================================
   PAYMENT PANEL
   ========================================================= */

function renderPaymentPanel() {

    const panel =
        $("#paymentRequestPanel");

    const button =
        $("#requestPaymentButton");

    const status =
        $("#paymentRequestStatus");

    const description =
        $("#paymentRequestDescription");

    const checklist =
        $("#paymentChecklist");


    if (
        !panel ||
        !button ||
        !status ||
        !description ||
        !checklist
    ) {

        return;

    }


    const allComplete =
        getCompletedStageCount() ===
        INSTALLATION_STAGES.length;


    if (
        SiteTracking.paymentRequested
    ) {

        panel.classList.remove(
            "ready"
        );

        panel.classList.add(
            "requested"
        );


        status.textContent =
            "Payment Request Prepared";


        description.textContent =
            "Your installation evidence package has been completed and the payment request has been prepared for operations review.";


        button.disabled =
            true;


        button.innerHTML =
            `
                <i class="fa-solid fa-check"></i>
                Payment Requested
            `;

    } else if (allComplete) {

        panel.classList.add(
            "ready"
        );

        panel.classList.remove(
            "requested"
        );


        status.textContent =
            "Ready for Payment Request";


        description.textContent =
            "All required installation evidence has been completed. You can now request payment for this installation.";


        button.disabled =
            false;


        button.innerHTML =
            `
                <i class="fa-solid fa-money-bill-transfer"></i>
                Request Payment
            `;

    } else {

        panel.classList.remove(
            "ready",
            "requested"
        );


        status.textContent =
            "Evidence Incomplete";


        description.textContent =
            "Complete all six installation evidence stages before requesting your installation payment.";


        button.disabled =
            true;


        button.innerHTML =
            `
                <i class="fa-solid fa-lock"></i>
                Request Payment
            `;

    }


    checklist.innerHTML =
        INSTALLATION_STAGES
            .map(
                stage => {

                    const complete =
                        SiteTracking
                            .stages[
                                stage.id
                            ]
                            .complete;


                    return `
                        <span
                            class="
                                check-item
                                ${complete ? "done" : ""}
                            "
                        >

                            <i
                                class="
                                    fa-solid
                                    ${
                                        complete
                                            ? "fa-check"
                                            : "fa-clock"
                                    }
                                "
                            ></i>

                            ${escapeHtml(stage.shortTitle)}

                        </span>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   REQUEST PAYMENT
   ========================================================= */

function requestPayment() {

    const allComplete =
        getCompletedStageCount() ===
        INSTALLATION_STAGES.length;


    if (!allComplete) {

        showToast(
            "Complete all required installation stages first.",
            "warning"
        );

        return;

    }


    if (
        SiteTracking.paymentRequested
    ) {

        showToast(
            "Payment request has already been prepared.",
            "warning"
        );

        return;

    }


    showModal(
        `
            <div>

                <span class="eyebrow">
                    FINAL INSTALLATION REVIEW
                </span>

                <h3 style="
                    margin-top:6px;
                    font-family:Manrope,sans-serif;
                    font-size:20px;
                ">
                    Request Installation Payment
                </h3>

                <p style="
                    margin-top:8px;
                    color:#738197;
                    font-size:10px;
                    line-height:1.65;
                ">
                    All six evidence stages have been completed for
                    ${escapeHtml(PORTAL_CONFIG.projectId)}.
                    Confirm that the installation is finished and the
                    evidence represents the completed site.
                </p>


                <div style="
                    margin-top:17px;
                    padding:14px;
                    background:#f5f7fa;
                    border:1px solid #e3e8ef;
                    border-radius:10px;
                ">

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        gap:15px;
                        font-size:9px;
                        margin-bottom:9px;
                    ">

                        <span style="color:#738197;">
                            Evidence stages
                        </span>

                        <strong>
                            6 / 6 Complete
                        </strong>

                    </div>


                    <div style="
                        display:flex;
                        justify-content:space-between;
                        gap:15px;
                        font-size:9px;
                        margin-bottom:9px;
                    ">

                        <span style="color:#738197;">
                            Project
                        </span>

                        <strong>
                            ${escapeHtml(PORTAL_CONFIG.projectId)}
                        </strong>

                    </div>


                    <div style="
                        display:flex;
                        justify-content:space-between;
                        gap:15px;
                        font-size:9px;
                    ">

                        <span style="color:#738197;">
                            Installation
                        </span>

                        <strong style="color:#008000;">
                            COMPLETE
                        </strong>

                    </div>

                </div>


                <div style="
                    display:flex;
                    gap:8px;
                    margin-top:18px;
                ">

                    <button
                        class="secondary-btn"
                        type="button"
                        style="flex:1;"
                        onclick="closeModal()"
                    >
                        Review Again
                    </button>


                    <button
                        class="primary-btn"
                        type="button"
                        style="flex:1;"
                        id="confirmPaymentRequest"
                    >
                        Confirm Request
                    </button>

                </div>

            </div>
        `
    );


    const confirm =
        $("#confirmPaymentRequest");


    if (confirm) {

        confirm.addEventListener(
            "click",
            confirmPaymentRequest
        );

    }

}


/* =========================================================
   CONFIRM PAYMENT REQUEST
   ========================================================= */

async function confirmPaymentRequest() {

    SiteTracking.paymentRequested =
        true;


    saveTrackingState();

    closeModal();

    renderTracking();

    // ====================================================
    // BACKEND SYNC: Submit payment request to Admin
    // ====================================================
    const projectId = PORTAL_CONFIG.projectId;
    if (projectId) {
        try {
            const completedCount = getCompletedStageCount();
            const contractValue = PORTAL_CONFIG.contractValue || null;

            const res = await InstallerAPI.post(`/api/projects/${projectId}/request-payment`, {
                notes: `Installer confirmed all ${completedCount} installation evidence stages complete. Payment request submitted for Admin authorization.`,
                amount: contractValue,
                payment_reference: "INST-PAY-" + Date.now().toString(36).toUpperCase()
            });

            if (res?.success) {
                showToast("Payment request submitted to Admin Control Centre!", "success");
                console.log("[AE Installer] Payment request sent to admin.");
            } else {
                console.warn("[AE Installer] Payment request response:", res?.message);
                showToast("Payment request recorded locally. Admin will be notified.", "normal");
            }
        } catch (err) {
            console.warn("[AE Installer] Payment request API error:", err.message);
            showToast("Payment request prepared successfully. It is ready for operations review.", "success");
        }
    } else {
        showToast(
            "Payment request prepared successfully. It is ready for operations review.",
            "success"
        );
    }

}


/* =========================================================
   PROGRESS
   ========================================================= */

function getCompletedStageCount() {

    return INSTALLATION_STAGES
        .filter(
            stage =>
                SiteTracking
                    .stages[
                        stage.id
                    ]
                    .complete
        )
        .length;

}


function getTrackingPercentage() {

    const completed =
        getCompletedStageCount();


    return Math.round(
        (
            completed /
            INSTALLATION_STAGES.length
        ) * 100
    );

}


function getCurrentStageIndex() {

    const index =
        INSTALLATION_STAGES.findIndex(
            stage =>
                !SiteTracking
                    .stages[
                        stage.id
                    ]
                    .complete
        );


    return index === -1
        ? INSTALLATION_STAGES.length - 1
        : index;

}


function getTotalImageCount() {

    return INSTALLATION_STAGES
        .reduce(
            (
                total,
                stage
            ) => {

                return total +
                    SiteTracking
                        .stages[
                            stage.id
                        ]
                        .images
                        .length;

            },
            0
        );

}


/* =========================================================
   UPDATE PROGRESS EVERYWHERE
   ========================================================= */

function updateProgressEverywhere() {

    const percentage =
        getTrackingPercentage();

    const completed =
        getCompletedStageCount();


    setText(
        "#siteTrackingPercent",
        `${percentage}%`
    );


    setText(
        "#siteTrackingProgressText",
        `${completed} of 6 evidence stages completed`
    );


    const mainBar =
        $("#siteTrackingProgressBar");


    if (mainBar) {

        mainBar.style.width =
            `${percentage}%`;

    }


    const dashboardBar =
        $("#dashboardTrackingBar");


    if (dashboardBar) {

        dashboardBar.style.width =
            `${percentage}%`;

    }


    setText(
        "#dashboardTrackingPercent",
        `${percentage}%`
    );


    const myJobBar =
        $("#myJobProgressBar");


    if (myJobBar) {

        myJobBar.style.width =
            `${percentage}%`;

    }


    setText(
        "#myJobProgressText",
        `${percentage}%`
    );


    const trackingDot =
        $("#trackingNavDot");


    if (trackingDot) {

        trackingDot.style.background =
            percentage === 100
                ? "#008000"
                : "#f4a600";

    }

    if (typeof renderCommissioningChecklist === "function") {
        renderCommissioningChecklist();
        updateCommissioningStatus();
    }

}

/* =========================================================
   COMMISSIONING & EVIDENCE CHECKLIST SYNCHRONIZATION
   ========================================================= */

const COMMISSIONING_ITEMS = [
    {
        stageId: "starting",
        number: 1,
        title: "Pre-Installation Site & Environmental Safety Verified",
        subtitle: "Site layout inspected, roof/ground structure confirmed, safety perimeter and PPE verified.",
        specName: "Site Safety Check",
        icon: "fa-shield-halved"
    },
    {
        stageId: "working",
        number: 2,
        title: "Mounting Structure & Protection Devices Checked",
        subtitle: "Racking torqued, DC isolators positioned, surge protection devices (SPD) & grounding checked.",
        specName: "Protection Devices",
        icon: "fa-screwdriver-wrench"
    },
    {
        stageId: "panels",
        number: 3,
        title: "Solar PV Array Input & String Voltage Verified",
        subtitle: "PV modules mounted, array Voc/Isc string polarity checked, cable conduits weather-sealed.",
        specName: "PV Input Verified",
        icon: "fa-solar-panel"
    },
    {
        stageId: "inverter",
        number: 4,
        title: "Inverter Installation & Operating Parameters Configured",
        subtitle: "Inverter mounted, AC/DC termination secured, grid/generator synchronization configured.",
        specName: "Inverter Configured",
        icon: "fa-bolt"
    },
    {
        stageId: "battery",
        number: 5,
        title: "Battery Storage & BMS Communication Interface Verified",
        subtitle: "Battery bank racked, DC main breaker installed, CAN/RS485 BMS communication protocol verified.",
        specName: "Battery Communication",
        icon: "fa-battery-full"
    },
    {
        stageId: "finishing",
        number: 6,
        title: "System Testing, Cable Dressing & Client Handover Completed",
        subtitle: "Full-load test executed, hazard warning labels attached, client walkthrough & handover completed.",
        specName: "Client Handover",
        icon: "fa-handshake"
    }
];

function renderCommissioningChecklist(newlyTickedStageId = null) {
    const container = $("#commissioningChecklist");
    if (!container) return;

    container.innerHTML = COMMISSIONING_ITEMS.map((item, index) => {
        const isVerified = Boolean(SiteTracking?.stages?.[item.stageId]?.complete);
        const isJustTicked = newlyTickedStageId === item.stageId;
        const stageIndex = index;
        const isUnlocked = isStageUnlocked(stageIndex);

        return `
            <div class="comm-item ${isVerified ? 'verified' : 'pending'} ${isJustTicked ? 'just-ticked' : ''}" 
                 id="commItem-${item.stageId}" data-stage-id="${item.stageId}">
                <div class="comm-check-box" title="${isVerified ? 'Evidence confirmed in Site Tracking' : 'Awaiting evidence confirmation'}">
                    <i class="fa-solid ${isVerified ? 'fa-check' : 'fa-clock'}"></i>
                </div>
                <div class="comm-content">
                    <div class="comm-title-row">
                        <span class="comm-title">
                            <i class="fa-solid ${item.icon}" style="color: ${isVerified ? '#008000' : 'var(--blue)'};"></i>
                            ${item.number}. ${item.title}
                        </span>
                        <span class="comm-badge ${isVerified ? 'verified' : 'pending'}">
                            <i class="fa-solid ${isVerified ? 'fa-circle-check' : 'fa-hourglass-half'}"></i>
                            ${isVerified ? 'Verified via Site Tracking' : 'Awaiting Evidence'}
                        </span>
                    </div>
                    <p class="comm-subtitle">${escapeHtml(item.subtitle)}</p>
                    ${!isVerified ? `
                        <button type="button" class="comm-jump-btn" onclick="goToTrackingStage('${item.stageId}')">
                            <i class="fa-solid fa-camera"></i>
                            ${isUnlocked ? 'Capture & Confirm Stage Evidence →' : 'Complete Previous Stages First →'}
                        </button>
                    ` : `
                        <small style="color:#008000; font-size:10px; font-weight:600; display:inline-flex; align-items:center; gap:4px; margin-top:4px;">
                            <i class="fa-solid fa-shield-check"></i> Evidence confirmed & verified for handover
                        </small>
                    `}
                </div>
            </div>
        `;
    }).join("");
}

function updateCommissioningStatus() {
    const percentage = getTrackingPercentage();
    const completed = getCompletedStageCount();

    // Percentage & Progress Bar
    setText("#commPercentText", `${percentage}%`);
    const bar = $("#commProgressBar");
    if (bar) bar.style.width = `${percentage}%`;

    // Evidence counter
    setText("#commEvidenceSummaryText", `${completed} of 6 evidence stages confirmed`);

    // Status Pill
    const pill = $("#commStatusPill");
    if (pill) {
        if (completed === 6) {
            pill.className = "status-pill status-ready";
            pill.style.background = "#eaf8f0";
            pill.style.color = "#008000";
            pill.textContent = "● 6/6 Complete (Ready for Handover)";
        } else if (completed > 0) {
            pill.className = "status-pill status-progress";
            pill.style.background = "#fff8eb";
            pill.style.color = "#b45309";
            pill.textContent = `● ${completed} / 6 Stages Verified`;
        } else {
            pill.className = "status-pill";
            pill.style.background = "#f1f5f9";
            pill.style.color = "#64748b";
            pill.textContent = "● Pending Evidence (0/6)";
        }
    }

    // Active Project Information
    if (PORTAL_CONFIG.activeJob) {
        const job = PORTAL_CONFIG.activeJob;
        setText("#commProjectCode", job.project_code || ("PRJ-" + job.id));
        setText("#commProjectName", job.project_name || "Residential Hybrid Solar System");

        if (job.inverter_capacity_kva) {
            setText("#commInverterSpec", `${Number(job.inverter_capacity_kva).toFixed(1)}kVA Inverter`);
        }
        if (job.battery_capacity_kwh) {
            setText("#commBatterySpec", `${Number(job.battery_capacity_kwh).toFixed(1)}kWh Battery`);
        }
        if (job.system_capacity_kw) {
            setText("#commPvSpec", `${Number(job.system_capacity_kw).toFixed(1)}kWp Solar PV`);
        }
        const loc = [job.city, job.state].filter(Boolean).join(", ");
        if (loc) {
            setText("#commLocationSpec", loc);
        }
    }

    // Handover Button
    const saveBtn = $("#saveCommissioningBtn");
    const footerNote = $("#commFooterNote");
    if (saveBtn) {
        if (completed === 6) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = "1";
            saveBtn.style.cursor = "pointer";
            saveBtn.style.background = "linear-gradient(135deg, #008000, #044381)";
            saveBtn.innerHTML = `<i class="fa-solid fa-signature"></i> Complete Commissioning &amp; Handover`;
            if (footerNote) {
                footerNote.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#008000;"></i> All 6 evidence stages confirmed. System ready for technical sign-off.`;
            }
        } else {
            saveBtn.disabled = true;
            saveBtn.style.opacity = "0.6";
            saveBtn.style.cursor = "not-allowed";
            saveBtn.style.background = "";
            saveBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Complete All 6 Evidence Stages to Submit (${completed}/6)`;
            if (footerNote) {
                footerNote.innerHTML = `<i class="fa-solid fa-circle-info"></i> Each site tracking required evidence confirmed automatically ticks the corresponding checklist item.`;
            }
        }
    }

    // Timeline Pipeline rendering
    const timeline = $("#commTimeline");
    if (timeline) {
        timeline.innerHTML = COMMISSIONING_ITEMS.map((item, idx) => {
            const isDone = Boolean(SiteTracking?.stages?.[item.stageId]?.complete);
            const isCurrent = !isDone && isStageUnlocked(idx);
            const statusClass = isDone ? 'done' : (isCurrent ? 'active' : 'locked');
            const icon = isDone ? '<i class="fa-solid fa-check"></i>' : (isCurrent ? (idx + 1) : '<i class="fa-solid fa-lock" style="font-size:8px;"></i>');

            return `
                <div class="comm-timeline-step ${statusClass}">
                    <div class="comm-timeline-node">${icon}</div>
                    <span class="comm-timeline-step-label">${idx + 1}. ${item.specName}</span>
                    <span style="font-size:9px; color:${isDone ? '#008000' : (isCurrent ? 'var(--blue)' : 'var(--muted)')}; font-weight:700;">
                        ${isDone ? 'CONFIRMED' : (isCurrent ? 'READY' : 'LOCKED')}
                    </span>
                </div>
            `;
        }).join("");
    }
}

function goToTrackingStage(stageId) {
    showPage("site-tracking");
    setTimeout(() => {
        const card = document.querySelector(`[data-stage-card="${stageId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            card.classList.add("highlight-pulse");
            setTimeout(() => card.classList.remove("highlight-pulse"), 1800);
        }
    }, 180);
}

async function handleSaveCommissioning() {
    const completed = getCompletedStageCount();
    if (completed < 6) {
        showToast(`Please complete and confirm all 6 evidence stages before sign-off (${completed}/6 verified).`, "warning");
        return;
    }

    const projectId = PORTAL_CONFIG.projectId;
    if (!projectId) {
        showToast("No active project selected.", "warning");
        return;
    }

    try {
        showToast("Submitting commissioning sign-off...", "normal");
        const res = await InstallerAPI.post("/api/installers/commissioning", {
            projectId: projectId,
            confirmedStages: COMMISSIONING_ITEMS.map(i => i.stageId),
            signoffDate: new Date().toISOString()
        });

        if (res && res.success) {
            showModal(`
                <div class="modal-heading" style="text-align:center;">
                    <div style="width:56px;height:56px;margin:0 auto 14px;background:#eaf8f0;color:#008000;border-radius:50%;display:grid;place-items:center;font-size:26px;">
                        <i class="fa-solid fa-certificate"></i>
                    </div>
                    <span class="eyebrow" style="color:#008000;">AE RENEWABLE QUALITY ASSURANCE</span>
                    <h3 style="margin-top:6px;">Commissioning Sign-Off Recorded</h3>
                    <p style="margin-top:6px;">All 6 installation stages have been verified and signed off for project <strong>${escapeHtml(PORTAL_CONFIG.projectCode || "PRJ-" + projectId)}</strong>.</p>
                </div>

                <div style="margin:20px 0;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;font-size:11px;line-height:1.7;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="color:#64748b;">Project Reference</span>
                        <strong>${escapeHtml(PORTAL_CONFIG.projectCode || "PRJ-" + projectId)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="color:#64748b;">Checklist Completion</span>
                        <strong style="color:#008000;">6 of 6 Items Verified (100%)</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="color:#64748b;">Handover Status</span>
                        <strong style="color:#044381;">System Handover Completed</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Sign-Off Timestamp</span>
                        <strong>${new Date().toLocaleString()}</strong>
                    </div>
                </div>

                <div style="display:flex;gap:10px;">
                    <button class="primary-btn" type="button" style="width:100%;" onclick="closeModal(); showPage('site-tracking');">
                        View Evidence Summary
                    </button>
                </div>
            `);

            showToast("Project commissioning signed off and recorded successfully!", "success");
            updateProgressEverywhere();
        } else {
            showToast(res?.message || "Failed to save commissioning.", "warning");
        }
    } catch (err) {
        showToast("Error saving commissioning: " + err.message, "warning");
    }
}

async function loadInstallerCommissioning() {
    try {
        const res = await InstallerAPI.get("/api/installers/commissioning");
        if (res && res.success && res.data) {
            const list = Array.isArray(res.data) ? res.data : (res.data.commissioning || []);
            const active = list.find(p => p.id === PORTAL_CONFIG.projectId) || list[0];
            if (active && Array.isArray(active.evidence_stages)) {
                active.evidence_stages.forEach(ev => {
                    const st = ev.stage;
                    if (st && SiteTracking.stages[st]) {
                        SiteTracking.stages[st].complete = true;
                    }
                });
                saveTrackingState();
                renderTracking();
                renderCommissioningChecklist();
                updateCommissioningStatus();
            }
        }
    } catch (err) {
        console.warn("[AE Installer] Commissioning load note:", err.message);
    }
}


/* =========================================================
   MODAL
   ========================================================= */

function showModal(content) {

    const backdrop =
        $("#modalBackdrop");

    const container =
        $("#modalContent");


    if (
        !backdrop ||
        !container
    ) {

        return;

    }


    container.innerHTML =
        content;


    backdrop.classList.add(
        "open"
    );


    backdrop.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}


function closeModal() {

    const backdrop =
        $("#modalBackdrop");


    if (!backdrop) {
        return;
    }


    backdrop.classList.remove(
        "open"
    );


    backdrop.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        $("#toastContainer");


    if (!container) {
        return;
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    let icon =
        "fa-circle-check";


    if (
        type === "warning"
    ) {

        icon =
            "fa-triangle-exclamation";

    }


    if (
        type === "error"
    ) {

        icon =
            "fa-circle-exclamation";

    }


    toast.innerHTML = `

        <i class="fa-solid ${icon}"></i>

        <div class="toast-content">

            <strong>
                AE Network
            </strong>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>

    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "hide"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                250
            );

        },
        3800
    );

}


/* =========================================================
   TEXT HELPER
   ========================================================= */

function setText(
    selector,
    value
) {

    const element =
        $(selector);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
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
   DEVELOPMENT CONSOLE
   ========================================================= */

console.log(
    "%cAE NETWORK INSTALLER PORTAL",
    "font-weight:800;color:#044381;font-size:14px;"
);

console.log(
    "Version 5.0 Premium · Backend Connected"
);


/* =========================================================
   INSTALLER API LAYER — Live Backend Integration
   ========================================================= */

const InstallerAPI = {
    TOKEN_KEYS: [
        "token",
        "accessToken",
        "aeInstallerToken",
        "aeRenewableToken"
    ],

    USER_KEYS: [
        "user",
        "aeInstallerUser",
        "aeRenewableUser"
    ],

    getToken() {
        for (const key of this.TOKEN_KEYS) {
            const val = localStorage.getItem(key);
            if (val) return val;
        }
        return "";
    },

    getUser() {
        for (const key of this.USER_KEYS) {
            try {
                const val = localStorage.getItem(key);
                if (val) return JSON.parse(val);
            } catch {}
        }
        return {};
    },

    headers() {
        const token = this.getToken();
        const h = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        };
        if (token) {
            h["Authorization"] = `Bearer ${token}`;
        }
        return h;
    },

    async get(endpoint) {
        try {
            const res = await fetch(endpoint, {
                method: "GET",
                credentials: "include",
                headers: this.headers()
            });

            if (res.status === 401 || res.status === 403) {
                console.warn(`[InstallerAPI] Access warning on ${endpoint} (${res.status})`);
                return { success: false, data: null, message: `HTTP ${res.status}` };
            }

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.warn(`[InstallerAPI] Non-OK response on ${endpoint}:`, err);
                return { success: false, data: null, message: err.message || `HTTP ${res.status}` };
            }

            return res.json();
        } catch (e) {
            console.warn(`[InstallerAPI] Fetch error on ${endpoint}:`, e.message);
            return { success: false, data: null, message: e.message };
        }
    },

    async post(endpoint, body) {
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                credentials: "include",
                headers: this.headers(),
                body: JSON.stringify(body)
            });

            if (res.status === 401 || res.status === 403) {
                console.warn(`[InstallerAPI] Access warning on POST ${endpoint} (${res.status})`);
                return { success: false, data: null, message: `HTTP ${res.status}` };
            }

            return res.json();
        } catch (e) {
            console.warn(`[InstallerAPI] POST error on ${endpoint}:`, e.message);
            return { success: false, data: null, message: e.message };
        }
    },

    async patch(endpoint, body) {
        try {
            const res = await fetch(endpoint, {
                method: "PATCH",
                credentials: "include",
                headers: this.headers(),
                body: JSON.stringify(body)
            });
            return res.json();
        } catch (e) {
            return { success: false, data: null, message: e.message };
        }
    }
};


/* =========================================================
   INSTALLER PROFILE LOADER — From API
   ========================================================= */

async function loadInstallerProfileFromAPI() {
    try {
        const res = await InstallerAPI.get("/api/installers/me");
        if (!res?.data) return;

        const ins = res.data;

        const name = ins.contact_name || ins.company_name ||
            `${ins.first_name || ""} ${ins.last_name || ""}`.trim() ||
            PORTAL_CONFIG.installerName;

        const initials = getInitials(name);
        const code = ins.installer_code || ins.id || PORTAL_CONFIG.installerId;

        // Update PORTAL_CONFIG
        PORTAL_CONFIG.installerName = name;
        PORTAL_CONFIG.installerId = code;

        // Update all name/avatar elements
        setText("#sidebarInstallerName", name);
        setText("#footerInstallerName", name);
        setText("#topInstallerName", name);
        setText("#profileInstallerName", name);
        setText("#sidebarAvatarInitials", initials);
        setText("#footerAvatarInitials", initials);
        setText("#topAvatarInitials", initials);
        setText("#profileAvatarInitials", initials);
        setText("#installerIdDisplay", code);

        // Populate profile page fields
        const fields = {
            "#profileContactName": name,
            "#profileCompanyName": ins.company_name || "",
            "#profileEmail": ins.contact_email || ins.email || "",
            "#profilePhone": ins.contact_phone || ins.phone || "",
            "#profileState": ins.state || "",
            "#profileLga": ins.lga || "",
            "#profilePosition": ins.position || ins.service_category || "",
            "#profileSpecialization": ins.specialization || "",
            "#profileRcNumber": ins.rc_number || ins.cac_registration_number || "",
            "#profileBankName": ins.bank_name || "",
            "#profileAccountNumber": ins.account_number || "",
            "#profileAccountName": ins.account_name || ""
        };

        for (const [sel, val] of Object.entries(fields)) {
            const el = $(sel);
            if (el) {
                if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
                    el.value = val;
                } else {
                    el.textContent = val;
                }
            }
        }

        // Verification status badge
        const statusEl = $("#profileVerificationStatus");
        if (statusEl) {
            const status = ins.verification_status || ins.status || "pending";
            statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusEl.className = `status-badge ${status === "verified" || status === "active" ? "verified" : "pending"}`;
        }

    } catch (err) {
        console.warn("[AE Installer] Profile API unavailable:", err.message);
    }
}


/* =========================================================
   INSTALLER JOBS LOADER
   ========================================================= */

async function loadInstallerJobs() {
    try {
        const res = await InstallerAPI.get("/api/installers/jobs");
        if (!res?.data) return;

        const allJobs = Array.isArray(res.data) ? res.data : (res.data.jobs || []);

        // Filter into Available (unassigned) and My Jobs (assigned to installer)
        const availableJobs = allJobs.filter(j => !j.installer_id && (j.status === "approved" || j.status === "scheduled"));
        const myJobs = allJobs.filter(j => j.installer_id);

        // Limit available jobs to at most 2 real jobs (per user instruction)
        const displayAvailable = availableJobs.slice(0, 2);

        // Update counts across Dashboard & Navigation
        const availableCount = displayAvailable.length;
        const activeCount = myJobs.filter(j => j.status === "installation" || j.status === "in_progress" || j.status === "installer_assigned").length;
        const commissioningCount = myJobs.filter(j => j.status === "testing" || j.status === "commissioned").length;

        $all("#availableJobCount, #dashJobCount, #availableJobsMetric").forEach(el => {
            if (el) el.textContent = availableCount;
        });
        const navCount = $("#availableJobsNavCount");
        if (navCount) navCount.textContent = availableCount;

        const activeMetric = $("#activeJobsMetric");
        if (activeMetric) activeMetric.textContent = activeCount;

        const commMetric = $("#commissioningMetric");
        if (commMetric) commMetric.textContent = commissioningCount;

        // Set active project for site tracking / commissioning
        const activeJob = myJobs.find(j =>
            j.status === "in_progress" ||
            j.status === "installation" ||
            j.status === "installer_assigned" ||
            j.status === "approved"
        ) || allJobs[0];

        if (activeJob) {
            PORTAL_CONFIG.projectId = activeJob.id;
            PORTAL_CONFIG.projectCode = activeJob.project_code;
            PORTAL_CONFIG.activeJob = activeJob;
            if (typeof updateCommissioningStatus === "function") {
                updateCommissioningStatus();
            }
            console.log("[AE Installer] Active project set:", activeJob.project_code, "(ID:", activeJob.id, ")");
        }

        // Render Available Jobs (Up to 2 real jobs)
        const container = $("#availableJobsList, #jobsContainer");
        if (container) {
            if (!displayAvailable.length) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 16px;">
                        <i class="fa-solid fa-briefcase" style="font-size: 32px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
                        <h3 style="color: #1e293b; font-size: 18px; margin-bottom: 6px;">No Available Jobs Right Now</h3>
                        <p style="color: #64748b; font-size: 13px;">New installations ready for field deployment will appear here in real time.</p>
                    </div>
                `;
            } else {
                container.innerHTML = displayAvailable.map(job => {
                    const solarCap = job.system_capacity_kw ? Number(job.system_capacity_kw).toFixed(1) + " kWp" : "—";
                    const inverterSize = job.inverter_capacity_kva ? Number(job.inverter_capacity_kva).toFixed(1) + " kVA" : "—";
                    const batteryCap = job.battery_capacity_kwh ? Number(job.battery_capacity_kwh).toFixed(1) + " kWh" : "—";
                    const address = [job.site_address, job.city, job.state].filter(Boolean).join(", ") || "Abuja, Nigeria";
                    const clientName = job.client_name || "Valued Client";
                    const labourPrice = Number(
                        job.installation_price ||
                        job.installer_payout ||
                        (job.system_capacity_kw ? Math.round(Math.max(100000, Number(job.system_capacity_kw) * 25000)) : 150000)
                    );
                    const priceFormatted = labourPrice > 0 ? "₦" + labourPrice.toLocaleString() : "₦150,000";

                    return `
                    <article class="job-card" data-job-id="${job.id || ""}">
                        <div class="job-card-top">
                            <span class="job-code">
                                <i class="fa-solid fa-hashtag"></i> ${job.project_code || "PRJ-" + job.id}
                            </span>
                            <span class="status-pill status-available">
                                <i class="fa-solid fa-circle-check"></i> Available
                            </span>
                        </div>

                        <h3>${job.project_name || "Solar Energy Installation"}</h3>

                        <!-- CLIENT & ADDRESS TABLE -->
                        <div class="job-info-table">
                            <div class="job-info-row">
                                <span class="info-label"><i class="fa-solid fa-user-tie"></i> Client Name</span>
                                <strong class="info-value client-name-val">${clientName}</strong>
                            </div>
                            <div class="job-info-row">
                                <span class="info-label"><i class="fa-solid fa-location-dot"></i> Site Address</span>
                                <strong class="info-value address-val">${address}</strong>
                            </div>
                        </div>

                        <!-- SPECIFICATIONS TABLE (COLORED & TABLED) -->
                        <div class="job-specs-table">
                            <div class="spec-cell spec-solar" title="Solar Array Capacity">
                                <div class="spec-icon"><i class="fa-solid fa-solar-panel"></i></div>
                                <span class="spec-title">SOLAR</span>
                                <strong class="spec-num">${solarCap}</strong>
                            </div>

                            <div class="spec-cell spec-inverter" title="Inverter Power Rating">
                                <div class="spec-icon"><i class="fa-solid fa-bolt"></i></div>
                                <span class="spec-title">INVERTER</span>
                                <strong class="spec-num">${inverterSize}</strong>
                            </div>

                            <div class="spec-cell spec-battery" title="Battery Storage Capacity">
                                <div class="spec-icon"><i class="fa-solid fa-battery-full"></i></div>
                                <span class="spec-title">BATTERY</span>
                                <strong class="spec-num">${batteryCap}</strong>
                            </div>
                        </div>

                        <!-- FOOTER WITH INSTALLATION LABOUR PRICE & ACTION -->
                        <div class="job-card-footer">
                            <div class="job-price-group">
                                <span class="price-caption">INSTALLATION PRICE (LABOUR)</span>
                                <strong class="price-amount">${priceFormatted}</strong>
                            </div>

                            <button class="accept-job-btn" onclick="acceptJob('${job.id}', this)" type="button">
                                <i class="fa-solid fa-check"></i> Accept Job
                            </button>
                        </div>
                    </article>`;
                }).join("");
            }
        }

        // Render My Jobs table dynamically from real database projects
        const myJobsTable = $("#myJobsTableBody");
        if (myJobsTable) {
            if (!myJobs.length) {
                myJobsTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:24px;">No active assigned jobs. Accept an available job above to get started.</td></tr>`;
            } else {
                myJobsTable.innerHTML = myJobs.map(j => {
                    const isDone = j.status === "completed" || j.status === "commissioned";
                    const statusClass = isDone ? "status-complete" : "status-progress";
                    const statusLabel = j.status === "installation" ? "In Progress" : (j.status.charAt(0).toUpperCase() + j.status.slice(1).replace(/_/g, ' '));
                    const specs = `${j.system_capacity_kw || 0}kW / ${j.battery_capacity_kwh || 0}kWh`;
                    const location = [j.city, j.state].filter(Boolean).join(", ") || "Abuja, FCT";
                    const progressPercent = isDone ? 100 : (j.status === "testing" ? 85 : 35);
                    return `
                        <tr>
                            <td>
                                <strong>${j.project_code || "PRJ-" + j.id}</strong>
                                <span class="table-subtext">${j.project_name || "Solar Installation"}</span>
                            </td>
                            <td>${location}</td>
                            <td>${specs}</td>
                            <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
                            <td>
                                <div class="table-progress">
                                    <div class="progress">
                                        <span style="width: ${progressPercent}%"></span>
                                    </div>
                                    <small>${progressPercent}%</small>
                                </div>
                            </td>
                            <td>
                                <button class="table-btn" type="button" onclick="setProjectAndTrack('${j.id}', '${j.project_code || ""}')">Track</button>
                            </td>
                        </tr>
                    `;
                }).join("");
            }
        }

    } catch (err) {
        console.warn("[AE Installer] Jobs API unavailable:", err.message);
    }
}


async function acceptJob(jobId, btn) {
    if (!jobId) return;
    try {
        btn.disabled = true;
        btn.textContent = "Accepting...";
        const res = await InstallerAPI.post(`/api/installers/jobs/${jobId}/accept`, {});
        if (res?.success) {
            showToast("Job accepted! Check My Jobs for details.", "success");
            btn.textContent = "Accepted ✓";
            btn.style.background = "#22c55e";
            await loadInstallerJobs();
        } else {
            showToast(res?.message || "Could not accept job at this time.", "error");
            btn.disabled = false;
            btn.textContent = "Accept Job";
        }
    } catch (err) {
        showToast("Network error — please try again.", "error");
        btn.disabled = false;
        btn.textContent = "Accept Job";
    }
}


/* =========================================================
   INSTALLER DOCUMENTS LOADER
   ========================================================= */

async function loadInstallerDocuments() {
    try {
        const res = await InstallerAPI.get("/api/installers/documents");
        if (!res?.data) return;

        const docs = Array.isArray(res.data) ? res.data : (res.data.documents || []);
        if (!docs.length) return;

        const container = $("#documentsList, #installerDocuments");
        if (!container) return;

        container.innerHTML = docs.map(doc => `
            <div class="document-card">
                <div class="doc-type-icon">${getDocIcon(doc.document_type || doc.file_type || "pdf")}</div>
                <div class="doc-info">
                    <strong>${doc.document_name || doc.file_name || "Document"}</strong>
                    <small>${doc.document_type || doc.file_type || "PDF"} • ${
                        doc.file_size_bytes
                            ? (doc.file_size_bytes / 1024 / 1024).toFixed(1) + " MB"
                            : "—"
                    }</small>
                    <small>${doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-GB") : ""}</small>
                </div>
                <a href="${doc.file_url || doc.url || "#"}" target="_blank" class="doc-download-btn" download>
                    Download
                </a>
            </div>
        `).join("");

    } catch (err) {
        console.warn("[AE Installer] Documents API unavailable:", err.message);
    }
}

function getDocIcon(type) {
    const icons = { pdf: "📄", image: "🖼️", jpg: "🖼️", png: "🖼️", xls: "📊", xlsx: "📊", doc: "📝", docx: "📝" };
    return icons[type.toLowerCase()] || "📁";
}


/* =========================================================
   INSTALLER PAYMENTS LOADER
   ========================================================= */

async function loadInstallerPayments() {
    try {
        const res = await InstallerAPI.get("/api/installers/payments");
        if (!res?.data) return;

        const payments = Array.isArray(res.data) ? res.data : (res.data.payments || []);

        // Real financial metrics calculation
        const pendingPayments = payments.filter(p =>
            p.payment_status === "requested" ||
            p.payment_status === "pending" ||
            p.payment_status === "processing"
        );
        const pendingTotal = pendingPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        const completedPayments = payments.filter(p =>
            p.payment_status === "approved" ||
            p.payment_status === "completed" ||
            p.payment_status === "successful" ||
            p.payment_status === "paid"
        );
        const completedTotal = completedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthPayments = completedPayments.filter(p => {
            const d = new Date(p.transaction_date || p.updated_at || p.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Update Dashboard Metric (Pending Payouts)
        const pendingPayoutsMetric = $("#pendingPayoutsMetric");
        if (pendingPayoutsMetric) {
            pendingPayoutsMetric.textContent = pendingTotal > 0 ? "₦" + pendingTotal.toLocaleString() : "₦0";
        }

        // Update Finance Page Metrics
        const payoutPendingMetric = $("#payoutPendingMetric");
        if (payoutPendingMetric) {
            payoutPendingMetric.textContent = pendingTotal > 0 ? "₦" + pendingTotal.toLocaleString() : "₦0";
        }

        const payoutThisMonthMetric = $("#payoutThisMonthMetric");
        if (payoutThisMonthMetric) {
            payoutThisMonthMetric.textContent = thisMonthTotal > 0 ? "₦" + thisMonthTotal.toLocaleString() : "₦0";
        }

        const payoutTotalPaidMetric = $("#payoutTotalPaidMetric");
        if (payoutTotalPaidMetric) {
            payoutTotalPaidMetric.textContent = completedTotal > 0 ? "₦" + completedTotal.toLocaleString() : "₦0";
        }

        const totalEarnings = $("#totalEarnings");
        if (totalEarnings) {
            totalEarnings.textContent = completedTotal > 0 ? "₦" + completedTotal.toLocaleString() : "₦0";
        }

        // Render Payouts Table
        const payoutsTableBody = $("#payoutsTableBody");
        if (payoutsTableBody) {
            if (!payments.length) {
                payoutsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 24px;">No payout requests recorded yet.</td></tr>`;
            } else {
                payoutsTableBody.innerHTML = payments.map(p => {
                    const isPaid = p.payment_status === "approved" || p.payment_status === "completed" || p.payment_status === "successful";
                    const isPending = p.payment_status === "requested" || p.payment_status === "pending" || p.payment_status === "processing";
                    const pillClass = isPaid ? "status-complete" : (isPending ? "status-progress" : "status-pending");
                    const statusText = isPaid ? "Paid" : (p.payment_status === "requested" ? "Requested" : (p.payment_status.charAt(0).toUpperCase() + p.payment_status.slice(1)));
                    const dateStr = p.transaction_date || p.created_at ? new Date(p.transaction_date || p.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "—";
                    return `
                        <tr>
                            <td>
                                <strong>${p.project_code || p.payment_reference || "PRJ"}</strong>
                                <span class="table-subtext">${p.description || "Field Installation Payout"}</span>
                            </td>
                            <td>${dateStr}</td>
                            <td><strong>₦${Number(p.amount || 0).toLocaleString()}</strong></td>
                            <td><span class="status-pill ${pillClass}">${statusText}</span></td>
                        </tr>
                    `;
                }).join("");
            }
        }
    } catch (err) {
        console.warn("[AE Installer] Payments API unavailable:", err.message);
    }
}


/* =========================================================
   INSTALLER NOTIFICATIONS LOADER
   ========================================================= */

async function loadInstallerNotifications() {
    try {
        const res = await InstallerAPI.get("/api/installers/notifications");
        if (!res?.data) return;

        const notifs = Array.isArray(res.data) ? res.data : (res.data.notifications || []);
        const unread = notifs.filter(n => !n.is_read).length;

        // Update notification badges & counts across portal
        const badge = $("#notificationBadge");
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? "" : "none";
        }

        const navCount = $("#notificationNavCount");
        if (navCount) {
            navCount.textContent = unread;
            navCount.style.display = unread > 0 ? "inline-flex" : "none";
        }

        const topDot = $("#topNotificationDot");
        if (topDot) {
            topDot.style.display = unread > 0 ? "block" : "none";
        }

        // Populate notifications page
        const container = $("#notificationsList, #page-notifications .notifications-container");
        if (!container) return;

        if (!notifs.length) {
            container.innerHTML = `
                <div style="text-align: center; padding: 48px 20px; color: #64748b;">
                    <i class="fa-regular fa-bell-slash" style="font-size: 32px; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
                    <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 4px;">No Notifications</h3>
                    <p style="font-size: 13px; margin: 0;">Live project updates, verification status alerts, and payout confirmations will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifs.map(n => {
            const isUnread = !n.is_read;
            const priorityClass = n.priority === "high" ? "priority-high" : (n.priority === "urgent" ? "priority-urgent" : "");
            const dateStr = n.created_at ? timeAgoInstaller(new Date(n.created_at)) : "Recently";
            const iconMap = {
                assignment: "fa-briefcase",
                verification: "fa-shield-halved",
                banking: "fa-building-columns",
                commissioning: "fa-screwdriver-wrench",
                payment: "fa-money-bill-wave",
                system: "fa-bell"
            };
            const icon = iconMap[n.type] || "fa-bell";

            return `
                <div class="notification-item ${isUnread ? "unread" : "read"} ${priorityClass}" data-notif-id="${n.id || ""}" onclick="markNotificationRead('${n.id || ""}', this)">
                    <div class="notif-indicator" style="display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:${isUnread ? '#e0f2fe' : '#f1f5f9'}; color:${isUnread ? '#0284c7' : '#64748b'}; font-size:15px; flex-shrink:0;">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="notif-content" style="flex:1;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 4px;">
                            <strong style="color: #0f172a; font-size: 14px;">${escapeHtml(n.title || n.type || "Notification")}</strong>
                            <small style="color: #94a3b8; font-size: 11px; white-space: nowrap;">${dateStr}</small>
                        </div>
                        <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.45;">${escapeHtml(n.message || "")}</p>
                    </div>
                    ${isUnread ? `<span style="width:8px; height:8px; border-radius:50%; background:#0284c7; flex-shrink:0;" title="Unread"></span>` : ""}
                </div>
            `;
        }).join("");

    } catch (err) {
        console.warn("[AE Installer] Notifications API unavailable:", err.message);
    }
}

async function markNotificationRead(notifId, el) {
    if (!notifId) return;
    try {
        if (el) {
            el.classList.remove("unread");
            el.classList.add("read");
            const pip = el.querySelector("span[title='Unread']");
            if (pip) pip.remove();
        }
        await InstallerAPI.patch(`/api/installers/notifications/${notifId}/read`, {});
        const remainingUnread = document.querySelectorAll("#notificationsList .notification-item.unread").length;
        const navCount = $("#notificationNavCount");
        if (navCount) {
            navCount.textContent = remainingUnread;
            navCount.style.display = remainingUnread > 0 ? "inline-flex" : "none";
        }
        const topDot = $("#topNotificationDot");
        if (topDot) {
            topDot.style.display = remainingUnread > 0 ? "block" : "none";
        }
    } catch (e) {}
}

function timeAgoInstaller(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}


/* =========================================================
   INSTALLER PROFILE, SETTLEMENT & VERIFICATION LOGIC
   ========================================================= */

let currentInstallerData = null;
let pendingProfilePhotoBase64 = null;

// Mask rule: 3 starting digits open, 4 ending digits open, rest *
function maskSensitiveDigits(val) {
    if (!val) return "";
    const str = String(val).trim();
    if (str.length <= 7) return str;
    const start = str.slice(0, 3);
    const end = str.slice(-4);
    const maskedLength = Math.max(1, str.length - 7);
    return `${start}${"*".repeat(maskedLength)}${end}`;
}

async function loadInstallerProfileFromAPI() {
    try {
        const res = await InstallerAPI.get("/api/installers/me");
        if (!res || !res.data) {
            console.warn("[AE Installer] No installer profile data returned from /api/installers/me");
            return;
        }

        currentInstallerData = res.data;
        renderInstallerProfile(currentInstallerData);
    } catch (err) {
        console.warn("[AE Installer] Profile API unavailable:", err.message);
    }
}

function renderInstallerProfile(installer) {
    if (!installer) return;

    const fullName = installer.contact_name || installer.company_name || PORTAL_CONFIG.installerName || "Eniola Abdulrasaq";
    const installerCode = installer.installer_code || PORTAL_CONFIG.installerId || "AEI-0001";
    const email = installer.email || installer.user_email || "AERenewablesolution@gmail.com";
    const phone = installer.phone || installer.user_phone || "+2348133615132";
    const state = installer.state || "FCT Abuja";
    const specialization = installer.specialization || (Array.isArray(installer.specializations) ? installer.specializations.join(", ") : "Solar Installation & Inverter Systems");
    const photo = installer.profile_image || pendingProfilePhotoBase64 || null;

    // 1. Profile Avatar & Initials
    const initials = fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join("") || "EA";

    const avatarImg = $("#profileAvatarImg");
    const avatarInitials = $("#profileAvatarInitials");
    const sidebarInitials = $("#sidebarAvatarInitials");
    const footerInitials = $("#footerAvatarInitials");
    const topAvatarImg = $("#topAvatarImg");
    const topAvatarInitials = $("#topAvatarInitials");
    const brandLogoImg = $("#brandLogoImg");
    const miniAvatarBox = $(".mini-avatar");
    const footerAvatarBox = $(".profile-avatar");

    if (sidebarInitials) sidebarInitials.textContent = initials;
    if (footerInitials) footerInitials.textContent = initials;
    if (topAvatarInitials) topAvatarInitials.textContent = initials;

    if (photo) {
        if (avatarImg) {
            avatarImg.src = photo;
            avatarImg.style.display = "block";
        }
        if (avatarInitials) avatarInitials.style.display = "none";

        // Requirement: on the header logo image the installer image should appear there
        if (brandLogoImg) {
            brandLogoImg.src = photo;
            brandLogoImg.style.borderRadius = "9px";
            brandLogoImg.style.objectFit = "cover";
            brandLogoImg.alt = fullName + " - Certified Installer";
        }

        // Header topbar avatar
        if (topAvatarImg) {
            topAvatarImg.src = photo;
            topAvatarImg.style.display = "block";
        }
        if (topAvatarInitials) topAvatarInitials.style.display = "none";

        // Mini sidebar avatar
        if (miniAvatarBox) {
            miniAvatarBox.innerHTML = `<img src="${photo}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        }

        // Sidebar footer avatar
        if (footerAvatarBox) {
            footerAvatarBox.innerHTML = `<img src="${photo}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        }
    } else {
        if (avatarImg) avatarImg.style.display = "none";
        if (avatarInitials) {
            avatarInitials.textContent = initials;
            avatarInitials.style.display = "block";
        }
        if (topAvatarImg) topAvatarImg.style.display = "none";
        if (topAvatarInitials) topAvatarInitials.style.display = "block";
    }

    // 2. Identity info
    setText("#profileInstallerName", fullName);
    setText("#topInstallerName", fullName);
    setText("#sidebarInstallerName", fullName.split(" ")[0]);
    setText("#footerInstallerName", fullName);
    setText("#profileSidebarCode", installerCode);

    // 3. Protected fields (1: Installer ID, 2: Email, 3: Phone)
    const codeInput = $("#profileInstallerId");
    if (codeInput) codeInput.value = installerCode;

    const emailInput = $("#profileEmail");
    if (emailInput) emailInput.value = email;

    const phoneInput = $("#profilePhone");
    if (phoneInput) phoneInput.value = phone;

    const nameInput = $("#profileFullName");
    if (nameInput) nameInput.value = fullName;

    const stateInput = $("#profileState");
    if (stateInput) stateInput.value = state;

    const specInput = $("#profileSpecialization");
    if (specInput) specInput.value = specialization;

    // 4. Banking Form & Verification Status Handling
    const bankNameInput = $("#profileBankName");
    const accNameInput = $("#profileAccountName");
    const accNumInput = $("#profileAccountNumber");
    const bvnInput = $("#profileAccountBvn");

    const badge = $("#bankingVerificationBadge");
    const miniBadge = $("#profileBankingBadgeMini");
    const statusText = $("#profileVerificationText");
    const noticeBanner = $("#bankingNoticeBanner");
    const noticeTitle = $("#bankingNoticeTitle");
    const noticeText = $("#bankingNoticeText");

    const btnSubmit = $("#btnSubmitBanking");
    const btnUnlock = $("#btnRequestBankUnlock");
    const accLockTag = $("#accNumberLockTag");
    const bvnLockTag = $("#bvnLockTag");
    const accHint = $("#accNumberHint");
    const bvnHint = $("#bvnHint");

    const bankingStatus = (installer.banking_verification_status || (installer.bank_name ? "pending" : "unverified")).toLowerCase();

    if (bankingStatus === "verified" || bankingStatus === "approved") {
        // STATE: VERIFIED & LOCKED
        if (badge) {
            badge.className = "status-pill status-complete";
            badge.innerHTML = `<i class="fa-solid fa-shield-check"></i> Verified Bank Account`;
        }
        if (miniBadge) {
            miniBadge.className = "status-pill status-complete";
            miniBadge.innerHTML = `<i class="fa-solid fa-shield-check"></i> Banking: Verified`;
        }
        if (statusText) {
            statusText.className = "text-green";
            statusText.textContent = "Verified";
        }
        if (noticeBanner) {
            noticeBanner.className = "banking-notice-banner notice-verified";
        }
        if (noticeTitle) noticeTitle.textContent = "Verified Settlement Account (Locked)";
        if (noticeText) noticeText.innerHTML = "Your banking details are verified and permanently locked to protect your account. In accordance with security policy, verified accounts cannot be changed directly unless you request from Admin and authorization is granted.";

        if (bankNameInput) {
            bankNameInput.value = installer.bank_name || "";
            bankNameInput.readOnly = true;
            bankNameInput.classList.add("locked-input");
        }
        if (accNameInput) {
            accNameInput.value = installer.account_name || "";
            accNameInput.readOnly = true;
            accNameInput.classList.add("locked-input");
        }
        if (accNumInput) {
            accNumInput.value = maskSensitiveDigits(installer.account_number);
            accNumInput.readOnly = true;
            accNumInput.classList.add("locked-input");
        }
        if (bvnInput) {
            bvnInput.value = maskSensitiveDigits(installer.account_bvn);
            bvnInput.readOnly = true;
            bvnInput.classList.add("locked-input");
        }

        if (accLockTag) accLockTag.style.display = "block";
        if (bvnLockTag) bvnLockTag.style.display = "block";
        if (accHint) accHint.textContent = "(3 first & 4 ending digits open, rest *)";
        if (bvnHint) bvnHint.textContent = "(Masked for security)";

        if (btnSubmit) btnSubmit.style.display = "none";
        if (btnUnlock) btnUnlock.style.display = "inline-flex";

    } else if (bankingStatus === "pending") {
        // STATE: PENDING VERIFICATION
        if (badge) {
            badge.className = "status-pill status-pending";
            badge.innerHTML = `<i class="fa-solid fa-clock"></i> Pending Verify`;
        }
        if (miniBadge) {
            miniBadge.className = "status-pill status-pending";
            miniBadge.innerHTML = `<i class="fa-solid fa-clock"></i> Banking: Pending Verify`;
        }
        if (statusText) {
            statusText.className = "text-gold";
            statusText.textContent = "Pending Verify";
        }
        if (noticeBanner) {
            noticeBanner.className = "banking-notice-banner notice-pending";
        }
        if (noticeTitle) noticeTitle.textContent = "Pending Admin Verification";
        if (noticeText) noticeText.innerHTML = "Your account details and verification photo have been submitted and are currently <strong>Pending Verify</strong> by the Admin. Once verified, this card will lock permanently as part of your profile.";

        if (bankNameInput) {
            bankNameInput.value = installer.bank_name || "";
            bankNameInput.readOnly = true;
            bankNameInput.classList.add("locked-input");
        }
        if (accNameInput) {
            accNameInput.value = installer.account_name || "";
            accNameInput.readOnly = true;
            accNameInput.classList.add("locked-input");
        }
        if (accNumInput) {
            accNumInput.value = maskSensitiveDigits(installer.account_number);
            accNumInput.readOnly = true;
            accNumInput.classList.add("locked-input");
        }
        if (bvnInput) {
            bvnInput.value = maskSensitiveDigits(installer.account_bvn);
            bvnInput.readOnly = true;
            bvnInput.classList.add("locked-input");
        }

        if (accLockTag) accLockTag.style.display = "block";
        if (bvnLockTag) bvnLockTag.style.display = "block";
        if (accHint) accHint.textContent = "(3 first & 4 ending digits open, rest *)";
        if (bvnHint) bvnHint.textContent = "(Masked for security)";

        if (btnSubmit) {
            btnSubmit.style.display = "inline-flex";
            btnSubmit.disabled = true;
            btnSubmit.style.opacity = "0.75";
            btnSubmit.style.cursor = "not-allowed";
            btnSubmit.innerHTML = `<i class="fa-solid fa-clock"></i> Card Pending Admin Verification`;
        }
        if (btnUnlock) btnUnlock.style.display = "none";

    } else {
        // STATE: ACTION REQUIRED / READY TO FILL
        if (badge) {
            badge.className = "status-pill status-warning";
            badge.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Action Required`;
        }
        if (miniBadge) {
            miniBadge.className = "status-pill status-warning";
            miniBadge.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Banking: Action Required`;
        }
        if (statusText) {
            statusText.className = "text-muted";
            statusText.textContent = "Unregistered";
        }
        if (noticeBanner) {
            noticeBanner.className = "banking-notice-banner notice-info";
        }
        if (noticeTitle) noticeTitle.textContent = "Bank Details & Photo Registration";
        if (noticeText) noticeText.innerHTML = "Fill in your official bank account details and capture your installer image. After clicking Submit, your card will indicate <strong>Pending Verify</strong> until approved by the Admin.";

        if (bankNameInput) {
            bankNameInput.value = installer.bank_name || "";
            bankNameInput.readOnly = false;
            bankNameInput.classList.remove("locked-input");
        }
        if (accNameInput) {
            accNameInput.value = installer.account_name || "";
            accNameInput.readOnly = false;
            accNameInput.classList.remove("locked-input");
        }
        if (accNumInput) {
            accNumInput.value = installer.account_number || "";
            accNumInput.readOnly = false;
            accNumInput.classList.remove("locked-input");
        }
        if (bvnInput) {
            bvnInput.value = installer.account_bvn || "";
            bvnInput.readOnly = false;
            bvnInput.classList.remove("locked-input");
        }

        if (accLockTag) accLockTag.style.display = "none";
        if (bvnLockTag) bvnLockTag.style.display = "none";
        if (accHint) accHint.textContent = "";
        if (bvnHint) bvnHint.textContent = "";

        if (btnSubmit) {
            btnSubmit.style.display = "inline-flex";
            btnSubmit.disabled = false;
            btnSubmit.style.opacity = "";
            btnSubmit.style.cursor = "pointer";
            btnSubmit.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Submit Settlement Details & Photo`;
        }
        if (btnUnlock) btnUnlock.style.display = "none";
    }
}

async function submitBankingDetails(event) {
    if (event) event.preventDefault();

    const bankingStatus = (currentInstallerData?.banking_verification_status || "").toLowerCase();
    if (bankingStatus === "verified") {
        showToast("Your verified banking details are locked. Please request admin approval to make changes.", "error");
        return;
    }
    if (bankingStatus === "pending") {
        showToast("Your submission is already Pending Verification by Admin. Please await approval.", "warning");
        return;
    }

    const bankName = ($("#profileBankName")?.value || "").trim();
    const accountName = ($("#profileAccountName")?.value || "").trim();
    const accountNumber = ($("#profileAccountNumber")?.value || "").trim().replace(/\D/g, "");
    const accountBvn = ($("#profileAccountBvn")?.value || "").trim().replace(/\D/g, "");

    if (!bankName) {
        showToast("Please enter or select your Bank Name.", "error");
        $("#profileBankName")?.focus();
        return;
    }
    if (!accountName) {
        showToast("Please enter the official Account Name.", "error");
        $("#profileAccountName")?.focus();
        return;
    }
    if (!accountNumber || accountNumber.length !== 10) {
        showToast("Please enter a valid 10-digit NUBAN Account Number.", "error");
        $("#profileAccountNumber")?.focus();
        return;
    }
    if (!accountBvn || accountBvn.length !== 11) {
        showToast("Please enter a valid 11-digit BVN.", "error");
        $("#profileAccountBvn")?.focus();
        return;
    }

    const photoToUpload = pendingProfilePhotoBase64 || currentInstallerData?.profile_image || null;

    const submitBtn = $("#btnSubmitBanking");
    const originalText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting for Verification...`;
    }

    try {
        const payload = {
            bankName,
            accountName,
            accountNumber,
            accountBvn
        };
        if (photoToUpload) {
            payload.profileImage = photoToUpload;
        }

        const res = await InstallerAPI.patch("/api/installers/me", payload);
        if (res && res.success) {
            showToast("Account details & photo submitted! Card status: Pending Verify.", "success");
            currentInstallerData = res.data;
            renderInstallerProfile(currentInstallerData);
        } else {
            showToast(res?.message || "Failed to submit settlement details.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    } catch (err) {
        showToast(err.message || "Network error submitting details.", "error");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/* =========================================================
   OFFICIAL CAMERA PROFILE PHOTO CAPTURE & VALIDATION SYSTEM
   ========================================================= */

let cameraMediaStream = null;
let capturedSnapshotDataUrl = null;
let isCaptureValid = false;
let liveFeedTimer = null;

async function openCameraModal() {
    const modalBackdrop = $("#cameraModalBackdrop");
    const video = $("#cameraVideo");
    const canvas = $("#cameraCanvas");
    const liveControls = $("#cameraLiveControls");
    const reviewControls = $("#cameraReviewControls");
    const errorOverlay = $("#cameraErrorOverlay");
    const feedback = $("#validationFeedback");
    const confirmationBox = $("#cameraConfirmationBox");
    const chkEars = $("#chkEarsVisible");
    const oval = $(".face-guide-oval");

    if (!modalBackdrop) return;

    // Reset UI state
    modalBackdrop.style.display = "grid";
    if (canvas) canvas.style.display = "none";
    if (video) video.style.display = "block";
    if (liveControls) liveControls.style.display = "flex";
    if (reviewControls) reviewControls.style.display = "none";
    if (errorOverlay) errorOverlay.style.display = "none";
    if (feedback) feedback.style.display = "none";
    if (confirmationBox) confirmationBox.style.display = "none";
    if (chkEars) chkEars.checked = false;
    if (oval) oval.classList.remove("valid");
    capturedSnapshotDataUrl = null;
    isCaptureValid = false;
    resetValidationIndicators();

    // Start live camera
    await startCameraStream();
}

async function startCameraStream() {
    const video = $("#cameraVideo");
    const errorOverlay = $("#cameraErrorOverlay");
    const errorTitle = $("#cameraErrorTitle");
    const errorMsg = $("#cameraErrorMessage");

    // Close any previous stream
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (errorOverlay) {
            errorOverlay.style.display = "flex";
            if (errorTitle) errorTitle.textContent = "Camera Not Supported";
            if (errorMsg) errorMsg.textContent = "Your browser does not support direct camera capture. You can upload an image file instead.";
        }
        return;
    }

    try {
        // Request camera with preference for front-facing user camera
        const constraints = {
            video: {
                facingMode: "user",
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraMediaStream = stream;

        if (video) {
            video.srcObject = stream;
            await video.play();
        }

        if (errorOverlay) errorOverlay.style.display = "none";

        // Begin live check
        initLiveFeedCheck();

    } catch (err) {
        console.warn("[Camera Capture] getUserMedia error:", err);
        if (errorOverlay) {
            errorOverlay.style.display = "flex";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                if (errorTitle) errorTitle.textContent = "Camera Access Blocked";
                if (errorMsg) errorMsg.textContent = "Camera permission was denied. Please allow camera access in your browser address bar settings to capture your official photo.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                if (errorTitle) errorTitle.textContent = "No Camera Detected";
                if (errorMsg) errorMsg.textContent = "No camera hardware was detected on your device. You can connect a webcam or upload an image file.";
            } else {
                if (errorTitle) errorTitle.textContent = "Camera Initialization Error";
                if (errorMsg) errorMsg.textContent = `Unable to start camera (${err.message || "Unknown error"}). Try again or upload an image file.`;
            }
        }
    }
}

function stopCameraStream() {
    if (liveFeedTimer) {
        clearInterval(liveFeedTimer);
        liveFeedTimer = null;
    }
    if (cameraMediaStream) {
        try {
            cameraMediaStream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        cameraMediaStream = null;
    }
    const video = $("#cameraVideo");
    if (video) video.srcObject = null;
}

function closeCameraModal() {
    stopCameraStream();
    const modalBackdrop = $("#cameraModalBackdrop");
    if (modalBackdrop) modalBackdrop.style.display = "none";
}

function resetValidationIndicators() {
    ["ruleLighting", "ruleFace", "ruleEars"].forEach(id => {
        const el = $(`#${id}`);
        if (el) {
            el.className = "validation-rule-item";
            const icon = el.querySelector("i");
            if (icon) icon.className = "fa-solid fa-circle-check";
        }
    });
}

function updateValidationRule(id, passed, labelText) {
    const el = $(`#${id}`);
    if (!el) return;
    el.className = `validation-rule-item ${passed ? "passed" : "failed"}`;
    const icon = el.querySelector("i");
    if (icon) {
        icon.className = passed ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark";
    }
    if (labelText) {
        const span = el.querySelector("span");
        if (span) span.textContent = labelText;
    }
}

// Pixel luminance & contrast analysis
function analyzeLightingAndQuality(ctx, width, height) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    let totalLuminance = 0;
    let sampled = 0;

    for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        sampled++;
    }

    const avgLuminance = totalLuminance / Math.max(1, sampled);

    if (avgLuminance < 38) {
        return {
            passed: false,
            message: "Lighting is too low. Please move to a brighter, well-lit area.",
            avgLuminance
        };
    }
    if (avgLuminance > 232) {
        return {
            passed: false,
            message: "Lighting is too bright or washed out. Please avoid excessive direct flash/glare.",
            avgLuminance
        };
    }

    return {
        passed: true,
        message: "Lighting is optimal.",
        avgLuminance
    };
}

function initLiveFeedCheck() {
    if (liveFeedTimer) clearInterval(liveFeedTimer);
    liveFeedTimer = setInterval(async () => {
        const video = $("#cameraVideo");
        const oval = $(".face-guide-oval");
        if (!video || video.paused || video.ended || !video.videoWidth) return;

        if ("FaceDetector" in window) {
            try {
                const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
                const faces = await detector.detect(video);
                if (faces && faces.length === 1 && oval) {
                    oval.classList.add("valid");
                    updateValidationRule("ruleFace", true, "Face In Alignment");
                } else if (oval) {
                    oval.classList.remove("valid");
                }
            } catch (e) {}
        }
    }, 1000);
}

async function capturePhotoSnapshot() {
    const video = $("#cameraVideo");
    const canvas = $("#cameraCanvas");
    const liveControls = $("#cameraLiveControls");
    const reviewControls = $("#cameraReviewControls");
    const confirmationBox = $("#cameraConfirmationBox");
    const feedback = $("#validationFeedback");
    const oval = $(".face-guide-oval");

    if (!video || !canvas) return;

    if (liveFeedTimer) {
        clearInterval(liveFeedTimer);
        liveFeedTimer = null;
    }

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    // Centered square crop around face reticle
    const minDim = Math.min(vWidth, vHeight);
    const startX = Math.round((vWidth - minDim) / 2);
    const startY = Math.round((vHeight - minDim) / 2);

    const cropSize = Math.max(640, minDim);
    canvas.width = cropSize;
    canvas.height = cropSize;

    const ctx = canvas.getContext("2d");
    // Mirror horizontally to match the front camera mirror preview
    ctx.translate(cropSize, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(
        video,
        startX, startY, minDim, minDim,
        0, 0, cropSize, cropSize
    );

    // Reset canvas transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Freeze view on canvas
    video.style.display = "none";
    canvas.style.display = "block";

    // 1. Lighting analysis
    const lightResult = analyzeLightingAndQuality(ctx, cropSize, cropSize);
    updateValidationRule("ruleLighting", lightResult.passed, lightResult.passed ? "Good Lighting" : "Poor Lighting");

    // 2. Face Detection where supported
    let facePassed = true;
    let faceMessage = "";

    if ("FaceDetector" in window) {
        try {
            const detector = new window.FaceDetector({ fastMode: false, maxDetectedFaces: 5 });
            const faces = await detector.detect(canvas);

            if (faces.length === 0) {
                facePassed = false;
                faceMessage = "Face not detected. Please position your face directly inside the frame.";
            } else if (faces.length > 1) {
                facePassed = false;
                faceMessage = "Only one person should be inside the capture frame.";
            } else {
                const face = faces[0].boundingBox;
                const faceCenterX = face.x + face.width / 2;
                const faceCenterY = face.y + face.height / 2;
                const offX = Math.abs(faceCenterX - cropSize / 2) / cropSize;
                const offY = Math.abs(faceCenterY - cropSize / 2) / cropSize;

                if (offX > 0.28 || offY > 0.32) {
                    facePassed = false;
                    faceMessage = "Face is not centered. Please align face inside the guide frame.";
                } else if (face.width < cropSize * 0.22) {
                    facePassed = false;
                    faceMessage = "Face is too far from camera. Please move closer.";
                } else {
                    facePassed = true;
                }
            }
        } catch (detectErr) {
            console.warn("FaceDetector check:", detectErr);
            facePassed = true;
        }
    } else {
        facePassed = true;
    }

    updateValidationRule("ruleFace", facePassed, facePassed ? "Face Forward & Centered" : "Alignment Error");

    // Switch to review controls
    if (liveControls) liveControls.style.display = "none";
    if (reviewControls) reviewControls.style.display = "flex";
    if (confirmationBox) confirmationBox.style.display = "block";

    const overallPassed = lightResult.passed && facePassed;
    isCaptureValid = overallPassed;

    if (feedback) {
        feedback.style.display = "flex";
        if (overallPassed) {
            feedback.className = "validation-feedback-ribbon success";
            feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> Quality verified! Confirm both ears are visible and click "Confirm & Use Photo".`;
            if (oval) oval.classList.add("valid");
        } else {
            feedback.className = "validation-feedback-ribbon error";
            feedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${!lightResult.passed ? lightResult.message : faceMessage}`;
            if (oval) oval.classList.remove("valid");
        }
    }

    capturedSnapshotDataUrl = canvas.toDataURL("image/jpeg", 0.90);
}

function retakePhoto() {
    const video = $("#cameraVideo");
    const canvas = $("#cameraCanvas");
    const liveControls = $("#cameraLiveControls");
    const reviewControls = $("#cameraReviewControls");
    const confirmationBox = $("#cameraConfirmationBox");
    const feedback = $("#validationFeedback");
    const oval = $(".face-guide-oval");
    const chkEars = $("#chkEarsVisible");

    if (canvas) canvas.style.display = "none";
    if (video) video.style.display = "block";
    if (liveControls) liveControls.style.display = "flex";
    if (reviewControls) reviewControls.style.display = "none";
    if (confirmationBox) confirmationBox.style.display = "none";
    if (feedback) feedback.style.display = "none";
    if (oval) oval.classList.remove("valid");
    if (chkEars) chkEars.checked = false;

    capturedSnapshotDataUrl = null;
    isCaptureValid = false;
    resetValidationIndicators();

    initLiveFeedCheck();
}

async function confirmAndUsePhoto() {
    if (!capturedSnapshotDataUrl) {
        showToast("Please capture a photo first.", "error");
        return;
    }

    if (!isCaptureValid) {
        showToast("Photo does not meet verification requirements. Please retake following the guide.", "warning");
        return;
    }

    const chkEars = $("#chkEarsVisible");
    if (chkEars && !chkEars.checked) {
        showToast("Please confirm that both ears are visible by checking the verification box.", "warning");
        chkEars.focus();
        return;
    }

    updateValidationRule("ruleEars", true, "Ears Confirmed Visible");

    const confirmBtn = $("#btnConfirmPhoto");
    const originalText = confirmBtn ? confirmBtn.innerHTML : "";
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving to Backend...`;
    }

    try {
        const res = await InstallerAPI.post("/api/installers/me/photo", {
            photoBase64: capturedSnapshotDataUrl
        });

        if (res && res.success) {
            const permanentUrl = res.data?.profileImage || capturedSnapshotDataUrl;

            pendingProfilePhotoBase64 = permanentUrl;
            if (currentInstallerData) {
                currentInstallerData.profile_image = permanentUrl;
                renderInstallerProfile(currentInstallerData);
            }

            const avatarImg = $("#profileAvatarImg");
            const avatarInitials = $("#profileAvatarInitials");
            if (avatarImg) {
                avatarImg.src = permanentUrl;
                avatarImg.style.display = "block";
            }
            if (avatarInitials) avatarInitials.style.display = "none";

            const hint = $("#photoStatusHint");
            if (hint) {
                hint.textContent = "✓ Official photo saved and linked to your profile";
                hint.style.color = "#10b981";
                hint.style.fontWeight = "bold";
            }

            closeCameraModal();
            showToast("Official profile photo captured and saved successfully!", "success");
        } else {
            showToast(res?.message || "Failed to save photo to backend.", "error");
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalText;
            }
        }
    } catch (err) {
        showToast(err.message || "Network error saving profile photo.", "error");
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalText;
        }
    }
}

function setupPhotoCapture() {
    const triggerBtn = $("#btnTriggerPhoto");
    const uploadTextBtn = $("#btnUploadPhotoText");
    const fileInput = $("#installerPhotoInput");

    const handleCameraOpen = () => {
        const bankingStatus = (currentInstallerData?.banking_verification_status || "").toLowerCase();
        if (bankingStatus === "verified") {
            if (!confirm("Your profile is verified. Updating your photo will link to your official records. Proceed?")) return;
        }
        openCameraModal();
    };

    if (triggerBtn) triggerBtn.addEventListener("click", handleCameraOpen);
    if (uploadTextBtn) uploadTextBtn.addEventListener("click", handleCameraOpen);

    const btnCloseModal = $("#btnCloseCameraModal");
    const btnCancel = $("#btnCancelCamera");
    const btnShutter = $("#btnShutter");
    const btnRetake = $("#btnRetakePhoto");
    const btnConfirm = $("#btnConfirmPhoto");
    const btnRetry = $("#btnRetryCamera");
    const btnFallback = $("#btnFallbackUpload");

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeCameraModal);
    if (btnCancel) btnCancel.addEventListener("click", closeCameraModal);
    if (btnShutter) btnShutter.addEventListener("click", capturePhotoSnapshot);
    if (btnRetake) btnRetake.addEventListener("click", retakePhoto);
    if (btnConfirm) btnConfirm.addEventListener("click", confirmAndUsePhoto);
    if (btnRetry) btnRetry.addEventListener("click", startCameraStream);

    if (btnFallback) {
        btnFallback.addEventListener("click", () => {
            closeCameraModal();
            if (fileInput) fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener("change", function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                showToast("Please select an image file (JPEG, PNG, WebP).", "error");
                return;
            }

            if (file.size > 8 * 1024 * 1024) {
                showToast("Image size too large. Please select a photo under 8MB.", "warning");
                return;
            }

            const reader = new FileReader();
            reader.onload = async function(evt) {
                const base64 = evt.target.result;
                try {
                    const res = await InstallerAPI.post("/api/installers/me/photo", {
                        photoBase64: base64
                    });
                    if (res && res.success) {
                        const permanentUrl = res.data?.profileImage || base64;
                        pendingProfilePhotoBase64 = permanentUrl;
                        if (currentInstallerData) {
                            currentInstallerData.profile_image = permanentUrl;
                            renderInstallerProfile(currentInstallerData);
                        }
                        const avatarImg = $("#profileAvatarImg");
                        const avatarInitials = $("#profileAvatarInitials");
                        if (avatarImg) {
                            avatarImg.src = permanentUrl;
                            avatarImg.style.display = "block";
                        }
                        if (avatarInitials) avatarInitials.style.display = "none";
                        showToast("Profile photo uploaded and saved successfully!", "success");
                    } else {
                        showToast(res?.message || "Failed to upload photo.", "error");
                    }
                } catch (err) {
                    showToast("Error saving photo: " + err.message, "error");
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

function openRequestChangeModal(defaultType) {
    const modalBackdrop = $("#modalBackdrop");
    const modalContent = $("#modalContent");
    if (!modalBackdrop || !modalContent) return;

    const email = currentInstallerData?.email || currentInstallerData?.user_email || "";
    const phone = currentInstallerData?.phone || currentInstallerData?.user_phone || "";
    const installerCode = currentInstallerData?.installer_code || "";
    const bank = currentInstallerData?.bank_name ? `${currentInstallerData.bank_name} (${maskSensitiveDigits(currentInstallerData.account_number)})` : "Not Verified";

    modalContent.innerHTML = `
        <div class="change-request-modal">
            <div class="modal-head">
                <span class="eyebrow"><i class="fa-solid fa-shield-halved"></i> SECURITY AUTHORIZATION</span>
                <h3>Request Admin Change</h3>
                <p>Protected records (Installer ID, Registered Email, Phone Number, and Verified Settlement Accounts) cannot be altered directly by installers. Submit your official request for Administrator review.</p>
            </div>

            <form id="adminChangeRequestForm" onsubmit="submitAdminChangeRequest(event)">
                <div class="form-field" style="margin-bottom: 14px;">
                    <label for="changeRequestType">Field Requiring Modification <span class="required-star">*</span></label>
                    <select id="changeRequestType" class="form-select" required>
                        <option value="Registered Email" ${defaultType === 'email' ? 'selected' : ''}>Registered Email (Current: ${email})</option>
                        <option value="Phone Number" ${defaultType === 'phone' ? 'selected' : ''}>Phone Number (Current: ${phone})</option>
                        <option value="Installer ID" ${defaultType === 'id' ? 'selected' : ''}>Installer ID (Current: ${installerCode})</option>
                        <option value="Bank Settlement Account" ${defaultType === 'banking' ? 'selected' : ''}>Bank Settlement Account (Current: ${bank})</option>
                    </select>
                </div>

                <div class="form-field" style="margin-bottom: 14px;">
                    <label for="changeRequestedValue">New Proposed Value <span class="required-star">*</span></label>
                    <input type="text" id="changeRequestedValue" placeholder="Enter new email, phone, or bank details..." required>
                </div>

                <div class="form-field" style="margin-bottom: 18px;">
                    <label for="changeRequestReason">Reason for Change Request <span class="required-star">*</span></label>
                    <textarea id="changeRequestReason" rows="3" placeholder="Explain why this credential requires administrative modification..." required></textarea>
                </div>

                <div class="modal-form-actions">
                    <button type="button" class="secondary-btn" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="primary-btn" id="btnSubmitChangeReq">
                        <i class="fa-solid fa-paper-plane"></i> Submit Request to Admin
                    </button>
                </div>
            </form>
        </div>
    `;

    modalBackdrop.classList.add("open");
}

async function submitAdminChangeRequest(event) {
    if (event) event.preventDefault();

    const changeType = $("#changeRequestType")?.value;
    const requestedValue = $("#changeRequestedValue")?.value?.trim();
    const reason = $("#changeRequestReason")?.value?.trim();

    if (!changeType || !requestedValue || !reason) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    const submitBtn = $("#btnSubmitChangeReq");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting to Admin...`;
    }

    try {
        const res = await InstallerAPI.post("/api/installers/request-change", {
            changeType,
            requestedValue,
            reason
        });

        if (res && res.success) {
            closeModal();
            showToast("Change request successfully submitted to Admin! Review pending.", "success");
        } else {
            showToast(res?.message || "Failed to submit change request.", "error");
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Request to Admin`;
            }
        }
    } catch (err) {
        showToast(err.message || "Network error submitting change request.", "error");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Request to Admin`;
        }
    }
}

async function saveGeneralProfile(event) {
    if (event) event.preventDefault();

    const contactName = $("#profileFullName")?.value?.trim();
    const state = $("#profileState")?.value?.trim();
    const specialization = $("#profileSpecialization")?.value?.trim();

    const btn = $("#btnSaveGeneralProfile");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
    }

    try {
        const payload = {};
        if (contactName) payload.contactName = contactName;
        if (state) payload.state = state;
        if (specialization) payload.specialization = specialization;

        const res = await InstallerAPI.patch("/api/installers/me", payload);
        if (res && res.success) {
            showToast("Profile details updated successfully!", "success");
            currentInstallerData = res.data;
            renderInstallerProfile(currentInstallerData);
        } else {
            showToast(res?.message || "Failed to update profile.", "error");
        }
    } catch (err) {
        showToast(err.message || "Error updating profile.", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Profile Changes`;
        }
    }
}

/* =========================================================
   SUPPORT PAGE — SYSTEM TECHNICAL MANUALS & SEARCH
   ========================================================= */

const SYSTEM_MANUALS = [
    {
        id: "man-deye-5-8k",
        title: "Deye SUN-5/8K-SG01LP1 Low-Voltage Hybrid Inverter Manual",
        brand: "Deye",
        model: "SUN-5K / 8K-SG01LP1",
        category: "inverter",
        format: "PDF · 8.4 MB",
        specs: ["5kW / 8kW", "48V Low Voltage", "Dual MPPT", "IP65 Waterproof"],
        summary: "Official user manual and wiring schematics for Deye single-phase hybrid inverters. Covers AC/generator coupling, CT clamp placement, and lithium BMS comms.",
        url: "/documents/DEYE-SUN-5-8K-SG01LP1-MANUAL-EN.pdf"
    },
    {
        id: "man-felicity-ivem10048",
        title: "Felicity Solar IVEM-10048 10kVA Hybrid Inverter Manual",
        brand: "Felicity Solar",
        model: "IVEM-10048",
        category: "inverter",
        format: "PDF · 6.2 MB",
        specs: ["10kVA / 10kW", "48V DC", "Dual MPPT 500V", "Parallel Capable"],
        summary: "Field technician guide for Felicity 10kVA low-voltage hybrid inverter. Includes DIP switch configuration, battery charging curves, and fault code guide.",
        url: "/documents/FELICITY-IVEM10048-TECHNICAL-MANUAL.pdf"
    },
    {
        id: "man-growatt-spf5000es",
        title: "Growatt SPF 5000 ES Off-Grid Inverter Operation Manual",
        brand: "Growatt",
        model: "SPF 5000 ES",
        category: "inverter",
        format: "PDF · 5.8 MB",
        specs: ["5000W Pure Sine", "48V Battery", "450V Max PV Voc", "SUB/SBU Modes"],
        summary: "Comprehensive wiring and commissioning guide for Growatt SPF 5000 ES. Details lithium battery RS485/CAN port pinout and parallel operation up to 6 units.",
        url: "/documents/GROWATT-SPF5000ES-OPERATION-MANUAL.pdf"
    },
    {
        id: "man-sunsynk-8k",
        title: "Sunsynk 8kW Single Phase Hybrid Inverter Field Guide",
        brand: "Sunsynk",
        model: "SUNSYNK-8K-SG01LP1",
        category: "inverter",
        format: "PDF · 9.1 MB",
        specs: ["8.8kW Max AC", "48V", "AUX Load Port", "Smart Load Control"],
        summary: "Field installer engineering handbook for Sunsynk 8kW hybrid inverters. Details touch screen setup, time-of-use (TOU) schedules, and micro-inverter integration.",
        url: "/documents/SUNSYNK-8KW-HYBRID-INSTALLER-GUIDE.pdf"
    },
    {
        id: "man-felicity-lpba48100",
        title: "Felicity Solar LPBA48100 5.12kWh LiFePO4 Battery Manual",
        brand: "Felicity Solar",
        model: "LPBA48100-OL",
        category: "battery",
        format: "PDF · 4.5 MB",
        specs: ["51.2V 100Ah", "5.12kWh", "6000 Cycles @ 80% DoD", "CAN/RS485 BMS"],
        summary: "Operation and BMS communication wiring guide for Felicity wall-mounted LiFePO4 battery packs. Details master-slave DIP addressing for multi-pack expansion.",
        url: "/documents/FELICITY-LPBA48100-BMS-MANUAL.pdf"
    },
    {
        id: "man-pylontech-us3000c",
        title: "Pylontech US3000C 3.55kWh Lithium Battery Commissioning Guide",
        brand: "Pylontech",
        model: "US3000C",
        category: "battery",
        format: "PDF · 5.3 MB",
        specs: ["48V 74Ah", "3.55kWh", "95% DoD", "Tier-1 BMS"],
        summary: "Technical installation manual for Pylontech rack-mount storage. Includes CAN cable pinout diagrams for Deye, Growatt, and Victron inverters.",
        url: "/documents/PYLONTECH-US3000C-COMMISSIONING-GUIDE.pdf"
    },
    {
        id: "man-dyness-bx51100",
        title: "Dyness BX51100 5.12kWh LiFePO4 Battery Module Manual",
        brand: "Dyness",
        model: "BX51100",
        category: "battery",
        format: "PDF · 4.9 MB",
        specs: ["51.2V 100Ah", "5.12kWh", "Natural Cooling", "IP20 Indoor"],
        summary: "Installation and inverter protocol matching guide for Dyness 5.12kWh battery systems. Contains wiring schematics and wake-up button sequence.",
        url: "/documents/DYNESS-BX51100-USER-MANUAL.pdf"
    },
    {
        id: "man-jinko-tigerpro550",
        title: "Jinko Solar Tiger Pro 550W Mono-Facial PV Module Datasheet",
        brand: "Jinko Solar",
        model: "JKM550M-72HL4-V",
        category: "solar",
        format: "PDF · 3.7 MB",
        specs: ["550Wp", "49.62V Voc", "13.98A Isc", "182mm Half-Cell"],
        summary: "Mechanical installation and electrical characteristics for Jinko 550W Mono-PERC modules. Details roof clamping torque, rail spacing, and MC4 guidelines.",
        url: "/documents/JINKO-TIGER-PRO-550W-INSTALLATION-MANUAL.pdf"
    },
    {
        id: "man-canadian-hiku6",
        title: "Canadian Solar HiKu6 545W Mono PERC Module Guide",
        brand: "Canadian Solar",
        model: "CS6W-545MS",
        category: "solar",
        format: "PDF · 4.1 MB",
        specs: ["545W", "49.4V Voc", "13.95A Isc", "21.3% Efficiency"],
        summary: "Comprehensive field installation manual for Canadian Solar HiKu6 modules. Covers string voltage sizing in Nigerian tropical ambient temperatures.",
        url: "/documents/CANADIAN-SOLAR-HIKU6-545W-GUIDE.pdf"
    },
    {
        id: "man-jasolar-540",
        title: "JA Solar 540W DeepBlue 3.0 Module Engineering Manual",
        brand: "JA Solar",
        model: "JAM72S30-540/MR",
        category: "solar",
        format: "PDF · 3.9 MB",
        specs: ["540W", "49.60V Voc", "13.86A Isc", "Anti-PID Design"],
        summary: "Assembly instructions and lightning protection bonding guide for JA Solar DeepBlue utility and residential solar arrays.",
        url: "/documents/JA-SOLAR-540W-DEEPBLUE-MANUAL.pdf"
    },
    {
        id: "man-ae-protection-sop",
        title: "AE Renewable SOP: AC/DC Distribution & Surge Protection Standard",
        brand: "AE Renewable",
        model: "SOP-PROT-2026-V2",
        category: "protection",
        format: "PDF · 7.2 MB",
        specs: ["Class II DC SPD", "Type 2 AC SPD", "30mA RCD", "Earth Spike < 5Ω"],
        summary: "AE Renewable internal field engineering standard for AC/DC distribution boards, automatic changeover switches, earth spike resistance, and surge arresters.",
        url: "/documents/AE-RENEWABLE-PROTECTION-SOP-V2.pdf"
    },
    {
        id: "man-ae-commissioning-sop",
        title: "AE Renewable Commissioning & Field Acceptance Checklist SOP",
        brand: "AE Renewable",
        model: "SOP-COMM-2026-V1",
        category: "protection",
        format: "PDF · 5.5 MB",
        specs: ["6-Stage Photo Evidence", "Voc & Vmp Check", "Phase Balancing", "BMS Pairing"],
        summary: "Step-by-step verification standard required for all AE certified installers to achieve formal project sign-off and milestone labour payout release.",
        url: "/documents/AE-RENEWABLE-COMMISSIONING-STANDARDS.pdf"
    }
];

let activeManualCategory = "all";
let currentManualSearchKeyword = "";

function renderSystemManuals(keyword = "", category = "all") {
    const grid = $("#manualsGrid");
    if (!grid) return;

    currentManualSearchKeyword = (keyword || "").trim().toLowerCase();
    activeManualCategory = category || "all";

    // Filter manuals
    const filtered = SYSTEM_MANUALS.filter(m => {
        const matchesCategory = activeManualCategory === "all" || m.category === activeManualCategory;
        if (!matchesCategory) return false;

        if (!currentManualSearchKeyword) return true;

        const haystack = [
            m.title,
            m.brand,
            m.model,
            m.summary,
            m.category,
            ...(m.specs || [])
        ].join(" ").toLowerCase();

        return haystack.includes(currentManualSearchKeyword);
    });

    // Update Category Counts
    const counts = {
        all: SYSTEM_MANUALS.length,
        inverter: SYSTEM_MANUALS.filter(m => m.category === "inverter").length,
        battery: SYSTEM_MANUALS.filter(m => m.category === "battery").length,
        solar: SYSTEM_MANUALS.filter(m => m.category === "solar").length,
        protection: SYSTEM_MANUALS.filter(m => m.category === "protection").length
    };

    setText("#catCountAll", counts.all);
    setText("#catCountInverter", counts.inverter);
    setText("#catCountBattery", counts.battery);
    setText("#catCountSolar", counts.solar);
    setText("#catCountProtection", counts.protection);

    if (!filtered.length) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px;">
                <i class="fa-solid fa-magnifying-glass" style="font-size: 28px; color: #94a3b8; margin-bottom: 10px; display: block;"></i>
                <h4 style="color: #1e293b; font-size: 15px; margin-bottom: 4px;">No manuals match your search</h4>
                <p style="color: #64748b; font-size: 12px; margin: 0 0 12px;">Try searching for a different brand (e.g. Deye, Felicity, Jinko), voltage (48V), or equipment category.</p>
                <button type="button" class="secondary-btn btn-sm" onclick="clearManualSearch()">
                    <i class="fa-solid fa-rotate-left"></i> Reset Search
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(m => {
        return `
            <div class="manual-item-card" data-manual-id="${m.id}">
                <div class="manual-card-top">
                    <span class="manual-badge ${m.category}">${m.category}</span>
                    <span class="manual-doc-format"><i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i> ${m.format}</span>
                </div>

                <h4 class="manual-title">${escapeHtml(m.title)}</h4>
                <p class="manual-summary">${escapeHtml(m.summary)}</p>

                <div class="manual-specs-pill">
                    ${(m.specs || []).map(s => `<span class="manual-tag">${escapeHtml(s)}</span>`).join("")}
                </div>

                <div class="manual-card-actions">
                    <button type="button" class="manual-view-btn" onclick="openSystemManual('${m.id}')">
                        <i class="fa-solid fa-eye"></i> View Manual
                    </button>
                    <button type="button" class="manual-download-btn" onclick="downloadSystemManual('${m.id}')" title="Download ${m.format}">
                        <i class="fa-solid fa-download"></i>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function initSystemManuals() {
    renderSystemManuals();

    const searchInput = $("#manualSearchInput");
    const clearBtn = $("#manualSearchClear");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const val = e.target.value;
            if (clearBtn) clearBtn.style.display = val.trim() ? "block" : "none";
            renderSystemManuals(val, activeManualCategory);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            clearManualSearch();
        });
    }

    const catTabs = $("#manualCategoryTabs");
    if (catTabs) {
        catTabs.addEventListener("click", (e) => {
            const btn = e.target.closest(".manual-cat-btn");
            if (!btn) return;

            $all(".manual-cat-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const category = btn.dataset.category || "all";
            activeManualCategory = category;
            renderSystemManuals($("#manualSearchInput")?.value || "", activeManualCategory);
        });
    }
}

function clearManualSearch() {
    const input = $("#manualSearchInput");
    const clearBtn = $("#manualSearchClear");
    if (input) input.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    renderSystemManuals("", activeManualCategory);
}

function openSystemManual(manualId) {
    const manual = SYSTEM_MANUALS.find(m => m.id === manualId);
    if (!manual) return;

    const modalBackdrop = $("#modalBackdrop");
    const modalContent = $("#modalContent");
    if (!modalBackdrop || !modalContent) return;

    modalContent.innerHTML = `
        <div style="padding: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 14px;">
                <div>
                    <span class="status-pill status-progress" style="margin-bottom:6px; display:inline-block;">${manual.brand} · ${manual.model}</span>
                    <h3 style="font-size:18px; color:#0f172a; margin: 4px 0;">${escapeHtml(manual.title)}</h3>
                    <p style="font-size:12px; color:#64748b; margin:0;">${escapeHtml(manual.summary)}</p>
                </div>
            </div>

            <div style="background:#0f172a; border-radius:10px; padding: 24px; text-align:center; color:#fff; margin-bottom:16px;">
                <i class="fa-solid fa-file-pdf" style="font-size:48px; color:#ef4444; margin-bottom:12px; display:block;"></i>
                <h4 style="font-size:15px; margin-bottom:4px;">Technical Engineering Specification & Schematic Document</h4>
                <p style="font-size:12px; color:#94a3b8; max-width: 480px; margin:0 auto 16px;">
                    This official manufacturer manual contains complete terminal block wiring diagrams, inverter register addresses, BMS CAN-bus pinouts, and step-by-step field commissioning checklists.
                </p>
                <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
                    <button type="button" onclick="downloadSystemManual('${manual.id}')" class="primary-btn" style="text-decoration:none;">
                        <i class="fa-solid fa-download"></i> Download Full PDF (${manual.format})
                    </button>
                </div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin-bottom:16px;">
                <strong style="font-size:12px; color:#334155; display:block; margin-bottom:6px;">Key Field Specifications:</strong>
                <ul style="margin:0; padding-left:18px; font-size:12px; color:#475569; line-height:1.6;">
                    ${(manual.specs || []).map(s => `<li><strong>${escapeHtml(s)}</strong></li>`).join("")}
                </ul>
            </div>

            <div style="display:flex; justify-content:flex-end;">
                <button type="button" class="secondary-btn" onclick="closeModal()">Close Document</button>
            </div>
        </div>
    `;

    modalBackdrop.classList.add("open");
}

function downloadSystemManual(manualId) {
    const manual = SYSTEM_MANUALS.find(m => m.id === manualId);
    if (!manual) return;
    showToast(`Downloading ${manual.title} (${manual.format})...`, "success");
}

/* =========================================================
   SITE TRACKING DIRECT LIVE CAMERA CAPTURE
   ========================================================= */

let siteCameraMediaStream = null;
let currentSiteEvidenceStageId = null;
let siteCapturedSnapshotBlob = null;
let siteCapturedSnapshotDataUrl = null;
let siteCameraFacingMode = "environment"; // Preferred for site equipment inspection

async function openSiteEvidenceCamera(stageId) {
    currentSiteEvidenceStageId = stageId;
    siteCapturedSnapshotBlob = null;
    siteCapturedSnapshotDataUrl = null;

    const modalBackdrop = $("#siteEvidenceModalBackdrop");
    const video = $("#siteCameraVideo");
    const canvas = $("#siteCameraCanvas");
    const liveControls = $("#siteCameraLiveControls");
    const reviewControls = $("#siteCameraReviewControls");
    const errorOverlay = $("#siteCameraErrorOverlay");
    const feedback = $("#siteCameraFeedback");
    const stageBadge = $("#siteCameraStageBadge");
    const reqPrompt = $("#siteCameraRequirementPrompt");

    const stageMeta = INSTALLATION_STAGES.find(s => s.id === stageId) || {};

    if (stageBadge) {
        stageBadge.innerHTML = `<i class="fa-solid ${stageMeta.icon || 'fa-camera'}"></i> Stage ${stageMeta.number || ''}: ${escapeHtml(stageMeta.title || stageId)}`;
    }
    if (reqPrompt) {
        reqPrompt.textContent = stageMeta.requirement || "Position camera squarely at the equipment, labels, and wiring connections.";
    }

    if (video) video.style.display = "block";
    if (canvas) canvas.style.display = "none";
    if (liveControls) liveControls.style.display = "flex";
    if (reviewControls) reviewControls.style.display = "none";
    if (errorOverlay) errorOverlay.style.display = "none";
    if (feedback) feedback.style.display = "none";

    if (modalBackdrop) {
        modalBackdrop.style.display = "flex";
    }

    await startSiteCameraStream();
}

async function startSiteCameraStream() {
    const video = $("#siteCameraVideo");
    const errorOverlay = $("#siteCameraErrorOverlay");
    const errorMsg = $("#siteCameraErrorMessage");

    stopSiteCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (errorOverlay) {
            errorOverlay.style.display = "flex";
            if (errorMsg) errorMsg.textContent = "Your browser does not support live camera access. Please use file upload instead.";
        }
        return;
    }

    try {
        const constraints = {
            video: {
                facingMode: { ideal: siteCameraFacingMode },
                width: { ideal: 1920, min: 640 },
                height: { ideal: 1080, min: 480 }
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        siteCameraMediaStream = stream;

        if (video) {
            video.srcObject = stream;
            await video.play();
        }

        if (errorOverlay) errorOverlay.style.display = "none";

        // Check if multiple cameras exist to toggle switch button
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === "videoinput");
            const switchBtn = $("#btnSwitchSiteCameraFacing");
            if (switchBtn) {
                switchBtn.style.display = videoDevices.length > 1 ? "inline-flex" : "none";
            }
        } catch (e) {}

    } catch (err) {
        console.warn("[Site Camera] Stream start error:", err);
        if (errorOverlay) {
            errorOverlay.style.display = "flex";
            if (errorMsg) {
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    errorMsg.textContent = "Camera permission was denied. Please allow camera permissions in your browser.";
                } else if (err.name === "NotFoundError") {
                    errorMsg.textContent = "No camera hardware was detected on your device.";
                } else {
                    errorMsg.textContent = `Unable to access camera: ${err.message || "Unknown error"}.`;
                }
            }
        }
    }
}

function stopSiteCameraStream() {
    if (siteCameraMediaStream) {
        try {
            siteCameraMediaStream.getTracks().forEach(t => t.stop());
        } catch (e) {}
        siteCameraMediaStream = null;
    }
    const video = $("#siteCameraVideo");
    if (video) video.srcObject = null;
}

function closeSiteEvidenceModal() {
    stopSiteCameraStream();
    const modalBackdrop = $("#siteEvidenceModalBackdrop");
    if (modalBackdrop) modalBackdrop.style.display = "none";
    currentSiteEvidenceStageId = null;
    siteCapturedSnapshotBlob = null;
    siteCapturedSnapshotDataUrl = null;
}

function captureSitePhotoSnapshot() {
    const video = $("#siteCameraVideo");
    const canvas = $("#siteCameraCanvas");
    const liveControls = $("#siteCameraLiveControls");
    const reviewControls = $("#siteCameraReviewControls");
    const feedback = $("#siteCameraFeedback");

    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    // Freeze video display, show canvas
    video.style.display = "none";
    canvas.style.display = "block";

    if (liveControls) liveControls.style.display = "none";
    if (reviewControls) reviewControls.style.display = "flex";

    if (feedback) {
        feedback.style.display = "flex";
        feedback.className = "validation-feedback-ribbon success";
        feedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> Photo captured. Review and click "Add to Evidence".`;
    }

    siteCapturedSnapshotDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    canvas.toBlob(blob => {
        siteCapturedSnapshotBlob = blob;
    }, "image/jpeg", 0.92);
}

function retakeSitePhoto() {
    const video = $("#siteCameraVideo");
    const canvas = $("#siteCameraCanvas");
    const liveControls = $("#siteCameraLiveControls");
    const reviewControls = $("#siteCameraReviewControls");
    const feedback = $("#siteCameraFeedback");

    if (canvas) canvas.style.display = "none";
    if (video) video.style.display = "block";
    if (liveControls) liveControls.style.display = "flex";
    if (reviewControls) reviewControls.style.display = "none";
    if (feedback) feedback.style.display = "none";

    siteCapturedSnapshotBlob = null;
    siteCapturedSnapshotDataUrl = null;
}

async function confirmAndAddSitePhoto() {
    if (!siteCapturedSnapshotBlob || !currentSiteEvidenceStageId) {
        showToast("Please capture a photo first.", "warning");
        return;
    }

    const stageId = currentSiteEvidenceStageId;
    const stage = SiteTracking.stages[stageId];
    if (!stage) {
        closeSiteEvidenceModal();
        return;
    }

    const stageMeta = INSTALLATION_STAGES.find(s => s.id === stageId) || {};
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const filename = `${stageMeta.title || stageId}_live_${Date.now()}.jpg`;

    const file = new File([siteCapturedSnapshotBlob], filename, { type: "image/jpeg" });

    const newImage = {
        name: `${stageMeta.shortTitle || stageId} Live Capture (${timestampStr})`,
        size: siteCapturedSnapshotBlob.size,
        type: "image/jpeg",
        url: siteCapturedSnapshotDataUrl,
        _file: file
    };

    stage.images.push(newImage);
    saveTrackingState();
    renderTracking();

    showToast(`✓ Live camera photo captured and attached to ${stageMeta.title || stageId}!`, "success");
    closeSiteEvidenceModal();

    // Background evidence sync
    const projectId = PORTAL_CONFIG.projectId;
    if (projectId) {
        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("stage_type", stageId);
            formData.append("caption", newImage.name);
            formData.append("notes", stage.notes || "");

            const token = InstallerAPI.getToken();
            fetch(`/api/projects/${projectId}/evidence`, {
                method: "POST",
                credentials: "include",
                headers: { Authorization: "Bearer " + token },
                body: formData
            }).then(r => r.json()).then(res => {
                if (res.success) {
                    console.log(`[Site Camera] Direct evidence synced to backend:`, res.data);
                }
            }).catch(e => console.warn("[Site Camera] Backend sync error:", e));
        } catch (e) {}
    }
}

function setupSiteCameraListeners() {
    const btnClose = $("#btnCloseSiteCameraModal");
    const btnCancel = $("#btnCancelSiteCamera");
    const btnShutter = $("#btnShutterSiteCamera");
    const btnRetake = $("#btnRetakeSitePhoto");
    const btnConfirm = $("#btnConfirmSitePhoto");
    const btnRetry = $("#btnRetrySiteCamera");
    const btnSwitch = $("#btnSwitchSiteCameraFacing");
    const btnFallback = $("#btnFallbackSiteFile");

    if (btnClose) btnClose.addEventListener("click", closeSiteEvidenceModal);
    if (btnCancel) btnCancel.addEventListener("click", closeSiteEvidenceModal);
    if (btnShutter) btnShutter.addEventListener("click", captureSitePhotoSnapshot);
    if (btnRetake) btnRetake.addEventListener("click", retakeSitePhoto);
    if (btnConfirm) btnConfirm.addEventListener("click", confirmAndAddSitePhoto);
    if (btnRetry) btnRetry.addEventListener("click", startSiteCameraStream);

    if (btnSwitch) {
        btnSwitch.addEventListener("click", () => {
            siteCameraFacingMode = siteCameraFacingMode === "environment" ? "user" : "environment";
            startSiteCameraStream();
        });
    }

    if (btnFallback) {
        btnFallback.addEventListener("click", () => {
            const stageId = currentSiteEvidenceStageId;
            closeSiteEvidenceModal();
            if (stageId) {
                const fileInput = $(`#fileInput-${stageId}`);
                if (fileInput) fileInput.click();
            }
        });
    }
}

/* =========================================================
   WINDOW EXPORTS
   ========================================================= */

window.showPage = showPage;
window.closeModal = closeModal;
window.requestPayment = requestPayment;
window.acceptJob = acceptJob;
window.submitBankingDetails = submitBankingDetails;
window.saveGeneralProfile = saveGeneralProfile;
window.openRequestChangeModal = openRequestChangeModal;
window.submitAdminChangeRequest = submitAdminChangeRequest;
window.loadInstallerProfileFromAPI = loadInstallerProfileFromAPI;
window.openSiteEvidenceCamera = openSiteEvidenceCamera;
window.closeSiteEvidenceModal = closeSiteEvidenceModal;
window.renderSystemManuals = renderSystemManuals;
window.openSystemManual = openSystemManual;
window.downloadSystemManual = downloadSystemManual;
window.clearManualSearch = clearManualSearch;
window.markNotificationRead = markNotificationRead;
window.setProjectAndTrack = function(projectId, projectCode) {
    if (projectId) PORTAL_CONFIG.projectId = projectId;
    if (projectCode) PORTAL_CONFIG.projectCode = projectCode;
    showPage("site-tracking");
    if (typeof loadTrackingState === "function") {
        loadTrackingState();
        renderTracking();
    }
};

/* =========================================================
   LIVE DATA INITIALIZATION — Wire to Backend
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const token = InstallerAPI.getToken();

    // Initialize System Manuals on Support Page
    initSystemManuals();

    // Initialize Site Tracking Camera Listeners
    setupSiteCameraListeners();

    if (!token) {
        console.warn("[AE Installer] No auth token — running in preview mode.");
        showToast("Preview mode — some data is static", "normal");
        return;
    }

    // Non-blocking parallel API calls — portal renders instantly with live data
    Promise.all([
        loadInstallerProfileFromAPI(),
        loadInstallerJobs(),
        loadInstallerDocuments(),
        loadInstallerPayments(),
        loadInstallerNotifications(),
        loadInstallerCommissioning()
    ]).then(() => {
        console.log("[AE Installer] Live data synchronized with backend.");
    }).catch(err => {
        console.warn("[AE Installer] Some API calls failed, running on static data:", err.message);
    });

    // Logout button wiring
    $all("#logoutButton, [data-action='logout']").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (!confirm("Sign out of Installer Portal?")) return;
            try {
                await InstallerAPI.post("/api/auth/logout", {});
            } catch {}
            InstallerAPI.TOKEN_KEYS.forEach(k => localStorage.removeItem(k));
            InstallerAPI.USER_KEYS.forEach(k => localStorage.removeItem(k));
            sessionStorage.removeItem("ae_installer_logged_in");
            window.location.href = "/installer/login";
        });
    });

    // Profile buttons wiring
    const btnSubmitBanking = $("#btnSubmitBanking");
    if (btnSubmitBanking) {
        btnSubmitBanking.addEventListener("click", submitBankingDetails);
    }

    const btnRequestBankUnlock = $("#btnRequestBankUnlock");
    if (btnRequestBankUnlock) {
        btnRequestBankUnlock.addEventListener("click", () => openRequestChangeModal("banking"));
    }

    const btnRequestIdentityChange = $("#btnRequestIdentityChange");
    if (btnRequestIdentityChange) {
        btnRequestIdentityChange.addEventListener("click", () => openRequestChangeModal("email"));
    }

    const btnSaveGeneral = $("#btnSaveGeneralProfile");
    if (btnSaveGeneral) {
        btnSaveGeneral.addEventListener("click", saveGeneralProfile);
    }

    setupPhotoCapture();
});