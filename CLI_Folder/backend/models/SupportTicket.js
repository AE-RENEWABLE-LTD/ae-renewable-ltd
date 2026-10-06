"use strict";

const db = require("../config/database");

/**
 * =========================================================
 * AE RENEWABLE NETWORK
 * SUPPORT TICKET MODEL
 * =========================================================
 *
 * Handles:
 * - Ticket creation
 * - Ticket retrieval
 * - Ticket filtering
 * - Ticket assignment
 * - Ticket updates
 * - Ticket status transitions
 * - Ticket deletion
 * - Ticket counting
 * - Ticket statistics
 *
 * Status lifecycle:
 *
 * open
 *   ↓
 * in_progress
 *   ↓
 * pending
 *   ↓
 * resolved
 *   ↓
 * closed
 *
 * A ticket can be moved back to:
 * - open
 * - in_progress
 * - pending
 * - cancelled
 *
 * Timestamp rules:
 *
 * resolved_at:
 * - Set when status becomes "resolved"
 * - Preserved while status remains "resolved"
 * - Cleared when status changes away from "resolved"
 *
 * closed_at:
 * - Set when status becomes "closed"
 * - Preserved while status remains "closed"
 * - Cleared when status changes away from "closed"
 *
 * =========================================================
 */

class SupportTicket {

    /**
     * =====================================================
     * CREATE TICKET
     * =====================================================
     */
    static async create(data) {

        const {
            ticket_number,
            subject,
            description,
            category = "general",
            status = "open",
            priority = "normal",
            user_id,
            client_id = null,
            project_id = null,
            assigned_to = null
        } = data;

        const query = `
            INSERT INTO support_tickets (
                ticket_number,
                subject,
                description,
                category,
                status,
                priority,
                user_id,
                client_id,
                project_id,
                assigned_to
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10
            )
            RETURNING *
        `;

        const values = [
            ticket_number,
            subject,
            description,
            category,
            status,
            priority,
            user_id,
            client_id,
            project_id,
            assigned_to
        ];

        const result = await db.query(query, values);

        return result.rows[0] || null;
    }


    /**
     * =====================================================
     * GET TICKET BY ID
     * =====================================================
     */
    static async findById(id) {

        const query = `
            SELECT
                st.*,

                creator.first_name AS creator_first_name,
                creator.last_name AS creator_last_name,
                creator.email AS creator_email,

                client.client_code,
                client.company_name,
                client.contact_name,

                project.project_code,
                project.project_name,

                assignee.first_name AS assignee_first_name,
                assignee.last_name AS assignee_last_name,
                assignee.email AS assignee_email

            FROM support_tickets st

            LEFT JOIN users creator
                ON creator.id = st.user_id

            LEFT JOIN clients client
                ON client.id = st.client_id

            LEFT JOIN projects project
                ON project.id = st.project_id

            LEFT JOIN users assignee
                ON assignee.id = st.assigned_to

            WHERE st.id = $1::BIGINT
        `;

        const result = await db.query(query, [id]);

        return result.rows[0] || null;
    }


    /**
     * =====================================================
     * GET TICKET BY TICKET NUMBER
     * =====================================================
     */
    static async findByTicketNumber(ticketNumber) {

        const query = `
            SELECT
                st.*,

                creator.first_name AS creator_first_name,
                creator.last_name AS creator_last_name,
                creator.email AS creator_email,

                client.client_code,
                client.company_name,
                client.contact_name,

                project.project_code,
                project.project_name,

                assignee.first_name AS assignee_first_name,
                assignee.last_name AS assignee_last_name,
                assignee.email AS assignee_email

            FROM support_tickets st

            LEFT JOIN users creator
                ON creator.id = st.user_id

            LEFT JOIN clients client
                ON client.id = st.client_id

            LEFT JOIN projects project
                ON project.id = st.project_id

            LEFT JOIN users assignee
                ON assignee.id = st.assigned_to

            WHERE st.ticket_number = $1
        `;

        const result = await db.query(
            query,
            [ticketNumber]
        );

        return result.rows[0] || null;
    }


    /**
     * =====================================================
     * GET USER TICKETS
     * =====================================================
     */
    static async findByUserId(
        userId,
        {
            limit = 50,
            offset = 0
        } = {}
    ) {

        const query = `
            SELECT
                st.*,

                client.client_code,
                client.company_name,

                project.project_code,
                project.project_name,

                assignee.first_name AS assignee_first_name,
                assignee.last_name AS assignee_last_name,
                assignee.email AS assignee_email

            FROM support_tickets st

            LEFT JOIN clients client
                ON client.id = st.client_id

            LEFT JOIN projects project
                ON project.id = st.project_id

            LEFT JOIN users assignee
                ON assignee.id = st.assigned_to

            WHERE st.user_id = $1::BIGINT

            ORDER BY st.created_at DESC

            LIMIT $2
            OFFSET $3
        `;

        const result = await db.query(
            query,
            [userId, limit, offset]
        );

        return result.rows;
    }


    /**
     * =====================================================
     * GET ALL TICKETS
     * =====================================================
     */
    static async findAll({
        status = null,
        priority = null,
        category = null,
        assignedTo = null,
        limit = 50,
        offset = 0
    } = {}) {

        const conditions = [];
        const values = [];

        /**
         * STATUS FILTER
         */
        if (status) {

            values.push(status);

            conditions.push(
                `st.status = $${values.length}`
            );
        }

        /**
         * PRIORITY FILTER
         */
        if (priority) {

            values.push(priority);

            conditions.push(
                `st.priority = $${values.length}`
            );
        }

        /**
         * CATEGORY FILTER
         */
        if (category) {

            values.push(category);

            conditions.push(
                `st.category = $${values.length}`
            );
        }

        /**
         * ASSIGNED USER FILTER
         */
        if (assignedTo) {

            values.push(assignedTo);

            conditions.push(
                `st.assigned_to = $${values.length}::BIGINT`
            );
        }

        /**
         * PAGINATION
         */
        values.push(limit);

        const limitPosition = values.length;

        values.push(offset);

        const offsetPosition = values.length;

        /**
         * WHERE CLAUSE
         */
        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        const query = `
            SELECT
                st.*,

                creator.first_name AS creator_first_name,
                creator.last_name AS creator_last_name,
                creator.email AS creator_email,

                client.client_code,
                client.company_name,

                project.project_code,
                project.project_name,

                assignee.first_name AS assignee_first_name,
                assignee.last_name AS assignee_last_name,
                assignee.email AS assignee_email

            FROM support_tickets st

            LEFT JOIN users creator
                ON creator.id = st.user_id

            LEFT JOIN clients client
                ON client.id = st.client_id

            LEFT JOIN projects project
                ON project.id = st.project_id

            LEFT JOIN users assignee
                ON assignee.id = st.assigned_to

            ${whereClause}

            ORDER BY st.created_at DESC

            LIMIT $${limitPosition}
            OFFSET $${offsetPosition}
        `;

        const result = await db.query(
            query,
            values
        );

        return result.rows;
    }


    /**
     * =====================================================
     * UPDATE TICKET
     * =====================================================
     */
    static async update(id, data) {

        const allowedFields = [
            "subject",
            "description",
            "category",
            "status",
            "priority",
            "assigned_to",
            "resolution",
            "resolved_at",
            "closed_at",
            "client_id",
            "project_id"
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {

            if (
                Object.prototype.hasOwnProperty.call(
                    data,
                    field
                )
            ) {

                values.push(data[field]);

                updates.push(
                    `${field} = $${values.length}`
                );
            }
        }

        /**
         * Nothing to update
         */
        if (updates.length === 0) {
            return this.findById(id);
        }

        /**
         * Ticket ID
         */
        values.push(id);

        const query = `
            UPDATE support_tickets

            SET
                ${updates.join(", ")}

            WHERE id = $${values.length}::BIGINT

            RETURNING *
        `;

        const result = await db.query(
            query,
            values
        );

        return result.rows[0] || null;
    }


    /**
     * =====================================================
     * ASSIGN TICKET
     * =====================================================
     */
    static async assign(id, assignedTo) {

        const query = `
            UPDATE support_tickets

            SET
                assigned_to = $1::BIGINT

            WHERE id = $2::BIGINT

            RETURNING *
        `;

        const result = await db.query(
            query,
            [assignedTo, id]
        );

        return result.rows[0] || null;
    }


    /**
     * =====================================================
     * UPDATE TICKET STATUS
     * =====================================================
     *
     * Allowed statuses:
     *
     * - open
     * - in_progress
     * - pending
     * - resolved
     * - closed
     * - cancelled
     *
     * Timestamp behavior:
     *
     * resolved:
     *   resolved_at is created if it does not exist.
     *
     * closed:
     *   closed_at is created if it does not exist.
     *
     * Any other status:
     *   resolved_at = NULL
     *   closed_at = NULL
     *
     * This prevents stale timestamps when a ticket is reopened.
     * =====================================================
     */
    static async updateStatus(id, status) {

        const allowedStatuses = [
            "open",
            "in_progress",
            "pending",
            "resolved",
            "closed",
            "cancelled"
        ];

        /**
         * Validate status before touching database
         */
        if (!allowedStatuses.includes(status)) {

            throw new Error(
                `Invalid support ticket status: ${status}`
            );
        }

        const query = `
            UPDATE support_tickets

            SET
                status = $1::VARCHAR,

                resolved_at =
                    CASE
                        WHEN $1::VARCHAR = 'resolved'
                            THEN COALESCE(
                                resolved_at,
                                CURRENT_TIMESTAMP
                            )

                        ELSE NULL
                    END,

                closed_at =
                    CASE
                        WHEN $1::VARCHAR = 'closed'
                            THEN COALESCE(
                                closed_at,
                                CURRENT_TIMESTAMP
                            )

                        ELSE NULL
                    END,

                updated_at = CURRENT_TIMESTAMP

            WHERE id = $2::BIGINT

            RETURNING *
        `;

        const result = await db.query(
            query,
            [status, id]
        );

        return result.rows[0] || null;
    }


    /**
     * =====================================================
     * DELETE TICKET
     * =====================================================
     */
    static async delete(id) {

        const query = `
            DELETE FROM support_tickets

            WHERE id = $1::BIGINT

            RETURNING *
        `;

        const result = await db.query(
            query,
            [id]
        );

        return result.rows[0] || null;
    }


    /**
     * =====================================================
     * COUNT TICKETS
     * =====================================================
     */
    static async count(filters = {}) {

        const conditions = [];
        const values = [];

        /**
         * USER FILTER
         */
        if (filters.user_id) {

            values.push(filters.user_id);

            conditions.push(
                `user_id = $${values.length}::BIGINT`
            );
        }

        /**
         * STATUS FILTER
         */
        if (filters.status) {

            values.push(filters.status);

            conditions.push(
                `status = $${values.length}`
            );
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        const query = `
            SELECT
                COUNT(*)::INTEGER AS count

            FROM support_tickets

            ${whereClause}
        `;

        const result = await db.query(
            query,
            values
        );

        return result.rows[0].count;
    }


    /**
     * =====================================================
     * TICKET STATISTICS
     * =====================================================
     */
    static async getStatistics() {

        const query = `
            SELECT

                COUNT(*)::INTEGER AS total,

                COUNT(*) FILTER (
                    WHERE status = 'open'
                )::INTEGER AS open,

                COUNT(*) FILTER (
                    WHERE status = 'in_progress'
                )::INTEGER AS in_progress,

                COUNT(*) FILTER (
                    WHERE status = 'pending'
                )::INTEGER AS pending,

                COUNT(*) FILTER (
                    WHERE status = 'resolved'
                )::INTEGER AS resolved,

                COUNT(*) FILTER (
                    WHERE status = 'closed'
                )::INTEGER AS closed,

                COUNT(*) FILTER (
                    WHERE status = 'cancelled'
                )::INTEGER AS cancelled,

                COUNT(*) FILTER (
                    WHERE priority = 'urgent'
                )::INTEGER AS urgent

            FROM support_tickets
        `;

        const result = await db.query(query);

        return result.rows[0];
    }
}


module.exports = SupportTicket;