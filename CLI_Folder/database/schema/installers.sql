-- =========================================================
-- AE RENEWABLE NETWORK
-- INSTALLERS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS installers (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- USER RELATIONSHIP
    -- =====================================================

    user_id BIGINT NOT NULL UNIQUE,

    -- =====================================================
    -- INSTALLER IDENTITY
    -- =====================================================

    installer_code VARCHAR(30) NOT NULL UNIQUE,

    company_name VARCHAR(255) NOT NULL,

    contact_name VARCHAR(255) NOT NULL,

    email VARCHAR(255) NOT NULL,

    phone VARCHAR(30) NOT NULL,

    -- =====================================================
    -- BUSINESS REGISTRATION
    -- =====================================================

    rc_number VARCHAR(100),

    cac_certificate_url TEXT,

    professional_certificate_url TEXT,

    -- =====================================================
    -- LOCATION
    -- =====================================================

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    local_government VARCHAR(150),

    country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',

    -- =====================================================
    -- BANKING / VERIFICATION
    -- =====================================================

    bank_name VARCHAR(150),

    account_name VARCHAR(255),

    account_number VARCHAR(50),

    account_bvn VARCHAR(20),

    verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',

-- =====================================================
-- SPECIALIZATION
-- =====================================================

specializations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

-- =====================================================
-- INSTALLER STATUS
-- =====================================================

status VARCHAR(30) NOT NULL DEFAULT 'pending',

group_position VARCHAR(100),

registration_date DATE NOT NULL DEFAULT CURRENT_DATE,

approval_date DATE,
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

    CONSTRAINT installers_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- =====================================================
    -- VERIFICATION CONSTRAINT
    -- =====================================================

    CONSTRAINT installers_verification_status_check
        CHECK (
            verification_status IN (
                'pending',
                'verified',
                'rejected'
            )
        ),

    -- =====================================================
    -- STATUS CONSTRAINT
    -- =====================================================

    CONSTRAINT installers_status_check
        CHECK (
            status IN (
                'pending',
                'active',
                'on_project',
                'inactive',
                'suspended'
            )
        )
);

-- Keep existing installations compatible with the BVN field added later.
ALTER TABLE installers
    ADD COLUMN IF NOT EXISTS account_bvn VARCHAR(20);

ALTER TABLE installers
    ADD COLUMN IF NOT EXISTS banking_verification_status VARCHAR(30)
        NOT NULL DEFAULT 'verified';

ALTER TABLE installers
    ADD COLUMN IF NOT EXISTS banking_change_note TEXT;

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_installers_user_id
    ON installers (user_id);

CREATE INDEX IF NOT EXISTS idx_installers_code
    ON installers (installer_code);

CREATE INDEX IF NOT EXISTS idx_installers_email
    ON installers (email);

CREATE INDEX IF NOT EXISTS idx_installers_phone
    ON installers (phone);

CREATE INDEX IF NOT EXISTS idx_installers_rc_number
    ON installers (rc_number);

CREATE INDEX IF NOT EXISTS idx_installers_state
    ON installers (state);

CREATE INDEX IF NOT EXISTS idx_installers_local_government
    ON installers (local_government);

CREATE INDEX IF NOT EXISTS idx_installers_status
    ON installers (status);

CREATE INDEX IF NOT EXISTS idx_installers_verification
    ON installers (verification_status);

-- =========================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_installers_updated_at()
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

DROP TRIGGER IF EXISTS installers_updated_at_trigger
ON installers;

CREATE TRIGGER installers_updated_at_trigger
BEFORE UPDATE ON installers
FOR EACH ROW
EXECUTE FUNCTION update_installers_updated_at();