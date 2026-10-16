-- ==============================================================================
-- DDL: TABLA DE RECLAMOS DE GARANTÍA Y CAMBIO DE EQUIPO EN OBRA (4FN)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS warranty_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES tools(id) ON DELETE SET NULL,
    claim_type VARCHAR(30) NOT NULL, -- EXCHANGE, WARRANTY_REPAIR, REFUND
    fault_type VARCHAR(40) NOT NULL, -- MOTOR, ELECTRICO, HIDRAULICO, CONSUMIBLE, DIFERENTE, ESTRUCTURAL, OTHER
    urgency VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- URGENT (<4h), NORMAL (<24h)
    description TEXT NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    delivery_address VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, APPROVED, DISPATCHED, RESOLVED, REJECTED
    resolution_notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warranty_claims_rental ON warranty_claims(rental_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_tool ON warranty_claims(tool_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);
