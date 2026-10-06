-- =========================================================
-- AE RENEWABLE NETWORK
-- USERS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- ACCOUNT IDENTITY
    -- =====================================================

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    -- =====================================================
    -- PERSONAL INFORMATION
    -- =====================================================

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    phone VARCHAR(30),

    -- =====================================================
    -- ACCESS CONTROL
    -- =====================================================

    role VARCHAR(30) NOT NULL DEFAULT 'client',

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    -- =====================================================
    -- ACCOUNT SECURITY
    -- =====================================================

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    last_login_at TIMESTAMPTZ,

    password_changed_at TIMESTAMPTZ,

    failed_login_attempts INTEGER NOT NULL DEFAULT 0,

    locked_until TIMESTAMPTZ,

    -- =====================================================
    -- TIMESTAMPS
    -- =====================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- =====================================================
    -- ROLE VALIDATION
    -- =====================================================

    CONSTRAINT users_role_check
        CHECK (
            role IN (
                'admin',
                'staff',
                'installer',
                'client'
            )
        ),

    -- =====================================================
    -- STATUS VALIDATION
    -- =====================================================

    CONSTRAINT users_status_check
        CHECK (
            status IN (
                'active',
                'inactive',
                'suspended',
                'pending'
            )
        ),

    -- =====================================================
    -- FAILED LOGIN VALIDATION
    -- =====================================================

    CONSTRAINT users_failed_login_check
        CHECK (failed_login_attempts >= 0)
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_role
    ON users (role);

CREATE INDEX IF NOT EXISTS idx_users_status
    ON users (status);

CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users (created_at);

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
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

DROP TRIGGER IF EXISTS users_updated_at_trigger
ON users;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();