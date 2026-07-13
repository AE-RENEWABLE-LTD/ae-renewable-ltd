// ======================================================
//
// AE RENEWABLE LTD
// ARDE V1.0
//
// FILE
// materialTable.js
//
// PURPOSE
// Populate Material Requirement Table
//
// ======================================================

export function updateMaterialTable(materials){

    const tbody =
        document.getElementById("materialTableBody");

    if(!tbody){

        console.error("materialTableBody not found");

        return;

    }

    tbody.innerHTML = "";

    let grandTotal = 0;

    materials.forEach((item,index)=>{

        const total =
            item.quantity * item.unitPrice;

        grandTotal += total;

        tbody.innerHTML += `

        <tr>

            <td>${index+1}</td>

            <td>${item.description}</td>

            <td>${item.unit}</td>

            <td>${item.quantity}</td>

            <td>₦${item.unitPrice.toLocaleString()}</td>

            <td>₦${total.toLocaleString()}</td>

        </tr>

        `;

    });

    tbody.innerHTML += `

    <tr>

        <td colspan="5">

            <strong>Total Material Cost</strong>

        </td>

        <td>

            <strong>

            ₦${grandTotal.toLocaleString()}

            </strong>

        </td>

    </tr>

    `;

}