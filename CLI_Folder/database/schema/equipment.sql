-- =========================================================
-- AE RENEWABLE NETWORK - EQUIPMENT TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS equipment (
    id BIGSERIAL PRIMARY KEY,
    equipment_code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(150),
    model VARCHAR(150),
    category VARCHAR(60) NOT NULL,
    rating VARCHAR(100),
    unit VARCHAR(30) NOT NULL DEFAULT 'unit',
    specifications JSONB,
    description TEXT,
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    supplier VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT equipment_category_check CHECK (category IN ('solar_panel','inverter','battery','mounting_system','dc_cable','ac_cable','cable_lug','mc4_connector','circuit_breaker','fuse','spd','dc_combiner','distribution_board','earthing','bos','accessory','other')),
    CONSTRAINT equipment_status_check CHECK (status IN ('active','inactive','discontinued')),
    CONSTRAINT equipment_cost_price_check CHECK (cost_price >= 0),
    CONSTRAINT equipment_selling_price_check CHECK (selling_price >= 0)
);
CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment (equipment_code);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment (category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment (status);
CREATE INDEX IF NOT EXISTS idx_equipment_brand ON equipment (brand);
CREATE OR REPLACE FUNCTION update_equipment_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS equipment_updated_at_trigger ON equipment;
CREATE TRIGGER equipment_updated_at_trigger BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_equipment_updated_at();
