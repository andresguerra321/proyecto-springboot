-- ==============================================================================
-- DDL: ESQUEMA DE BASE DE DATOS RELACIONAL (POSTGRESQL 16)
-- PROYECTO: Plataforma de Renta de Herramientas y Equipos de Construcción
-- NORMALIZACIÓN: CUMPLE ESTRICTAMENTE CON LA CUARTA FORMA NORMAL (4FN)
-- ==============================================================================
-- Justificación de 4FN:
-- 1. 1FN: Todos los atributos son atómicos, sin listas separadas por comas ni grupos repetitivos.
-- 2. 2FN: Cumple 1FN y no existen dependencias parciales sobre claves candidatas compuestas.
-- 3. 3FN: Cumple 2FN y no existen dependencias transitivas entre atributos no clave.
-- 4. BCNF: Cada determinante es una superclave / clave candidata.
-- 5. 4FN: Se eliminan todas las dependencias multivaluadas (MVDs) no triviales:
--    - Las imágenes de herramientas se desacoplan en 'tool_images' (MVD: tool ->> image).
--    - Las especificaciones técnicas se desacoplan en 'tool_specifications' (MVD: tool ->> spec).
--    - Los roles se desacoplan de usuarios en 'user_roles' (MVD: user ->> role).
--    - Los ítems de alquiler se desacoplan de reservas en 'rental_items' (MVD: rental ->> tool).
--    - Los reportes de daños se desacoplan de inspecciones en 'damage_reports' (MVD: inspection ->> damage).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLA: roles
-- Catálogo de roles y permisos del sistema
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: users
-- Identidades y credenciales de acceso al sistema
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. TABLA: user_roles (4FN)
-- Asociación Muchos a Muchos entre Usuarios y Roles para evitar MVD
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- ------------------------------------------------------------------------------
-- 4. TABLA: provider_profiles
-- Perfil comercial de proveedores de maquinaria y equipos
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50) NOT NULL UNIQUE, -- NIT / RUT
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. TABLA: client_profiles
-- Perfil de clientes particulares y contratistas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    document_type VARCHAR(20) NOT NULL, -- CC, CE, PASAPORTE, NIT
    document_number VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. TABLA: categories
-- Categorías taxonómicas de herramientas y maquinaria
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. TABLA: tools
-- Catálogo de herramientas y equipos de construcción
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    description TEXT,
    daily_price NUMERIC(12, 2) NOT NULL CHECK (daily_price > 0),
    replacement_value NUMERIC(12, 2) NOT NULL CHECK (replacement_value > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RENTED, MAINTENANCE, RETIRED
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 8. TABLA: tool_images (4FN)
-- Desacoplamiento de múltiples imágenes por herramienta para prevenir MVD
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 9. TABLA: tool_specifications (4FN)
-- Desacoplamiento de especificaciones técnicas para prevenir MVD con imágenes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    spec_name VARCHAR(100) NOT NULL,
    spec_value VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 10. TABLA: rentals
-- Encabezado de la transacción de alquiler / reserva
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_code VARCHAR(30) NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL CHECK (total_days > 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    deposit NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (deposit >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rental_dates CHECK (end_date >= start_date)
);

-- ------------------------------------------------------------------------------
-- 11. TABLA: rental_items (4FN)
-- Detalle de herramientas involucradas en la reserva para permitir alquiler múltiple
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    daily_price NUMERIC(12, 2) NOT NULL CHECK (daily_price > 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'RESERVED', -- RESERVED, DELIVERED, RETURNED, DAMAGED
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 12. TABLA: rental_inspections
-- Control de inspecciones físicas en entrega y devolución
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    inspection_type VARCHAR(20) NOT NULL, -- DELIVERY, RETURN
    inspection_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inspector_notes TEXT,
    inspector_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PASSED', -- PASSED, WITH_OBSERVATIONS, DAMAGED
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 13. TABLA: damage_reports (4FN)
-- Desacoplamiento de reportes de daños físicos e incidencias económicas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS damage_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES rental_inspections(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    severity VARCHAR(20) NOT NULL, -- MINOR, MODERATE, SEVERE, TOTAL_LOSS
    description TEXT NOT NULL,
    repair_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (repair_cost >= 0),
    is_charged_to_client BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 14. TABLA: payments
-- Registro de transacciones monetarias y pasarelas de pago
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_reference VARCHAR(60) NOT NULL UNIQUE,
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(40) NOT NULL, -- CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, CASH
    payment_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- PENDING, COMPLETED, FAILED, REFUNDED
    transaction_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 15. TABLA: invoices
-- Documentos contables y facturas electrónicas emitidas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    rental_id UUID NOT NULL UNIQUE REFERENCES rentals(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
    issue_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0), -- IVA 19%
    total_billed NUMERIC(12, 2) NOT NULL CHECK (total_billed > 0),
    pdf_url VARCHAR(350),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tools_provider ON tools(provider_id);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category_id);
CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tool_images_tool ON tool_images(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_specs_tool ON tool_specifications(tool_id);
CREATE INDEX IF NOT EXISTS idx_rentals_client ON rentals(client_id);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rental_items_rental ON rental_items(rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_items_tool ON rental_items(tool_id);
CREATE INDEX IF NOT EXISTS idx_inspections_rental ON rental_inspections(rental_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_inspection ON damage_reports(inspection_id);
CREATE INDEX IF NOT EXISTS idx_payments_rental ON payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_invoices_rental ON invoices(rental_id);
