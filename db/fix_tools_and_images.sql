-- ==============================================================================
-- FIX TOOLS AND IMAGES FOR RENTA HERRAMIENTAS PLATFORM
-- 1. Actualizar imágenes rotas de herramientas existentes
-- 2. Asegurar categorías correctas
-- 3. Insertar herramientas adicionales de alta demanda
-- ==============================================================================

-- 1. Actualizar imágenes rotas de herramientas existentes
UPDATE tool_images SET image_url = '/images/scaffold-1.jpg' WHERE tool_id = 'c4d01ab9-3cd3-494a-a368-ad987ecb5aa2';
UPDATE tool_images SET image_url = '/images/scaffold-2.jpg' WHERE tool_id = '5e366d33-f72c-4269-8df2-441a0c0054cd';
UPDATE tool_images SET image_url = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000' WHERE tool_id = 'cf46b217-9d06-4fdb-a447-ab6cda201f85';
UPDATE tool_images SET image_url = '/images/scaffold-1.jpg' WHERE tool_id = '4dd206c6-2a41-4e35-b53c-3c22628df174';

-- 2. Corregir categorías de herramientas existentes
UPDATE tools SET category_id = 'f0000000-0000-0000-0000-000000000003' WHERE id = '5e366d33-f72c-4269-8df2-441a0c0054cd';
UPDATE tools SET category_id = 'f0000000-0000-0000-0000-000000000001' WHERE id = 'cf46b217-9d06-4fdb-a447-ab6cda201f85';

-- 3. Insertar herramientas adicionales conectadas directamente a la base de datos
INSERT INTO tools (id, provider_id, category_id, name, brand, model, serial_number, description, daily_price, replacement_value, status) VALUES
('11111111-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'Mezcladora de Concreto 1.5 Bultos', 'Cipsa', 'Maxi 10', 'CIP-2026-003', 'Trompo mezclador con motor Honda GX270 9HP', 55000.00, 3900000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', 'Generador Eléctrico Diésel Insonorizado 10kVA', 'Caterpillar', 'DE9.5E3', 'CAT-2026-006', 'Planta eléctrica trifásica 220V/110V para obra', 120000.00, 11500000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'Apisonador Canguro 4HP', 'Mikasa', 'MTX-70HDR', 'MIK-2026-007', 'Compactadora tipo rana para zanjas y suelos cohesivos', 60000.00, 4200000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000024', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'Plataforma Elevadora de Tijera Eléctrica 8m', 'Genie', 'GS-1930', 'GNE-2026-024', 'Plataforma para trabajos en altura en bodegas', 160000.00, 18500000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Rotomartillo SDS Max 1500W', 'DeWalt', 'D25773K', 'DWT-2026-002', 'Rotomartillo combinado para perforación pesada', 45000.00, 2600000.00, 'AVAILABLE')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  brand = EXCLUDED.brand, 
  model = EXCLUDED.model, 
  daily_price = EXCLUDED.daily_price, 
  status = EXCLUDED.status;

-- 4. Insertar imágenes verificadas para las herramientas
INSERT INTO tool_images (id, tool_id, image_url, is_primary) VALUES
('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', '/images/concrete-mixer.jpg', true),
('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000006', '/images/generator.jpg', true),
('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000007', '/images/compactor.jpg', true),
('22222222-0000-0000-0000-000000000024', '11111111-0000-0000-0000-000000000024', '/images/scissor-lift.jpg', true),
('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '/images/hammer-drill.jpg', true)
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;
