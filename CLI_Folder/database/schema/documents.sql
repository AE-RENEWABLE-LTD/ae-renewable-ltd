-- =========================================================
-- AE RENEWABLE NETWORK
-- DOCUMENTS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- DOCUMENT IDENTITY
    -- =====================================================

    document_code VARCHAR(100) NOT NULL UNIQUE,

    document_name VARCHAR(255) NOT NULL,

    document_type VARCHAR(50) NOT NULL,

    description TEXT,

    -- =====================================================
    -- RELATIONSHIPS
    -- =====================================================

    client_id BIGINT,

    project_id BIGINT,

    uploaded_by BIGINT,

    -- =====================================================
    -- FILE INFORMATION
    -- =====================================================

    file_name VARCHAR(255) NOT NULL,

    original_file_name VARCHAR(255),

    file_url TEXT NOT NULL,

    file_path TEXT,

    mime_type VARCHAR(100),

    file_size BIGINT,

    -- =====================================================
    -- DOCUMENT STATUS
    -- =====================================================

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    -- =====================================================
    -- VISIBILITY
    -- =====================================================

    visibility VARCHAR(30) NOT NULL DEFAULT 'private',

    -- =====================================================
    -- VERSION CONTROL
    -- =====================================================

    version INTEGER NOT NULL DEFAULT 1,

    -- =====================================================
    -- VERIFICATION
    -- =====================================================

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    verified_by BIGINT,

    verified_at TIMESTAMPTZ,

    -- =====================================================
    -- TIMESTAMPS
    -- =====================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- =====================================================
    -- FOREIGN KEYS
    -- =====================================================

    CONSTRAINT documents_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE SET NULL,

    CONSTRAINT documents_project_id_fkey
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE SET NULL,

    CONSTRAINT documents_uploaded_by_fkey
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT documents_verified_by_fkey
        FOREIGN KEY (verified_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    -- =====================================================
    -- DOCUMENT TYPE
    -- =====================================================

    CONSTRAINT documents_type_check
        CHECK (
            document_type IN (
                'identity',
                'cac_certificate',
                'professional_certificate',
                'quotation',
                'invoice',
                'receipt',
                'contract',
                'agreement',
                'site_survey',
                'technical_report',
                'installation_report',
                'commissioning_report',
                'project_photo',
                'payment_proof',
                'warranty',
                'manual',
                'other'
            )
        ),

    -- =====================================================
    -- STATUS
    -- =====================================================

    CONSTRAINT documents_status_check
        CHECK (
            status IN (
                'active',
                'archived',
                'deleted',
                'pending'
            )
        ),

    -- =====================================================
    -- VISIBILITY
    -- =====================================================

    CONSTRAINT documents_visibility_check
        CHECK (
            visibility IN (
                'private',
                'client',
                'installer',
                'admin',
                'public'
            )
        ),

    -- =====================================================
    -- VERSION
    -- =====================================================

    CONSTRAINT documents_version_check
        CHECK (version > 0),

    -- =====================================================
    -- FILE SIZE
    -- =====================================================

    CONSTRAINT documents_file_size_check
        CHECK (
            file_size IS NULL
            OR file_size >= 0
        )
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_documents_client_id
    ON documents (client_id);

CREATE INDEX IF NOT EXISTS idx_documents_project_id
    ON documents (project_id);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by
    ON documents (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_documents_document_type
    ON documents (document_type);

CREATE INDEX IF NOT EXISTS idx_documents_status
    ON documents (status);

CREATE INDEX IF NOT EXISTS idx_documents_visibility
    ON documents (visibility);

CREATE INDEX IF NOT EXISTS idx_documents_created_at
    ON documents (created_at);

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_documents_updated_at()
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

DROP TRIGGER IF EXISTS documents_updated_at_trigger
ON documents;

CREATE TRIGGER documents_updated_at_trigger
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_documents_updated_at();