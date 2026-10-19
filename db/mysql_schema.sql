-- ==============================================================================
-- DDL: ESQUEMA DE BASE DE DATOS RELACIONAL (MYSQL 8.0+)
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

CREATE DATABASE IF NOT EXISTS renta_herramientas_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE renta_herramientas_db;

-- ------------------------------------------------------------------------------
-- 1. TABLA: roles
-- Catálogo de roles y permisos del sistema
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 2. TABLA: users
-- Identidades y credenciales de acceso al sistema
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 3. TABLA: user_roles (4FN)
-- Asociación Muchos a Muchos entre Usuarios y Roles para evitar MVD
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id CHAR(36) NOT NULL,
    role_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 4. TABLA: provider_profiles
-- Perfil comercial de proveedores de maquinaria y equipos
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_profiles (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    company_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50) NOT NULL UNIQUE, -- NIT / RUT
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prov_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 5. TABLA: client_profiles
-- Perfil de clientes particulares y contratistas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_profiles (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    document_type VARCHAR(20) NOT NULL, -- CC, CE, PASAPORTE, NIT
    document_number VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cli_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 6. TABLA: categories
-- Categorías taxonómicas de herramientas y maquinaria
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 7. TABLA: tools
-- Catálogo de herramientas y equipos de construcción
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tools (
    id CHAR(36) PRIMARY KEY,
    provider_id CHAR(36) NOT NULL,
    category_id CHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    description TEXT,
    daily_price DECIMAL(12, 2) NOT NULL,
    replacement_value DECIMAL(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, RENTED, MAINTENANCE, RETIRED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tool_provider FOREIGN KEY (provider_id) REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tool_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 8. TABLA: tool_images (4FN)
-- Desacoplamiento de múltiples imágenes por herramienta para prevenir MVD
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_images (
    id CHAR(36) PRIMARY KEY,
    tool_id CHAR(36) NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_img_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 9. TABLA: tool_specifications (4FN)
-- Desacoplamiento de especificaciones técnicas para prevenir MVD con imágenes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_specifications (
    id CHAR(36) PRIMARY KEY,
    tool_id CHAR(36) NOT NULL,
    spec_name VARCHAR(100) NOT NULL,
    spec_value VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_spec_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 10. TABLA: rentals
-- Encabezado de la transacción de alquiler / reserva
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rentals (
    id CHAR(36) PRIMARY KEY,
    rental_code VARCHAR(30) NOT NULL UNIQUE,
    client_id CHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    deposit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    delivery_address VARCHAR(200),
    contact_phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rental_client FOREIGN KEY (client_id) REFERENCES client_profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 11. TABLA: rental_items (4FN)
-- Detalle de herramientas involucradas en la reserva para permitir alquiler múltiple
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_items (
    id CHAR(36) PRIMARY KEY,
    rental_id CHAR(36) NOT NULL,
    tool_id CHAR(36) NOT NULL,
    daily_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'RESERVED', -- RESERVED, DELIVERED, RETURNED, DAMAGED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 12. TABLA: rental_inspections
-- Control de inspecciones físicas en entrega y devolución
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_inspections (
    id CHAR(36) PRIMARY KEY,
    rental_id CHAR(36) NOT NULL,
    inspection_type VARCHAR(20) NOT NULL, -- DELIVERY, RETURN
    inspection_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inspector_notes TEXT,
    inspector_user_id CHAR(36),
    status VARCHAR(30) NOT NULL DEFAULT 'PASSED', -- PASSED, WITH_OBSERVATIONS, DAMAGED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_insp_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
    CONSTRAINT fk_insp_user FOREIGN KEY (inspector_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 13. TABLA: damage_reports (4FN)
-- Desacoplamiento de reportes de daños físicos e incidencias económicas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS damage_reports (
    id CHAR(36) PRIMARY KEY,
    inspection_id CHAR(36) NOT NULL,
    tool_id CHAR(36) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- MINOR, MODERATE, SEVERE, TOTAL_LOSS
    description TEXT NOT NULL,
    repair_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_charged_to_client BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dmg_inspection FOREIGN KEY (inspection_id) REFERENCES rental_inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_dmg_tool FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 14. TABLA: payments
-- Registro de transacciones monetarias y pasarelas de pago
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) PRIMARY KEY,
    payment_reference VARCHAR(60) NOT NULL UNIQUE,
    rental_id CHAR(36) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(40) NOT NULL, -- CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, CASH
    payment_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- PENDING, COMPLETED, FAILED, REFUNDED
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 15. TABLA: invoices
-- Documentos contables y facturas electrónicas emitidas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id CHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    rental_id CHAR(36) NOT NULL UNIQUE,
    payment_id CHAR(36) NOT NULL UNIQUE,
    issue_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- IVA 19%
    total_billed DECIMAL(12, 2) NOT NULL,
    pdf_url VARCHAR(350),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tools_provider ON tools(provider_id);
CREATE INDEX idx_tools_category ON tools(category_id);
CREATE INDEX idx_tools_status ON tools(status);
CREATE INDEX idx_tool_images_tool ON tool_images(tool_id);
CREATE INDEX idx_tool_specs_tool ON tool_specifications(tool_id);
CREATE INDEX idx_rentals_client ON rentals(client_id);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rental_items_rental ON rental_items(rental_id);
CREATE INDEX idx_rental_items_tool ON rental_items(tool_id);
CREATE INDEX idx_inspections_rental ON rental_inspections(rental_id);
CREATE INDEX idx_damage_reports_inspection ON damage_reports(inspection_id);
CREATE INDEX idx_payments_rental ON payments(rental_id);
CREATE INDEX idx_invoices_rental ON invoices(rental_id);
