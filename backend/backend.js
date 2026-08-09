"use strict";

/* =========================================================
   AE RENEWABLE LTD
   BACKEND UI — STATIC FRONTEND CONTROLLER
   INSTALLER DIRECTORY + REGISTRATION + SECURE VITAL ACCESS
   ========================================================= */


/* =========================================================
   GLOBAL ELEMENTS
   ========================================================= */

const pages = Array.from(document.querySelectorAll(".page"));
const navItems = Array.from(document.querySelectorAll(".nav-item"));

const breadcrumb = document.getElementById("breadcrumb");
const toast = document.getElementById("toast");

let toastTimer = null;
let monitoringInterval = null;

let currentInstaller = null;
let vitalInformationUnlocked = false;


/* =========================================================
   INSTALLER DATA
   ========================================================= */

let installers = [
    {
        id: "INS-0001",
        name: "Abdulrasaq Eniola",
        initials: "AE",
        phone: "08133615132",
        email: "AERenewablesolution@gmail.com",
        state: "FCT Abuja",
        position: "Lead Installer",
        specialization: "Solar & Hybrid Systems",
        group: "AE Renewable Core",
        experience: "8 Years",
        rcNumber: "RC 1234567",
        cacDate: "14 March 2023",
        status: "Active",
        availability: "Available",
        projects: 24,
        lastQuotation: "AE-20260806-001",
        registrationDate: "06 August 2026",

        bvn: "********321",
        bank: "GTBank",
        accountName: "Abdulrasaq Eniola Abdulquodry",
        accountNumber: "********9012",

        notes:
            "Lead technical installer and system commissioning specialist.",

        certificates: [
            "Solar PV Installation Certificate",
            "Electrical Installation Certificate"
        ],

        projectsHistory: [
            {
                reference: "PRJ-2026-001",
                client: "Residential Client",
                location: "Guzape, Abuja",
                quotation: "AE-20260806-001",
                assignment: "06 Aug 2026",
                completion: "08 Aug 2026",
                status: "Completed",
                images: 18,
                workImages: 12
            },
            {
                reference: "PRJ-2026-002",
                client: "Commercial Client",
                location: "Maitama, Abuja",
                quotation: "AE-20260801-004",
                assignment: "01 Aug 2026",
                completion: "04 Aug 2026",
                status: "Completed",
                images: 24,
                workImages: 17
            }
        ],

        photo: null
    },

    {
        id: "INS-0002",
        name: "Ibrahim Musa",
        initials: "IM",
        phone: "08000000001",
        email: "ibrahim@example.com",
        state: "Nasarawa",
        position: "Solar Installer",
        specialization: "Solar PV Installation",
        group: "Field Team A",
        experience: "5 Years",
        rcNumber: "RC 2456812",
        cacDate: "22 May 2024",
        status: "Active",
        availability: "On Project",
        projects: 17,
        lastQuotation: "AE-20260729-003",
        registrationDate: "29 July 2026",

        bvn: "********782",
        bank: "Access Bank",
        accountName: "Ibrahim Musa",
        accountNumber: "********4421",

        notes:
            "Experienced residential PV installer.",

        certificates: [
            "Solar Installation Certificate"
        ],

        projectsHistory: [],

        photo: null
    },

    {
        id: "INS-0003",
        name: "David John",
        initials: "DJ",
        phone: "08000000002",
        email: "david@example.com",
        state: "FCT Abuja",
        position: "Electrical Installer",
        specialization: "Electrical Engineering",
        group: "Field Team B",
        experience: "6 Years",
        rcNumber: "BN 5567821",
        cacDate: "12 January 2024",
        status: "Active",
        availability: "Available",
        projects: 12,
        lastQuotation: "AE-20260722-002",
        registrationDate: "22 July 2026",

        bvn: "********451",
        bank: "UBA",
        accountName: "David John",
        accountNumber: "********7761",

        notes:
            "Electrical installation and protection systems specialist.",

        certificates: [
            "Electrical Engineering Certificate"
        ],

        projectsHistory: [],

        photo: null
    }
];


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageName) {

    pages.forEach((page) => {
        page.classList.remove("active");
    });

    const targetPage =
        document.getElementById(`page-${pageName}`);

    if (!targetPage) {
        console.warn(`Page "${pageName}" was not found.`);
        return;
    }

    targetPage.classList.add("active");

    navItems.forEach((item) => {
        item.classList.remove("active");

        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }
    });

    updateBreadcrumb(pageName);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   BREADCRUMB
   ========================================================= */

function updateBreadcrumb(pageName) {

    if (!breadcrumb) return;

    const pageNames = {
        dashboard: "Dashboard",
        consultations: "Consultations",
        detail: "Consultation Detail",
        customers: "Customers",
        sites: "Sites",
        projects: "Projects",
        quotations: "Quotations",
        invoices: "Invoices",
        reports: "Reports",
        monitoring: "Live Monitoring",
        equipment: "Equipment",
        installers: "Installers",
        installerProfile: "Installer Profile",
        settings: "Settings"
    };

    breadcrumb.textContent =
        pageNames[pageName] ||
        pageName.charAt(0).toUpperCase() +
        pageName.slice(1);
}


/* =========================================================
   SIDEBAR NAVIGATION
   ========================================================= */

navItems.forEach((item) => {

    item.addEventListener("click", () => {

        const page = item.dataset.page;

        if (!page) return;

        showPage(page);
    });

});


/* =========================================================
   CONSULTATION DETAILS
   ========================================================= */

function openDetail(reference) {

    const title =
        document.getElementById("detailTitle");

    if (title && reference) {
        title.textContent = reference;
    }

    showPage("detail");
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "normal") {

    if (!toast) return;

    toast.textContent = message;

    toast.classList.remove(
        "success",
        "error",
        "warning",
        "show"
    );

    if (type === "success") {
        toast.classList.add("success");
    }

    if (type === "error") {
        toast.classList.add("error");
    }

    if (type === "warning") {
        toast.classList.add("warning");
    }

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


/* =========================================================
   RANDOM NUMBER
   ========================================================= */

function randomNumber(min, max, decimals = 1) {

    const value =
        Math.random() * (max - min) + min;

    return Number(value).toFixed(decimals);
}


/* =========================================================
   MONITORING DEMO
   ========================================================= */

function startMonitoringDemo() {

    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }

    updateMonitoringValues();

    monitoringInterval =
        setInterval(updateMonitoringValues, 3000);
}


function updateMonitoringValues() {

    const dashboardSolar =
        document.querySelector(
            "#page-dashboard .energy-number strong"
        );

    if (dashboardSolar) {

        dashboardSolar.textContent =
            randomNumber(41.5, 44.8);
    }


    const monitoringStats =
        document.querySelectorAll(
            "#page-monitoring .monitor-stats strong"
        );

    if (monitoringStats.length >= 4) {

        monitoringStats[0].innerHTML =
            `${randomNumber(17.5, 19.8)} <small>kW</small>`;

        monitoringStats[1].innerHTML =
            `${randomNumber(10.4, 12.8)} <small>kW</small>`;

        monitoringStats[2].innerHTML =
            `${randomNumber(79, 86, 0)} <small>%</small>`;

        monitoringStats[3].innerHTML =
            `0.0 <small>kW</small>`;
    }
}


/* =========================================================
   SYSTEM STATUS
   ========================================================= */

function setSystemStatus(status) {

    const statusElement =
        document.querySelector(
            "#page-monitoring .live-pill"
        );

    if (!statusElement) return;


    if (status === "online") {

        statusElement.innerHTML =
            "<i></i> SYSTEM ONLINE";

        statusElement.style.background =
            "#eaf8f0";

        statusElement.style.color =
            "#008000";

        return;
    }


    if (status === "warning") {

        statusElement.innerHTML =
            "<i></i> SYSTEM ATTENTION";

        statusElement.style.background =
            "#fff5db";

        statusElement.style.color =
            "#996500";

        return;
    }


    if (status === "offline") {

        statusElement.innerHTML =
            "<i></i> SYSTEM OFFLINE";

        statusElement.style.background =
            "#fdecec";

        statusElement.style.color =
            "#b42318";
    }
}


/* =========================================================
   CONSULTATION SEARCH
   ========================================================= */

const consultationSearch =
    document.querySelector(
        "#page-consultations .search input"
    );

if (consultationSearch) {

    consultationSearch.addEventListener(
        "input",
        applyConsultationFilters
    );
}


function applyConsultationFilters() {

    const searchInput =
        document.querySelector(
            "#page-consultations .search input"
        );

    const searchValue =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const selects =
        document.querySelectorAll(
            "#page-consultations .filter-row select"
        );


    const statusValue =
        selects[0]
            ? selects[0].value.toLowerCase()
            : "all statuses";


    const serviceValue =
        selects[1]
            ? selects[1].value.toLowerCase()
            : "all services";


    const rows =
        document.querySelectorAll(
            "#page-consultations tbody tr"
        );


    rows.forEach((row) => {

        const text =
            row.textContent.toLowerCase();


        const matchesSearch =
            !searchValue ||
            text.includes(searchValue);


        const matchesStatus =
            statusValue === "all statuses" ||
            text.includes(statusValue);


        const matchesService =
            serviceValue === "all services" ||
            text.includes(serviceValue);


        row.style.display =
            matchesSearch &&
            matchesStatus &&
            matchesService
                ? ""
                : "none";
    });
}


/* =========================================================
   CONSULTATION FILTERS
   ========================================================= */

document
    .querySelectorAll(
        "#page-consultations .filter-row select"
    )
    .forEach((select) => {

        select.addEventListener(
            "change",
            applyConsultationFilters
        );

    });


/* =========================================================
   QUOTATION ACTIONS
   ========================================================= */

const quotationPage =
    document.getElementById("page-quotations");

if (quotationPage) {

    quotationPage
        .querySelectorAll(".row-action")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    showToast(
                        "Quotation detail interface will open here.",
                        "normal"
                    );

                }
            );

        });
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

const notificationButton =
    document.querySelector(
        ".icon-btn[title='Notifications']"
    );

if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            showToast(
                "3 notifications — static demonstration.",
                "normal"
            );

        }
    );
}


/* =========================================================
   MESSAGES
   ========================================================= */

const messageButton =
    document.querySelector(
        ".icon-btn[title='Messages']"
    );

if (messageButton) {

    messageButton.addEventListener(
        "click",
        () => {

            showToast(
                "No new messages in this prototype.",
                "normal"
            );

        }
    );
}


/* =========================================================
   PROFILE
   ========================================================= */

const profileButton =
    document.querySelector(".profile");

if (profileButton) {

    profileButton.addEventListener(
        "click",
        () => {

            showToast(
                "Administrator profile menu.",
                "normal"
            );

        }
    );
}


/* =========================================================
   INSTALLER HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getInitials(name) {

    if (!name) return "IN";

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
}


function generateInstallerID() {

    let highestNumber = 0;

    installers.forEach((installer) => {

        const match =
            String(installer.id || "")
                .match(/INS-(\d+)/i);

        if (match) {

            highestNumber =
                Math.max(
                    highestNumber,
                    Number(match[1])
                );
        }
    });

    return `INS-${String(
        highestNumber + 1
    ).padStart(4, "0")}`;
}


/* =========================================================
   INSTALLER STATUS CLASS
   ========================================================= */

function getInstallerStatusClass(status) {

    const normalized =
        String(status || "")
            .toLowerCase()
            .trim();

    if (
        normalized === "active" ||
        normalized === "available" ||
        normalized === "completed"
    ) {
        return "green-b";
    }

    if (
        normalized === "on project" ||
        normalized === "pending"
    ) {
        return "amber-b";
    }

    if (
        normalized === "inactive" ||
        normalized === "suspended"
    ) {
        return "purple-b";
    }

    return "blue-b";
}


/* =========================================================
   INSTALLER DIRECTORY
   ========================================================= */

function renderInstallerDirectory(
    filteredInstallers = installers
) {

    const tableBody =
        document.querySelector(
            "#page-installers tbody"
        );

    if (!tableBody) return;


    if (!filteredInstallers.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-page">
                        <div>⌕</div>
                        <h2>No installers found</h2>
                        <p>
                            No installer matches the current
                            search or filter.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        updateInstallerStats([]);

        return;
    }


    tableBody.innerHTML =
        filteredInstallers
            .map((installer) => {

                return `
                    <tr>

                        <td>
                            <div class="installer-table-person">

                                <div class="avatar">
                                    ${escapeHTML(
                                        installer.initials ||
                                        getInitials(installer.name)
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        ${escapeHTML(
                                            installer.name
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            installer.id
                                        )}
                                    </small>
                                </div>

                            </div>
                        </td>


                        <td>
                            ${escapeHTML(
                                installer.phone
                            )}

                            <small>
                                ${escapeHTML(
                                    installer.email
                                )}
                            </small>
                        </td>


                        <td>
                            ${escapeHTML(
                                installer.position
                            )}

                            <small>
                                ${escapeHTML(
                                    installer.state
                                )}
                            </small>
                        </td>


                        <td>
                            <span class="badge blue-b">
                                ${escapeHTML(
                                    installer.specialization
                                )}
                            </span>
                        </td>


                        <td>
                            ${escapeHTML(
                                installer.rcNumber ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                installer.group ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                installer.registrationDate ||
                                "—"
                            )}
                        </td>


                        <td>
                            <strong>
                                ${Number(
                                    installer.projects || 0
                                )}
                            </strong>

                            <small>
                                projects
                            </small>
                        </td>


                        <td>
                            <span class="badge ${getInstallerStatusClass(
                                installer.availability ||
                                installer.status
                            )}">
                                ${escapeHTML(
                                    installer.availability ||
                                    installer.status
                                )}
                            </span>
                        </td>


                        <td>
                            <button
                                class="row-action"
                                type="button"
                                data-installer-id="${escapeHTML(
                                    installer.id
                                )}"
                            >
                                Open Profile
                            </button>
                        </td>

                    </tr>
                `;

            })
            .join("");


    updateInstallerStats(filteredInstallers);
}


/* =========================================================
   INSTALLER STATISTICS
   ========================================================= */

function updateInstallerStats(
    list = installers
) {

    const total =
        document.getElementById(
            "installerTotal"
        );

    const active =
        document.getElementById(
            "installerActive"
        );

    const onProject =
        document.getElementById(
            "installerOnProject"
        );

    const projects =
        document.getElementById(
            "installerProjects"
        );


    if (total) {
        total.textContent = list.length;
    }


    if (active) {

        active.textContent =
            list.filter(
                installer =>
                    String(installer.status)
                        .toLowerCase() ===
                    "active"
            ).length;
    }


    if (onProject) {

        onProject.textContent =
            list.filter(
                installer =>
                    String(installer.availability)
                        .toLowerCase() ===
                    "on project"
            ).length;
    }


    if (projects) {

        projects.textContent =
            list.reduce(
                (sum, installer) =>
                    sum +
                    Number(installer.projects || 0),
                0
            );
    }
}


/* =========================================================
   INSTALLER SEARCH + FILTERS
   ========================================================= */

function getSelectValue(id) {

    const element =
        document.getElementById(id);

    if (!element) return "all";

    return String(element.value || "all")
        .trim();
}


function applyInstallerFilters() {

    const searchInput =
        document.getElementById(
            "installerSearch"
        );


    const searchValue =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const state =
        getSelectValue(
            "installerStateFilter"
        );


    const position =
        getSelectValue(
            "installerPositionFilter"
        );


    const status =
        getSelectValue(
            "installerStatusFilter"
        );


    const specialization =
        getSelectValue(
            "installerSpecializationFilter"
        );


    const filtered =
        installers.filter((installer) => {

            const searchable =
                [
                    installer.id,
                    installer.name,
                    installer.phone,
                    installer.email,
                    installer.state,
                    installer.position,
                    installer.specialization,
                    installer.group,
                    installer.rcNumber
                ]
                    .join(" ")
                    .toLowerCase();


            const searchMatch =
                !searchValue ||
                searchable.includes(
                    searchValue
                );


            const stateMatch =
                state === "all" ||
                !state ||
                String(installer.state)
                    .toLowerCase() ===
                state.toLowerCase();


            const positionMatch =
                position === "all" ||
                !position ||
                String(installer.position)
                    .toLowerCase() ===
                position.toLowerCase();


            const statusMatch =
                status === "all" ||
                !status ||
                String(installer.status)
                    .toLowerCase() ===
                status.toLowerCase();


            const specializationMatch =
                specialization === "all" ||
                !specialization ||
                String(installer.specialization)
                    .toLowerCase() ===
                specialization.toLowerCase();


            return (
                searchMatch &&
                stateMatch &&
                positionMatch &&
                statusMatch &&
                specializationMatch
            );
        });


    renderInstallerDirectory(
        filtered
    );
}


/* =========================================================
   INSTALLER PROFILE
   ========================================================= */

function openInstallerProfile(
    installerId
) {

    const installer =
        installers.find(
            item => item.id === installerId
        );


    if (!installer) {

        showToast(
            "Installer profile could not be found.",
            "error"
        );

        return;
    }


    const page =
        document.getElementById(
            "page-installerProfile"
        );


    if (!page) {

        showToast(
            "Installer profile page is not available.",
            "error"
        );

        return;
    }


    currentInstaller =
        installer;

    lockVitalInformation();

    renderInstallerProfile(
        installer
    );

    showPage(
        "installerProfile"
    );
}


function renderInstallerProfile(
    installer
) {

    const name =
        document.getElementById(
            "installerProfileName"
        );


    const id =
        document.getElementById(
            "installerProfileId"
        );


    const avatar =
        document.getElementById(
            "installerProfileAvatar"
        );


    const status =
        document.getElementById(
            "installerProfileStatus"
        );


    const position =
        document.getElementById(
            "installerProfilePosition"
        );


    const phone =
        document.getElementById(
            "installerProfilePhone"
        );


    const email =
        document.getElementById(
            "installerProfileEmail"
        );


    const state =
        document.getElementById(
            "installerProfileState"
        );


    const specialization =
        document.getElementById(
            "installerProfileSpecialization"
        );


    const group =
        document.getElementById(
            "installerProfileGroup"
        );


    const experience =
        document.getElementById(
            "installerProfileExperience"
        );


    const rc =
        document.getElementById(
            "installerProfileRC"
        );


    const cacDate =
        document.getElementById(
            "installerProfileCACDate"
        );


    const registrationDate =
        document.getElementById(
            "installerProfileRegistrationDate"
        );


    const projects =
        document.getElementById(
            "installerProfileProjects"
        );


    const lastQuotation =
        document.getElementById(
            "installerProfileQuotation"
        );


    if (name) {
        name.textContent =
            installer.name;
    }


    if (id) {
        id.textContent =
            installer.id;
    }


    if (avatar) {

        avatar.textContent =
            installer.initials ||
            getInitials(
                installer.name
            );

        if (installer.photo) {

            avatar.innerHTML = `
                <img
                    src="${escapeHTML(
                        installer.photo
                    )}"
                    alt="${escapeHTML(
                        installer.name
                    )}"
                >
            `;
        }
    }


    if (status) {

        status.textContent =
            installer.status;

        status.className =
            `badge ${getInstallerStatusClass(
                installer.status
            )}`;
    }


    if (position) {
        position.textContent =
            installer.position || "—";
    }


    if (phone) {
        phone.textContent =
            installer.phone || "—";
    }


    if (email) {
        email.textContent =
            installer.email || "—";
    }


    if (state) {
        state.textContent =
            installer.state || "—";
    }


    if (specialization) {
        specialization.textContent =
            installer.specialization || "—";
    }


    if (group) {
        group.textContent =
            installer.group || "—";
    }


    if (experience) {
        experience.textContent =
            installer.experience || "—";
    }


    if (rc) {
        rc.textContent =
            installer.rcNumber || "—";
    }


    if (cacDate) {
        cacDate.textContent =
            installer.cacDate || "—";
    }


    if (registrationDate) {
        registrationDate.textContent =
            installer.registrationDate || "—";
    }


    if (projects) {
        projects.textContent =
            installer.projects || 0;
    }


    if (lastQuotation) {
        lastQuotation.textContent =
            installer.lastQuotation || "—";
    }


    renderInstallerNotes(
        installer
    );

    renderInstallerCertificates(
        installer
    );

    renderInstallerProjects(
        installer
    );

    renderInstallerBanking(
        installer
    );
}


/* =========================================================
   INSTALLER NOTES
   ========================================================= */

function renderInstallerNotes(
    installer
) {

    const possibleElements = [
        document.getElementById(
            "installerProfileNotes"
        ),
        document.getElementById(
            "installerNotes"
        )
    ];

    const element =
        possibleElements.find(Boolean);

    if (!element) return;

    element.textContent =
        installer.notes || "No notes available.";
}


/* =========================================================
   INSTALLER CERTIFICATES
   ========================================================= */

function renderInstallerCertificates(
    installer
) {

    const container =
        document.getElementById(
            "installerCertificates"
        );

    if (!container) return;


    const certificates =
        installer.certificates || [];


    if (!certificates.length) {

        container.innerHTML =
            `<p>No certificates uploaded.</p>`;

        return;
    }


    container.innerHTML =
        certificates
            .map((certificate) => {

                return `
                    <div class="certificate-item">

                        <span>✓</span>

                        <strong>
                            ${escapeHTML(
                                certificate
                            )}
                        </strong>

                    </div>
                `;

            })
            .join("");
}


/* =========================================================
   INSTALLER BANKING / VITAL INFORMATION
   ========================================================= */

function renderInstallerBanking(
    installer
) {

    const accountName =
        document.getElementById(
            "installerBankAccountName"
        );


    const bank =
        document.getElementById(
            "installerBankName"
        );


    const accountNumber =
        document.getElementById(
            "installerBankAccountNumber"
        );


    const bvn =
        document.getElementById(
            "installerBVN"
        );


    if (!vitalInformationUnlocked) {

        if (accountName) {
            accountName.textContent =
                "••••••••••••••";
        }

        if (bank) {
            bank.textContent =
                "••••••••";
        }

        if (accountNumber) {
            accountNumber.textContent =
                "••••••••••••";
        }

        if (bvn) {
            bvn.textContent =
                "••••••••••";
        }

        updateVitalSecurityUI(false);

        return;
    }


    if (accountName) {
        accountName.textContent =
            installer.accountName || "—";
    }


    if (bank) {
        bank.textContent =
            installer.bank || "—";
    }


    if (accountNumber) {
        accountNumber.textContent =
            installer.accountNumber || "—";
    }


    if (bvn) {
        bvn.textContent =
            installer.bvn || "—";
    }


    updateVitalSecurityUI(true);
}


/* =========================================================
   VITAL INFORMATION SECURITY
   ========================================================= */

const INSTALLER_VITAL_PASSCODE =
    "12345";


function unlockVitalInformation() {

    if (!currentInstaller) {

        showToast(
            "Open an installer profile first.",
            "warning"
        );

        return;
    }


    const passcode =
        window.prompt(
            "Enter installer vital-information passcode:"
        );


    if (passcode === null) {
        return;
    }


    if (
        String(passcode).trim() !==
        INSTALLER_VITAL_PASSCODE
    ) {

        vitalInformationUnlocked =
            false;

        renderInstallerBanking(
            currentInstaller
        );

        showToast(
            "Access denied. Incorrect passcode.",
            "error"
        );

        return;
    }


    vitalInformationUnlocked =
        true;


    renderInstallerBanking(
        currentInstaller
    );


    showToast(
        "Vital installer information unlocked.",
        "success"
    );


    startVitalAutoLock();
}


let vitalAutoLockTimer = null;


function startVitalAutoLock() {

    clearTimeout(
        vitalAutoLockTimer
    );


    vitalAutoLockTimer =
        setTimeout(() => {

            lockVitalInformation();

            showToast(
                "Vital information has been automatically locked.",
                "warning"
            );

        }, 60000);
}


function lockVitalInformation() {

    vitalInformationUnlocked =
        false;


    clearTimeout(
        vitalAutoLockTimer
    );


    if (currentInstaller) {

        renderInstallerBanking(
            currentInstaller
        );
    }
}


function updateVitalSecurityUI(
    unlocked
) {

    const button =
        document.querySelector(
            "[data-action='unlock-vitals']"
        );


    if (!button) return;


    if (unlocked) {

        button.textContent =
            "🔓 Lock Vital Information";

        button.dataset.action =
            "lock-vitals";

    } else {

        button.textContent =
            "🔒 Access Vital Information";

        button.dataset.action =
            "unlock-vitals";
    }
}


/* =========================================================
   INSTALLER PROJECT HISTORY
   ========================================================= */

function renderInstallerProjects(
    installer
) {

    const tbody =
        document.querySelector(
            "#installerProjectHistory tbody"
        );


    if (!tbody) return;


    const history =
        installer.projectsHistory || [];


    if (!history.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-page">
                        <div>⌂</div>
                        <h2>No project history</h2>
                        <p>
                            Projects assigned to this installer
                            will appear here.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        history
            .map((project) => {

                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    project.reference
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                project.client
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                project.location
                            )}
                        </td>

                        <td>
                            <span class="ref">
                                ${escapeHTML(
                                    project.quotation
                                )}
                            </span>
                        </td>

                        <td>
                            ${escapeHTML(
                                project.assignment
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                project.completion
                            )}
                        </td>

                        <td>
                            <span class="badge ${getInstallerStatusClass(
                                project.status
                            )}">
                                ${escapeHTML(
                                    project.status
                                )}
                            </span>
                        </td>

                        <td>
                            ${Number(
                                project.images || 0
                            )}
                        </td>

                        <td>
                            ${Number(
                                project.workImages || 0
                            )}
                        </td>

                    </tr>
                `;

            })
            .join("");
}


/* =========================================================
   INSTALLER REGISTRATION MODAL
   ========================================================= */

const installerModal =
    document.getElementById(
        "installerRegistrationModal"
    );


function openInstallerRegistration() {

    if (!installerModal) {

        showToast(
            "Installer registration modal is not available.",
            "error"
        );

        return;
    }


    const form =
        document.getElementById(
            "installerRegistrationForm"
        );


    if (form) {
        form.reset();
    }


    setInstallerID();

    clearInstallerPhoto();

    installerModal.classList.add("show");

    installerModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}


function closeInstallerRegistration() {

    if (!installerModal) return;


    installerModal.classList.remove(
        "show"
    );

    installerModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}


function setInstallerID() {

    const field =
        document.getElementById(
            "installerId"
        );


    if (field) {

        field.value =
            generateInstallerID();
    }
}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

const closeInstallerButton =
    document.querySelector(
        ".modal-close"
    );

if (closeInstallerButton) {

    closeInstallerButton.addEventListener(
        "click",
        closeInstallerRegistration
    );
}


const cancelInstallerButton =
    document.getElementById(
        "cancelInstallerRegistration"
    );

if (cancelInstallerButton) {

    cancelInstallerButton.addEventListener(
        "click",
        closeInstallerRegistration
    );
}


if (installerModal) {

    installerModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                installerModal
            ) {

                closeInstallerRegistration();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            installerModal &&
            installerModal.classList.contains(
                "show"
            )
        ) {

            closeInstallerRegistration();
        }

    }
);


/* =========================================================
   INSTALLER PHOTO UPLOAD
   ========================================================= */

const installerPhotoInput =
    document.getElementById(
        "installerPhoto"
    );


const installerPhotoPreview =
    document.getElementById(
        "installerPhotoPreview"
    );


if (installerPhotoInput) {

    installerPhotoInput.addEventListener(
        "change",
        handleInstallerPhoto
    );
}


function handleInstallerPhoto(
    event
) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (!file) return;


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showToast(
            "Please select a valid image.",
            "error"
        );

        event.target.value = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload = (e) => {

        if (!installerPhotoPreview) {
            return;
        }


        installerPhotoPreview.innerHTML = `
            <img
                src="${e.target.result}"
                alt="Installer photo"
            >
        `;
    };


    reader.readAsDataURL(file);
}


function clearInstallerPhoto() {

    if (installerPhotoInput) {
        installerPhotoInput.value = "";
    }


    if (installerPhotoPreview) {

        installerPhotoPreview.innerHTML =
            "👤";
    }
}


/* =========================================================
   FILE UPLOAD VALIDATION
   ========================================================= */

document
    .querySelectorAll(
        "#installerRegistrationForm input[type='file']"
    )
    .forEach((input) => {

        input.addEventListener(
            "change",
            () => {

                const file =
                    input.files &&
                    input.files[0];


                if (!file) return;


                const maxSize =
                    10 * 1024 * 1024;


                if (file.size > maxSize) {

                    showToast(
                        "File is too large. Maximum size is 10MB.",
                        "error"
                    );

                    input.value = "";

                    return;
                }


                const label =
                    input.closest(
                        ".document-upload"
                    );


                if (label) {

                    const small =
                        label.querySelector(
                            "small"
                        );


                    if (small) {

                        small.textContent =
                            file.name;
                    }
                }

            }
        );

    });


/* =========================================================
   INSTALLER REGISTRATION FORM
   ========================================================= */

const installerRegistrationForm =
    document.getElementById(
        "installerRegistrationForm"
    );


if (installerRegistrationForm) {

    installerRegistrationForm.addEventListener(
        "submit",
        handleInstallerRegistration
    );
}


function handleInstallerRegistration(
    event
) {

    event.preventDefault();


    if (!installerRegistrationForm) {
        return;
    }


    const formData =
        new FormData(
            installerRegistrationForm
        );


    const name =
        String(
            formData.get("fullName") ||
            ""
        ).trim();


    if (!name) {

        showToast(
            "Installer full name is required.",
            "error"
        );

        return;
    }


    const installerId =
        String(
            formData.get("installerId") ||
            generateInstallerID()
        ).trim();


    const photoFile =
        installerPhotoInput &&
        installerPhotoInput.files &&
        installerPhotoInput.files[0];


    const installer = {

        id: installerId,

        name: name,

        initials:
            getInitials(name),

        phone:
            String(
                formData.get("phone") ||
                ""
            ).trim(),

        email:
            String(
                formData.get("email") ||
                ""
            ).trim(),

        state:
            String(
                formData.get("state") ||
                ""
            ).trim(),

        position:
            String(
                formData.get("position") ||
                ""
            ).trim(),

        specialization:
            String(
                formData.get("specialization") ||
                ""
            ).trim(),

        group:
            String(
                formData.get("group") ||
                ""
            ).trim(),

        experience:
            String(
                formData.get("experience") ||
                ""
            ).trim(),

        rcNumber:
            String(
                formData.get("rcNumber") ||
                ""
            ).trim(),

        cacDate:
            String(
                formData.get("cacDate") ||
                ""
            ).trim(),

        status:
            formData.get("status") === "on"
                ? "Active"
                : "Inactive",

        availability:
            "Available",

        projects:
            0,

        lastQuotation:
            "—",

        registrationDate:
            new Date().toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ),

        bvn:
            String(
                formData.get("bvn") ||
                ""
            ).trim(),

        bank:
            String(
                formData.get("bank") ||
                ""
            ).trim(),

        accountName:
            String(
                formData.get(
                    "accountName"
                ) ||
                name
            ).trim(),

        accountNumber:
            String(
                formData.get(
                    "accountNumber"
                ) ||
                ""
            ).trim(),

        notes:
            String(
                formData.get("notes") ||
                ""
            ).trim(),

        certificates: [],

        projectsHistory: [],

        photo:
            photoFile
                ? URL.createObjectURL(
                    photoFile
                )
                : null
    };


    const certificateInputs =
        document.querySelectorAll(
            "#installerRegistrationForm input[type='file']"
        );


    certificateInputs.forEach(
        (input) => {

            if (
                input ===
                installerPhotoInput
            ) {
                return;
            }


            if (
                input.files &&
                input.files[0]
            ) {

                installer.certificates.push(
                    input.files[0].name
                );
            }

        }
    );


    installers.push(
        installer
    );


    renderInstallerDirectory(
        installers
    );


    closeInstallerRegistration();


    showPage(
        "installers"
    );


    showToast(
        `${installer.name} has been registered successfully.`,
        "success"
    );


    installerRegistrationForm.reset();

    setInstallerID();

    clearInstallerPhoto();
}


/* =========================================================
   OPEN INSTALLER PROFILE FROM TABLE
   ========================================================= */

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "[data-installer-id]"
            );


        if (!button) return;


        const installerId =
            button.dataset.installerId;


        if (!installerId) return;


        openInstallerProfile(
            installerId
        );

    }
);


/* =========================================================
   INSTALLER SECURITY BUTTONS
   ========================================================= */

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "[data-action='unlock-vitals']"
            );


        if (!button) return;


        unlockVitalInformation();
    }
);


document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "[data-action='lock-vitals']"
            );


        if (!button) return;


        lockVitalInformation();


        showToast(
            "Vital information locked.",
            "success"
        );
    }
);


/* =========================================================
   INSTALLER ACTION BUTTONS
   ========================================================= */

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "button"
            );


        if (!button) return;


        const text =
            button.textContent
                .trim()
                .toLowerCase();


        if (
            text.includes(
                "new consultation"
            ) ||
            text.includes(
                "add customer"
            ) ||
            text.includes(
                "add site"
            ) ||
            text.includes(
                "new project"
            ) ||
            text.includes(
                "create quotation"
            ) ||
            text.includes(
                "add equipment"
            )
        ) {

            showToast(
                "This action will be connected to the backend later."
            );
        }

    }
);


/* =========================================================
   INSTALLER DIRECTORY BUTTON
   ========================================================= */

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "[data-action='register-installer']"
            );


        if (!button) return;


        openInstallerRegistration();

    }
);


/* =========================================================
   INSTALLER FILTER LISTENERS
   ========================================================= */

[
    "installerSearch",
    "installerStateFilter",
    "installerPositionFilter",
    "installerStatusFilter",
    "installerSpecializationFilter"
]
    .forEach((id) => {

        const element =
            document.getElementById(id);


        if (!element) return;


        element.addEventListener(
            "input",
            applyInstallerFilters
        );


        element.addEventListener(
            "change",
            applyInstallerFilters
        );

    });


/* =========================================================
   BACK BUTTONS
   ========================================================= */

document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "[data-back]"
            );


        if (!button) return;


        const page =
            button.dataset.back;


        if (page) {

            lockVitalInformation();

            showPage(page);
        }

    }
);


/* =========================================================
   EXPORT INSTALLERS CSV
   ========================================================= */

function exportInstallersCSV() {

    if (!installers.length) {

        showToast(
            "There are no installers to export.",
            "warning"
        );

        return;
    }


    const headers = [
        "Installer ID",
        "Name",
        "Phone",
        "Email",
        "State",
        "Position",
        "Specialization",
        "Group",
        "Experience",
        "RC/BN",
        "CAC Date",
        "Status",
        "Availability",
        "Projects",
        "Last Quotation",
        "Registration Date"
    ];


    const rows =
        installers.map(
            (installer) => [

                installer.id,
                installer.name,
                installer.phone,
                installer.email,
                installer.state,
                installer.position,
                installer.specialization,
                installer.group,
                installer.experience,
                installer.rcNumber,
                installer.cacDate,
                installer.status,
                installer.availability,
                installer.projects,
                installer.lastQuotation,
                installer.registrationDate

            ]
        );


    const csv =
        [
            headers,
            ...rows
        ]
            .map((row) =>
                row
                    .map(csvEscape)
                    .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "AE-Renewable-Installer-Directory.csv";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    showToast(
        "Installer directory exported successfully.",
        "success"
    );
}


function csvEscape(value) {

    const stringValue =
        String(
            value ?? ""
        );


    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {

        return `"${stringValue.replace(
            /"/g,
            '""'
        )}"`;
    }


    return stringValue;
}


document.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                "[data-action='export-installers']"
            );


        if (!button) return;


        exportInstallersCSV();

    }
);


/* =========================================================
   RESPONSIVE SUPPORT
   ========================================================= */

function handleResize() {

    const width =
        window.innerWidth;


    if (width <= 720) {

        document.body.classList.add(
            "mobile-layout"
        );

    } else {

        document.body.classList.remove(
            "mobile-layout"
        );
    }
}


window.addEventListener(
    "resize",
    handleResize
);


/* =========================================================
   PAGE VISIBILITY / SECURITY
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden
        ) {

            lockVitalInformation();
        }
    }
);


/* =========================================================
   INITIALISE
   ========================================================= */

function initialiseAEBackend() {

    handleResize();

    showPage(
        "dashboard"
    );

    startMonitoringDemo();

    renderInstallerDirectory(
        installers
    );

    setInstallerID();

    lockVitalInformation();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiseAEBackend
    );

} else {

    initialiseAEBackend();
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.showPage =
    showPage;

window.openDetail =
    openDetail;

window.showToast =
    showToast;

window.setSystemStatus =
    setSystemStatus;

window.openInstallerRegistration =
    openInstallerRegistration;

window.closeInstallerRegistration =
    closeInstallerRegistration;

window.openInstallerProfile =
    openInstallerProfile;

window.renderInstallerDirectory =
    renderInstallerDirectory;

window.applyInstallerFilters =
    applyInstallerFilters;

window.exportInstallersCSV =
    exportInstallersCSV;

window.unlockVitalInformation =
    unlockVitalInformation;

window.lockVitalInformation =
    lockVitalInformation;