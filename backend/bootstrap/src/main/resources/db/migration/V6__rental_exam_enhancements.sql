-- ==============================================================================
-- V6: REJECTION REASON, CONCURRENCY VERSION Y HISTORIAL DE ESTADOS DE ALQUILER
-- ==============================================================================

-- 1. Motivo de rechazo de reservas
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255);

-- 2. Control de concurrencia optimista (Optimistic Locking)
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 3. Tabla de auditoría y trazabilidad de cambios de estado (Historial)
CREATE TABLE IF NOT EXISTS rental_status_history (
    id UUID PRIMARY KEY,
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    notes VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_rental_status_history_rental_id ON rental_status_history(rental_id);
