-- =========================================================
-- AE RENEWABLE NETWORK - PROJECT EVIDENCE TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS project_evidence (
    id BIGSERIAL PRIMARY KEY,
    evidence_code VARCHAR(60) NOT NULL UNIQUE,
    project_id BIGINT NOT NULL,
    installer_id BIGINT NOT NULL,
    stage VARCHAR(30) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255),
    file_url TEXT NOT NULL,
    file_path TEXT,
    mime_type VARCHAR(100),
    file_size BIGINT,
    notes TEXT,
    review_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    reviewed_by BIGINT,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT project_evidence_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT project_evidence_installer_id_fkey FOREIGN KEY (installer_id) REFERENCES installers(id) ON DELETE RESTRICT,
    CONSTRAINT project_evidence_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT project_evidence_stage_check CHECK (stage IN ('starting','working','panels','inverter','battery','finishing')),
    CONSTRAINT project_evidence_review_status_check CHECK (review_status IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS idx_project_evidence_project_id ON project_evidence (project_id);
CREATE INDEX IF NOT EXISTS idx_project_evidence_installer_id ON project_evidence (installer_id);
CREATE INDEX IF NOT EXISTS idx_project_evidence_stage ON project_evidence (stage);
CREATE INDEX IF NOT EXISTS idx_project_evidence_review_status ON project_evidence (review_status);
CREATE INDEX IF NOT EXISTS idx_project_evidence_created_at ON project_evidence (created_at);
CREATE OR REPLACE FUNCTION update_project_evidence_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS project_evidence_updated_at_trigger ON project_evidence;
CREATE TRIGGER project_evidence_updated_at_trigger BEFORE UPDATE ON project_evidence FOR EACH ROW EXECUTE FUNCTION update_project_evidence_updated_at();
