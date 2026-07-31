// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: ui/alert.js
// PURPOSE: Dynamic alert notification component
// ======================================================

/**
 * Renders an alert banner into a target container.
 * 
 * @param {string} containerId - Element ID to inject into
 * @param {string} message - Text message to render
 * @param {string} [type='info'] - 'success', 'warning', 'danger', or 'info'
 */
export function showAlert(containerId, message, type = "info") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alertMap = {
        success: "background-color: #dcfce7; color: #15803d; border: 1px solid #86efac;",
        warning: "background-color: #fef9c3; color: #a16207; border: 1px solid #fde047;",
        danger:  "background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;",
        info:    "background-color: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc;"
    };

    const style = alertMap[type] || alertMap.info;

    container.innerHTML = `
        <div style="padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 15px; ${style}">
            ${message}
        </div>
    `;
}

export function clearAlert(containerId) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";
}