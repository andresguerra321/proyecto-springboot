-- ==============================================================================
-- DDL: TABLA DE NOTIFICACIONES DE USUARIO (4FN)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'INFO', -- SUCCESS, INFO, WARNING, ERROR
    category VARCHAR(40) NOT NULL DEFAULT 'RENTAL', -- RENTAL, PAYMENT, WARRANTY, RETURN, SYSTEM
    link VARCHAR(300) DEFAULT '#/client',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_notif_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_unread ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notif_created ON user_notifications(created_at DESC);

-- ==============================================================================
-- DML: POBLACIÓN DE NOTIFICACIONES REALES HISTÓRICAS (CERO SIMULACIÓN)
-- ==============================================================================

-- 1. Notificaciones reales para alquileres confirmados/en progreso existentes
INSERT INTO user_notifications (user_id, title, message, type, category, link, is_read, created_at)
SELECT 
    cp.user_id,
    '¡Alquiler Confirmado!',
    'Has reservado ' || COALESCE(
        (SELECT STRING_AGG(DISTINCT t2.name, ', ')
         FROM rental_items ri2
         JOIN tools t2 ON ri2.tool_id = t2.id
         WHERE ri2.rental_id = r.id),
        'equipo'
    ) || ' (' || r.rental_code || ') del ' || TO_CHAR(r.start_date, 'YYYY-MM-DD') || ' al ' || TO_CHAR(r.end_date, 'YYYY-MM-DD') || '.',
    'SUCCESS',
    'RENTAL',
    '#/client',
    false,
    r.created_at
FROM rentals r
JOIN client_profiles cp ON r.client_id = cp.id
WHERE r.status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
ORDER BY r.created_at DESC;

-- 2. Notificaciones para reclamos de garantía existentes si los hubiere
INSERT INTO user_notifications (user_id, title, message, type, category, link, is_read, created_at)
SELECT
    cp.user_id,
    'Reclamo de Garantía #' || wc.ticket_number,
    'Se ha registrado su solicitud de garantía/cambio para ' || COALESCE(t.name, 'equipo') || ' con estado: ' || wc.status || '.',
    'WARNING',
    'WARRANTY',
    '#/client',
    false,
    wc.created_at
FROM warranty_claims wc
JOIN rentals r ON wc.rental_id = r.id
JOIN client_profiles cp ON r.client_id = cp.id
LEFT JOIN tools t ON wc.tool_id = t.id
ORDER BY wc.created_at DESC;
