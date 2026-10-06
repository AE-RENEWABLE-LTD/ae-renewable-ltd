-- =========================================================
-- AE RENEWABLE NETWORK
-- NOTIFICATIONS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- RECIPIENT
    -- =====================================================

    user_id BIGINT NOT NULL,

    -- =====================================================
    -- NOTIFICATION INFORMATION
    -- =====================================================

    type VARCHAR(50) NOT NULL DEFAULT 'system',

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    -- =====================================================
    -- OPTIONAL RELATED RECORDS
    -- =====================================================

    client_id BIGINT,

    project_id BIGINT,

    quotation_id BIGINT,

    payment_id BIGINT,

    -- =====================================================
    -- ACTION / NAVIGATION
    -- =====================================================

    action_url TEXT,

    action_label VARCHAR(100),

    -- =====================================================
    -- NOTIFICATION STATE
    -- =====================================================

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at TIMESTAMPTZ,

    -- =====================================================
    -- PRIORITY
    -- =====================================================

    priority VARCHAR(20) NOT NULL DEFAULT 'normal',

    -- =====================================================
    -- TIMESTAMPS
    -- =====================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- =====================================================
    -- FOREIGN KEYS
    -- =====================================================

    CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT notifications_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE SET NULL,

    CONSTRAINT notifications_project_id_fkey
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

    CONSTRAINT notifications_quotation_id_fkey
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE SET NULL,

    CONSTRAINT notifications_payment_id_fkey
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE SET NULL,

    -- =====================================================
    -- TYPE
    -- =====================================================

    CONSTRAINT notifications_type_check
        CHECK (
            type IN (
                'system',
                'account',
                'project',
                'quotation',
                'payment',
                'document',
                'installer',
                'support',
                'security',
                'announcement'
            )
        ),

    -- =====================================================
    -- PRIORITY
    -- =====================================================

    CONSTRAINT notifications_priority_check
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_client_id
    ON notifications (client_id);

CREATE INDEX IF NOT EXISTS idx_notifications_project_id
    ON notifications (project_id);

CREATE INDEX IF NOT EXISTS idx_notifications_quotation_id
    ON notifications (quotation_id);

CREATE INDEX IF NOT EXISTS idx_notifications_payment_id
    ON notifications (payment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_type
    ON notifications (type);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
    ON notifications (is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_priority
    ON notifications (priority);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON notifications (created_at);

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
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

DROP TRIGGER IF EXISTS notifications_updated_at_trigger
ON notifications;

CREATE TRIGGER notifications_updated_at_trigger
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- =========================================================
-- READ TIMESTAMP FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = CURRENT_TIMESTAMP;
    END IF;

    IF NEW.is_read = FALSE THEN
        NEW.read_at = NULL;
    END IF;

    RETURN NEW;
END;
$$;

-- =========================================================
-- READ TIMESTAMP TRIGGER
-- =========================================================

DROP TRIGGER IF EXISTS notifications_read_at_trigger
ON notifications;

CREATE TRIGGER notifications_read_at_trigger
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notification_read_at();