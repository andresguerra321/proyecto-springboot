-- ==============================================================================
-- DML: POBLACIÓN DE DATOS INICIALES (POSTGRESQL 16)
-- CONFIGURACIÓN LIMPIA: 1 USUARIO POR ROL + CATÁLOGO DE CATEGORÍAS
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
-- 2. TABLA: users (1 Usuario por Rol)
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, enabled) VALUES
-- 1 Admin
('a0000000-0000-0000-0000-000000000001', 'admin_principal', 'admin@rentaequipos.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
-- 1 Proveedor
('b0000000-0000-0000-0000-000000000001', 'prov_maquinaria_bog', 'contacto@maquinariabogota.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
-- 1 Cliente
('c0000000-0000-0000-0000-000000000001', 'cliente_carlos_gomez', 'carlos.gomez@constructora.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. TABLA: user_roles (Asignación normalizada)
-- ------------------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id) VALUES
('a0000000-0000-0000-0000-000000000001', 1), -- Admin -> ROLE_ADMIN
('b0000000-0000-0000-0000-000000000001', 2), -- Proveedor -> ROLE_PROVEEDOR
('c0000000-0000-0000-0000-000000000001', 3)  -- Cliente -> ROLE_CLIENTE
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. TABLA: provider_profiles (1 Perfil Activo)
-- ------------------------------------------------------------------------------
INSERT INTO provider_profiles (id, user_id, company_name, tax_id, phone, address, city, is_verified) VALUES
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Maquinaria y Equipos Bogotá S.A.S.', '900123456-1', '+57 310 111 2233', 'Av. Boyacá # 68-45', 'Bogotá D.C.', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. TABLA: client_profiles (1 Perfil Activo)
-- ------------------------------------------------------------------------------
INSERT INTO client_profiles (id, user_id, full_name, document_type, document_number, phone, address, city) VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Carlos Alberto Gómez Peña', 'CC', '1018234567', '+57 300 123 4567', 'Calle 134 # 19-45', 'Bogotá D.C.')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. TABLA: categories (20 categorías taxonómicas listas para recibir herramientas)
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
