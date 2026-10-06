-- =========================================================
-- AE RENEWABLE NETWORK
-- SUPPORT TICKETS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- TICKET IDENTITY
    -- =====================================================

    ticket_number VARCHAR(30) NOT NULL UNIQUE,

    subject VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    -- =====================================================
    -- TICKET CATEGORY
    -- =====================================================

    category VARCHAR(50) NOT NULL DEFAULT 'general',

    -- =====================================================
    -- TICKET STATUS
    -- =====================================================

    status VARCHAR(30) NOT NULL DEFAULT 'open',

    -- =====================================================
    -- PRIORITY
    -- =====================================================

    priority VARCHAR(20) NOT NULL DEFAULT 'normal',

    -- =====================================================
    -- USER RELATIONSHIP
    -- =====================================================

    user_id BIGINT NOT NULL,

    -- =====================================================
    -- CLIENT RELATIONSHIP
    -- =====================================================

    client_id BIGINT,

    -- =====================================================
    -- PROJECT RELATIONSHIP
    -- =====================================================

    project_id BIGINT,

    -- =====================================================
    -- ASSIGNED STAFF / ADMIN
    -- =====================================================

    assigned_to BIGINT,

    -- =====================================================
    -- RESOLUTION
    -- =====================================================

    resolution TEXT,

    resolved_at TIMESTAMPTZ,

    closed_at TIMESTAMPTZ,

    -- =====================================================
    -- TIMESTAMPS
    -- =====================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- =====================================================
    -- FOREIGN KEYS
    -- =====================================================

    CONSTRAINT support_tickets_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT support_tickets_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE SET NULL,

    CONSTRAINT support_tickets_project_id_fkey
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

    CONSTRAINT support_tickets_assigned_to_fkey
        FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE SET NULL,

    -- =====================================================
    -- CATEGORY VALIDATION
    -- =====================================================

    CONSTRAINT support_tickets_category_check
        CHECK (
            category IN (
                'general',
                'technical',
                'billing',
                'project',
                'quotation',
                'payment',
                'installation',
                'maintenance',
                'account',
                'complaint',
                'other'
            )
        ),

    -- =====================================================
    -- STATUS VALIDATION
    -- =====================================================

    CONSTRAINT support_tickets_status_check
        CHECK (
            status IN (
                'open',
                'in_progress',
                'pending',
                'resolved',
                'closed',
                'cancelled'
            )
        ),

    -- =====================================================
    -- PRIORITY VALIDATION
    -- =====================================================

    CONSTRAINT support_tickets_priority_check
        CHECK (
            priority IN (
                'low',
                'normal',
                'high',
                'urgent'
            )
        )
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number
    ON support_tickets (ticket_number);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id
    ON support_tickets (user_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_client_id
    ON support_tickets (client_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_project_id
    ON support_tickets (project_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to
    ON support_tickets (assigned_to);

CREATE INDEX IF NOT EXISTS idx_support_tickets_category
    ON support_tickets (category);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
    ON support_tickets (status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_priority
    ON support_tickets (priority);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at
    ON support_tickets (created_at);

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

DROP TRIGGER IF EXISTS support_tickets_updated_at_trigger
ON support_tickets;

CREATE TRIGGER support_tickets_updated_at_trigger
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_tickets_updated_at();

