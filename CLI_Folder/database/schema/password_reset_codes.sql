-- =========================================================
-- AE RENEWABLE NETWORK
-- PASSWORD RESET CODES
-- =========================================================

CREATE TABLE IF NOT EXISTS password_reset_codes (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    code_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    attempts INTEGER NOT NULL DEFAULT 0,

    verified_at TIMESTAMPTZ,

    reset_token_hash TEXT,

    reset_token_expires_at TIMESTAMPTZ,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT password_reset_codes_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT password_reset_codes_attempts_check
        CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id
    ON password_reset_codes (user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at
    ON password_reset_codes (expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_active
    ON password_reset_codes (
        user_id,
        used_at,
        expires_at
    );

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_reset_token
    ON password_reset_codes (
        reset_token_hash
    );
