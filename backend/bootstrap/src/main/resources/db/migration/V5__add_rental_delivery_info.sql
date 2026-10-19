-- ==============================================================================
-- DDL: AGREGAR DIRECCIÓN DE ENTREGA Y TELÉFONO DE CONTACTO EN RENTALS (4FN)
-- ==============================================================================

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(200);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30);

-- Sincronizar registros existentes con el perfil del cliente asociado o valores por defecto oficiales
UPDATE rentals r
SET delivery_address = COALESCE(cp.address || ', ' || cp.city, 'Calle 134 # 19-45, Bogotá D.C.'),
    contact_phone = COALESCE(cp.phone, '+57 300 123 4567')
FROM client_profiles cp
WHERE r.client_id = cp.id AND (r.delivery_address IS NULL OR r.delivery_address = '');

-- Asegurar flota de 2 unidades operativas para Andamio Certificado Multidireccional Layher 6m
INSERT INTO tools (id, provider_id, category_id, name, brand, model, serial_number, description, daily_price, replacement_value, status, created_at, updated_at)
VALUES ('5e366d33-f72c-4269-8df2-441a0c0054ce', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'Andamio Certificado Multidireccional Layher 6m', 'Layher Allround', 'AR-200 Pro', 'SN-LAY-9988-U2', 'Torre de andamio multidireccional con certificacion OSHA y plataformas antideslizantes de alta resistencia.', 45000.00, 2900000.00, 'AVAILABLE', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
