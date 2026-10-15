-- ==============================================================================
-- DML: POBLACIÓN DE DATOS INICIALES (POSTGRESQL 16)
-- CUMPLE EL REQUISITO DE AL MENOS 20 REGISTROS POR ENTIDAD
-- Password por defecto para todos los usuarios: 'Password123*'
-- Hash BCrypt: $2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA: roles (20 registros)
-- ------------------------------------------------------------------------------
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_ADMIN', 'Administrador general del sistema con acceso total'),
(2, 'ROLE_PROVEEDOR', 'Proveedor de equipos y herramientas con gestión de inventario'),
(3, 'ROLE_CLIENTE', 'Cliente particular o empresa con capacidad de alquilar'),
(4, 'ROLE_SUPERVISOR_CALIDAD', 'Supervisor de estado y mantenimiento de maquinaria'),
(5, 'ROLE_AUDITOR_FINANCIERO', 'Auditor de reportes contables, facturación y pagos'),
(6, 'ROLE_LOGISTICA_ENTREGAS', 'Encargado del despacho físico y recepción de herramientas'),
(7, 'ROLE_SOPORTE_TECNICO', 'Atención de incidencias de clientes y proveedores'),
(8, 'ROLE_INSPECTOR_HERRAMIENTAS', 'Perito técnico de inspecciones de entrega y devolución'),
(9, 'ROLE_FACTURACION', 'Emisión y conciliación de facturas electrónicas'),
(10, 'ROLE_SEGURIDAD_SISTEMA', 'Monitor de eventos de seguridad y accesos al API'),
(11, 'ROLE_GESTOR_GARANTIAS', 'Administrador de depósitos y cobros por siniestros'),
(12, 'ROLE_MARKETING', 'Gestor de promociones y descuentos en catálogo'),
(13, 'ROLE_ATENCION_CLIENTE', 'Gestor de tickets de soporte posventa'),
(14, 'ROLE_COORDINADOR_MANTENIMIENTO', 'Programador de mantenimiento preventivo de maquinaria'),
(15, 'ROLE_ANALISTA_REPORTES', 'Generador de analítica de rentabilidad'),
(16, 'ROLE_VERIFICADOR_DOCUMENTOS', 'Validador de identidad de clientes y proveedores'),
(17, 'ROLE_GESTOR_CATEGORIAS', 'Administrador de taxonomías del catálogo'),
(18, 'ROLE_OPERADOR_BODEGA', 'Personal de bodega para embalaje y alistamiento'),
(19, 'ROLE_MONITOREO_PAGOS', 'Analista de pasarelas de pago y rechazos bancarios'),
(20, 'ROLE_CONSULTOR_EXTERNO', 'Acceso de solo lectura a auditorías externas')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Sincronizar secuencia de roles
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));

-- ------------------------------------------------------------------------------
-- 2. TABLA: users (42 registros: 2 Admins + 20 Proveedores + 20 Clientes)
-- ------------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, enabled) VALUES
-- Admins
('a0000000-0000-0000-0000-000000000001', 'admin_principal', 'admin@rentaequipos.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('a0000000-0000-0000-0000-000000000002', 'admin_operaciones', 'operaciones@rentaequipos.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
-- Proveedores (20)
('b0000000-0000-0000-0000-000000000001', 'prov_maquinaria_bog', 'contacto@maquinariabogota.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000002', 'prov_equipos_med', 'ventas@equiposmedellin.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000003', 'prov_rentacali', 'info@rentamaquinariacali.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000004', 'prov_herramientas_caribe', 'rentas@herramientascaribe.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000005', 'prov_andinaconstruc', 'servicio@andinaconstruccion.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000006', 'prov_ferrecentro', 'equipos@ferrecentro.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000007', 'prov_gruas_elevadores', 'despacho@gruaselevadores.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000008', 'prov_concretocool', 'alquiler@concretocool.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000009', 'prov_demoliciones_sas', 'contacto@demolicionescol.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000010', 'prov_soluciones_viales', 'maquinaria@solucionesviales.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000011', 'prov_agroindustrial', 'alquiler@agroindustrialmaq.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000012', 'prov_potencia_generadores', 'energia@potenciageneradores.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000013', 'prov_sierra_taladro', 'ventas@sierrataladro.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000014', 'prov_andamios_seguros', 'logistica@andamiosseguros.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000015', 'prov_hidrolavadoras_pro', 'servicio@hidrolavadoraspro.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000016', 'prov_soldaduras_bog', 'contacto@soldadurasbogota.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000017', 'prov_compactadores_sur', 'rentas@compactadoressur.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000018', 'prov_pintura_recubrimientos', 'equipos@pinturarecubrimientos.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000019', 'prov_topografia_precision', 'alquiler@topografiaprecision.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('b0000000-0000-0000-0000-000000000020', 'prov_corte_diamante', 'ventas@cortediamante.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
-- Clientes (20)
('c0000000-0000-0000-0000-000000000001', 'cliente_carlos_gomez', 'carlos.gomez@constructora.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000002', 'cliente_maria_rodriguez', 'maria.rodriguez@ingenieria.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000003', 'cliente_juan_perez', 'juan.perez@obrasciviles.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000004', 'cliente_ana_martinez', 'ana.martinez@remodelaciones.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000005', 'cliente_luis_herrera', 'luis.herrera@arquitectura.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000006', 'cliente_diana_castro', 'diana.castro@proyectos.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000007', 'cliente_andres_torres', 'andres.torres@infraestructura.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000008', 'cliente_camila_ruiz', 'camila.ruiz@urbanismo.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000009', 'cliente_felipe_morales', 'felipe.morales@edificaciones.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000010', 'cliente_patricia_vega', 'patricia.vega@reformas.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000011', 'cliente_javier_ramirez', 'javier.ramirez@constructora.org', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000012', 'cliente_laura_guerrero', 'laura.guerrero@diseno.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000013', 'cliente_oscar_navarro', 'oscar.navarro@montajes.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000014', 'cliente_valentina_rios', 'valentina.rios@ecovivienda.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000015', 'cliente_gustavo_silva', 'gustavo.silva@pavimentos.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000016', 'cliente_daniela_ortiz', 'daniela.ortiz@estructuras.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000017', 'cliente_sergio_mendoza', 'sergio.mendoza@vias.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000018', 'cliente_paula_flores', 'paula.flores@acabados.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000019', 'cliente_fernando_duque', 'fernando.duque@canalizaciones.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true),
('c0000000-0000-0000-0000-000000000020', 'cliente_catalina_ibanez', 'catalina.ibanez@consultoriaobra.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. TABLA: user_roles (42 registros: asignación normalizada)
-- ------------------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id) VALUES
-- Admins -> ROLE_ADMIN
('a0000000-0000-0000-0000-000000000001', 1),
('a0000000-0000-0000-0000-000000000002', 1),
-- Proveedores (20) -> ROLE_PROVEEDOR
('b0000000-0000-0000-0000-000000000001', 2),
('b0000000-0000-0000-0000-000000000002', 2),
('b0000000-0000-0000-0000-000000000003', 2),
('b0000000-0000-0000-0000-000000000004', 2),
('b0000000-0000-0000-0000-000000000005', 2),
('b0000000-0000-0000-0000-000000000006', 2),
('b0000000-0000-0000-0000-000000000007', 2),
('b0000000-0000-0000-0000-000000000008', 2),
('b0000000-0000-0000-0000-000000000009', 2),
('b0000000-0000-0000-0000-000000000010', 2),
('b0000000-0000-0000-0000-000000000011', 2),
('b0000000-0000-0000-0000-000000000012', 2),
('b0000000-0000-0000-0000-000000000013', 2),
('b0000000-0000-0000-0000-000000000014', 2),
('b0000000-0000-0000-0000-000000000015', 2),
('b0000000-0000-0000-0000-000000000016', 2),
('b0000000-0000-0000-0000-000000000017', 2),
('b0000000-0000-0000-0000-000000000018', 2),
('b0000000-0000-0000-0000-000000000019', 2),
('b0000000-0000-0000-0000-000000000020', 2),
-- Clientes (20) -> ROLE_CLIENTE
('c0000000-0000-0000-0000-000000000001', 3),
('c0000000-0000-0000-0000-000000000002', 3),
('c0000000-0000-0000-0000-000000000003', 3),
('c0000000-0000-0000-0000-000000000004', 3),
('c0000000-0000-0000-0000-000000000005', 3),
('c0000000-0000-0000-0000-000000000006', 3),
('c0000000-0000-0000-0000-000000000007', 3),
('c0000000-0000-0000-0000-000000000008', 3),
('c0000000-0000-0000-0000-000000000009', 3),
('c0000000-0000-0000-0000-000000000010', 3),
('c0000000-0000-0000-0000-000000000011', 3),
('c0000000-0000-0000-0000-000000000012', 3),
('c0000000-0000-0000-0000-000000000013', 3),
('c0000000-0000-0000-0000-000000000014', 3),
('c0000000-0000-0000-0000-000000000015', 3),
('c0000000-0000-0000-0000-000000000016', 3),
('c0000000-0000-0000-0000-000000000017', 3),
('c0000000-0000-0000-0000-000000000018', 3),
('c0000000-0000-0000-0000-000000000019', 3),
('c0000000-0000-0000-0000-000000000020', 3)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. TABLA: provider_profiles (20 registros)
-- ------------------------------------------------------------------------------
INSERT INTO provider_profiles (id, user_id, company_name, tax_id, phone, address, city, is_verified) VALUES
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Maquinaria y Equipos Bogotá S.A.S.', '900123456-1', '+57 310 111 2233', 'Av. Boyacá # 68-45', 'Bogotá D.C.', true),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Renta Equipos del Valle Medellín', '900234567-2', '+57 311 222 3344', 'Calle 10 # 43E-12', 'Medellín', true),
('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Rentas y Maquinaria Cali Ltda.', '900345678-3', '+57 312 333 4455', 'Carrera 1 # 24-80', 'Cali', true),
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Herramientas del Caribe S.A.', '900456789-4', '+57 313 444 5566', 'Vía 40 # 77-10', 'Barranquilla', true),
('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Andina de Construcción Equipos', '900567890-5', '+57 314 555 6677', 'Carrera 27 # 45-20', 'Bucaramanga', true),
('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'Ferrecentro Industrial S.A.S.', '900678901-6', '+57 315 666 7788', 'Av. 30 de Agosto # 28-15', 'Pereira', true),
('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000007', 'Grúas y Elevadores Andinos', '900789012-7', '+57 316 777 8899', 'Av. Santander # 54-12', 'Manizales', true),
('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000008', 'Equipos Concreto Total', '900890123-8', '+57 317 888 9900', 'Calle 50 # 14-30', 'Cartagena', true),
('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000009', 'Demoliciones y Alquileres Colombia', '900901234-9', '+57 318 999 0011', 'Calle 30 # 4-50', 'Santa Marta', true),
('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000010', 'Soluciones Viales del Huila', '901012345-0', '+57 319 000 1122', 'Carrera 7 # 12-40', 'Neiva', true),
('d0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', 'Agroindustrial y Construcción del Llano', '901123456-1', '+57 310 222 3344', 'Av. 40 # 25-10', 'Villavicencio', true),
('d0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000012', 'Potencia Generadores y Plantas', '901234567-2', '+57 311 333 4455', 'Av. Bolívar # 19-35', 'Armenia', true),
('d0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000013', 'Sierra y Taladro Profesionales', '901345678-3', '+57 312 444 5566', 'Carrera 5 # 38-12', 'Ibagué', true),
('d0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000014', 'Andamios Seguros de Colombia', '901456789-4', '+57 313 555 6677', 'Av. Las Américas # 42-18', 'Pasto', true),
('d0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000015', 'Hidrolavadoras Industriales Pro', '901567890-5', '+57 314 666 7788', 'Calle 15 # 10-25', 'Cúcuta', true),
('d0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000016', 'Soldaduras y Corte del Norte', '901678901-6', '+57 315 777 8899', 'Calle 60 # 18-90', 'Bucaramanga', true),
('d0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000017', 'Compactadores del Sur Ltda.', '901789012-7', '+57 316 888 9900', 'Carrera 9 # 8-30', 'Popayán', true),
('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000018', 'Equipos Pintura y Acabados S.A.S.', '901890123-8', '+57 317 999 0011', 'Calle 26 # 50-80', 'Bogotá D.C.', true),
('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000019', 'Topografía y Precisión Láser', '901901234-9', '+57 318 000 1122', 'Transversal 39 # 70-15', 'Medellín', true),
('d0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000020', 'Corte Diamante y Perforación S.A.', '902012345-0', '+57 319 111 2233', 'Av. 6N # 28N-40', 'Cali', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. TABLA: client_profiles (20 registros)
-- ------------------------------------------------------------------------------
INSERT INTO client_profiles (id, user_id, full_name, document_type, document_number, phone, address, city) VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Carlos Alberto Gómez Peña', 'CC', '1018234567', '+57 300 123 4567', 'Calle 134 # 19-45', 'Bogotá D.C.'),
('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'María Camila Rodríguez León', 'CC', '1020345678', '+57 301 234 5678', 'Carrera 43A # 1Sur-50', 'Medellín'),
('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Juan Esteban Pérez Soto', 'CC', '1032456789', '+57 302 345 6789', 'Av. Roosevelt # 36-22', 'Cali'),
('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'Ana Sofía Martínez Castro', 'CC', '1043567890', '+57 303 456 7890', 'Calle 82 # 51-30', 'Barranquilla'),
('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Luis Eduardo Herrera Gil', 'CC', '1054678901', '+57 304 567 8901', 'Carrera 33 # 48-15', 'Bucaramanga'),
('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'Diana Marcela Castro Ortiz', 'CC', '1065789012', '+57 305 678 9012', 'Calle 19 # 7-20', 'Pereira'),
('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', 'Andrés Felipe Torres Ruiz', 'CC', '1076890123', '+57 306 789 0123', 'Carrera 23 # 62-10', 'Manizales'),
('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'Camila Andrea Ruiz Parra', 'CC', '1087901234', '+57 307 890 1234', 'Bocagrande Cra 3 # 8-40', 'Cartagena'),
('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'Felipe Morales Jaramillo', 'CC', '1098012345', '+57 308 901 2345', 'Calle 22 # 15-80', 'Santa Marta'),
('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'Patricia Elena Vega Silva', 'CC', '1109123456', '+57 309 012 3456', 'Carrera 5 # 21-40', 'Neiva'),
('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', 'Javier Alejandro Ramírez Cruz', 'CC', '1120234567', '+57 310 123 9876', 'Calle 40 # 32-15', 'Villavicencio'),
('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'Laura Cristina Guerrero Rivas', 'CC', '1131345678', '+57 311 234 8765', 'Carrera 14 # 9-50', 'Armenia'),
('e0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000013', 'Óscar Iván Navarro Salazar', 'CC', '1142456789', '+57 312 345 7654', 'Calle 60 # 6A-30', 'Ibagué'),
('e0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000014', 'Valentina Ríos Moncada', 'CC', '1153567890', '+57 313 456 6543', 'Calle 18 # 25-14', 'Pasto'),
('e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000015', 'Gustavo Adolfo Silva Pardo', 'CC', '1164678901', '+57 314 567 5432', 'Av. 0 # 11-40', 'Cúcuta'),
('e0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000016', 'Daniela Paola Ortiz Blanco', 'CC', '1175789012', '+57 315 678 4321', 'Carrera 15 # 34-20', 'Bucaramanga'),
('e0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000017', 'Sergio David Mendoza Duque', 'CC', '1186890123', '+57 316 789 3210', 'Calle 5 # 4-60', 'Popayán'),
('e0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000018', 'Paula Andrea Flores Cárdenas', 'CC', '1197901234', '+57 317 890 2109', 'Calle 100 # 15-20', 'Bogotá D.C.'),
('e0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000019', 'Fernando Alonso Duque Giraldo', 'CC', '1208012345', '+57 318 901 1098', 'Circular 4 # 73-10', 'Medellín'),
('e0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000020', 'Catalina Sofía Ibáñez Varela', 'CC', '1219123456', '+57 319 012 0987', 'Av. 4N # 12N-55', 'Cali')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. TABLA: categories (20 registros)
-- ------------------------------------------------------------------------------
INSERT INTO categories (id, name, description) VALUES
('f0000000-0000-0000-0000-000000000001', 'Demolición y Perforación', 'Martillos demoledores, rotomartillos y taladros de impacto'),
('f0000000-0000-0000-0000-000000000002', 'Hormigón y Concreto', 'Mezcladoras trompo, vibradores de aguja y reglas vibratorias'),
('f0000000-0000-0000-0000-000000000003', 'Elevación y Andamiaje', 'Andamios certificados, torres de trabajo y plataformas de tijera'),
('f0000000-0000-0000-0000-000000000004', 'Generación de Energía', 'Plantas eléctricas diésel e inversores a gasolina'),
('f0000000-0000-0000-0000-000000000005', 'Compactación de Suelos', 'Ranas compactadoras tipo canguro y rodillos vibratorios manuales'),
('f0000000-0000-0000-0000-000000000006', 'Corte y Abrasivos', 'Cortadoras de pavimento, amoladoras industriales y sierras de banco'),
('f0000000-0000-0000-0000-000000000007', 'Bombeo y Drenaje', 'Motobombas de caudal, bombas sumergibles de lodo'),
('f0000000-0000-0000-0000-000000000008', 'Soldadura y Unión', 'Soldadores inverter, microalambre MIG y corte plasma'),
('f0000000-0000-0000-0000-000000000009', 'Pintura y Recubrimientos', 'Equipos airless profesionales y compresores de pintura'),
('f0000000-0000-0000-0000-000000000010', 'Topografía y Medición', 'Estaciones totales, niveles ópticos y niveles láser giratorios'),
('f0000000-0000-0000-0000-000000000011', 'Limpieza y Desinfección', 'Hidrolavadoras industriales de alta presión y aspiradoras de polvo/agua'),
('f0000000-0000-0000-0000-000000000012', 'Fijación y Clavado', 'Pistolas de fijación a pólvora y compresores con clavadoras neumáticas'),
('f0000000-0000-0000-0000-000000000013', 'Iluminación Temporal', 'Torres de iluminación diésel y reflectores LED para trabajo nocturno'),
('f0000000-0000-0000-0000-000000000014', 'Ventilación y Climatización', 'Extractores de aire para túneles y calentadores industriales'),
('f0000000-0000-0000-0000-000000000015', 'Herramienta Inalámbrica', 'Combos de herramientas a batería para montaje ligero'),
('f0000000-0000-0000-0000-000000000016', 'Jardinería y Paisajismo', 'Guadañadoras profesionales, motosierras y ahoyadoras'),
('f0000000-0000-0000-0000-000000000017', 'Carpintería de Obra', 'Cepillos eléctricos, ruteadoras y sierras circulares'),
('f0000000-0000-0000-0000-000000000018', 'Plomería y Destape', 'Sondas eléctricas desatascadoras y termofusoras para tubería'),
('f0000000-0000-0000-0000-000000000019', 'Carga y Transporte Manual', 'Carretillas motorizadas y transpaletas hidráulicas de obra'),
('f0000000-0000-0000-0000-000000000020', 'Seguridad y Rescate', 'Trípodes de espacio confinado y líneas de vida retractiles')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. TABLA: tools (25 registros)
-- ------------------------------------------------------------------------------
INSERT INTO tools (id, provider_id, category_id, name, brand, model, serial_number, description, daily_price, replacement_value, status) VALUES
('11111111-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Martillo Demoledor Hexagonal 30kg', 'Bosch', 'GSH 27 VC', 'BSH-2026-001', 'Demoledor eléctrico de 62 Joules para pavimentos', 85000.00, 4800000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Rotomartillo SDS Max 1500W', 'DeWalt', 'D25773K', 'DWT-2026-002', 'Rotomartillo combinado para perforación pesada', 45000.00, 2600000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'Mezcladora de Concreto 1.5 Bultos', 'Cipsa', 'Maxi 10', 'CIP-2026-003', 'Trompo mezclador con motor Honda GX270 9HP', 55000.00, 3900000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'Vibrador de Concreto a Gasolina 5.5HP', 'Wacker Neuson', 'M2500', 'WCK-2026-004', 'Aguja de 38mm x 4m para asentamiento de concreto', 32000.00, 1800000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'Cuerpo de Andamio Multidireccional Certificado', 'Layher', 'Allround 2.0', 'LAY-2026-005', 'Módulo de andamio con plataformas antideslizantes', 25000.00, 1200000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'Generador Eléctrico Diésel Insonorizado 10kVA', 'Caterpillar', 'DE9.5E3', 'CAT-2026-006', 'Planta eléctrica trifásica 220V/110V para obra', 120000.00, 11500000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'Apisonador Canguro 4HP', 'Mikasa', 'MTX-70HDR', 'MIK-2026-007', 'Compactadora tipo rana para zanjas y suelos cohesivos', 60000.00, 4200000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'Placa Compactadora Unidireccional 15kN', 'Wacker Neuson', 'BPU 2540', 'WCK-2026-008', 'Compactador de adoquines y asfalto en frío', 50000.00, 3600000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000006', 'Cortadora de Pavimento y Concreto 14"', 'Husqvarna', 'FS 400 LV', 'HSQ-2026-009', 'Cortadora autopropulsada con disco diamantado', 75000.00, 5300000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000007', 'Motobomba Autocebante para Lodos 3"', 'Honda', 'WT30XK4', 'HND-2026-010', 'Bomba para evacuación de aguas sucias y zanjas', 48000.00, 3100000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000008', 'Soldador Inverter Multiproceso 250A', 'Lincoln Electric', 'Power MIG 210', 'LNC-2026-011', 'Soldador electrodo revestido y microalambre', 40000.00, 2900000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000009', 'Equipo Airless Profesional para Pintura', 'Graco', 'Ultra Max II 490', 'GRC-2026-012', 'Pulverizador de pintura arquitectónica 3300 psi', 70000.00, 4900000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000010', 'Nivel Láser Giratorio Autonivelante 360°', 'Leica Geosystems', 'Roteo 35G', 'LCA-2026-013', 'Láser verde de alta visibilidad para nivelación de interiores', 35000.00, 2200000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000011', 'Hidrolavadora Industrial Agua Fría 3000 PSI', 'Kärcher', 'HD 7/16-4 Cage', 'KRC-2026-014', 'Lavadora de alta presión con chasis tubular', 42000.00, 3400000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000012', 'Pistola de Fijación Directa a Pólvora', 'Hilti', 'DX 460', 'HLT-2026-015', 'Herramienta de clavado sobre concreto y acero', 30000.00, 1950000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000013', 'Torre de Iluminación Portátil 4x350W LED', 'Generac Mobile', 'MLT4060', 'GNR-2026-016', 'Torre telescópica con mástil de 9 metros', 95000.00, 8900000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000014', 'Extractor de Aire y Polvo 12"', 'Ramfan', 'UB20', 'RMF-2026-017', 'Ventilador soplador para espacios confinados', 28000.00, 1600000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000015', 'Combo Inalámbrico Taladro + Llave de Impacto', 'Makita', 'DLX2180TX', 'MKT-2026-018', 'Kit 18V LXT con 2 baterías de 5.0Ah y cargador rápido', 35000.00, 1750000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000016', 'Ahoyadora a Gasolina 52cc con Broca 200mm', 'Stihl', 'BT 131', 'STH-2026-019', 'Perforadora de tierra para postes y cimientos', 40000.00, 2400000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000017', 'Sierra Circular de Banco para Madera 10"', 'DeWalt', 'DWE7491RS', 'DWT-2026-020', 'Sierra de mesa con soporte rodante para cortes precisos', 38000.00, 2300000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000018', 'Termofusora Digital para Tubería 20-63mm', 'Rothenberger', 'Roweld P63', 'RTH-2026-021', 'Equipo de soldadura por termofusión de PPR y PE', 22000.00, 1100000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000019', 'Transpaleta Hidráulica Manual 2.5 Toneladas', 'Yale', 'HP25', 'YLE-2026-022', 'Estibadora para carga en patios de almacenamiento', 20000.00, 1350000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000020', 'Trípode de Rescate y Espacio Confinado', '3M DBI-SALA', 'Salalift II', '3M-2026-023', 'Trípode con cabrestante y sistema anticaídas', 50000.00, 3800000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000024', 'd0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'Plataforma Elevadora de Tijera Eléctrica 8m', 'Genie', 'GS-1930', 'GNE-2026-024', 'Plataforma para trabajos en altura en bodegas', 160000.00, 18500000.00, 'AVAILABLE'),
('11111111-0000-0000-0000-000000000025', 'd0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000006', 'Allanadora de Concreto 36" (Helicóptero)', 'Multiquip Whiteman', 'J36H90', 'MQ-2026-025', 'Fratasadora mecánica para acabado liso de losas', 70000.00, 5600000.00, 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. TABLA: tool_images (25 registros)
-- ------------------------------------------------------------------------------
INSERT INTO tool_images (id, tool_id, image_url, is_primary) VALUES
('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'https://images.rentaequipos.com/tools/bosch-gsh27vc-front.webp', true),
('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'https://images.rentaequipos.com/tools/dewalt-d25773k-front.webp', true),
('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 'https://images.rentaequipos.com/tools/cipsa-maxi10-front.webp', true),
('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004', 'https://images.rentaequipos.com/tools/wacker-m2500-front.webp', true),
('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000005', 'https://images.rentaequipos.com/tools/layher-allround-front.webp', true),
('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000006', 'https://images.rentaequipos.com/tools/cat-de95e3-front.webp', true),
('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000007', 'https://images.rentaequipos.com/tools/mikasa-mtx70-front.webp', true),
('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000008', 'https://images.rentaequipos.com/tools/wacker-bpu2540-front.webp', true),
('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000009', 'https://images.rentaequipos.com/tools/husqvarna-fs400-front.webp', true),
('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000010', 'https://images.rentaequipos.com/tools/honda-wt30x-front.webp', true),
('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000011', 'https://images.rentaequipos.com/tools/lincoln-mig210-front.webp', true),
('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000012', 'https://images.rentaequipos.com/tools/graco-ultramax490-front.webp', true),
('22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000013', 'https://images.rentaequipos.com/tools/leica-roteo35g-front.webp', true),
('22222222-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000014', 'https://images.rentaequipos.com/tools/karcher-hd716-front.webp', true),
('22222222-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000015', 'https://images.rentaequipos.com/tools/hilti-dx460-front.webp', true),
('22222222-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000016', 'https://images.rentaequipos.com/tools/generac-mlt4060-front.webp', true),
('22222222-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000017', 'https://images.rentaequipos.com/tools/ramfan-ub20-front.webp', true),
('22222222-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000018', 'https://images.rentaequipos.com/tools/makita-dlx2180-front.webp', true),
('22222222-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000019', 'https://images.rentaequipos.com/tools/stihl-bt131-front.webp', true),
('22222222-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000020', 'https://images.rentaequipos.com/tools/dewalt-dwe7491-front.webp', true),
('22222222-0000-0000-0000-000000000021', '11111111-0000-0000-0000-000000000021', 'https://images.rentaequipos.com/tools/rothenberger-roweld-front.webp', true),
('22222222-0000-0000-0000-000000000022', '11111111-0000-0000-0000-000000000022', 'https://images.rentaequipos.com/tools/yale-hp25-front.webp', true),
('22222222-0000-0000-0000-000000000023', '11111111-0000-0000-0000-000000000023', 'https://images.rentaequipos.com/tools/3m-salalift-front.webp', true),
('22222222-0000-0000-0000-000000000024', '11111111-0000-0000-0000-000000000024', 'https://images.rentaequipos.com/tools/genie-gs1930-front.webp', true),
('22222222-0000-0000-0000-000000000025', '11111111-0000-0000-0000-000000000025', 'https://images.rentaequipos.com/tools/whiteman-j36h90-front.webp', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. TABLA: tool_specifications (25 registros)
-- ------------------------------------------------------------------------------
INSERT INTO tool_specifications (id, tool_id, spec_name, spec_value) VALUES
('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Energía de Impacto', '62 Joules'),
('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Peso Operativo', '29.5 kg'),
('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Potencia Nominal', '1500 Watts'),
('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 'Capacidad de Mezcla', '280 Litros'),
('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003', 'Combustible', 'Gasolina Corriente'),
('33333333-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000004', 'Longitud de Manguera', '4.0 metros'),
('33333333-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000005', 'Carga Máxima Admisible', '200 kg/m²'),
('33333333-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000006', 'Potencia Eléctrica', '9.5 kVA Trifásico'),
('33333333-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000007', 'Fuerza de Impacto', '14.9 kN'),
('33333333-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000008', 'Fuerza Centrífuga', '25 kN'),
('33333333-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000009', 'Profundidad de Corte', '162 mm'),
('33333333-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000010', 'Caudal Máximo', '1210 L/min'),
('33333333-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000011', 'Rango de Amperaje', '20A - 210A'),
('33333333-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000012', 'Presión Máxima', '3300 PSI'),
('33333333-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000013', 'Alcance de Trabajo', '500 metros de diámetro'),
('33333333-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000014', 'Caudal de Agua', '700 L/h'),
('33333333-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000015', 'Tipo de Fulminante', 'Calibre .27 en tiras'),
('33333333-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000016', 'Luminosidad Total', '150.000 Lúmenes'),
('33333333-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000017', 'Flujo de Aire', '1392 CFM'),
('33333333-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000018', 'Baterías Incluidas', '2x 18V 5.0Ah Li-Ion'),
('33333333-0000-0000-0000-000000000021', '11111111-0000-0000-0000-000000000019', 'Cilindrada', '36.3 cm³ 4-MIX'),
('33333333-0000-0000-0000-000000000022', '11111111-0000-0000-0000-000000000020', 'Velocidad de Giro', '4800 RPM'),
('33333333-0000-0000-0000-000000000023', '11111111-0000-0000-0000-000000000021', 'Temperatura Regulable', '180°C - 280°C'),
('33333333-0000-0000-0000-000000000024', '11111111-0000-0000-0000-000000000022', 'Capacidad Nominal', '2500 kg'),
('33333333-0000-0000-0000-000000000025', '11111111-0000-0000-0000-000000000024', 'Altura de Trabajo', '7.79 metros')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 10. TABLA: rentals (22 registros)
-- ------------------------------------------------------------------------------
INSERT INTO rentals (id, rental_code, client_id, start_date, end_date, total_days, subtotal, deposit, total_amount, status) VALUES
('44444444-0000-0000-0000-000000000001', 'REN-2026-001', 'e0000000-0000-0000-0000-000000000020', '2026-10-01', '2026-10-05', 4, 340000.00, 100000.00, 440000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000002', 'REN-2026-002', 'e0000000-0000-0000-0000-000000000002', '2026-10-02', '2026-10-07', 5, 275000.00, 150000.00, 425000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000003', 'REN-2026-003', 'e0000000-0000-0000-0000-000000000003', '2026-10-03', '2026-10-06', 3, 360000.00, 200000.00, 560000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000004', 'REN-2026-004', 'e0000000-0000-0000-0000-000000000004', '2026-10-04', '2026-10-10', 6, 360000.00, 100000.00, 460000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000005', 'REN-2026-005', 'e0000000-0000-0000-0000-000000000005', '2026-10-05', '2026-10-08', 3, 225000.00, 120000.00, 345000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000006', 'REN-2026-006', 'e0000000-0000-0000-0000-000000000006', '2026-10-06', '2026-10-09', 3, 144000.00, 80000.00, 224000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000007', 'REN-2026-007', 'e0000000-0000-0000-0000-000000000007', '2026-10-07', '2026-10-12', 5, 200000.00, 100000.00, 300000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000008', 'REN-2026-008', 'e0000000-0000-0000-0000-000000000008', '2026-10-08', '2026-10-11', 3, 210000.00, 150000.00, 360000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000009', 'REN-2026-009', 'e0000000-0000-0000-0000-000000000009', '2026-10-09', '2026-10-13', 4, 140000.00, 70000.00, 210000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000010', 'REN-2026-010', 'e0000000-0000-0000-0000-000000000010', '2026-10-10', '2026-10-14', 4, 168000.00, 100000.00, 268000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000011', 'REN-2026-011', 'e0000000-0000-0000-0000-000000000011', '2026-10-11', '2026-10-15', 4, 120000.00, 80000.00, 200000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000012', 'REN-2026-012', 'e0000000-0000-0000-0000-000000000012', '2026-10-12', '2026-10-18', 6, 570000.00, 300000.00, 870000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000013', 'REN-2026-013', 'e0000000-0000-0000-0000-000000000013', '2026-10-13', '2026-10-16', 3, 84000.00, 50000.00, 134000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000014', 'REN-2026-014', 'e0000000-0000-0000-0000-000000000014', '2026-10-14', '2026-10-19', 5, 175000.00, 90000.00, 265000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000015', 'REN-2026-015', 'e0000000-0000-0000-0000-000000000015', '2026-10-15', '2026-10-18', 3, 120000.00, 70000.00, 190000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000016', 'REN-2026-016', 'e0000000-0000-0000-0000-000000000016', '2026-10-16', '2026-10-20', 4, 152000.00, 80000.00, 232000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000017', 'REN-2026-017', 'e0000000-0000-0000-0000-000000000017', '2026-10-17', '2026-10-21', 4, 88000.00, 50000.00, 138000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000018', 'REN-2026-018', 'e0000000-0000-0000-0000-000000000018', '2026-10-18', '2026-10-22', 4, 80000.00, 40000.00, 120000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000019', 'REN-2026-019', 'e0000000-0000-0000-0000-000000000019', '2026-10-19', '2026-10-23', 4, 200000.00, 100000.00, 300000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000020', 'REN-2026-020', 'e0000000-0000-0000-0000-000000000020', '2026-10-20', '2026-10-25', 5, 800000.00, 400000.00, 1200000.00, 'COMPLETED'),
('44444444-0000-0000-0000-000000000021', 'REN-2026-021', 'e0000000-0000-0000-0000-000000000020', '2026-10-26', '2026-10-30', 4, 280000.00, 150000.00, 430000.00, 'CONFIRMED'),
('44444444-0000-0000-0000-000000000022', 'REN-2026-022', 'e0000000-0000-0000-0000-000000000002', '2026-10-27', '2026-11-02', 6, 270000.00, 120000.00, 390000.00, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 11. TABLA: rental_items (25 registros)
-- ------------------------------------------------------------------------------
INSERT INTO rental_items (id, rental_id, tool_id, daily_price, total_price, status) VALUES
('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 85000.00, 340000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', 55000.00, 275000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000006', 120000.00, 360000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000007', 60000.00, 360000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000009', 75000.00, 225000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000010', 48000.00, 144000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000007', '44444444-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000011', 40000.00, 200000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000008', '44444444-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000012', 70000.00, 210000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000009', '44444444-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000013', 35000.00, 140000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000010', '44444444-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000014', 42000.00, 168000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000011', '44444444-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000015', 30000.00, 120000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000012', '44444444-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000016', 95000.00, 570000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000013', '44444444-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000017', 28000.00, 84000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000014', '44444444-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000018', 35000.00, 175000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000015', '44444444-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000019', 40000.00, 120000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000016', '44444444-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000020', 38000.00, 152000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000017', '44444444-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000021', 22000.00, 88000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000018', '44444444-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000022', 20000.00, 80000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000019', '44444444-0000-0000-0000-000000000019', '11111111-0000-0000-0000-000000000023', 50000.00, 200000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000020', '44444444-0000-0000-0000-000000000020', '11111111-0000-0000-0000-000000000024', 160000.00, 800000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000021', '44444444-0000-0000-0000-000000000021', '11111111-0000-0000-0000-000000000025', 70000.00, 280000.00, 'RESERVED'),
('55555555-0000-0000-0000-000000000022', '44444444-0000-0000-0000-000000000022', '11111111-0000-0000-0000-000000000002', 45000.00, 270000.00, 'RESERVED'),
('55555555-0000-0000-0000-000000000023', '44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 25000.00, 100000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000024', '44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', 32000.00, 160000.00, 'RETURNED'),
('55555555-0000-0000-0000-000000000025', '44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000008', 50000.00, 150000.00, 'RETURNED')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 12. TABLA: rental_inspections (22 registros)
-- ------------------------------------------------------------------------------
INSERT INTO rental_inspections (id, rental_id, inspection_type, inspection_date, inspector_notes, inspector_user_id, status) VALUES
('66666666-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'RETURN', '2026-10-05 16:30:00', 'Equipo devuelto con cincel desgastado', 'a0000000-0000-0000-0000-000000000002', 'WITH_OBSERVATIONS'),
('66666666-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002', 'RETURN', '2026-10-07 15:00:00', 'Mezcladora limpia y funcionando perfectamente', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000003', 'RETURN', '2026-10-06 17:00:00', 'Generador recibido con niveles correctos de aceite', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000004', 'RETURN', '2026-10-10 11:30:00', 'Canguro apisonador con filtro de aire saturado', 'a0000000-0000-0000-0000-000000000002', 'WITH_OBSERVATIONS'),
('66666666-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000005', 'RETURN', '2026-10-08 14:00:00', 'Cortadora con disco diamantado fisurado', 'a0000000-0000-0000-0000-000000000002', 'DAMAGED'),
('66666666-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000006', 'RETURN', '2026-10-09 10:00:00', 'Motobomba en perfecto estado de arranque', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000007', '44444444-0000-0000-0000-000000000007', 'RETURN', '2026-10-12 16:00:00', 'Soldador probado en banco de prueba OK', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000008', '44444444-0000-0000-0000-000000000008', 'RETURN', '2026-10-11 12:00:00', 'Manguera de alta presión con raspaduras superficiales', 'a0000000-0000-0000-0000-000000000002', 'WITH_OBSERVATIONS'),
('66666666-0000-0000-0000-000000000009', '44444444-0000-0000-0000-000000000009', 'RETURN', '2026-10-13 15:30:00', 'Nivel láser con trípode y diana completa', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000010', '44444444-0000-0000-0000-000000000010', 'RETURN', '2026-10-14 11:00:00', 'Hidrolavadora devuelta con boquilla taponada', 'a0000000-0000-0000-0000-000000000002', 'WITH_OBSERVATIONS'),
('66666666-0000-0000-0000-000000000011', '44444444-0000-0000-0000-000000000011', 'RETURN', '2026-10-15 14:00:00', 'Pistola de clavado con percutor en excelente estado', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000012', '44444444-0000-0000-0000-000000000012', 'RETURN', '2026-10-18 16:30:00', 'Torre de luz devuelta limpia y sin golpes', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000013', '44444444-0000-0000-0000-000000000013', 'RETURN', '2026-10-16 10:30:00', 'Extractor probado con ducto de 7m completo', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000014', '44444444-0000-0000-0000-000000000014', 'RETURN', '2026-10-19 12:00:00', 'Una batería presenta carcasa plástica agrietada', 'a0000000-0000-0000-0000-000000000002', 'DAMAGED'),
('66666666-0000-0000-0000-000000000015', '44444444-0000-0000-0000-000000000015', 'RETURN', '2026-10-18 17:00:00', 'Ahoyadora con cuchilla de broca mellada', 'a0000000-0000-0000-0000-000000000002', 'WITH_OBSERVATIONS'),
('66666666-0000-0000-0000-000000000016', '44444444-0000-0000-0000-000000000016', 'RETURN', '2026-10-20 15:00:00', 'Sierra de mesa entregada sin novedades', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000017', '44444444-0000-0000-0000-000000000017', 'RETURN', '2026-10-21 16:30:00', 'Termofusora con matriz de 32mm desgastada', 'a0000000-0000-0000-0000-000000000002', 'WITH_OBSERVATIONS'),
('66666666-0000-0000-0000-000000000018', '44444444-0000-0000-0000-000000000018', 'RETURN', '2026-10-22 11:30:00', 'Estibadora hidráulica con descenso suave OK', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000019', '44444444-0000-0000-0000-000000000019', 'RETURN', '2026-10-23 14:00:00', 'Trípode de rescate con cable de acero perfecto', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000020', '44444444-0000-0000-0000-000000000020', 'RETURN', '2026-10-25 17:00:00', 'Plataforma de tijera con horómetro verificado', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000021', '44444444-0000-0000-0000-000000000021', 'DELIVERY', '2026-10-26 09:00:00', 'Entrega en obra al contratista', 'a0000000-0000-0000-0000-000000000002', 'PASSED'),
('66666666-0000-0000-0000-000000000022', '44444444-0000-0000-0000-000000000022', 'DELIVERY', '2026-10-27 10:00:00', 'Inspección de pre-entrega programada', 'a0000000-0000-0000-0000-000000000002', 'PASSED')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 13. TABLA: damage_reports (20 registros)
-- ------------------------------------------------------------------------------
INSERT INTO damage_reports (id, inspection_id, tool_id, severity, description, repair_cost, is_charged_to_client) VALUES
('77777777-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'MINOR', 'Cincel plano con filo quebrado por uso en roca dura', 35000.00, true),
('77777777-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000007', 'MINOR', 'Filtro de aire impregnado de lodo seco', 25000.00, true),
('77777777-0000-0000-0000-000000000003', '66666666-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000009', 'MODERATE', 'Disco diamantado de 14 pulgadas agrietado por corte sin refrigeración', 180000.00, true),
('77777777-0000-0000-0000-000000000004', '66666666-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000012', 'MINOR', 'Manguera de pulverización con rozamiento lateral', 40000.00, false),
('77777777-0000-0000-0000-000000000005', '66666666-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000014', 'MINOR', 'Boquilla rotativa obstruida con sedimento calcáreo', 30000.00, true),
('77777777-0000-0000-0000-000000000006', '66666666-0000-0000-0000-000000000014', '11111111-0000-0000-0000-000000000018', 'MODERATE', 'Batería 18V con carcasa plástica rota por caída', 120000.00, true),
('77777777-0000-0000-0000-000000000007', '66666666-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000019', 'MINOR', 'Cuchilla de la broca perforadora con deformación', 45000.00, true),
('77777777-0000-0000-0000-000000000008', '66666666-0000-0000-0000-000000000017', '11111111-0000-0000-0000-000000000021', 'MINOR', 'Revestimiento de teflón de matriz desgastado', 38000.00, true),
('77777777-0000-0000-0000-000000000009', '66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'MINOR', 'Pasador de bloqueo de andamio doblado', 15000.00, false),
('77777777-0000-0000-0000-000000000010', '66666666-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', 'MINOR', 'Cable del acelerador del vibrador desajustado', 20000.00, false),
('77777777-0000-0000-0000-000000000011', '66666666-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000008', 'MINOR', 'Banda de transmisión de placa compactadora floja', 35000.00, false),
('77777777-0000-0000-0000-000000000012', '66666666-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000009', 'SEVERE', 'Cárter de cortadora golpeado en bordillo', 320000.00, true),
('77777777-0000-0000-0000-000000000013', '66666666-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000010', 'MINOR', 'Abrazadera de succión sulfatada', 12000.00, false),
('77777777-0000-0000-0000-000000000014', '66666666-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000011', 'MINOR', 'Pinza de masa con resorte debilitado', 18000.00, true),
('77777777-0000-0000-0000-000000000015', '66666666-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000013', 'MINOR', 'Regleta graduada de mira con rayones', 22000.00, true),
('77777777-0000-0000-0000-000000000016', '66666666-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000015', 'MINOR', 'Resorte recuperador del pistón fatigado', 28000.00, false),
('77777777-0000-0000-0000-000000000017', '66666666-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000016', 'MINOR', 'Lente protector de faro LED con salpicadura de pintura', 15000.00, true),
('77777777-0000-0000-0000-000000000018', '66666666-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000017', 'MINOR', 'Ducto flexible con rotura de 5cm', 25000.00, true),
('77777777-0000-0000-0000-000000000019', '66666666-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000020', 'MINOR', 'Protector retráctil de hoja con virutas atascadas', 20000.00, false),
('77777777-0000-0000-0000-000000000020', '66666666-0000-0000-0000-000000000018', '11111111-0000-0000-0000-000000000022', 'MINOR', 'Rueda direccional de poliuretano mellada', 42000.00, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 14. TABLA: payments (22 registros)
-- ------------------------------------------------------------------------------
INSERT INTO payments (id, payment_reference, rental_id, amount, payment_method, payment_status, transaction_date) VALUES
('88888888-0000-0000-0000-000000000001', 'PAY-2026-001', '44444444-0000-0000-0000-000000000001', 440000.00, 'CREDIT_CARD', 'COMPLETED', '2026-10-01 08:30:00'),
('88888888-0000-0000-0000-000000000002', 'PAY-2026-002', '44444444-0000-0000-0000-000000000002', 425000.00, 'BANK_TRANSFER', 'COMPLETED', '2026-10-02 09:15:00'),
('88888888-0000-0000-0000-000000000003', 'PAY-2026-003', '44444444-0000-0000-0000-000000000003', 560000.00, 'DEBIT_CARD', 'COMPLETED', '2026-10-03 10:45:00'),
('88888888-0000-0000-0000-000000000004', 'PAY-2026-004', '44444444-0000-0000-0000-000000000004', 460000.00, 'CREDIT_CARD', 'COMPLETED', '2026-10-04 11:20:00'),
('88888888-0000-0000-0000-000000000005', 'PAY-2026-005', '44444444-0000-0000-0000-000000000005', 345000.00, 'BANK_TRANSFER', 'COMPLETED', '2026-10-05 14:10:00'),
('88888888-0000-0000-0000-000000000006', 'PAY-2026-006', '44444444-0000-0000-0000-000000000006', 224000.00, 'DEBIT_CARD', 'COMPLETED', '2026-10-06 08:50:00'),
('88888888-0000-0000-0000-000000000007', 'PAY-2026-007', '44444444-0000-0000-0000-000000000007', 300000.00, 'CREDIT_CARD', 'COMPLETED', '2026-10-07 16:35:00'),
('88888888-0000-0000-0000-000000000008', 'PAY-2026-008', '44444444-0000-0000-0000-000000000008', 360000.00, 'BANK_TRANSFER', 'COMPLETED', '2026-10-08 09:00:00'),
('88888888-0000-0000-0000-000000000009', 'PAY-2026-009', '44444444-0000-0000-0000-000000000009', 210000.00, 'DEBIT_CARD', 'COMPLETED', '2026-10-09 13:25:00'),
('88888888-0000-0000-0000-000000000010', 'PAY-2026-010', '44444444-0000-0000-0000-000000000010', 268000.00, 'CREDIT_CARD', 'COMPLETED', '2026-10-10 10:15:00'),
('88888888-0000-0000-0000-000000000011', 'PAY-2026-011', '44444444-0000-0000-0000-000000000011', 200000.00, 'BANK_TRANSFER', 'COMPLETED', '2026-10-11 15:40:00'),
('88888888-0000-0000-0000-000000000012', 'PAY-2026-012', '44444444-0000-0000-0000-000000000012', 870000.00, 'CREDIT_CARD', 'COMPLETED', '2026-10-12 11:05:00'),
('88888888-0000-0000-0000-000000000013', 'PAY-2026-013', '44444444-0000-0000-0000-000000000013', 134000.00, 'DEBIT_CARD', 'COMPLETED', '2026-10-13 14:50:00'),
('88888888-0000-0000-0000-000000000014', 'PAY-2026-014', '44444444-0000-0000-0000-000000000014', 265000.00, 'BANK_TRANSFER', 'COMPLETED', '2026-10-14 08:45:00'),
('88888888-0000-0000-0000-000000000015', 'PAY-2026-015', '44444444-0000-0000-0000-000000000015', 190000.00, 'CREDIT_CARD', 'COMPLETED', '2026-10-15 16:10:00'),
('88888888-0000-0000-0000-000000000016', 'PAY-2026-016', '44444444-0000-0000-0000-000000000016', 232000.00, 'DEBIT_CARD', 'COMPLETED', '2026-10-16 09:30:00'),
('88888888-0000-0000-0000-000000000017', 'PAY-2026-017', '44444444-0000-0000-0000-000000000017', 138000.00, 'BANK_TRANSFER', 'COMPLETED', '2026-10-17 12:20:00'),
('88888888-0000-0000-0000-000000000018', 'PAY-2026-018', '44444444-0000-0000-0000-000000000018', 120000.00, 'CREDIT_CARD', 'COMPLETED', '2026-10-18 10:40:00'),
('88888888-0000-0000-0000-000000000019', 'PAY-2026-019', '44444444-0000-0000-0000-000000000019', 300000.00, 'DEBIT_CARD', 'COMPLETED', '2026-10-19 15:15:00'),
('88888888-0000-0000-0000-000000000020', 'PAY-2026-020', '44444444-0000-0000-0000-000000000020', 1200000.00, 'CREDIT_CARD', 'COMPLETED', '2026-10-20 17:00:00'),
('88888888-0000-0000-0000-000000000021', 'PAY-2026-021', '44444444-0000-0000-0000-000000000021', 430000.00, 'BANK_TRANSFER', 'COMPLETED', '2026-10-26 11:00:00'),
('88888888-0000-0000-0000-000000000022', 'PAY-2026-022', '44444444-0000-0000-0000-000000000022', 390000.00, 'CREDIT_CARD', 'PENDING', '2026-10-27 12:30:00')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 15. TABLA: invoices (20 registros con cálculo contable en 4FN)
-- ------------------------------------------------------------------------------
INSERT INTO invoices (id, invoice_number, rental_id, payment_id, issue_date, subtotal, tax_amount, total_billed, pdf_url) VALUES
('99999999-0000-0000-0000-000000000001', 'FAC-2026-001', '44444444-0000-0000-0000-000000000001', '88888888-0000-0000-0000-000000000001', '2026-10-01 08:35:00', 369747.90, 70252.10, 440000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-001.pdf'),
('99999999-0000-0000-0000-000000000002', 'FAC-2026-002', '44444444-0000-0000-0000-000000000002', '88888888-0000-0000-0000-000000000002', '2026-10-02 09:20:00', 357142.86, 67857.14, 425000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-002.pdf'),
('99999999-0000-0000-0000-000000000003', 'FAC-2026-003', '44444444-0000-0000-0000-000000000003', '88888888-0000-0000-0000-000000000003', '2026-10-03 10:50:00', 470588.24, 89411.76, 560000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-003.pdf'),
('99999999-0000-0000-0000-000000000004', 'FAC-2026-004', '44444444-0000-0000-0000-000000000004', '88888888-0000-0000-0000-000000000004', '2026-10-04 11:25:00', 386554.62, 73445.38, 460000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-004.pdf'),
('99999999-0000-0000-0000-000000000005', 'FAC-2026-005', '44444444-0000-0000-0000-000000000005', '88888888-0000-0000-0000-000000000005', '2026-10-05 14:15:00', 289915.97, 55084.03, 345000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-005.pdf'),
('99999999-0000-0000-0000-000000000006', 'FAC-2026-006', '44444444-0000-0000-0000-000000000006', '88888888-0000-0000-0000-000000000006', '2026-10-06 08:55:00', 188235.29, 35764.71, 224000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-006.pdf'),
('99999999-0000-0000-0000-000000000007', 'FAC-2026-007', '44444444-0000-0000-0000-000000000007', '88888888-0000-0000-0000-000000000007', '2026-10-07 16:40:00', 252100.84, 47899.16, 300000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-007.pdf'),
('99999999-0000-0000-0000-000000000008', 'FAC-2026-008', '44444444-0000-0000-0000-000000000008', '88888888-0000-0000-0000-000000000008', '2026-10-08 09:05:00', 302521.01, 57478.99, 360000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-008.pdf'),
('99999999-0000-0000-0000-000000000009', 'FAC-2026-009', '44444444-0000-0000-0000-000000000009', '88888888-0000-0000-0000-000000000009', '2026-10-09 13:30:00', 176470.59, 33529.41, 210000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-009.pdf'),
('99999999-0000-0000-0000-000000000010', 'FAC-2026-010', '44444444-0000-0000-0000-000000000010', '88888888-0000-0000-0000-000000000010', '2026-10-10 10:20:00', 225210.08, 42789.92, 268000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-010.pdf'),
('99999999-0000-0000-0000-000000000011', 'FAC-2026-011', '44444444-0000-0000-0000-000000000011', '88888888-0000-0000-0000-000000000011', '2026-10-11 15:45:00', 168067.23, 31932.77, 200000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-011.pdf'),
('99999999-0000-0000-0000-000000000012', 'FAC-2026-012', '44444444-0000-0000-0000-000000000012', '88888888-0000-0000-0000-000000000012', '2026-10-12 11:10:00', 731092.44, 138907.56, 870000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-012.pdf'),
('99999999-0000-0000-0000-000000000013', 'FAC-2026-013', '44444444-0000-0000-0000-000000000013', '88888888-0000-0000-0000-000000000013', '2026-10-13 14:55:00', 112605.04, 21394.96, 134000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-013.pdf'),
('99999999-0000-0000-0000-000000000014', 'FAC-2026-014', '44444444-0000-0000-0000-000000000014', '88888888-0000-0000-0000-000000000014', '2026-10-14 08:50:00', 222689.08, 42310.92, 265000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-014.pdf'),
('99999999-0000-0000-0000-000000000015', 'FAC-2026-015', '44444444-0000-0000-0000-000000000015', '88888888-0000-0000-0000-000000000015', '2026-10-15 16:15:00', 159663.87, 30336.13, 190000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-015.pdf'),
('99999999-0000-0000-0000-000000000016', 'FAC-2026-016', '44444444-0000-0000-0000-000000000016', '88888888-0000-0000-0000-000000000016', '2026-10-16 09:35:00', 194957.98, 37042.02, 232000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-016.pdf'),
('99999999-0000-0000-0000-000000000017', 'FAC-2026-017', '44444444-0000-0000-0000-000000000017', '88888888-0000-0000-0000-000000000017', '2026-10-17 12:25:00', 115966.39, 22033.61, 138000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-017.pdf'),
('99999999-0000-0000-0000-000000000018', 'FAC-2026-018', '44444444-0000-0000-0000-000000000018', '88888888-0000-0000-0000-000000000018', '2026-10-18 10:45:00', 100840.34, 19159.66, 120000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-018.pdf'),
('99999999-0000-0000-0000-000000000019', 'FAC-2026-019', '44444444-0000-0000-0000-000000000019', '88888888-0000-0000-0000-000000000019', '2026-10-19 15:20:00', 252100.84, 47899.16, 300000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-019.pdf'),
('99999999-0000-0000-0000-000000000020', 'FAC-2026-020', '44444444-0000-0000-0000-000000000020', '88888888-0000-0000-0000-000000000020', '2026-10-20 17:05:00', 1008403.36, 191596.64, 1200000.00, 'https://invoices.rentaequipos.com/pdf/FAC-2026-020.pdf')
ON CONFLICT (id) DO NOTHING;

