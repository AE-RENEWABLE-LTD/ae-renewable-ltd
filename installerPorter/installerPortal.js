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

            showToast(
                "Commissioning checklist saved.",
                "success"
            );

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


                            <label
                                class="evidence-upload"
                            >

                                <input
                                    type="file"
                                    class="stage-file-input"
                                    data-stage="${stage.id}"
                                    accept="image/*"
                                    capture="environment"
                                    multiple
                                    ${
                                        disabled
                                            ? "disabled"
                                            : ""
                                    }
                                >

                                <span class="upload-content">

                                    <span class="upload-icon">

                                        <i class="fa-solid fa-camera"></i>

                                    </span>

                                    <strong>
                                        Add Site Images
                                    </strong>

                                    <span>
                                        Click to browse or use camera
                                    </span>

                                    <em>
                                        JPG, PNG, WEBP · Multiple images allowed
                                    </em>

                                </span>

                            </label>


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
                    )

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

function confirmPaymentRequest() {

    SiteTracking.paymentRequested =
        true;


    saveTrackingState();

    closeModal();

    renderTracking();


    showToast(
        "Payment request prepared successfully. It is ready for operations review.",
        "success"
    );

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
   WINDOW EXPORTS
   ========================================================= */

window.showPage =
    showPage;

window.closeModal =
    closeModal;

window.requestPayment =
    requestPayment;


/* =========================================================
   DEVELOPMENT CONSOLE
   ========================================================= */

console.log(
    "%cAE NETWORK INSTALLER PORTAL",
    "font-weight:800;color:#044381;font-size:14px;"
);

console.log(
    "Version 5.0 Premium · Frontend Only"
);

console.log(
    "Site tracking workflow loaded."
);