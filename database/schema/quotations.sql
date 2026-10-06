CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,

    quotation_code VARCHAR(100) NOT NULL UNIQUE,

    quotation_number VARCHAR(100) NOT NULL UNIQUE,

    client_id INTEGER NOT NULL
        REFERENCES clients(id)
        ON DELETE RESTRICT,

    project_id INTEGER
        REFERENCES projects(id)
        ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    version INTEGER NOT NULL DEFAULT 1,

    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,

    discount NUMERIC(15,2) NOT NULL DEFAULT 0,

    tax NUMERIC(15,2) NOT NULL DEFAULT 0,

    installation_fee NUMERIC(15,2) NOT NULL DEFAULT 0,

    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,

    amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0,

    balance_due NUMERIC(15,2) NOT NULL DEFAULT 0,

    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,

    valid_until DATE,

    client_viewed_at TIMESTAMP,

    client_responded_at TIMESTAMP,

    rejection_reason TEXT,

    approved_at TIMESTAMP,

    approved_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    pdf_url TEXT,

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotations_client_id
    ON quotations(client_id);

CREATE INDEX IF NOT EXISTS idx_quotations_project_id
    ON quotations(project_id);

CREATE INDEX IF NOT EXISTS idx_quotations_status
    ON quotations(status);

CREATE INDEX IF NOT EXISTS idx_quotations_created_at
    ON quotations(created_at);

CREATE INDEX IF NOT EXISTS idx_quotations_issue_date
    ON quotations(issue_date);
