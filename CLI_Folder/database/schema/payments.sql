-- =========================================================
-- AE RENEWABLE NETWORK
-- PAYMENTS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- PAYMENT IDENTITY
    -- =====================================================

    payment_reference VARCHAR(100) NOT NULL UNIQUE,

    -- =====================================================
    -- CLIENT RELATIONSHIP
    -- =====================================================

    client_id BIGINT NOT NULL,

    -- =====================================================
    -- PROJECT / QUOTATION RELATIONSHIPS
    -- =====================================================

    project_id BIGINT,

    quotation_id BIGINT,

    -- =====================================================
    -- PAYMENT INFORMATION
    -- =====================================================

    amount NUMERIC(15, 2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',

    payment_method VARCHAR(40) NOT NULL DEFAULT 'bank_transfer',

    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',

    -- =====================================================
    -- TRANSACTION INFORMATION
    -- =====================================================

    transaction_reference VARCHAR(150),

    transaction_date TIMESTAMPTZ,

    -- =====================================================
    -- PAYMENT DESCRIPTION
    -- =====================================================

    description TEXT,

    notes TEXT,

    -- =====================================================
    -- VERIFICATION
    -- =====================================================

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    verified_by BIGINT,

    verified_at TIMESTAMPTZ,

    -- =====================================================
    -- RECEIPT
    -- =====================================================

    receipt_url TEXT,

    -- =====================================================
    -- TIMESTAMPS
    -- =====================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- =====================================================
    -- FOREIGN KEYS
    -- =====================================================

    CONSTRAINT payments_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE RESTRICT,

    CONSTRAINT payments_project_id_fkey
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

    CONSTRAINT payments_quotation_id_fkey
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE SET NULL,

    CONSTRAINT payments_verified_by_fkey
        FOREIGN KEY (verified_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    -- =====================================================
    -- PAYMENT AMOUNT
    -- =====================================================

    CONSTRAINT payments_amount_check
        CHECK (amount > 0),

    -- =====================================================
    -- PAYMENT METHOD
    -- =====================================================

    CONSTRAINT payments_method_check
        CHECK (
            payment_method IN (
                'bank_transfer',
                'cash',
                'card',
                'pos',
                'online',
                'cheque',
                'other'
            )
        ),

    -- =====================================================
    -- PAYMENT STATUS
    -- =====================================================

    CONSTRAINT payments_status_check
        CHECK (
            payment_status IN (
                'pending',
                'processing',
                'successful',
                'failed',
                'reversed',
                'refunded',
                'cancelled'
            )
        )
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_payments_client_id
    ON payments (client_id);

CREATE INDEX IF NOT EXISTS idx_payments_project_id
    ON payments (project_id);

CREATE INDEX IF NOT EXISTS idx_payments_quotation_id
    ON payments (quotation_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
    ON payments (payment_status);

CREATE INDEX IF NOT EXISTS idx_payments_transaction_reference
    ON payments (transaction_reference);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
    ON payments (created_at);

CREATE INDEX IF NOT EXISTS idx_payments_transaction_date
    ON payments (transaction_date);

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_payments_updated_at()
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

DROP TRIGGER IF EXISTS payments_updated_at_trigger
ON payments;

CREATE TRIGGER payments_updated_at_trigger
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();