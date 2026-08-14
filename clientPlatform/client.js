/* =========================================================
   AE NETWORK — CLIENT PORTAL ENGINE
   client.js
========================================================= */

"use strict";


/* =========================================================
   1. APPLICATION STATE
========================================================= */

const ClientApp = {

    currentPage: "dashboard",

    client: {
        name: "Eniola Abdulrasaq",
        email: "AERenewablesolution@gmail.com",
        phone: "0813 361 5132",
        location: "Abuja"
    },

    notifications: 3,

    projects: [
        {
            id: "AE-PRJ-2026-018",
            name: "Residential Hybrid Solar System",
            capacity: "16kVA",
            battery: "32kWh Lithium",
            solar: "12kW PV",
            progress: 72,
            status: "In Installation"
        },

        {
            id: "AE-PRJ-2026-009",
            name: "Home Backup Solar System",
            capacity: "12kVA",
            battery: "15kWh Lithium",
            solar: "9kW PV",
            progress: 100,
            status: "Completed"
        }
    ],

    quotations: [
        {
            id: "AE-QUO-2026-042",
            amount: "₦8,750,000",
            status: "Awaiting Approval"
        }
    ],

    requests: []
};


/* =========================================================
   2. DOM CACHE
========================================================= */

const DOM = {

    sidebar: document.getElementById("sidebar"),

    mobileMenu: document.getElementById("mobileMenu"),

    pageTitle: document.getElementById("pageTitle"),

    navItems: document.querySelectorAll(".nav-item[data-page]"),

    pages: document.querySelectorAll(".page"),

    searchBtn: document.getElementById("searchBtn"),

    searchPanel: document.getElementById("searchPanel"),

    closeSearch: document.getElementById("closeSearch"),

    globalSearch: document.getElementById("globalSearch"),

    notificationBtn:
        document.getElementById("notificationBtn"),

    notificationDrawer:
        document.getElementById("notificationDrawer"),

    closeNotifications:
        document.getElementById("closeNotifications"),

    overlay:
        document.getElementById("overlay"),

    modalOverlay:
        document.getElementById("modalOverlay"),

    modal:
        document.getElementById("modal"),

    modalClose:
        document.getElementById("modalClose"),

    modalContent:
        document.getElementById("modalContent"),

    logoutBtn:
        document.getElementById("logoutBtn"),

    saveProfile:
        document.getElementById("saveProfile")
};


/* =========================================================
   3. PAGE TITLES
========================================================= */

const PAGE_TITLES = {

    dashboard: "Client Dashboard",

    projects: "My Projects",

    quotations: "Quotations",

    payments: "Payments",

    monitoring: "System Monitoring",

    requests: "Service Requests",

    documents: "Documents",

    support: "Support Center",

    profile: "My Profile"

};


/* =========================================================
   4. NAVIGATION ENGINE
========================================================= */

function navigateTo(pageName) {

    if (!PAGE_TITLES[pageName]) {
        console.warn(`Unknown page: ${pageName}`);
        return;
    }

    ClientApp.currentPage = pageName;

    DOM.pages.forEach(page => {

        page.classList.remove("active");

    });

    const targetPage =
        document.getElementById(`${pageName}Page`);

    if (targetPage) {

        targetPage.classList.add("active");

    }


    DOM.navItems.forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );

    });


    DOM.pageTitle.textContent =
        PAGE_TITLES[pageName];


    closeMobileSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   5. NAVIGATION EVENTS
========================================================= */

DOM.navItems.forEach(item => {

    item.addEventListener("click", () => {

        navigateTo(item.dataset.page);

    });

});


/* =========================================================
   6. PAGE LINK BUTTONS
========================================================= */

document.querySelectorAll("[data-page-link]")
    .forEach(button => {

        button.addEventListener("click", () => {

            navigateTo(button.dataset.pageLink);

        });

    });


/* =========================================================
   7. MOBILE SIDEBAR
========================================================= */

DOM.mobileMenu.addEventListener("click", () => {

    DOM.sidebar.classList.toggle("open");

});


function closeMobileSidebar() {

    DOM.sidebar.classList.remove("open");

}


/* =========================================================
   8. SEARCH
========================================================= */

DOM.searchBtn.addEventListener("click", () => {

    DOM.searchPanel.classList.toggle("open");

    if (DOM.searchPanel.classList.contains("open")) {

        setTimeout(() => {
            DOM.globalSearch.focus();
        }, 100);

    }

});


DOM.closeSearch.addEventListener("click", () => {

    DOM.searchPanel.classList.remove("open");

    DOM.globalSearch.value = "";

});


document.addEventListener("keydown", event => {

    if (event.key === "/" && document.activeElement.tagName !== "INPUT") {

        event.preventDefault();

        DOM.searchPanel.classList.add("open");

        DOM.globalSearch.focus();

    }

    if (event.key === "Escape") {

        DOM.searchPanel.classList.remove("open");

        closeNotificationDrawer();

        closeModal();

    }

});


DOM.globalSearch.addEventListener("input", event => {

    const searchValue =
        event.target.value.trim().toLowerCase();

    if (!searchValue) return;

    const searchableItems =
        document.querySelectorAll(
            ".project-card, .document-card, tbody tr, .activity-item"
        );

    searchableItems.forEach(item => {

        const content =
            item.textContent.toLowerCase();

        item.style.display =
            content.includes(searchValue)
                ? ""
                : "none";

    });

});


/* =========================================================
   9. NOTIFICATIONS
========================================================= */

DOM.notificationBtn.addEventListener(
    "click",
    openNotificationDrawer
);


DOM.closeNotifications.addEventListener(
    "click",
    closeNotificationDrawer
);


DOM.overlay.addEventListener(
    "click",
    closeNotificationDrawer
);


function openNotificationDrawer() {

    DOM.notificationDrawer.classList.add("open");

    DOM.overlay.classList.add("open");

}


function closeNotificationDrawer() {

    DOM.notificationDrawer.classList.remove("open");

    DOM.overlay.classList.remove("open");

}


/* =========================================================
   10. MODAL ENGINE
========================================================= */

function openModal(content) {

    DOM.modalContent.innerHTML = content;

    DOM.modalOverlay.classList.add("open");

}


function closeModal() {

    DOM.modalOverlay.classList.remove("open");

}


DOM.modalClose.addEventListener(
    "click",
    closeModal
);


DOM.modalOverlay.addEventListener(
    "click",
    event => {

        if (event.target === DOM.modalOverlay) {

            closeModal();

        }

    }
);


/* =========================================================
   11. ACTION DISPATCHER
========================================================= */

document.addEventListener("click", event => {

    const actionElement =
        event.target.closest("[data-action]");

    if (!actionElement) return;

    const action =
        actionElement.dataset.action;

    handleAction(action);

});


function handleAction(action) {

    switch (action) {

        case "new-request":

            openNewRequestModal();

            break;


        case "view-project":

            openProjectModal();

            break;


        case "monitoring":

            navigateTo("monitoring");

            break;


        case "view-quotation":

            openQuotationModal();

            break;


        case "accept-quotation":

            acceptQuotation();

            break;


        case "support":

            openSupportModal();

            break;


        default:

            console.warn(
                `Unhandled action: ${action}`
            );

    }

}


/* =========================================================
   12. PROJECT MODAL
========================================================= */

function openProjectModal() {

    const project =
        ClientApp.projects[0];

    openModal(`

        <span class="eyebrow">
            PROJECT DETAILS
        </span>

        <h2>${project.name}</h2>

        <p>
            Project ID:
            <strong>${project.id}</strong>
        </p>

        <div class="system-info-grid" style="margin-top:20px;">

            <div>
                <span>Capacity</span>
                <strong>${project.capacity}</strong>
            </div>

            <div>
                <span>Battery</span>
                <strong>${project.battery}</strong>
            </div>

            <div>
                <span>Solar Array</span>
                <strong>${project.solar}</strong>
            </div>

            <div>
                <span>Progress</span>
                <strong>${project.progress}%</strong>
            </div>

        </div>

        <div class="progress-section" style="margin-top:22px;">

            <div class="progress-label">

                <span>Installation Progress</span>

                <strong>${project.progress}%</strong>

            </div>

            <div class="progress-bar">

                <span style="width:${project.progress}%"></span>

            </div>

        </div>

        <div class="modal-actions">

            <button
                class="secondary-btn"
                onclick="closeModal()"
            >
                Close
            </button>

            <button
                class="primary-btn"
                onclick="navigateTo('monitoring'); closeModal();"
            >
                Monitor System
            </button>

        </div>

    `);

}


/* =========================================================
   13. QUOTATION MODAL
========================================================= */

function openQuotationModal() {

    const quotation =
        ClientApp.quotations[0];

    openModal(`

        <span class="eyebrow">
            QUOTATION
        </span>

        <h2>${quotation.id}</h2>

        <p>
            20kVA Hybrid Solar Power System
        </p>

        <div class="quotation-summary"
             style="margin-top:20px;">

            <div>

                <span>Total Project Value</span>

                <strong>
                    ${quotation.amount}
                </strong>

            </div>

            <div>

                <span>Status</span>

                <strong>
                    ${quotation.status}
                </strong>

            </div>

        </div>

        <p>
            This quotation includes solar panels,
            hybrid inverter, lithium battery storage,
            protection equipment, installation,
            testing and commissioning.
        </p>

        <div class="modal-actions">

            <button
                class="secondary-btn"
                onclick="closeModal()"
            >
                Close
            </button>

            <button
                class="primary-btn"
                onclick="acceptQuotation()"
            >
                Accept Quotation
            </button>

        </div>

    `);

}


/* =========================================================
   14. ACCEPT QUOTATION
========================================================= */

function acceptQuotation() {

    const quotation =
        ClientApp.quotations[0];

    if (quotation.status === "Accepted") {

        showToast(
            "Quotation has already been accepted."
        );

        return;

    }


    quotation.status = "Accepted";

    closeModal();

    showToast(
        "Quotation accepted successfully."
    );


    setTimeout(() => {

        navigateTo("projects");

    }, 500);

}


/* =========================================================
   15. NEW REQUEST
========================================================= */

function openNewRequestModal(
    defaultType = ""
) {

    openModal(`

        <span class="eyebrow">
            SERVICE REQUEST
        </span>

        <h2>Submit a New Request</h2>

        <p>
            Tell AE Network what you need and our team
            will review your request.
        </p>

        <form class="modal-form" id="requestForm">

            <label>

                Request Type

                <select id="requestType" required>

                    <option value="">
                        Select request type
                    </option>

                    <option value="Solar Consultation">
                        Solar Consultation
                    </option>

                    <option value="Site Survey">
                        Site Survey
                    </option>

                    <option value="Maintenance">
                        Maintenance
                    </option>

                    <option value="System Upgrade">
                        System Upgrade
                    </option>

                    <option value="CCTV">
                        CCTV
                    </option>

                    <option value="Electric Fence">
                        Electric Fence
                    </option>

                    <option value="General Support">
                        General Support
                    </option>

                </select>

            </label>


            <label>

                Subject

                <input
                    type="text"
                    id="requestSubject"
                    placeholder="Brief description"
                    required
                >

            </label>


            <label>

                Details

                <textarea
                    id="requestDetails"
                    placeholder="Explain what you need..."
                    required
                ></textarea>

            </label>


            <div class="modal-actions">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-btn"
                >
                    Submit Request
                </button>

            </div>

        </form>

    `);


    const select =
        document.getElementById("requestType");

    if (defaultType) {

        select.value = defaultType;

    }


    document
        .getElementById("requestForm")
        .addEventListener(
            "submit",
            submitRequest
        );

}


/* =========================================================
   16. REQUEST SUBMISSION
========================================================= */

function submitRequest(event) {

    event.preventDefault();

    const type =
        document.getElementById("requestType").value;

    const subject =
        document.getElementById("requestSubject").value;

    const details =
        document.getElementById("requestDetails").value;


    const request = {

        id:
            `AE-REQ-${Date.now().toString().slice(-6)}`,

        type,

        subject,

        details,

        status: "Submitted",

        date:
            new Date().toLocaleDateString()

    };


    ClientApp.requests.push(request);


    closeModal();


    showToast(
        `Request ${request.id} submitted successfully.`
    );


    setTimeout(() => {

        navigateTo("requests");

    }, 500);

}


/* =========================================================
   17. SUPPORT
========================================================= */

function openSupportModal() {

    openModal(`

        <span class="eyebrow">
            CLIENT SUPPORT
        </span>

        <h2>Contact AE Network</h2>

        <p>
            Submit a support request and our team
            will respond as soon as possible.
        </p>

        <form class="modal-form" id="supportForm">

            <label>

                Issue Type

                <select required>

                    <option>
                        System Issue
                    </option>

                    <option>
                        Project Support
                    </option>

                    <option>
                        Account Support
                    </option>

                    <option>
                        General Question
                    </option>

                </select>

            </label>


            <label>

                Message

                <textarea
                    placeholder="Describe the issue..."
                    required
                ></textarea>

            </label>


            <div class="modal-actions">

                <button
                    type="button"
                    class="secondary-btn"
                    onclick="closeModal()"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-btn"
                >
                    Send Support Request
                </button>

            </div>

        </form>

    `);


    document
        .getElementById("supportForm")
        .addEventListener(
            "submit",
            event => {

                event.preventDefault();

                closeModal();

                showToast(
                    "Support request submitted successfully."
                );

            }
        );

}


/* =========================================================
   18. REQUEST CARD EVENTS
========================================================= */

document
    .querySelectorAll("[data-request-type]")
    .forEach(card => {

        card.addEventListener("click", () => {

            openNewRequestModal(
                card.dataset.requestType
            );

        });

    });


/* =========================================================
   19. PROFILE SAVE
========================================================= */

if (DOM.saveProfile) {

    DOM.saveProfile.addEventListener(
        "click",
        () => {

            showToast(
                "Profile information saved successfully."
            );

        }
    );

}


/* =========================================================
   20. PROFILE BUTTON
========================================================= */

document
    .getElementById("profileButton")
    .addEventListener(
        "click",
        () => {

            navigateTo("profile");

        }
    );


/* =========================================================
   21. LOGOUT
========================================================= */

DOM.logoutBtn.addEventListener(
    "click",
    () => {

        const confirmLogout =
            window.confirm(
                "Are you sure you want to logout?"
            );

        if (!confirmLogout) return;


        showToast(
            "Logging out..."
        );


        setTimeout(() => {

            /*
             * Backend authentication should replace
             * this section later.
             */

            window.location.href = "index.html";

        }, 900);

    }
);


/* =========================================================
   22. TOAST ENGINE
========================================================= */

function showToast(message) {

    let toast =
        document.getElementById("clientToast");


    if (!toast) {

        toast =
            document.createElement("div");

        toast.id = "clientToast";

        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.right = "25px";
        toast.style.zIndex = "5000";

        toast.style.padding =
            "13px 18px";

        toast.style.background =
            "#010a1d";

        toast.style.color =
            "#ffffff";

        toast.style.borderRadius =
            "10px";

        toast.style.fontSize =
            "11px";

        toast.style.fontWeight =
            "700";

        toast.style.boxShadow =
            "0 15px 40px rgba(1,10,29,.2)";

        toast.style.opacity = "0";

        toast.style.transform =
            "translateY(10px)";

        toast.style.transition =
            ".25s ease";

        document.body.appendChild(toast);

    }


    toast.textContent = message;


    requestAnimationFrame(() => {

        toast.style.opacity = "1";

        toast.style.transform =
            "translateY(0)";

    });


    clearTimeout(
        toast.hideTimer
    );


    toast.hideTimer =
        setTimeout(() => {

            toast.style.opacity = "0";

            toast.style.transform =
                "translateY(10px)";

        }, 3000);

}


/* =========================================================
   23. INITIALIZATION
========================================================= */

function initializeClientPortal() {

    navigateTo("dashboard");

    console.log(
        "AE Network Client Portal initialized."
    );

    console.log(
        "Client:",
        ClientApp.client.name
    );

    console.log(
        "Projects:",
        ClientApp.projects.length
    );

}


initializeClientPortal();