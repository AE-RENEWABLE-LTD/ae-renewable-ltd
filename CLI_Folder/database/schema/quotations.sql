-- =========================================================
-- AE RENEWABLE NETWORK
-- QUOTATIONS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS quotations (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- QUOTATION IDENTITY
    -- =====================================================

    quotation_code VARCHAR(40) NOT NULL UNIQUE,

    quotation_number VARCHAR(50) NOT NULL UNIQUE,

    -- =====================================================
    -- CLIENT RELATIONSHIP
    -- =====================================================

    client_id BIGINT NOT NULL,

    -- =====================================================
    -- PROJECT RELATIONSHIP
    -- =====================================================

    project_id BIGINT,

    -- =====================================================
    -- QUOTATION INFORMATION
    -- =====================================================

    title VARCHAR(255) NOT NULL,

    description TEXT,

    version INTEGER NOT NULL DEFAULT 1,

    -- =====================================================
    -- FINANCIAL INFORMATION
    -- =====================================================

    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,

    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,

    tax NUMERIC(15, 2) NOT NULL DEFAULT 0,

    installation_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,

    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,

    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,

    balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0,

    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',

    -- =====================================================
    -- STATUS
    -- =====================================================

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    -- =====================================================
    -- VALIDITY
    -- =====================================================

    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,

    valid_until DATE,

    -- =====================================================
    -- CLIENT RESPONSE
    -- =====================================================

    client_viewed_at TIMESTAMPTZ,

    client_responded_at TIMESTAMPTZ,

    rejection_reason TEXT,

    -- =====================================================
    -- APPROVAL
    -- =====================================================

    approved_at TIMESTAMPTZ,

    approved_by BIGINT,

    -- =====================================================
    -- DOCUMENT
    -- =====================================================

    pdf_url TEXT,

    notes TEXT,

    -- =====================================================
    -- TIMESTAMPS
    -- =====================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- =====================================================
    -- FOREIGN KEYS
    -- =====================================================

    CONSTRAINT quotations_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE RESTRICT,

    CONSTRAINT quotations_project_id_fkey
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

    CONSTRAINT quotations_approved_by_fkey
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    -- =====================================================
    -- VERSION
    -- =====================================================

    CONSTRAINT quotations_version_check
        CHECK (version > 0),

    -- =====================================================
    -- STATUS
    -- =====================================================

    CONSTRAINT quotations_status_check
        CHECK (
            status IN (
                'draft',
                'sent',
                'viewed',
                'accepted',
                'rejected',
                'expired',
                'cancelled'
            )
        ),

    -- =====================================================
    -- FINANCIAL VALIDATION
    -- =====================================================

    CONSTRAINT quotations_subtotal_check
        CHECK (subtotal >= 0),

    CONSTRAINT quotations_discount_check
        CHECK (discount >= 0),

    CONSTRAINT quotations_tax_check
        CHECK (tax >= 0),

    CONSTRAINT quotations_installation_fee_check
        CHECK (installation_fee >= 0),

    CONSTRAINT quotations_total_amount_check
        CHECK (total_amount >= 0),

    CONSTRAINT quotations_amount_paid_check
        CHECK (amount_paid >= 0),

    CONSTRAINT quotations_balance_due_check
        CHECK (balance_due >= 0)
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_quotations_code
    ON quotations (quotation_code);

CREATE INDEX IF NOT EXISTS idx_quotations_number
    ON quotations (quotation_number);

CREATE INDEX IF NOT EXISTS idx_quotations_client_id
    ON quotations (client_id);

CREATE INDEX IF NOT EXISTS idx_quotations_project_id
    ON quotations (project_id);

CREATE INDEX IF NOT EXISTS idx_quotations_status
    ON quotations (status);

CREATE INDEX IF NOT EXISTS idx_quotations_issue_date
    ON quotations (issue_date);

CREATE INDEX IF NOT EXISTS idx_quotations_created_at
    ON quotations (created_at);

-- =========================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_quotations_updated_at()
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

DROP TRIGGER IF EXISTS quotations_updated_at_trigger
ON quotations;

CREATE TRIGGER quotations_updated_at_trigger
BEFORE UPDATE ON quotations
FOR EACH ROW
EXECUTE FUNCTION update_quotations_updated_at();