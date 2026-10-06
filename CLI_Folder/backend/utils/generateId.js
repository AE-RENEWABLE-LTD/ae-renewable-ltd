/**
 * =========================================================
 * AE RENEWABLE NETWORK
 * ID GENERATOR
 * =========================================================
 */

function generateId(prefix = "ID") {

    const timestamp = Date.now().toString(36).toUpperCase();

    const random = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();

    return `${prefix}-${timestamp}-${random}`;
}

module.exports = generateId;
