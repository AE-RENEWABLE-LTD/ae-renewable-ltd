-- =========================================================
-- AE RENEWABLE NETWORK
-- EMAIL VERIFICATION CODES
-- =========================================================

CREATE TABLE IF NOT EXISTS email_verification_codes (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    code_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    attempts INTEGER NOT NULL DEFAULT 0,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT email_verification_codes_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT email_verification_codes_attempts_check
        CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_user_id
    ON email_verification_codes (user_id);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at
    ON email_verification_codes (expires_at);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_active
    ON email_verification_codes (user_id, used_at, expires_at);
