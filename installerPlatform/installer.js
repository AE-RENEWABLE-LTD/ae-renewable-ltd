/* =========================================================
   AE NETWORK — INSTALLER PORTAL ENGINE
   installer.js
   ========================================================= */

"use strict";

/* =========================================================
   1. APPLICATION STATE
========================================================= */

const InstallerApp = {

    currentPage: "dashboard",

    installer: {
        name: "Abdulrasaq",
        company: "Abdulrasaq Engineering Services",
        id: "AER-INS-0024",
        status: "available",
        rating: 4.8,
        performance: 94,
        activeProjects: 1,
        maxProjects: 2,
        completedProjects: 24
    },

    dashboard: {
        progress: 78
    },

    jobs: [
        {
            id: "JOB-001",
            title: "12kVA Hybrid Solar System",
            type: "solar",
            typeLabel: "Solar",
            location: "Maitama, Abuja",
            distance: 6.8,
            amount: 180000,
            duration: "2 days",
            date: "20 Aug 2026",
            description:
                "Installation and commissioning of a 12kVA hybrid solar system with lithium battery storage.",
            requirements: [
                "Solar installation experience",
                "Battery installation",
                "DC/AC wiring",
                "Testing & commissioning"
            ]
        },

        {
            id: "JOB-002",
            title: "Commercial Distribution Board",
            type: "electrical",
            typeLabel: "Electrical",
            location: "Wuse 2, Abuja",
            distance: 11.4,
            amount: 95000,
            duration: "1 day",
            date: "21 Aug 2026",
            description:
                "Installation and termination of a commercial electrical distribution board.",
            requirements: [
                "Electrical installation",
                "DB termination",
                "Protection device installation",
                "Testing"
            ]
        },

        {
            id: "JOB-003",
            title: "12-Camera CCTV Installation",
            type: "cctv",
            typeLabel: "CCTV",
            location: "Gwarinpa, Abuja",
            distance: 15.2,
            amount: 140000,
            duration: "2 days",
            date: "23 Aug 2026",
            description:
                "Complete installation of a 12-camera CCTV surveillance system.",
            requirements: [
                "CCTV installation",
                "Camera configuration",
                "DVR/NVR setup",
                "Network configuration"
            ]
        },

        {
            id: "JOB-004",
            title: "Smart Building Automation",
            type: "automation",
            typeLabel: "Automation",
            location: "Jabi, Abuja",
            distance: 18.5,
            amount: 220000,
            duration: "3 days",
            date: "25 Aug 2026",
            description:
                "Smart lighting and building automation installation.",
            requirements: [
                "Smart automation",
                "Control systems",
                "Low voltage wiring"
            ]
        }
    ],

    projects: [
        {
            id: "AE-2026-0048",
            title: "20kW Hybrid Solar System",
            type: "solar",
            status: "active",
            statusLabel: "Installation",
            location: "Guzape, AMAC, Abuja",
            progress: 78,
            milestonesCompleted: 7,
            milestonesTotal: 9
        },

        {
            id: "AE-2026-0031",
            title: "15kVA Solar Backup System",
            type: "solar",
            status: "completed",
            statusLabel: "Completed",
            location: "Maitama, Abuja",
            progress: 100,
            milestonesCompleted: 9,
            milestonesTotal: 9
        },

        {
            id: "AE-2026-0028",
            title: "Commercial Electrical Upgrade",
            type: "electrical",
            status: "inspection",
            statusLabel: "Inspection",
            location: "Wuse 2, Abuja",
            progress: 94,
            milestonesCompleted: 8,
            milestonesTotal: 9
        }
    ],

    milestones: [
        {
            id: 1,
            title: "Site Preparation",
            description: "Project site preparation completed.",
            status: "complete"
        },

        {
            id: 2,
            title: "Solar Panel Installation",
            description: "Solar modules installed and mechanically secured.",
            status: "complete"
        },

        {
            id: 3,
            title: "DC Wiring",
            description: "PV strings and DC cable installation.",
            status: "complete"
        },

        {
            id: 4,
            title: "Protection Installation",
            description: "DC protection and isolators installed.",
            status: "complete"
        },

        {
            id: 5,
            title: "Inverter Installation",
            description: "Hybrid inverter installation and termination.",
            status: "active"
        },

        {
            id: 6,
            title: "Battery Installation",
            description: "Lithium battery installation and communication setup.",
            status: "upcoming"
        },

        {
            id: 7,
            title: "AC Distribution",
            description: "AC distribution and protection termination.",
            status: "upcoming"
        },

        {
            id: 8,
            title: "Testing & Commissioning",
            description: "System testing and commissioning.",
            status: "upcoming"
        },

        {
            id: 9,
            title: "Client Handover",
            description: "Final documentation and client handover.",
            status: "upcoming"
        }
    ],

    documents: [
        {
            name: "System Single Line Diagram",
            type: "PDF",
            size: "1.2 MB",
            icon: "file-text"
        },

        {
            name: "Installation Guide",
            type: "PDF",
            size: "2.8 MB",
            icon: "book-open"
        },

        {
            name: "Equipment Schedule",
            type: "PDF",
            size: "850 KB",
            icon: "clipboard-list"
        },

        {
            name: "Protection Schedule",
            type: "PDF",
            size: "740 KB",
            icon: "shield-check"
        },

        {
            name: "Commissioning Checklist",
            type: "PDF",
            size: "620 KB",
            icon: "check-square"
        }
    ],

    payments: [
        {
            project: "20kW Hybrid Solar System",
            amount: 250000,
            submitted: "14 Aug 2026",
            status: "Under Review",
            reference: "PAY-2026-0841"
        },

        {
            project: "15kVA Solar Backup System",
            amount: 180000,
            submitted: "05 Aug 2026",
            status: "Paid",
            reference: "PAY-2026-0788"
        },

        {
            project: "Commercial Electrical Upgrade",
            amount: 170000,
            submitted: "28 Jul 2026",
            status: "Paid",
            reference: "PAY-2026-0712"
        }
    ]

};


/* =========================================================
   2. DOM HELPERS
========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


/* =========================================================
   3. INITIALIZE APPLICATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeLucide();

    initializeNavigation();

    initializeDashboardActions();

    initializeAvailability();

    initializeNotifications();

    initializeSupport();

    initializeJobs();

    initializeProjects();

    initializeProgress();

    initializeDocuments();

    initializeEvidence();

    initializePayments();

    initializeProfile();

    initializeMobileMenu();

    initializeProfileMenu();

    initializeLogout();

    updateInstallerUI();

    renderJobs();

    renderProjects();

    renderMilestones();

    renderDocuments();

    renderPayments();

    updateDashboard();

});


/* =========================================================
   4. LUCIDE ICONS
========================================================= */

function initializeLucide() {

    if (window.lucide) {
        lucide.createIcons();
    }

}


/* =========================================================
   5. NAVIGATION ENGINE
========================================================= */

function initializeNavigation() {

    const navItems = $$(".nav-item");

    navItems.forEach(button => {

        button.addEventListener("click", () => {

            const page = button.dataset.page;

            if (!page) return;

            navigateTo(page);

        });

    });


    $$("[data-page-target]").forEach(button => {

        button.addEventListener("click", () => {

            const page = button.dataset.pageTarget;

            if (!page) return;

            navigateTo(page);

        });

    });

}


function navigateTo(page) {

    const targetPage = $(`[data-page-content="${page}"]`);

    if (!targetPage) {

        console.warn(`Page "${page}" does not exist.`);

        return;

    }


    InstallerApp.currentPage = page;


    /* -----------------------------------------
       Hide every page
    ----------------------------------------- */

    $$(".portal-page").forEach(section => {

        section.classList.remove("active");

    });


    /* -----------------------------------------
       Show selected page
    ----------------------------------------- */

    targetPage.classList.add("active");


    /* -----------------------------------------
       Update sidebar
    ----------------------------------------- */

    $$(".nav-item").forEach(item => {

        item.classList.remove("active");

        if (item.dataset.page === page) {

            item.classList.add("active");

        }

    });


    /* -----------------------------------------
       Update page title
    ----------------------------------------- */

    updatePageTitle(page);


    /* -----------------------------------------
       Close mobile sidebar
    ----------------------------------------- */

    closeMobileMenu();


    /* -----------------------------------------
       Scroll to top
    ----------------------------------------- */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    initializeLucide();

}


function updatePageTitle(page) {

    const titles = {

        dashboard: "Installer Dashboard",

        "available-jobs": "Available Jobs",

        projects: "My Projects",

        progress: "Project Progress",

        documents: "Technical Documents",

        evidence: "Evidence Upload",

        payments: "Payments",

        performance: "Installer Performance",

        availability: "Availability",

        profile: "My Profile"

    };


    const title = $("#pageTitle");

    if (title) {

        title.textContent =
            titles[page] || "Installer Portal";

    }

}


/* =========================================================
   6. DASHBOARD ENGINE
========================================================= */

function initializeDashboardActions() {

    const menuButtons = $$(".card-menu-btn");

    menuButtons.forEach(button => {

        button.addEventListener("click", event => {

            event.stopPropagation();

            showToast(
                "Project options opened.",
                "info"
            );

        });

    });

}


function updateDashboard() {

    const activeCount =
        $("#activeProjectsCount");

    const completedCount =
        $("#completedProjectsCount");

    const progressValue =
        $("#dashboardProgressValue");

    const progressBar =
        $("#dashboardProgressBar");


    if (activeCount) {

        activeCount.textContent =
            String(InstallerApp.installer.activeProjects)
                .padStart(2, "0");

    }


    if (completedCount) {

        completedCount.textContent =
            InstallerApp.installer.completedProjects;

    }


    if (progressValue) {

        progressValue.textContent =
            `${InstallerApp.dashboard.progress}%`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${InstallerApp.dashboard.progress}%`;

    }

}


/* =========================================================
   7. INSTALLER INFORMATION
========================================================= */

function updateInstallerUI() {

    const name =
        InstallerApp.installer.name;

    const sidebarName =
        $("#sidebarInstallerName");

    const welcomeName =
        $("#welcomeInstallerName");

    if (sidebarName) {

        sidebarName.textContent =
            InstallerApp.installer.company;

    }

    if (welcomeName) {

        welcomeName.textContent =
            name;

    }


    const sidebarId =
        $("#sidebarInstallerId");

    if (sidebarId) {

        sidebarId.textContent =
            InstallerApp.installer.id;

    }

}


/* =========================================================
   8. AVAILABILITY ENGINE
========================================================= */

function initializeAvailability() {

    const toggle =
        $("#availabilityToggle");

    const menu =
        $("#availabilityMenu");


    if (toggle && menu) {

        toggle.addEventListener("click", event => {

            event.stopPropagation();

            menu.hidden = !menu.hidden;

        });

    }


    $$("[data-status-select]").forEach(button => {

        button.addEventListener("click", () => {

            const status =
                button.dataset.statusSelect;

            setAvailability(status);

            if (menu) {

                menu.hidden = true;

            }

        });

    });


    $$("[data-availability]").forEach(button => {

        button.addEventListener("click", () => {

            const status =
                button.dataset.availability;

            setAvailability(status);

        });

    });


    document.addEventListener("click", event => {

        if (
            menu &&
            !menu.contains(event.target) &&
            toggle &&
            !toggle.contains(event.target)
        ) {

            menu.hidden = true;

        }

    });

}


function setAvailability(status) {

    const validStatuses = [
        "available",
        "occupied",
        "offline",
        "leave"
    ];


    if (!validStatuses.includes(status)) {

        return;

    }


    InstallerApp.installer.status =
        status;


    const labels = {

        available: "Available",

        occupied: "Occupied",

        offline: "Offline",

        leave: "On Leave"

    };


    const text =
        labels[status];


    /* Top availability button */

    const availabilityToggle =
        $("#availabilityToggle");

    const availabilityText =
        $("#availabilityText");


    if (availabilityToggle) {

        availabilityToggle.dataset.status =
            status;

        availabilityToggle.className =
            `availability-pill ${status}`;

    }


    if (availabilityText) {

        availabilityText.textContent =
            text;

    }


    /* Large availability page */

    const largeText =
        $("#largeAvailabilityText");

    const largeDot =
        $("#largeStatusDot");


    if (largeText) {

        largeText.textContent =
            text;

    }


    if (largeDot) {

        largeDot.className =
            `large-status-dot ${status}`;

    }


    /* Availability option buttons */

    $$("[data-availability]").forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.availability === status
        );

    });


    showToast(
        `Availability changed to ${text}.`,
        "success"
    );

}


/* =========================================================
   9. NOTIFICATIONS
========================================================= */

function initializeNotifications() {

    const button =
        $("#notificationBtn");

    const panel =
        $("#notificationPanel");


    if (!button || !panel) return;


    button.addEventListener("click", event => {

        event.stopPropagation();

        panel.hidden =
            !panel.hidden;

    });


    document.addEventListener("click", event => {

        if (
            !panel.contains(event.target) &&
            !button.contains(event.target)
        ) {

            panel.hidden = true;

        }

    });


    const markRead =
        $("#markNotificationsRead");


    if (markRead) {

        markRead.addEventListener("click", () => {

            $$(".notification-item").forEach(item => {

                item.classList.remove("unread");

            });


            const badge =
                $(".notification-count");

            if (badge) {

                badge.textContent = "0";

            }


            markRead.textContent =
                "All read";


            showToast(
                "All notifications marked as read.",
                "success"
            );

        });

    }

}


/* =========================================================
   10. SUPPORT MODAL
========================================================= */

function initializeSupport() {

    const supportButton =
        $("#supportBtn");

    const modal =
        $("#supportModal");


    if (supportButton && modal) {

        supportButton.addEventListener(
            "click",
            () => openModal(modal)
        );

    }


    $$("[data-close-modal]").forEach(button => {

        button.addEventListener("click", () => {

            closeAllModals();

        });

    });


    $$(".modal-overlay").forEach(overlay => {

        overlay.addEventListener("click", event => {

            if (event.target === overlay) {

                closeAllModals();

            }

        });

    });


    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            closeAllModals();

        }

    });

}


function openModal(modal) {

    if (!modal) return;

    modal.hidden = false;

    document.body.classList.add("modal-open");

    initializeLucide();

}


function closeAllModals() {

    $$(".modal-overlay").forEach(modal => {

        modal.hidden = true;

    });

    document.body.classList.remove("modal-open");

}


/* =========================================================
   11. AVAILABLE JOBS
========================================================= */

function initializeJobs() {

    const search =
        $("#jobSearch");

    const typeFilter =
        $("#jobTypeFilter");

    const distanceFilter =
        $("#jobDistanceFilter");

    const refresh =
        $("#refreshJobsBtn");


    if (search) {

        search.addEventListener(
            "input",
            renderJobs
        );

    }


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            renderJobs
        );

    }


    if (distanceFilter) {

        distanceFilter.addEventListener(
            "change",
            renderJobs
        );

    }


    if (refresh) {

        refresh.addEventListener("click", () => {

            renderJobs();

            showToast(
                "Available jobs refreshed.",
                "success"
            );

        });

    }

}


function renderJobs() {

    const container =
        $("#availableJobsList");

    if (!container) return;


    const search =
        ($("#jobSearch")?.value || "")
            .toLowerCase()
            .trim();

    const type =
        $("#jobTypeFilter")?.value || "all";

    const distance =
        $("#jobDistanceFilter")?.value || "all";


    const jobs =
        InstallerApp.jobs.filter(job => {

            const matchesSearch =
                !search ||
                job.title.toLowerCase().includes(search) ||
                job.location.toLowerCase().includes(search);


            const matchesType =
                type === "all" ||
                job.type === type;


            const matchesDistance =
                distance === "all" ||
                job.distance <= Number(distance);


            return (
                matchesSearch &&
                matchesType &&
                matchesDistance
            );

        });


    if (!jobs.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="search-x"></i>
                <h3>No projects found</h3>
                <p>
                    Try changing your search or filters.
                </p>
            </div>
        `;

        initializeLucide();

        return;

    }


    container.innerHTML =
        jobs.map(job => createJobCard(job)).join("");


    initializeLucide();


    $$(".job-card", container).forEach(card => {

        card.addEventListener("click", () => {

            const job =
                InstallerApp.jobs.find(
                    item => item.id === card.dataset.jobId
                );

            if (job) {

                openJobModal(job);

            }

        });

    });

}


function createJobCard(job) {

    return `
        <article
            class="job-card"
            data-job-id="${job.id}"
        >

            <div class="job-card-top">

                <span class="job-type ${job.type}">
                    ${job.typeLabel}
                </span>

                <span class="job-distance">
                    ${job.distance} km
                </span>

            </div>

            <div class="job-card-main">

                <h3>${job.title}</h3>

                <p>
                    <i data-lucide="map-pin"></i>
                    ${job.location}
                </p>

                <p>
                    <i data-lucide="calendar"></i>
                    ${job.date}
                </p>

                <p>
                    <i data-lucide="clock"></i>
                    ${job.duration}
                </p>

            </div>

            <div class="job-card-footer">

                <strong>
                    ₦${formatMoney(job.amount)}
                </strong>

                <button
                    type="button"
                    class="btn btn-primary"
                    data-job-action="${job.id}"
                >
                    View Job
                    <i data-lucide="arrow-right"></i>
                </button>

            </div>

        </article>
    `;

}


function openJobModal(job) {

    const modal =
        $("#projectModal");

    const content =
        $("#projectModalContent");


    if (!modal || !content) return;


    content.innerHTML = `

        <span class="eyebrow">
            AVAILABLE PROJECT
        </span>

        <h2>
            ${job.title}
        </h2>

        <p class="modal-description">
            ${job.description}
        </p>

        <div class="modal-project-details">

            <div>
                <span>Location</span>
                <strong>${job.location}</strong>
            </div>

            <div>
                <span>Distance</span>
                <strong>${job.distance} km</strong>
            </div>

            <div>
                <span>Installation Fee</span>
                <strong>₦${formatMoney(job.amount)}</strong>
            </div>

            <div>
                <span>Duration</span>
                <strong>${job.duration}</strong>
            </div>

        </div>

        <div class="job-requirements">

            <h3>Requirements</h3>

            <ul>
                ${job.requirements.map(requirement => `
                    <li>
                        <i data-lucide="check-circle-2"></i>
                        ${requirement}
                    </li>
                `).join("")}
            </ul>

        </div>

        <div class="modal-actions">

            <button
                type="button"
                class="btn btn-light"
                data-close-modal
            >
                Cancel
            </button>

            <button
                type="button"
                class="btn btn-primary"
                id="acceptJobBtn"
            >
                <i data-lucide="check"></i>
                Accept Project
            </button>

        </div>
    `;


    openModal(modal);


    const acceptButton =
        $("#acceptJobBtn");


    if (acceptButton) {

        acceptButton.addEventListener(
            "click",
            () => acceptJob(job)
        );

    }


    $$("[data-close-modal]").forEach(button => {

        button.addEventListener(
            "click",
            closeAllModals
        );

    });

}


function acceptJob(job) {

    if (
        InstallerApp.installer.activeProjects >=
        InstallerApp.installer.maxProjects
    ) {

        showToast(
            "Your workload limit has been reached.",
            "warning"
        );

        return;

    }


    InstallerApp.installer.activeProjects++;


    InstallerApp.projects.unshift({

        id: `AE-2026-${Math.floor(
            Math.random() * 9000 + 1000
        )}`,

        title: job.title,

        type: job.type,

        status: "active",

        statusLabel: "Assigned",

        location: job.location,

        progress: 0,

        milestonesCompleted: 0,

        milestonesTotal: 9

    });


    closeAllModals();

    renderProjects();

    updateDashboard();


    showToast(
        `${job.title} has been added to your projects.`,
        "success"
    );


    navigateTo("projects");

}


/* =========================================================
   12. MY PROJECTS
========================================================= */

function initializeProjects() {

    $$(".project-tab").forEach(tab => {

        tab.addEventListener("click", () => {

            $$(".project-tab").forEach(item => {

                item.classList.remove("active");

            });

            tab.classList.add("active");

            renderProjects(
                tab.dataset.projectStatus
            );

        });

    });

}


function renderProjects(filter = "all") {

    const container =
        $("#projectsList");

    if (!container) return;


    const projects =
        filter === "all"
            ? InstallerApp.projects
            : InstallerApp.projects.filter(
                project =>
                    project.status === filter
            );


    if (!projects.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="folder-open"></i>
                <h3>No projects</h3>
                <p>No projects match this category.</p>
            </div>
        `;

        initializeLucide();

        return;

    }


    container.innerHTML =
        projects.map(project => `

            <article
                class="project-list-card"
                data-project-id="${project.id}"
            >

                <div class="project-list-icon ${project.type}">
                    <i data-lucide="sun"></i>
                </div>

                <div class="project-list-content">

                    <span class="project-id">
                        ${project.id}
                    </span>

                    <h3>
                        ${project.title}
                    </h3>

                    <p>
                        <i data-lucide="map-pin"></i>
                        ${project.location}
                    </p>

                </div>

                <div class="project-list-progress">

                    <div>
                        <span>Progress</span>
                        <strong>${project.progress}%</strong>
                    </div>

                    <div class="progress-track">
                        <div
                            class="progress-fill"
                            style="width:${project.progress}%"
                        ></div>
                    </div>

                </div>

                <span class="project-status-badge ${project.status}">
                    ${project.statusLabel}
                </span>

                <button
                    type="button"
                    class="btn btn-light project-open-btn"
                >
                    Open
                    <i data-lucide="arrow-right"></i>
                </button>

            </article>

        `).join("");


    initializeLucide();


    $$(".project-list-card", container).forEach(card => {

        const project =
            InstallerApp.projects.find(
                item =>
                    item.id === card.dataset.projectId
            );


        card.querySelector(
            ".project-open-btn"
        )?.addEventListener(
            "click",
            () => {

                if (project) {

                    openProject(project);

                }

            }
        );

    });

}


function openProject(project) {

    if (project.id === "AE-2026-0048") {

        navigateTo("progress");

        return;

    }


    showToast(
        `${project.title} opened.`,
        "info"
    );

}


/* =========================================================
   13. PROJECT PROGRESS
========================================================= */

function initializeProgress() {

    renderMilestones();

}


function renderMilestones() {

    const container =
        $("#milestoneList");

    if (!container) return;


    container.innerHTML =
        InstallerApp.milestones.map(
            (milestone, index) => {

                const icons = {

                    complete: "check",

                    active: "loader-circle",

                    upcoming: "circle"

                };


                return `

                    <div
                        class="milestone-item ${milestone.status}"
                        data-milestone-id="${milestone.id}"
                    >

                        <div class="milestone-number">
                            ${String(index + 1).padStart(2, "0")}
                        </div>

                        <div class="milestone-icon">
                            <i data-lucide="${icons[milestone.status]}"></i>
                        </div>

                        <div class="milestone-content">

                            <span>
                                ${milestone.status.toUpperCase()}
                            </span>

                            <h3>
                                ${milestone.title}
                            </h3>

                            <p>
                                ${milestone.description}
                            </p>

                        </div>

                        <button
                            type="button"
                            class="btn btn-light milestone-action"
                            data-milestone="${milestone.id}"
                        >
                            ${
                                milestone.status === "complete"
                                    ? "View"
                                    : milestone.status === "active"
                                        ? "Update"
                                        : "Open"
                            }
                        </button>

                    </div>

                `;

            }
        ).join("");


    initializeLucide();


    $$(".milestone-action", container).forEach(button => {

        button.addEventListener("click", () => {

            const id =
                Number(button.dataset.milestone);

            handleMilestone(id);

        });

    });

}


function handleMilestone(id) {

    const milestone =
        InstallerApp.milestones.find(
            item => item.id === id
        );


    if (!milestone) return;


    if (milestone.status === "upcoming") {

        showToast(
            `${milestone.title} is not active yet.`,
            "info"
        );

        return;

    }


    if (milestone.status === "active") {

        navigateTo("evidence");

        const select =
            $("#evidenceMilestone");

        if (select) {

            const option =
                [...select.options].find(
                    option =>
                        option.text
                            .toLowerCase()
                            .includes(
                                milestone.title
                                    .toLowerCase()
                            )
                );

            if (option) {

                select.value =
                    option.value ||
                    option.text;

            }

        }

        return;

    }


    showToast(
        `${milestone.title} completed.`,
        "success"
    );

}


/* =========================================================
   14. TECHNICAL DOCUMENTS
========================================================= */

function initializeDocuments() {

    renderDocuments();

}


function renderDocuments() {

    const container =
        $("#documentsGrid");

    if (!container) return;


    container.innerHTML =
        InstallerApp.documents.map(document => `

            <article class="document-card">

                <div class="document-icon">
                    <i data-lucide="${document.icon}"></i>
                </div>

                <div class="document-content">

                    <h3>
                        ${document.name}
                    </h3>

                    <span>
                        ${document.type}
                        •
                        ${document.size}
                    </span>

                </div>

                <button
                    type="button"
                    class="icon-button document-download"
                    data-document="${document.name}"
                    aria-label="Download document"
                >
                    <i data-lucide="download"></i>
                </button>

            </article>

        `).join("");


    initializeLucide();


    $$(".document-download", container).forEach(button => {

        button.addEventListener("click", () => {

            const name =
                button.dataset.document;

            downloadDocument(name);

        });

    });

}


function downloadDocument(name) {

    showToast(
        `${name} download started.`,
        "success"
    );

}


/* =========================================================
   15. EVIDENCE UPLOAD
========================================================= */

function initializeEvidence() {

    const fileInput =
        $("#evidenceFiles");

    const preview =
        $("#evidencePreview");

    const submit =
        $("#submitEvidenceBtn");


    if (fileInput && preview) {

        fileInput.addEventListener(
            "change",
            () => {

                preview.innerHTML = "";


                [...fileInput.files].forEach(file => {

                    const item =
                        document.createElement("div");

                    item.className =
                        "evidence-file-preview";


                    const isImage =
                        file.type.startsWith("image/");


                    if (isImage) {

                        const image =
                            document.createElement("img");

                        image.src =
                            URL.createObjectURL(file);

                        image.alt =
                            file.name;

                        item.appendChild(image);

                    } else {

                        item.innerHTML = `
                            <i data-lucide="video"></i>
                        `;

                    }


                    const label =
                        document.createElement("span");

                    label.textContent =
                        file.name;

                    item.appendChild(label);

                    preview.appendChild(item);

                });


                initializeLucide();

            }
        );

    }


    if (submit) {

        submit.addEventListener(
            "click",
            submitEvidence
        );

    }

}


function submitEvidence() {

    const milestone =
        $("#evidenceMilestone")?.value;

    const files =
        $("#evidenceFiles")?.files;

    const notes =
        $("#evidenceNotes")?.value.trim();


    if (!milestone) {

        showToast(
            "Please select a milestone.",
            "warning"
        );

        return;

    }


    if (!files || !files.length) {

        showToast(
            "Please select at least one evidence file.",
            "warning"
        );

        return;

    }


    showToast(
        "Evidence submitted successfully.",
        "success"
    );


    if ($("#evidenceFiles")) {

        $("#evidenceFiles").value = "";

    }


    if ($("#evidencePreview")) {

        $("#evidencePreview").innerHTML = "";

    }


    if ($("#evidenceNotes")) {

        $("#evidenceNotes").value = "";

    }

}


/* =========================================================
   16. PAYMENTS
========================================================= */

function initializePayments() {

    renderPayments();

}


function renderPayments() {

    const tbody =
        $("#paymentTableBody");

    if (!tbody) return;


    tbody.innerHTML =
        InstallerApp.payments.map(payment => `

            <tr>

                <td>
                    ${payment.project}
                </td>

                <td>
                    ₦${formatMoney(payment.amount)}
                </td>

                <td>
                    ${payment.submitted}
                </td>

                <td>

                    <span class="
                        payment-status
                        ${payment.status
                            .toLowerCase()
                            .replaceAll(" ", "-")}
                    ">
                        ${payment.status}
                    </span>

                </td>

                <td>
                    ${payment.reference}
                </td>

            </tr>

        `).join("");

}


/* =========================================================
   17. PROFILE
========================================================= */

function initializeProfile() {

    $$(".profile-layout .btn").forEach(button => {

        button.addEventListener("click", () => {

            if (
                button.textContent
                    .trim()
                    .includes("Edit")
            ) {

                showToast(
                    "Profile editing will open here.",
                    "info"
                );

            }

        });

    });

}


/* =========================================================
   18. MOBILE MENU
========================================================= */

function initializeMobileMenu() {

    const button =
        $("#mobileMenuBtn");

    const sidebar =
        $("#sidebar");


    if (!button || !sidebar) return;


    button.addEventListener("click", () => {

        sidebar.classList.toggle(
            "mobile-open"
        );

        document.body.classList.toggle(
            "sidebar-open"
        );

    });

}


function closeMobileMenu() {

    const sidebar =
        $("#sidebar");

    if (!sidebar) return;


    sidebar.classList.remove(
        "mobile-open"
    );

    document.body.classList.remove(
        "sidebar-open"
    );

}


/* =========================================================
   19. PROFILE MENU
========================================================= */

function initializeProfileMenu() {

    const button =
        $("#profileMenuBtn");

    if (!button) return;


    button.addEventListener("click", () => {

        navigateTo("profile");

    });

}


/* =========================================================
   20. LOGOUT
========================================================= */

function initializeLogout() {

    const button =
        $("#logoutBtn");

    if (!button) return;


    button.addEventListener("click", () => {

        const confirmed =
            window.confirm(
                "Are you sure you want to sign out?"
            );


        if (!confirmed) return;


        showToast(
            "Signing out...",
            "info"
        );


        setTimeout(() => {

            /*
             * Connect this to your authentication
             * system later.
             */

            window.location.href =
                "index.html";

        }, 700);

    });

}


/* =========================================================
   21. TOAST SYSTEM
========================================================= */

function showToast(message, type = "info") {

    let container =
        $("#toastContainer");


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";

        container.className =
            "toast-container";

        document.body.appendChild(container);

    }


    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;


    const icons = {

        success: "check-circle-2",

        warning: "triangle-alert",

        error: "circle-x",

        info: "info"

    };


    toast.innerHTML = `

        <i data-lucide="${icons[type] || icons.info}"></i>

        <span>
            ${escapeHTML(message)}
        </span>

        <button type="button">
            <i data-lucide="x"></i>
        </button>

    `;


    container.appendChild(toast);

    initializeLucide();


    toast.querySelector("button")
        ?.addEventListener(
            "click",
            () => toast.remove()
        );


    setTimeout(() => {

        toast.classList.add("show");

    }, 10);


    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(
            () => toast.remove(),
            300
        );

    }, 4000);

}


/* =========================================================
   22. UTILITY FUNCTIONS
========================================================= */

function formatMoney(amount) {

    return Number(amount).toLocaleString(
        "en-NG"
    );

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   23. GLOBAL CLICK HANDLER
========================================================= */

document.addEventListener("click", event => {

    const jobButton =
        event.target.closest(
            "[data-job-action]"
        );


    if (jobButton) {

        event.stopPropagation();

        const job =
            InstallerApp.jobs.find(
                item =>
                    item.id ===
                    jobButton.dataset.jobAction
            );


        if (job) {

            openJobModal(job);

        }

    }

});


/* =========================================================
   24. WINDOW RESIZE
========================================================= */

window.addEventListener("resize", () => {

    if (window.innerWidth > 900) {

        closeMobileMenu();

    }

});


/* =========================================================
   25. PUBLIC API
========================================================= */

window.AENetworkInstaller = {

    navigateTo,

    setAvailability,

    renderJobs,

    renderProjects,

    renderMilestones,

    showToast,

    InstallerApp

};