// ======================================================
// AE RENEWABLE LTD | ARDE V1.0
// FILE: reports/pdfGenerator.js
// PURPOSE: Format report payloads into print-ready HTML/PDF content
// ======================================================

/**
 * Converts structured report data into clean HTML ready for browser print or PDF libraries (jsPDF/html2pdf).
 * 
 * @param {Object} reportData - Object returned by buildReportData
 * @returns {string} HTML markup string
 */
export function generatePdfHtml(reportData) {
    const { meta, clientInfo, loadProfile, systemConfiguration, financials, bomItems } = reportData;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>${meta.title} - ${meta.projectRef}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1e293b; line-height: 1.5; }
            .header { border-bottom: 3px solid #eab308; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .brand { color: #15803d; font-size: 24px; font-weight: bold; }
            .section-title { font-size: 16px; font-weight: bold; color: #15803d; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .total-row { background-color: #fef08a; font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="brand">${meta.company}</div>
                <div>Solar Engineering Design & Technical Specification</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
                <strong>Ref:</strong> ${meta.projectRef}<br>
                <strong>Date:</strong> ${meta.generatedAt}
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <strong>Client Information:</strong><br>
                Name: ${clientInfo.name}<br>
                Location: ${clientInfo.address}<br>
                Phone: ${clientInfo.phone}
            </div>
            <div class="card">
                <strong>Load Requirements:</strong><br>
                Estimated Peak Power: ${loadProfile.peakLoadKw} kW<br>
                Daily Energy Demand: ${loadProfile.dailyEnergyKwh} kWh/day<br>
                Autonomy Target: ${loadProfile.autonomyDays} Day(s)
            </div>
        </div>

        <div class="section-title">System Architecture & Components</div>
        <table>
            <tr><th>Component</th><th>Selection / Specification</th></tr>
            <tr><td><strong>Inverter Unit</strong></td><td>${systemConfiguration.inverter}</td></tr>
            <tr><td><strong>Battery Storage</strong></td><td>${systemConfiguration.batteryBank}</td></tr>
            <tr><td><strong>PV Array</strong></td><td>${systemConfiguration.pvArray}</td></tr>
            <tr><td><strong>String Configuration</strong></td><td>${systemConfiguration.stringConfig}</td></tr>
            <tr><td><strong>Switchgear / Protection</strong></td><td>${systemConfiguration.protection.acBreaker}, ${systemConfiguration.protection.dcBreaker}</td></tr>
        </table>

        <div class="section-title">Itemized Bill of Materials</div>
        <table>
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th>Specification</th>
                    <th>Qty</th>
                    <th>Unit Price (NGN)</th>
                    <th>Total (NGN)</th>
                </tr>
            </thead>
            <tbody>
                ${bomItems.map(item => `
                    <tr>
                        <td>${item.item}</td>
                        <td>${item.specification}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unitPrice ? item.unitPrice.toLocaleString() : '-'}</td>
                        <td>${item.totalPrice ? item.totalPrice.toLocaleString() : '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        ${financials.grandTotal ? `
        <div class="section-title">Financial Summary</div>
        <table>
            <tr><td>Equipment Subtotal</td><td><strong>NGN ${financials.equipmentTotal?.toLocaleString()}</strong></td></tr>
            <tr><td>Balance of System (Racking, Cables, Trunking)</td><td>NGN ${financials.balanceOfSystem?.toLocaleString()}</td></tr>
            <tr><td>Installation, Testing & Commissioning</td><td>NGN ${financials.installationAndLabor?.toLocaleString()}</td></tr>
            <tr class="total-row"><td>GRAND TOTAL</td><td>NGN ${financials.grandTotal?.toLocaleString()}</td></tr>
        </table>
        ` : ''}
    </body>
    </html>
    `;
}