// ======================================================
// AE RENEWABLE LTD — ARDE V1.0
// FILE: admin/prices.js
// PURPOSE: Admin Price Manager Controller
// ======================================================

import {
    DEFAULT_PRICES,
    getActivePrices,
    saveActivePrices,
    getCustomMaterials,
    addCustomMaterial,
    removeCustomMaterial
} from "/arde/data/prices.js";

let activePrices = getActivePrices();
let customMaterials = getCustomMaterials();
let currentFilter = "all";
let currentSearch = "";

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    renderTable();
    updateCounts();
});

function initUI() {
    // Search
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearch = e.target.value.toLowerCase();
            renderTable();
        });
    }

    // Category Tabs
    const tabs = document.querySelectorAll(".cat-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentFilter = tab.getAttribute("data-cat");
            renderTable();
        });
    });

    // Save All Button
    const btnSave = document.getElementById("btnSaveAllPrices");
    if (btnSave) {
        btnSave.addEventListener("click", saveAllPricesFromTable);
    }

    // Modal Add Material
    const btnAdd = document.getElementById("btnAddNewMaterial");
    const modal = document.getElementById("addMaterialModal");
    const btnClose = document.getElementById("btnCloseModal");
    const btnCancel = document.getElementById("btnCancelModal");
    const form = document.getElementById("addMaterialForm");

    if (btnAdd && modal) {
        btnAdd.addEventListener("click", () => modal.classList.add("open"));
    }
    if (btnClose && modal) {
        btnClose.addEventListener("click", () => modal.classList.remove("open"));
    }
    if (btnCancel && modal) {
        btnCancel.addEventListener("click", () => modal.classList.remove("open"));
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("newMatName").value.trim();
            const category = document.getElementById("newMatCat").value;
            const unit = document.getElementById("newMatUnit").value.trim();
            const price = Number(document.getElementById("newMatPrice").value) || 0;
            const description = document.getElementById("newMatDesc").value.trim();

            if (!name) return;

            addCustomMaterial({ name, category, unit, unitPrice: price, description });
            
            // Also store in price dictionary
            activePrices[name] = price;
            saveActivePrices(activePrices);

            customMaterials = getCustomMaterials();
            modal.classList.remove("open");
            form.reset();
            renderTable();
            updateCounts();
            showToast(`Added "${name}" to Price Catalog!`);
        });
    }
}

function getItemCategory(name) {
    if (name.includes("INV") || name.includes("Inverter") || name.includes("Felicity IV") || name.includes("Deye SUN")) return "Inverter";
    if (name.includes("Battery") || name.includes("LPBF") || name.includes("SE-G5.1")) return "Battery";
    if (name.includes("Panel") || name.includes("Jinko") || name.includes("Solar PV")) return "Panel";
    if (name.includes("Breaker") || name.includes("SPD") || name.includes("Changeover") || name.includes("Busbar") || name.includes("Combiner")) return "Breaker";
    if (name.includes("Cable") || name.includes("Earth Rod") || name.includes("Lug")) return "Cable";
    return "Accessories";
}

function renderTable() {
    const tbody = document.getElementById("priceTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    activePrices = getActivePrices();
    customMaterials = getCustomMaterials();

    let allItems = [];

    // Default & Overridden items
    Object.keys(activePrices).forEach((name, idx) => {
        const cat = getItemCategory(name);
        allItems.push({
            id: "std_" + idx,
            name,
            category: cat,
            unit: name.includes("Cable") || name.includes("Pipe") ? "meters" : "pcs",
            unitPrice: activePrices[name],
            isCustom: false
        });
    });

    // Custom items
    customMaterials.forEach(m => {
        // Only if not duplicate
        if (!allItems.some(i => i.name === m.name)) {
            allItems.push({
                id: m.id,
                name: m.name,
                category: m.category || "Custom",
                unit: m.unit || "pcs",
                unitPrice: m.unitPrice || 0,
                isCustom: true
            });
        }
    });

    // Filter
    let filtered = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(currentSearch) || item.category.toLowerCase().includes(currentSearch);
        const matchesCat = currentFilter === "all" || 
            (currentFilter === "Custom" && item.isCustom) ||
            item.category === currentFilter;
        return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94A3B8;">No equipment or materials found matching your search.</td></tr>`;
        return;
    }

    filtered.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="color:#64748B; font-weight:600;">${index + 1}</td>
            <td>
                <strong style="color:#FFF; display:block; font-size:13px;">${item.name}</strong>
                ${item.isCustom ? `<span class="badge-cat badge-custom" style="font-size:10px; margin-top:4px;">Custom Entry</span>` : ""}
            </td>
            <td><span class="badge-cat">${item.category}</span></td>
            <td style="color:#94A3B8;">${item.unit}</td>
            <td style="text-align:right;">
                <input type="number" class="price-input" data-name="${item.name}" value="${item.unitPrice}" min="0" step="100">
            </td>
            <td style="text-align:center;">
                ${item.isCustom ? `
                    <button type="button" class="btn-delete-mat" data-id="${item.id}" style="background:none; border:none; color:#EF4444; font-weight:700; cursor:pointer; font-size:12px;">Delete</button>
                ` : `
                    <button type="button" class="btn-reset-single" data-name="${item.name}" style="background:none; border:none; color:#38BDF8; font-weight:600; cursor:pointer; font-size:11px;">Reset</button>
                `}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Wire single resets
    document.querySelectorAll(".btn-reset-single").forEach(btn => {
        btn.addEventListener("click", () => {
            const name = btn.getAttribute("data-name");
            if (DEFAULT_PRICES[name] !== undefined) {
                const input = document.querySelector(`.price-input[data-name="${name}"]`);
                if (input) {
                    input.value = DEFAULT_PRICES[name];
                    activePrices[name] = DEFAULT_PRICES[name];
                    saveActivePrices(activePrices);
                    showToast(`Reset price for ${name}`);
                }
            }
        });
    });

    // Wire delete custom
    document.querySelectorAll(".btn-delete-mat").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            removeCustomMaterial(id);
            customMaterials = getCustomMaterials();
            renderTable();
            updateCounts();
            showToast(`Removed custom item`);
        });
    });
}

function saveAllPricesFromTable() {
    const inputs = document.querySelectorAll(".price-input");
    inputs.forEach(input => {
        const name = input.getAttribute("data-name");
        const val = Number(input.value) || 0;
        if (name) {
            activePrices[name] = val;
        }
    });

    saveActivePrices(activePrices);
    showToast("All Pricing & Catalog Changes Saved Successfully!");
}

function updateCounts() {
    const countAll = document.getElementById("countAll");
    const countCustom = document.getElementById("countCustom");
    if (countAll) {
        countAll.textContent = Object.keys(activePrices).length + customMaterials.length;
    }
    if (countCustom) {
        countCustom.textContent = customMaterials.length;
    }
}

function showToast(msg) {
    const toast = document.getElementById("toastNotice");
    if (toast) {
        toast.textContent = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }
}
