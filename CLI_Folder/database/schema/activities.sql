-- =========================================================
-- AE RENEWABLE NETWORK - ACTIVITIES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS activities (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT,
    actor_role VARCHAR(30),
    actor_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    action_label VARCHAR(255),
    entity_type VARCHAR(50),
    entity_id BIGINT,
    project_id BIGINT,
    quotation_id BIGINT,
    payment_id BIGINT,
    installer_id BIGINT,
    client_id BIGINT,
    metadata JSONB,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT activities_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT activities_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT activities_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
    CONSTRAINT activities_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    CONSTRAINT activities_installer_id_fkey FOREIGN KEY (installer_id) REFERENCES installers(id) ON DELETE SET NULL,
    CONSTRAINT activities_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities (project_id);
CREATE INDEX IF NOT EXISTS idx_activities_actor_user_id ON activities (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_activities_action ON activities (action);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at);
