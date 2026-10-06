CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,

    quotation_id INTEGER NOT NULL
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    item_type VARCHAR(50) NOT NULL DEFAULT 'product',

    item_code VARCHAR(100),

    name VARCHAR(255) NOT NULL,

    description TEXT,

    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,

    unit VARCHAR(50) DEFAULT 'unit',

    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,

    discount NUMERIC(15,2) NOT NULL DEFAULT 0,

    tax NUMERIC(15,2) NOT NULL DEFAULT 0,

    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id
    ON quotation_items(quotation_id);

CREATE INDEX IF NOT EXISTS idx_quotation_items_item_code
    ON quotation_items(item_code);

CREATE INDEX IF NOT EXISTS idx_quotation_items_sort_order
    ON quotation_items(quotation_id, sort_order);
