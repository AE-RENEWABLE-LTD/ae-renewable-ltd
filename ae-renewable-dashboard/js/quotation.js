
/* ==========================================
   AE RENEWABLE QUOTATION ENGINE
========================================== */

/*
|--------------------------------------------------------------------------
| GENERATE QUOTATION
|--------------------------------------------------------------------------
*/

function generateQuotation(systemData) {

    const inverterCost =
        calculateInverterCost(
            systemData.inverter
        );

    const batteryCost =
        calculateBatteryCost(
            systemData.battery
        );

    const panelCost =
        calculatePanelCost(
            systemData.solar
        );

    const accessoryCost =
        calculateAccessoryCost(
            systemData.solar.quantity
        );

    const laborCost =
        calculateLaborCost(
            systemData.solar.quantity
        );

    const subTotal =
        inverterCost +
        batteryCost +
        panelCost +
        accessoryCost +
        laborCost;

    const vat =
        subTotal * 0.075;

    const grandTotal =
        subTotal + vat;

    return {

        inverterCost,

        batteryCost,

        panelCost,

        accessoryCost,

        laborCost,

        subTotal,

        vat,

        grandTotal

    };

}

/*
|--------------------------------------------------------------------------
| INVERTER COST
|--------------------------------------------------------------------------
*/

function calculateInverterCost(
    inverterSelection
) {

    const inverter =
        inverterSelection.inverter;

    const quantity =
        inverterSelection.quantity;

    const price =
        getInverterPrice(
            inverter.id
        );

    return price * quantity;

}

/*
|--------------------------------------------------------------------------
| BATTERY COST
|--------------------------------------------------------------------------
*/

function calculateBatteryCost(
    battery
) {

    return getBatteryPrice(
        battery.id
    );

}

/*
|--------------------------------------------------------------------------
| PANEL COST
|--------------------------------------------------------------------------
*/

function calculatePanelCost(
    solar
) {

    const unitPrice =
        getPanelPrice(
            solar.panelWatt
        );

    return (
        solar.quantity *
        unitPrice
    );

}

/*
|--------------------------------------------------------------------------
| ACCESSORY COST
|--------------------------------------------------------------------------
*/

function calculateAccessoryCost(
    panelQuantity
) {

    let cost = 0;

    cost += 85000; // AC Breaker

    cost += 65000; // DC Breaker

    cost += 120000; // SPD

    cost += 40000; // Earthing

    cost += 25000; // MC4

    cost += 15000 * panelQuantity; // PV Cable

    if(panelQuantity > 8){

        cost += 180000; // Combiner Box

    }

    return cost;

}

/*
|--------------------------------------------------------------------------
| LABOR COST
|--------------------------------------------------------------------------
*/

function calculateLaborCost(
    panelQuantity
) {

    return (

        250000 +

        (panelQuantity * 12000)

    );

}

/*
|--------------------------------------------------------------------------
| INVENTORY PRICE LOOKUP
|--------------------------------------------------------------------------
*/

function getInverterPrice(id) {

    const prices = {

        DEYE3,6: 850000,
        DEYE5: 1200000,
        DEYE6: 1500000,
        DEYE8: 1900000,
        DEYE10: 2500000,
        DEYE12: 3200000,
        DEYE16: 4200000,

        FEL5: 850000,
        FEL8: 1200000,
        FEL10: 1650000,

        FIR3,5: 450000,
        FIR5: 650000,
        FIR10: 1200000

    };

    return prices[id] || 0;

}

function getBatteryPrice(id) {

    const prices = {

        BAT5: 850000,
        BAT10: 1600000,
        BAT16: 2400000,
        BAT20: 3200000,
        BAT30: 4700000,
        BAT40: 6200000

    };

    return prices[id] || 0;

}

function getPanelPrice(watt) {

    const prices = {

        550: 135000,
        650: 160000,
        700: 180000

    };

    return prices[watt] || 0;

}

/*
|--------------------------------------------------------------------------
| CUSTOMER QUOTATION HTML
|--------------------------------------------------------------------------
*/

function createQuotationHTML(
    customer,
    systemData,
    quotation
) {

    return `

<div class="quote-card">

    <div class="quote-header">

        <div class="quote-company">

            <img
                src="assets/logo.png"
                alt="AE Renewable"
            >

            <div>

                <h1>
                    AE Renewable Energy
                </h1>

                <p>
                    Solar • Inverter • CCTV • Smart Home
                </p>

            </div>

        </div>

        <div class="quote-number">

            <h3>
                QUOTATION
            </h3>

            <span>
                ${new Date().toLocaleDateString()}
            </span>

        </div>

    </div>

    <div class="customer-section">

        <div class="customer-grid">

            <div class="customer-item">
                <label>Customer</label>
                <span>${customer.name}</span>
            </div>

            <div class="customer-item">
                <label>Phone</label>
                <span>${customer.phone}</span>
            </div>

            <div class="customer-item">
                <label>Location</label>
                <span>${customer.location}</span>
            </div>

        </div>

    </div>

    <div class="quote-table-wrapper">

        <table class="quote-table">

            <thead>

                <tr>

                    <th>Description</th>
                    <th>Qty</th>
                    <th>Amount</th>

                </tr>

            </thead>

            <tbody>

                <tr>

                    <td>
                        ${systemData.inverter.inverter.brand}
                        ${systemData.inverter.inverter.model}
                    </td>

                    <td>
                        ${systemData.inverter.quantity}
                    </td>

                    <td>
                        ${formatMoney(
                            quotation.inverterCost
                        )}
                    </td>

                </tr>

                <tr>

                    <td>
                        Battery Bank
                    </td>

                    <td>
                        1
                    </td>

                    <td>
                        ${formatMoney(
                            quotation.batteryCost
                        )}
                    </td>

                </tr>

                <tr>

                    <td>
                        Solar Panels
                    </td>

                    <td>
                        ${systemData.solar.quantity}
                    </td>

                    <td>
                        ${formatMoney(
                            quotation.panelCost
                        )}
                    </td>

                </tr>

                <tr>

                    <td>
                        Accessories
                    </td>

                    <td>
                        1
                    </td>

                    <td>
                        ${formatMoney(
                            quotation.accessoryCost
                        )}
                    </td>

                </tr>

                <tr>

                    <td>
                        Installation &
                        Commissioning
                    </td>

                    <td>
                        1
                    </td>

                    <td>
                        ${formatMoney(
                            quotation.laborCost
                        )}
                    </td>

                </tr>

            </tbody>

        </table>

    </div>

    <div class="totals-section">

        <div class="totals-box">

            <div class="total-row">

                <span>
                    Sub Total
                </span>

                <span>
                    ${formatMoney(
                        quotation.subTotal
                    )}
                </span>

            </div>

            <div class="total-row">

                <span>
                    VAT (7.5%)
                </span>

                <span>
                    ${formatMoney(
                        quotation.vat
                    )}
                </span>

            </div>

            <div class="total-row grand-total">

                <span>
                    GRAND TOTAL
                </span>

                <span>
                    ${formatMoney(
                        quotation.grandTotal
                    )}
                </span>

            </div>

        </div>

    </div>

</div>

`;

}

/*
|--------------------------------------------------------------------------
| RENDER QUOTATION
|--------------------------------------------------------------------------
*/

function renderQuotation(
    customer,
    systemData
) {

    const quotation =
        generateQuotation(
            systemData
        );

    const html =
        createQuotationHTML(
            customer,
            systemData,
            quotation
        );

    document
    .getElementById(
        "quotationContainer"
    )
    .innerHTML = html;

}

/*
|--------------------------------------------------------------------------
| PRINT QUOTATION
|--------------------------------------------------------------------------
*/

function printQuotation() {

    window.print();

}

