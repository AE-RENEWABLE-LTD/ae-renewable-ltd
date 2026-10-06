-- =========================================================
-- AE RENEWABLE NETWORK - SCHEMA ALTERATIONS
-- =========================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS quotation_id BIGINT;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_quotation_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL;

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('consultation','survey','design','engineering','quotation_ready','quotation','submitted','admin_review','approved','installer_search','installer_assigned','installer_accepted','scheduled','in_progress','installation','testing','evidence_review','payment_requested','payment_review','payment_approved','payment_paid','commissioned','completed','on_hold','cancelled'));

CREATE INDEX IF NOT EXISTS idx_projects_quotation_id ON projects (quotation_id);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS installer_id BIGINT;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_installer_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_installer_id_fkey FOREIGN KEY (installer_id) REFERENCES installers(id) ON DELETE SET NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(30) NOT NULL DEFAULT 'client_payment';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS requested_by BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS approved_by BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (payment_status IN ('pending','requested','under_review','approved','processing','paid','successful','failed','rejected','reversed','refunded','cancelled'));

CREATE INDEX IF NOT EXISTS idx_payments_installer_id ON payments (installer_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments (payment_type);
