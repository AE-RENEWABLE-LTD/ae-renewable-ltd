-- =========================================================
-- AE RENEWABLE NETWORK
-- PROJECTS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,

    -- =====================================================
    -- PROJECT IDENTITY
    -- =====================================================

    project_code VARCHAR(30) NOT NULL UNIQUE,

    project_name VARCHAR(255) NOT NULL,

    description TEXT,

    -- =====================================================
    -- CLIENT RELATIONSHIP
    -- =====================================================

    client_id BIGINT NOT NULL,

    -- =====================================================
    -- INSTALLER RELATIONSHIP
    -- =====================================================

    installer_id BIGINT,

    -- =====================================================
    -- PROJECT LOCATION
    -- =====================================================

    site_address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    local_government VARCHAR(150),

    country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',

    -- =====================================================
    -- PROJECT TYPE
    -- =====================================================

    project_type VARCHAR(50) NOT NULL DEFAULT 'solar',

    -- =====================================================
    -- PROJECT STATUS
    -- =====================================================

    status VARCHAR(40) NOT NULL DEFAULT 'consultation',

    -- =====================================================
    -- PROJECT PRIORITY
    -- =====================================================

    priority VARCHAR(20) NOT NULL DEFAULT 'normal',

    -- =====================================================
    -- PROJECT DATES
    -- =====================================================

    consultation_date DATE,

    scheduled_start_date DATE,

    actual_start_date DATE,

    expected_completion_date DATE,

    actual_completion_date DATE,

    -- =====================================================
    -- SYSTEM INFORMATION
    -- =====================================================

    system_capacity_kw NUMERIC(12, 2),

    battery_capacity_kwh NUMERIC(12, 2),

    panel_count INTEGER,

    inverter_capacity_kva NUMERIC(12, 2),

    -- =====================================================
    -- PROJECT FINANCIAL SUMMARY
    -- =====================================================

    estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0,

    contract_value NUMERIC(15, 2) NOT NULL DEFAULT 0,

    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,

    balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0,

    -- =====================================================
    -- ADDITIONAL INFORMATION
    -- =====================================================

    notes TEXT,

    -- =====================================================
    -- TIMESTAMPS
    -- =====================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- =====================================================
    -- FOREIGN KEYS
    -- =====================================================

    CONSTRAINT projects_client_id_fkey
        FOREIGN KEY (client_id)
        REFERENCES clients(id)
        ON DELETE RESTRICT,

    CONSTRAINT projects_installer_id_fkey
        FOREIGN KEY (installer_id)
        REFERENCES installers(id)
        ON DELETE SET NULL,

    -- =====================================================
    -- PROJECT TYPE
    -- =====================================================

    CONSTRAINT projects_type_check
        CHECK (
            project_type IN (
                'solar',
                'cctv',
                'electric_fence',
                'electrical',
                'hybrid',
                'solar_mini_grid',
                'other'
            )
        ),

    -- =====================================================
    -- PROJECT STATUS
    -- =====================================================

    CONSTRAINT projects_status_check
        CHECK (
            status IN (
                'consultation',
                'survey',
                'design',
                'quotation',
                'approved',
                'scheduled',
                'installation',
                'testing',
                'commissioned',
                'completed',
                'on_hold',
                'cancelled'
            )
        ),

    -- =====================================================
    -- PRIORITY
    -- =====================================================

    CONSTRAINT projects_priority_check
        CHECK (
            priority IN (
                'low',
                'normal',
                'high',
                'urgent'
            )
        ),

    -- =====================================================
    -- NUMERIC VALIDATION
    -- =====================================================

    CONSTRAINT projects_estimated_value_check
        CHECK (estimated_value >= 0),

    CONSTRAINT projects_contract_value_check
        CHECK (contract_value >= 0),

    CONSTRAINT projects_amount_paid_check
        CHECK (amount_paid >= 0),

    CONSTRAINT projects_balance_due_check
        CHECK (balance_due >= 0),

    CONSTRAINT projects_system_capacity_check
        CHECK (
            system_capacity_kw IS NULL
            OR system_capacity_kw >= 0
        ),

    CONSTRAINT projects_battery_capacity_check
        CHECK (
            battery_capacity_kwh IS NULL
            OR battery_capacity_kwh >= 0
        ),

    CONSTRAINT projects_panel_count_check
        CHECK (
            panel_count IS NULL
            OR panel_count >= 0
        ),

    CONSTRAINT projects_inverter_capacity_check
        CHECK (
            inverter_capacity_kva IS NULL
            OR inverter_capacity_kva >= 0
        )
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_projects_project_code
    ON projects (project_code);

CREATE INDEX IF NOT EXISTS idx_projects_client_id
    ON projects (client_id);

CREATE INDEX IF NOT EXISTS idx_projects_installer_id
    ON projects (installer_id);

CREATE INDEX IF NOT EXISTS idx_projects_status
    ON projects (status);

CREATE INDEX IF NOT EXISTS idx_projects_project_type
    ON projects (project_type);

CREATE INDEX IF NOT EXISTS idx_projects_priority
    ON projects (priority);

CREATE INDEX IF NOT EXISTS idx_projects_state
    ON projects (state);

CREATE INDEX IF NOT EXISTS idx_projects_created_at
    ON projects (created_at);

-- =========================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_projects_updated_at()
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

DROP TRIGGER IF EXISTS projects_updated_at_trigger
ON projects;

CREATE TRIGGER projects_updated_at_trigger
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_updated_at();