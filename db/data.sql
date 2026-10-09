-- ==============================================================================
-- DML: Datos Iniciales de Prueba (PostgreSQL 16)
-- Usuarios por defecto con contraseñas encriptadas en BCrypt ($2a$10$w... para 'Password123*')
-- ==============================================================================

-- Categorías
INSERT INTO categories (id, name, description) VALUES
('c1000000-0000-0000-0000-000000000001', 'Demolición y Perforación', 'Rotomartillos, demoledores y taladros industriales'),
('c1000000-0000-0000-0000-000000000002', 'Hormigón y Concreto', 'Mezcladoras, vibradores de concreto y allanadoras'),
('c1000000-0000-0000-0000-000000000003', 'Elevación y Andamios', 'Andamios tubulares, plataformas de tijera y polipastos'),
('c1000000-0000-0000-0000-000000000004', 'Generación y Energía', 'Generadores eléctricos diésel, gasolina y compresores')
ON CONFLICT (id) DO NOTHING;

-- Usuario Administrador Inicial (password: Admin123*)
INSERT INTO users (id, username, email, password, role, enabled) VALUES
('u1000000-0000-0000-0000-000000000001', 'admin', 'admin@rentaequipos.com', '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.d5xAzV6n4BHG6', 'ROLE_ADMIN', true)
ON CONFLICT (id) DO NOTHING;
