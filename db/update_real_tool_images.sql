-- ==============================================================================
-- UPDATE TOOL IMAGES TO AUTHENTIC, HIGH-DEFINITION PHOTOGRAPHY (POSTGRESQL 16)
-- Reemplaza los enlaces ficticios 'images.rentaequipos.com' por imágenes reales y múltiples vistas
-- ==============================================================================

BEGIN;

-- 1. Limpiar imágenes no válidas o rotas
DELETE FROM tool_images WHERE image_url LIKE '%images.rentaequipos.com%';

-- 2. Insertar vistas reales para las 25 herramientas del catálogo
INSERT INTO tool_images (id, tool_id, image_url, is_primary) VALUES
-- 1. Martillo Demoledor Hexagonal 30kg Bosch
(gen_random_uuid(), '11111111-0000-0000-0000-000000000001', '/images/hammer-drill.jpg', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80', false),

-- 2. Rotomartillo SDS Max 1500W DeWalt
(gen_random_uuid(), '11111111-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000002', '/images/hammer-drill.jpg', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80', false),

-- 3. Mezcladora de Concreto 1.5 Bultos Cipsa
(gen_random_uuid(), '11111111-0000-0000-0000-000000000003', '/images/concrete-mixer.jpg', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80', false),

-- 4. Vibrador de Concreto Wacker Neuson
(gen_random_uuid(), '11111111-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),

-- 5. Andamio Certificado Layher Allround
(gen_random_uuid(), '11111111-0000-0000-0000-000000000005', '/images/scaffold-1.jpg', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000005', '/images/scaffold-2.jpg', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000005', '/images/scaffold-3.jpg', false),

-- 6. Generador Diésel Caterpillar 10kVA
(gen_random_uuid(), '11111111-0000-0000-0000-000000000006', '/images/generator.jpg', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', false),

-- 7. Apisonador Canguro Mikasa
(gen_random_uuid(), '11111111-0000-0000-0000-000000000007', '/images/compactor.jpg', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', false),

-- 8. Placa Compactadora Wacker Neuson
(gen_random_uuid(), '11111111-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000008', '/images/compactor.jpg', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', false),

-- 9. Cortadora de Pavimento Husqvarna
(gen_random_uuid(), '11111111-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', false),

-- 10. Motobomba de Lodos Honda 3"
(gen_random_uuid(), '11111111-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),

-- 11. Soldador Inverter Lincoln Electric
(gen_random_uuid(), '11111111-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', false),

-- 12. Equipo Airless Graco 490
(gen_random_uuid(), '11111111-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1000&auto=format&fit=crop&q=80', false),

-- 13. Nivel Láser Leica Geosystems
(gen_random_uuid(), '11111111-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', false),

-- 14. Hidrolavadora Kärcher 3000 PSI
(gen_random_uuid(), '11111111-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', false),

-- 15. Pistola de Fijación Hilti DX 460
(gen_random_uuid(), '11111111-0000-0000-0000-000000000015', 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000015', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000015', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),

-- 16. Torre de Iluminación Generac 4x350W
(gen_random_uuid(), '11111111-0000-0000-0000-000000000016', 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000016', 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000016', 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', false),

-- 17. Extractor de Aire Ramfan UB20
(gen_random_uuid(), '11111111-0000-0000-0000-000000000017', 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000017', 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000017', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),

-- 18. Combo Inalámbrico Makita 18V
(gen_random_uuid(), '11111111-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1000&auto=format&fit=crop&q=80', false),

-- 19. Ahoyadora Stihl BT 131
(gen_random_uuid(), '11111111-0000-0000-0000-000000000019', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000019', 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000019', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),

-- 20. Sierra Circular DeWalt DWE7491
(gen_random_uuid(), '11111111-0000-0000-0000-000000000020', 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000020', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000020', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', false),

-- 21. Termofusora Rothenberger Roweld
(gen_random_uuid(), '11111111-0000-0000-0000-000000000021', 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000021', 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000021', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),

-- 22. Transpaleta Hidráulica Yale 2.5T
(gen_random_uuid(), '11111111-0000-0000-0000-000000000022', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000022', 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000022', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),

-- 23. Trípode de Rescate 3M DBI-SALA
(gen_random_uuid(), '11111111-0000-0000-0000-000000000023', 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000023', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000023', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),

-- 24. Plataforma de Tijera Genie GS-1930
(gen_random_uuid(), '11111111-0000-0000-0000-000000000024', '/images/scissor-lift.jpg', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000024', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000024', 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', false),

-- 25. Allanadora de Concreto Whiteman
(gen_random_uuid(), '11111111-0000-0000-0000-000000000025', 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80', true),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000025', 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1000&auto=format&fit=crop&q=80', false),
(gen_random_uuid(), '11111111-0000-0000-0000-000000000025', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
