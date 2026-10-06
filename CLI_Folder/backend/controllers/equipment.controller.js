"use strict";

const { query } = require("../config/database");

async function getAllEquipment(req, res, next) {
    try {
        const { category, search, inStock } = req.query;
        const conditions = [];
        const params = [];

        if (category) {
            params.push(category);
            conditions.push(`category = $${params.length}`);
        }

        if (inStock !== undefined) {
            params.push(inStock === "true");
            conditions.push(`in_stock = $${params.length}`);
        }

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(name ILIKE $${params.length} OR brand ILIKE $${params.length} OR equipment_code ILIKE $${params.length})`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const result = await query(
            `SELECT * FROM equipment ${where} ORDER BY category ASC, selling_price ASC`,
            params
        );

        return res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
}

async function getEquipmentById(req, res, next) {
    try {
        const result = await query(`SELECT * FROM equipment WHERE id = $1`, [req.params.id]);
        if (!result.rows[0]) {
            return res.status(404).json({ success: false, message: "Equipment not found" });
        }
        return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
}

async function updateEquipment(req, res, next) {
    try {
        const { cost_price, selling_price, in_stock, status, supplier, specifications } = req.body;
        const result = await query(
            `
            UPDATE equipment
            SET
                cost_price = COALESCE($1, cost_price),
                selling_price = COALESCE($2, selling_price),
                in_stock = COALESCE($3, in_stock),
                status = COALESCE($4, status),
                supplier = COALESCE($5, supplier),
                specifications = COALESCE($6, specifications),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
            `,
            [cost_price, selling_price, in_stock, status, supplier, specifications ? JSON.stringify(specifications) : null, req.params.id]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ success: false, message: "Equipment not found" });
        }

        return res.status(200).json({ success: true, message: "Equipment updated", data: result.rows[0] });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllEquipment,
    getEquipmentById,
    updateEquipment
};
