-- =========================================================
-- AE RENEWABLE NETWORK
-- CLIENTS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- USER RELATIONSHIP
    -- =====================================================

    user_id BIGINT NOT NULL UNIQUE,

    -- =====================================================
    -- CLIENT IDENTITY
    -- =====================================================

    client_code VARCHAR(30) NOT NULL UNIQUE,

    company_name VARCHAR(255),

    contact_name VARCHAR(255),

    email VARCHAR(255) NOT NULL,

    phone VARCHAR(30),

    -- =====================================================
    -- LOCATION
    -- =====================================================

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',

    -- =====================================================
    -- BUSINESS INFORMATION
    -- =====================================================

    client_type VARCHAR(30) NOT NULL DEFAULT 'individual',

    industry VARCHAR(150),

    registration_number VARCHAR(100),

    -- =====================================================
    -- CLIENT STATUS
    -- =====================================================

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    -- =====================================================
    -- PROFILE
    -- =====================================================

    profile_image TEXT,

    notes TEXT,

    -- =====================================================
    -- TIMESTAMPS
    -- =====================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- =====================================================
    -- FOREIGN KEY
    -- =====================================================

    CONSTRAINT clients_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- =====================================================
    -- CONSTRAINTS
    -- =====================================================

    CONSTRAINT clients_type_check
        CHECK (
            client_type IN (
                'individual',
                'business',
                'corporate',
                'government',
                'organization'
            )
        ),

    CONSTRAINT clients_status_check
        CHECK (
            status IN (
                'active',
                'inactive',
                'suspended',
                'pending'
            )
        )
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_clients_user_id
    ON clients (user_id);

CREATE INDEX IF NOT EXISTS idx_clients_client_code
    ON clients (client_code);

CREATE INDEX IF NOT EXISTS idx_clients_email
    ON clients (email);

CREATE INDEX IF NOT EXISTS idx_clients_phone
    ON clients (phone);

CREATE INDEX IF NOT EXISTS idx_clients_company_name
    ON clients (company_name);

CREATE INDEX IF NOT EXISTS idx_clients_status
    ON clients (status);

-- =========================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_clients_updated_at()
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

DROP TRIGGER IF EXISTS clients_updated_at_trigger
ON clients;

CREATE TRIGGER clients_updated_at_trigger
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_clients_updated_at();