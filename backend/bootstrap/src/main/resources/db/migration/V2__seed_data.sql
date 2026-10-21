-- ==============================================================================
-- DML: POBLACIÓN DE DATOS INICIALES (POSTGRESQL 16)
-- CONFIGURACIÓN LIMPIA PARA PRUEBAS:
-- 4 USUARIOS (Admin, Proveedor, Carlos Gómez y María Rodríguez)
-- 5 HERRAMIENTAS ACTIVAS DEL PROVEEDOR
-- 0 ALQUILERES REGISTRADOS
-- Password por defecto para todos los usuarios: 'Password123*'
-- Hash BCrypt: $2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA: roles
-- ------------------------------------------------------------------------------
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Administrador general del sistema con acceso total'),
(2, 'ROLE_PROVEEDOR', 'Proveedor de equipos y herramientas con gestión de inventario'),
(3, 'ROLE_CLIENTE', 'Cliente particular o empresa con capacidad de alquilar')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Sincronizar secuencia de roles
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- ------------------------------------------------------------------------------
-- 2. TABLA: users (Exactamente 4 Usuarios)
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, enabled) VALUES
-- 1 Admin
('a0000000-0000-0000-0000-000000000001', 'admin_principal', 'admin@rentaequipos.com', '$2a$10$egj3OFBJc2mVDfMMX25ZL.I4hfcDG9TY05vWS6ShiTPxFUx.uRy0q', true),
-- 1 Proveedor
('b0000000-0000-0000-0000-000000000001', 'prov_maquinaria_bog', 'contacto@maquinariabogota.com', '$2a$10$egj3OFBJc2mVDfMMX25ZL.I4hfcDG9TY05vWS6ShiTPxFUx.uRy0q', true),
-- 2 Clientes (incluyendo a Carlos Gómez)
('c0000000-0000-0000-0000-000000000001', 'cliente_carlos_gomez', 'carlos.gomez@constructora.com', '$2a$10$egj3OFBJc2mVDfMMX25ZL.I4hfcDG9TY05vWS6ShiTPxFUx.uRy0q', true),
('c0000000-0000-0000-0000-000000000002', 'cliente_maria_rodriguez', 'maria.rodriguez@ingenieria.com', '$2a$10$egj3OFBJc2mVDfMMX25ZL.I4hfcDG9TY05vWS6ShiTPxFUx.uRy0q', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. TABLA: user_roles (Asignación normalizada)
-- ------------------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id) VALUES
('a0000000-0000-0000-0000-000000000001', 1), -- Admin -> ROLE_ADMIN
('b0000000-0000-0000-0000-000000000001', 2), -- Proveedor -> ROLE_PROVEEDOR
('c0000000-0000-0000-0000-000000000001', 3), -- Carlos -> ROLE_CLIENTE
('c0000000-0000-0000-0000-000000000002', 3)  -- María -> ROLE_CLIENTE
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. TABLA: provider_profiles (1 Perfil de Proveedor)
-- ------------------------------------------------------------------------------
INSERT INTO provider_profiles (id, user_id, company_name, tax_id, phone, address, city, is_verified) VALUES
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Maquinaria y Equipos Bogotá S.A.S.', '900123456-1', '+57 310 111 2233', 'Av. Boyacá # 68-45', 'Bogotá D.C.', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. TABLA: client_profiles (2 Perfiles de Cliente)
-- ------------------------------------------------------------------------------
INSERT INTO client_profiles (id, user_id, full_name, document_type, document_number, phone, address, city) VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Carlos Alberto Gómez Peña', 'CC', '1018234567', '+57 300 123 4567', 'Calle 134 # 19-45', 'Bogotá D.C.'),
('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'María Camila Rodríguez León', 'CC', '1020345678', '+57 301 234 5678', 'Carrera 43A # 1Sur-50', 'Medellín')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. TABLA: categories (20 categorías taxonómicas)
-- ------------------------------------------------------------------------------
INSERT INTO categories (id, name, description) VALUES
('f0000000-0000-0000-0000-000000000001', 'Demolición y Perforación', 'Martillos demoledores, rotomartillos y taladros de impacto'),
('f0000000-0000-0000-0000-000000000002', 'Hormigón y Concreto', 'Mezcladoras trompo, vibradores de aguja y reglas vibratorias'),
('f0000000-0000-0000-0000-000000000003', 'Elevación y Andamiaje', 'Andamios certificados, torres de trabajo y plataformas de tijera'),
('f0000000-0000-0000-0000-000000000004', 'Generación de Energía', 'Plantas eléctricas diésel e inversores a gasolina'),
('f0000000-0000-0000-0000-000000000005', 'Compactación de Suelos', 'Ranas compactadoras tipo canguro y rodillos vibratorios manuales'),
('f0000000-0000-0000-0000-000000000006', 'Corte y Abrasivos', 'Cortadoras de pavimento, amoladoras industriales y sierras de banco'),
('f0000000-0000-0000-0000-000000000007', 'Bombeo y Drenaje', 'Motobombas sumergibles para lodo y bombas centrífugas de alta presión'),
('f0000000-0000-0000-0000-000000000008', 'Soldadura y Metales', 'Equipos inversores multiproceso MIG/TIG y cortadores de plasma'),
('f0000000-0000-0000-0000-000000000009', 'Limpieza y Desinfección', 'Hidrolavadoras industriales de agua caliente y barredoras de obra'),
('f0000000-0000-0000-0000-000000000010', 'Pintura y Recubrimientos', 'Equipos airless de pulverización y compresores de pintura'),
('f0000000-0000-0000-0000-000000000011', 'Topografía y Medición', 'Niveles ópticos, estaciones totales y distanciómetros láser'),
('f0000000-0000-0000-0000-000000000012', 'Iluminación de Faena', 'Torres de iluminación LED autónomas y reflectores de alta potencia'),
('f0000000-0000-0000-0000-000000000013', 'Ventilación y Climatización', 'Extractores centrífugos axiales y cañones de calor diésel'),
('f0000000-0000-0000-0000-000000000014', 'Fijación y Encofrados', 'Puntales metálicos telescópicos y pistolas de fijación neumática'),
('f0000000-0000-0000-0000-000000000015', 'Seguridad y Rescate', 'Trípodes de rescate con torno y arneses anticaída certificados'),
('f0000000-0000-0000-0000-000000000016', 'Jardinería y Desmonte', 'Motosierras profesionales, desbrozadoras y trituradoras de ramas'),
('f0000000-0000-0000-0000-000000000017', 'Movimiento de Tierras Menor', 'Minidumpers a orugas y carretillas motorizadas 4x4'),
('f0000000-0000-0000-0000-000000000018', 'Herramientas Inalámbricas', 'Kits profesionales a batería de 18V/20V/54V'),
('f0000000-0000-0000-0000-000000000019', 'Corte con Diamante', 'Perforadoras diamantinas saca-núcleos en húmedo y seco'),
('f0000000-0000-0000-0000-000000000020', 'Equipos Hidráulicos', 'Gatos hidráulicos de alta capacidad y prensas terminales')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 7. TABLA: tools (Exactamente 5 Herramientas del Proveedor)
-- ------------------------------------------------------------------------------
INSERT INTO tools (id, provider_id, category_id, name, brand, model, serial_number, description, daily_price, replacement_value, status) VALUES
('11111111-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Martillo Demoledor Hexagonal 30kg', 'Bosch', 'GSH 27 VC', 'BSH-2026-001', 'Demoledor eléctrico industrial de 62 Joules para demolición pesada de pavimentos y losas.', 85000.00, 4800000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'Mezcladora de Concreto 1.5 Bultos (Trompo)', 'Cipsa', 'Maxi 10', 'CIP-2026-003', 'Trompo mezclador con motor Honda GX270 9HP de alta eficiencia para vaciado de concreto en obra.', 55000.00, 3900000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'Andamio Certificado Multidireccional Layher 6m', 'Layher', 'Allround 2.0', 'LAY-2026-005', 'Módulo de andamio multidireccional certificado con plataformas antideslizantes y rodapiés de seguridad.', 35000.00, 3500000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', 'Generador Eléctrico Diésel Insonorizado 10kVA', 'Caterpillar', 'DE9.5E3', 'CAT-2026-006', 'Planta eléctrica trifásica cabinada insonorizada 220V/110V para suministro continuo en faena.', 120000.00, 11500000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'Apisonador Canguro 4HP', 'Mikasa', 'MTX-70HDR', 'MIK-2026-007', 'Compactadora tipo canguro de alta frecuencia para zanjas, cimientos y suelos cohesivos.', 60000.00, 4200000.00, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. TABLA: tool_images (Imágenes locales)
-- ------------------------------------------------------------------------------
INSERT INTO tool_images (id, tool_id, image_url, is_primary) VALUES
('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '/images/hammer-drill.jpg', true),
('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '/images/concrete-mixer.jpg', true),
('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', '/images/scaffold-1.jpg', true),
('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004', '/images/generator.jpg', true),
('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005', '/images/compactor.jpg', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. TABLA: tool_specifications
-- ------------------------------------------------------------------------------
INSERT INTO tool_specifications (id, tool_id, spec_name, spec_value) VALUES
('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Energía de Impacto', '62 Joules'),
('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Peso Operativo', '29.5 kg'),
('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Capacidad de Mezcla', '280 Litros (1.5 Bultos)'),
('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'Motor', 'Honda GX270 9.0 HP Gasolina'),
('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003', 'Carga Máxima Admisible', '200 kg/m² Clase 3'),
('33333333-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000003', 'Altura de Trabajo', '6.0 metros útiles'),
('33333333-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000004', 'Potencia Eléctrica', '9.5 kVA Trifásico 220V/110V'),
('33333333-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000004', 'Autonomía', '12 Horas a media carga'),
('33333333-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000005', 'Fuerza de Impacto', '14.9 kN'),
('33333333-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000005', 'Frecuencia de Golpe', '640 a 680 golpes/min')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. ALQUILERES: Cero alquileres (Para pruebas limpias desde ceros)
-- ------------------------------------------------------------------------------
