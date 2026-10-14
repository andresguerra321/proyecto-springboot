# 📋 Documento de Traspaso y Estado del Proyecto (HANDOFF.md)

**Proyecto:** Plataforma de Renta de Herramientas y Equipos de Construcción (ToolRent)  
**Fecha:** Octubre 2026  
**Tecnologías Backend:** Spring Boot 3.4.x, Java 21, PostgreSQL 16, Flyway, Maven Multi-Módulo, Spring Security 6, JWT, Docker, H2 (Testing)  
**Tecnologías Frontend:** Vite, Vanilla JavaScript (ES6 Modules), Tailwind CSS v3.4, PostCSS, Lucide Icons, Glassmorphism UI  
**Ramas Actuales en Remoto:** `main`, `develop`, `frontend` (Sincronizadas)  

---

## 🎯 1. Visión General y Propósito del Proyecto

El proyecto consiste en una plataforma integral para la gestión y alquiler de maquinaria y herramientas industriales orientada a tres actores principales:
1. **Clientes (Contratistas y Particulares):** Exploran equipos, reservan por rangos de fechas (con validación de solapamiento), pagan en línea, descargan facturas e inspeccionan su historial.
2. **Proveedores de Equipos:** Publican y administran el inventario de herramientas (especificaciones, fotos por URL o archivo multipart, precios), gestionan solicitudes de alquiler exclusivas de sus equipos, reciben métricas en su dashboard (KPIs) y controlan entregas y devoluciones con inspecciones técnicas y registro de averías.
3. **Administradores del Sistema:** Monitorean usuarios y empresas proveedoras (verificación de cuentas), supervisan alquileres globales y analizan reportes financieros y operativos.

El desarrollo se rige estrictamente por los lineamientos del documento institucional [docs/ejercicioDemo.md](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/docs/ejercicioDemo.md).

---

## 🔑 2. Matriz de Credenciales por Perfil y Flujo de Acceso

La base de datos relacional PostgreSQL 16 se encuentra poblada mediante las migraciones de Flyway (`V2__seed_data.sql`) con datos de prueba consistentes.

> [!IMPORTANT]
> **Contraseña universal para todas las cuentas semilla precargadas:**  
> `Password123*`

### 2.1. Cuentas Básicas por Rol del Sistema

| Rol del Sistema | Nombre de Usuario (`username`) | Correo Electrónico | Perfil Comercial Asociado | Destino tras Login | Pestaña Navbar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | `admin_principal` | `admin@rentaequipos.com` | Administrador General del Sistema | `#/admin` | `Administración [Admin]` |
| **ADMINISTRADOR #2** | `admin_operaciones` | `operaciones@rentaequipos.com` | Supervisor de Operaciones | `#/admin` | `Administración [Admin]` |
| **PROVEEDOR** | `prov_maquinaria_bog` | `contacto@maquinariabogota.com` | Maquinaria Bogotá S.A.S. | `#/provider` | `Panel de Proveedor` |
| **PROVEEDOR #2** | `prov_equipos_med` | `ventas@equiposmedellin.com` | Equipos Medellín Ltda. | `#/provider` | `Panel de Proveedor` |
| **PROVEEDOR #3** | `prov_rentacali` | `info@rentamaquinariacali.com` | Renta Maquinaria Cali | `#/provider` | `Panel de Proveedor` |
| **CLIENTE** | `cliente_carlos_gomez` | `carlos.gomez@constructora.com` | Constructora Gómez & Asoc. | `#/client` o `#/catalog` | `Mis Alquileres` |
| **CLIENTE #2** | `cliente_maria_rodriguez` | `maria.rodriguez@ingenieria.com` | M&R Ingeniería Civil | `#/client` o `#/catalog` | `Mis Alquileres` |
| **CLIENTE #3** | `cliente_juan_perez` | `juan.perez@obrasciviles.com` | Obras Civiles Santander | `#/client` o `#/catalog` | `Mis Alquileres` |

---

### 2.2. Flujo de Autenticación Universal y Redirección Inteligente

1. **Punto de Entrada Común (SSO):**  
   Todos los usuarios (Clientes, Proveedores y Administradores) inician sesión desde el botón **"Iniciar sesión"** en la barra superior o en los avisos de áreas restringidas.
2. **Validación de Claims en JWT:**  
   El backend expide un token firmado `HS384` con los claims de identidad y autoridades (`ROLE_ADMIN`, `ROLE_PROVEEDOR`, `ROLE_CLIENTE`).
3. **Redirección Automática según Privilegios:**
   - Si contiene `ROLE_ADMIN` $\to$ Se redirige de inmediato a `#/admin` (Consola de Administración).
   - Si contiene `ROLE_PROVEEDOR` $\to$ Se redirige a `#/provider` (Panel de Solicitudes y KPIs).
   - Si contiene `ROLE_CLIENTE` $\to$ Permanece en el catálogo o va a `#/client` (Mis Alquileres).
4. **Protección Directa por URL:**  
   Si un usuario no autenticado ingresa a `#/admin`, `#/provider` o `#/client` directamente, el sistema bloquea la vista con un componente guardián amigable e invita a autenticarse con el rol correspondiente.

---

## 🏗️ 3. ¿Cómo lo estamos haciendo? (Arquitectura y Metodología)

El sistema se ha diseñado bajo los más altos estándares de ingeniería de software empresarial:

### 3.1. Arquitectura Hexagonal (Puertos y Adaptadores)
Cada módulo vertical implementa una separación estricta en tres capas concéntricas:
- **Capa de Dominio (`domain`):** Núcleo agnóstico de frameworks. Contiene las entidades puras (`Tool`, `Rental`, `RentalInspection`, `DamageReport`, `User`, `ClientProfile`, `ProviderProfile`, `Invoice`), Value Objects (`Money`, `DateRange`), enumeraciones de estado y los **Puertos** (interfaces como `ToolRepository`, `RentalRepository`, `RentalInspectionRepository`, `DamageReportRepository`, `ClientProfileRepository`, `ProviderProfileRepository`, `JwtTokenPort`).
- **Capa de Aplicación (`application`):** Orquesta los casos de uso (`ToolUseCase`, `RentalUseCase`, `InspectionUseCase`, `ProfileUseCase`, `BillingUseCase`, `AuthUseCase`, `ReportingUseCase`) y define los DTOs de entrada y salida (Records inmutables).
- **Capa de Infraestructura (`infrastructure`):** Implementa los adaptadores tecnológicos:
  - *Adaptadores de Entrada (Inbound):* Controladores REST (`ToolController`, `ToolAvailabilityController`, `RentalController`, `InspectionController`, `ClientProfileController`, `ProviderProfileController`, `BillingController`, `AuthController`, `UserController`, `ReportingController`).
  - *Adaptadores de Salida (Outbound):* Repositorios de persistencia basados en Spring Data JPA (`ToolRepositoryAdapter`, `RentalRepositoryAdapter`, `RentalInspectionRepositoryAdapter`, `DamageReportRepositoryAdapter`, `ClientProfileRepositoryAdapter`, `ProviderProfileRepositoryAdapter`), entidades JPA con anotaciones Jakarta Persistence, codificadores BCrypt, consultas agregadas JDBC y filtros JWT.

```
       [ HTTP Request / Swagger / Postman / Frontend ]
                         │
                         ▼
       ┌────────────────────────────────────────────────────────┐
       │ Adaptador de Entrada (Inbound REST Controller)         │
       └────────────────────────┬───────────────────────────────┘
                                │ invoca
                                ▼
       ┌────────────────────────────────────────────────────────┐
       │ Caso de Uso (Application Service / Use Case)           │
       └────────────────────────┬───────────────────────────────┘
                                │ ejecuta reglas sobre
                                ▼
       ┌────────────────────────────────────────────────────────┐
       │ Entidades de Dominio + Value Objects + Puertos (Ports) │
       └────────────────────────┬───────────────────────────────┘
                                │ implementado por
                                ▼
       ┌────────────────────────────────────────────────────────┐
       │ Adaptador de Salida (Outbound Persistence Adapter)     │
       │ Spring Data JPA + Postgres / Flyway / BCrypt / JWT     │
       └────────────────────────────────────────────────────────┘
```

---

### 3.2. Domain-Driven Design (DDD) y Modularización con Maven
El backend está organizado como un proyecto **Maven Multi-Módulo** estructurado en Bounded Contexts independientes en [backend/pom.xml](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/pom.xml):

| Módulo | Propósito en el Dominio | Dependencias Clave |
| :--- | :--- | :--- |
| [`shared-kernel`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/shared-kernel) | Value Objects transversales (`Money`, `DateRange` con método `overlaps`), excepciones base y manejador global | Spring Web, Jackson, Validation |
| [`identity`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/identity) | Autenticación JWT, roles, perfiles de clientes particulares/contratistas y perfiles comerciales de proveedores | `shared-kernel`, Spring Security, JJWT, Spring Data JPA |
| [`catalog`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/catalog) | Gestión de herramientas, categorías, fichas técnicas, subida multipart de fotos y almacenamiento de imágenes | `shared-kernel`, Spring Data JPA, Spring Security |
| [`rental`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/rental) | Contratos de alquiler, cálculo de días, verificación de solapamiento de fechas, inspecciones (DELIVERY/RETURN) y daños | `shared-kernel`, `catalog`, Spring Data JPA, Spring Security |
| [`billing`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/billing) | Transacciones de pago, facturación legal con IVA (19%) y generación de vista HTML para impresión fiscal | `shared-kernel`, `rental`, Spring Data JPA, Spring Security |
| [`reporting`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/reporting) | Analítica global (ingresos, equipos top, clientes top, disponibilidad de stock) y KPIs para el dashboard de proveedor | `shared-kernel`, Spring Data JPA, Spring Security, Spring JDBC |
| [`bootstrap`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/bootstrap) | Ensamblador Spring Boot, seguridad global, CORS, ResourceHandlers `/uploads/**`, OpenAPI Swagger y Flyway | Agrega todos los módulos anteriores |

---

### 3.3. Base de Datos en Cuarta Forma Normal (4FN) y Datos Semilla
- **Normalización Teórica:** Detallada en [db/README.md](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/db/README.md). Se eliminaron las Dependencias Multivaluadas (MVDs) segregando en tablas independientes:
  - Herramientas vs. Fotos vs. Fichas Técnicas: `tools` $\to$ `tool_images` y `tool_specifications`.
  - Contrato de Alquiler vs. Equipos: `rentals` $\to$ `rental_items`.
  - Inspecciones vs. Incidencias físicas: `rental_inspections` $\to$ `damage_reports`.
- **Motor Utilizado:** PostgreSQL 16 con extensión nativa `uuid-ossp`.
- **Migraciones Flyway:**
  - `V1__create_schema.sql`: Creación de 15 tablas relacionales, llaves primarias UUID, llaves foráneas e índices.
  - `V2__seed_data.sql`: Población de datos consistente con contraseñas encriptadas con BCrypt (`Password123*`).
- **Volumen:** Cumple rigurosamente el requisito de $\ge 20$ registros por entidad transaccional y maestra (42 usuarios, 20 perfiles de cliente, 20 perfiles de proveedor, 25 herramientas, 25 fotos, 25 fichas técnicas, 22 reservas, 22 pagos, 20 facturas, 20 inspecciones, 20 reportes de daño; las tablas catálogo de dominio son 8 categorías de equipos y 3 roles de seguridad).

---

### 3.4. Seguridad, Mitigación de Vulnerabilidades y Decisiones de Hardening

#### A. Mitigación contra IDOR (Insecure Direct Object References)
- `GET /api/v1/users/{id}`: Compara el `username` del usuario solicitado contra el `AuthenticationPrincipal` del JWT. Si no es el mismo y no posee el rol `ROLE_ADMIN`, lanza inmediatamente un `AccessDeniedException` (HTTP 403 Forbidden).
- `GET /api/v1/rentals/client/{clientId}`: Valida a nivel de base de datos que el perfil de cliente consultado pertenezca al usuario autenticado (`client_profiles.user_id = users.id`).
- `GET /api/v1/rentals/provider/{providerId}`: Valida que el perfil pertenezca a la empresa del proveedor autenticado, impidiendo acceso a alquileres ajenos.
- `GET /api/v1/rentals`: Bloqueado con `@PreAuthorize("hasRole('ADMIN')")`.
- Endpoints sin paso de ID por URL: `GET /api/v1/users/me`, `GET /api/v1/clients/me`, `GET /api/v1/providers/me`.

#### B. Prevención de Escalada de Privilegios en Registro Público
- En `AuthUseCase.java`: Si una petición a `/auth/register` incluye `ROLE_ADMIN` sin estar previamente autenticada como administrador, el sistema aborta de inmediato con `HTTP 409 Conflict`. Los registros públicos solo permiten `ROLE_CLIENTE` o `ROLE_PROVEEDOR`.

#### C. Validación de Archivos (Anti Path Traversal y Anti Stored-XSS)
- En `ToolController.java` (`/images/upload`):
  - Se valida estrictamente el MIME Type (`image/jpeg`, `image/png`, `image/webp`), rechazando archivos ejecutables, scripts SVG o HTML.
  - Se sanitiza el nombre de archivo eliminando secuencias `../` y caracteres no alfanuméricos.
  - Se verifica que la ruta resuelta permanezca estrictamente dentro del directorio `uploads/`.

#### D. Configuración de CORS y Headers
- `allowedOriginPatterns = List.of("*")` para flexibilidad en desarrollo local.
- `allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")`.
- `allowedHeaders = List.of("Authorization", "Content-Type", "Accept", "X-Requested-With")`.
- `allowCredentials = true`.

---

## 📦 4. Inventario Completo de Endpoints del Backend

### 4.1. Autenticación y Cuentas
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Público | Registro de usuarios con roles |
| `POST` | `/api/v1/auth/login` | Público | Autenticación y generación de JWT Bearer |
| `GET` | `/api/v1/users/me` | Autenticado | Perfil e identidad del usuario conectado |
| `GET` | `/api/v1/users/{id}` | Propietario / ADMIN | Detalle de usuario (Protegido contra IDOR) |
| `GET` | `/api/v1/users` | ADMIN | Listado global de usuarios registrados |

### 4.2. Perfiles Comerciales (Clientes y Proveedores)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/clients` | Autenticado | Crear perfil de cliente / contratista |
| `GET` | `/api/v1/clients/me` | CLIENTE | Perfil comercial del cliente logueado |
| `GET` | `/api/v1/clients/{id}` | Autenticado | Consultar perfil de cliente por UUID |
| `GET` | `/api/v1/clients/user/{userId}` | Autenticado | Consultar perfil por User ID |
| `GET` | `/api/v1/clients` | PROVEEDOR / ADMIN | Listar todos los clientes registrados |
| `PUT` | `/api/v1/clients/{id}` | Autenticado | Actualizar datos de contacto y dirección |
| `POST` | `/api/v1/providers` | Autenticado | Crear perfil comercial de empresa proveedora |
| `GET` | `/api/v1/providers/me` | PROVEEDOR | Perfil comercial del proveedor logueado |
| `GET` | `/api/v1/providers/{id}` | Público | Consultar perfil de proveedor por UUID |
| `GET` | `/api/v1/providers` | Público | Listar catálogo de empresas proveedoras |
| `PUT` | `/api/v1/providers/{id}` | Autenticado | Actualizar datos comerciales de la empresa |
| `PATCH` | `/api/v1/providers/{id}/verify` | ADMIN | Verificar y aprobar formalmente a un proveedor |

### 4.3. Catálogo de Herramientas y Disponibilidad
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/tools` | Público | Listar herramientas con filtros (`status`, `categoryId`, `providerId`, `search`) |
| `GET` | `/api/v1/tools/categories` | Público | Listar categorías taxonómicas de equipos |
| `GET` | `/api/v1/tools/{id}` | Público | Detalle técnico, fotos y especificaciones de la herramienta |
| `GET` | `/api/v1/tools/{id}/availability` | Público | **Verificación de disponibilidad por fechas (`?from=&to=`) y lista de rangos ocupados** |
| `POST` | `/api/v1/tools` | PROVEEDOR / ADMIN | Registrar nueva herramienta en el inventario |
| `PUT` | `/api/v1/tools/{id}` | PROVEEDOR / ADMIN | Actualizar información técnica o precios |
| `DELETE` | `/api/v1/tools/{id}` | PROVEEDOR / ADMIN | Eliminar herramienta del catálogo |
| `POST` | `/api/v1/tools/{id}/images` | PROVEEDOR / ADMIN | Asociar fotografía por URL externa |
| `POST` | `/api/v1/tools/{id}/images/upload` | PROVEEDOR / ADMIN | **Subir archivo de fotografía (Multipart File) y guardar en `/uploads/**`** |

### 4.4. Alquileres y Reservas
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/rentals` | CLIENTE | Crear reserva (con validación de solapamiento de fechas) |
| `GET` | `/api/v1/rentals` | ADMIN | Listar todas las reservas del sistema |
| `GET` | `/api/v1/rentals/{id}` | Autenticado | Consultar reserva e ítems contratados |
| `GET` | `/api/v1/rentals/client/{clientId}` | Propietario / ADMIN | Historial de alquileres del cliente (Anti-IDOR) |
| `GET` | `/api/v1/rentals/provider/{providerId}` | Proveedor dueño / ADMIN | **Solicitudes y alquileres de equipos del proveedor (Anti-IDOR)** |
| `PATCH` | `/api/v1/rentals/{id}/confirm` | PROVEEDOR / ADMIN | Aceptar/Confirmar solicitud de alquiler |
| `PATCH` | `/api/v1/rentals/{id}/start` | PROVEEDOR / ADMIN | Registrar entrega del equipo (`IN_PROGRESS`) |
| `PATCH` | `/api/v1/rentals/{id}/complete` | PROVEEDOR / ADMIN | Confirmar retorno y liberar herramienta (`AVAILABLE`) |
| `PATCH` | `/api/v1/rentals/{id}/cancel` | Autenticado | Cancelar reserva y liberar equipo (`AVAILABLE`) |

### 4.5. Inspecciones Físicas y Reportes de Averías (Devolución)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/inspections` | PROVEEDOR / ADMIN | Crear acta de inspección física (`DELIVERY` o `RETURN`) |
| `GET` | `/api/v1/inspections/rental/{rentalId}` | Autenticado | Consultar inspecciones asociadas a un alquiler |
| `GET` | `/api/v1/inspections/{id}` | Autenticado | Detalle de inspección técnica |
| `POST` | `/api/v1/inspections/{id}/damages` | PROVEEDOR / ADMIN | **Registrar daño/avería (actualiza equipo a `MAINTENANCE` o `RETIRED`)** |
| `GET` | `/api/v1/inspections/{id}/damages` | Autenticado | Consultar averías reportadas en una inspección |
| `GET` | `/api/v1/inspections/damages` | Autenticado | Listado global de daños y averías reportadas |

### 4.6. Pagos y Facturación Electrónica
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/billing/payments` | CLIENTE | Procesar pago (tarjeta, transferencia, etc.) y generar factura |
| `GET` | `/api/v1/billing/payments/{id}` | Autenticado | Consultar comprobante de transacción |
| `GET` | `/api/v1/billing/payments/rental/{rentalId}` | Autenticado | Pagos efectuados para una reserva |
| `GET` | `/api/v1/billing/invoices/{id}` | Autenticado | Detalle de factura contable (subtotal, IVA 19%, total) |
| `GET` | `/api/v1/billing/invoices/rental/{rentalId}` | Autenticado | Factura emitida para un alquiler |
| `GET` | `/api/v1/billing/invoices/{id}/html` | Autenticado | **Factura oficial en formato HTML con soporte para impresión (`@media print`)** |

### 4.7. Analítica y Reportes
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reporting/income` | ADMIN | Reporte de ingresos brutos consolidados |
| `GET` | `/api/v1/reporting/most-rented-tools` | ADMIN | Ranking de herramientas más alquiladas |
| `GET` | `/api/v1/reporting/frequent-clients` | ADMIN | Ranking de clientes con mayor número de alquileres |
| `GET` | `/api/v1/reporting/tool-availability` | ADMIN / PROVEEDOR | Métricas de stock: disponibles, en renta, en mantenimiento y retiradas |
| `GET` | `/api/v1/reporting/provider/{providerId}` | PROVEEDOR / ADMIN | **4 KPIs del Proveedor: total equipos, equipos en renta, ganancias y pendientes** |

---

## 💻 5. Implementación del Frontend (Vite + Tailwind CSS v3 + ToolRent Design System)

El frontend opera como una Single Page Application (SPA) reactiva y desacoplada en [`frontend/`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/frontend):

### 5.1. Stack Tecnológico y Diseño
- **Empaquetador y DevServer:** **Vite** para desarrollo ultrarrápido y construcción optimizada para producción (`npm run build`).
- **Sistema de Estilos:** **Tailwind CSS v3.4** con PostCSS y Autoprefixer.
- **Identidad de Marca ToolRent:**
  - **Paleta de Color:** Naranja industrial ToolRent (`#FF5A1F` / `#ea580c`), fondos limpios (`#f8fafc`), tarjetas con elevación suave (`border-slate-200/80` y sombras sutiles).
  - **Tipografía:** Google Fonts **Outfit** (marca y títulos) e **Inter** (cuerpo de texto).
  - **Precios en Pesos Colombianos:** Separadores de miles con puntos (ej. `$ 185.000 / día`).
  - **Iconografía:** Lucide Icons SVG modularizado.

---

### 5.2. Segmentación Dinámica de Navegación y Menú de Perfil (Role-Based UX)

La barra de navegación (`navbar.js`) adapta su estructura dinámicamente según el estado de la sesión:

1. **Visitante Público (Sin sesión):**
   - Enlaces visibles: `Inicio` (catálogo) y botón `¿Tienes equipos? Publica aquí` (abre modal de registro para proveedores).
   - Oculta por completo: `Mis Alquileres`, `Para Proveedores` y `Administración`.
2. **Cliente Autenticado (`ROLE_CLIENTE`):**
   - Enlaces visibles: `Inicio` y `Mis Alquileres`.
3. **Proveedor Autenticado (`ROLE_PROVEEDOR`):**
   - Enlaces visibles: `Inicio` y `Panel de Proveedor`.
4. **Administrador Autenticado (`ROLE_ADMIN`):**
   - Enlaces visibles: `Inicio` y `Administración` (con icono de escudo y badge dorado `Admin`).
5. **Menú de Perfil Interactivo (Avatar Dropdown):**
   - Al pulsar sobre el avatar del usuario conectado se abre una tarjeta popover con nombre, correo, insignia del rol (`Administrador`, `Proveedor Aliado`, o `Cliente Verificado`), accesos contextuales y botón para **Cerrar Sesión**.
6. **Pie de Página (`footer.js`):**
   - Limpio de accesos administrativos públicos; ofrece enlaces institucionales y enlace para registro de aliados comerciales.

---

### 5.3. Vistas y Módulos de la Plataforma

1. **🛒 Catálogo Marketplace (`#/catalog`):**
   - Buscador en tiempo real, filtros por categoría taxonómica, precio y disponibilidad.
   - Modal de reserva con cálculo automático de días e integración con el backend.
2. **🔑 Acceso y Registro Split-Screen:**
   - Fotografía profesional de alta resolución en obra sin texto sobrepuesto.
   - Tarjetas de selección de rol: *Cliente* ("Quiero alquilar") vs. *Proveedor* ("Quiero publicar").
3. **🚜 Panel del Proveedor (`#/provider`):**
   - 4 KPIs en vivo: Disponibles, En renta, En mantenimiento y Solicitudes pendientes.
   - Tabla operativa para confirmar, registrar entrega y recibir devoluciones.
   - Modal de inspección técnica física y reporte de averías (4FN).
   - Publicación y edición de herramientas conectadas al backend.
4. **🛡️ Panel del Administrador (`#/admin`):**
   - 4 métricas globales: Ingresos facturados, Alquileres, Usuarios y Herramientas.
   - Gráficos interactivos de herramientas más rentadas, clientes frecuentes y disponibilidad de stock.
   - Gestión integral de usuarios con cajones laterales (drawers) para crear, editar o desactivar.
5. **📄 Visor de Factura Oficial (`rental-modal.js`):**
   - Membrete legal, desglose de subtotal, IVA del 19% y soporte para impresión directa (`window.print()`).
6. **🔔 Centro de Notificaciones Reactivo:**
   - Badge con contador de no leídas, filtros, marcado masivo y deep linking contextual.

---

### 5.4. Cómo Ejecutar el Frontend Localmente
```bash
cd frontend
npm install
npm run dev
```
La aplicación inicia de inmediato en: **`http://localhost:5173/`**

---

## 📌 6. Checklist de Cumplimiento de Entregables (`ejercicioDemo.md`)

| # | Requisito Obligatorio | Cumplimiento | Evidencia en el Proyecto |
|---|---|:---:|---|
| **1** | Repositorio GitHub con Código Fuente | ✅ 100% | Repositorio multi-módulo con ramas `develop` y `frontend` sincronizadas, commits descriptivos y código modular. |
| **2** | Backend Completo en Spring Boot 3 + Java 21 | ✅ 100% | Arquitectura Hexagonal con 7 módulos Maven desacoplados (shared-kernel, identity, catalog, rental, billing, reporting, bootstrap), JWT Stateless, Spring Security 6, control de solapamiento de fechas, CORS y manejo global de errores. |
| **3** | Base de Datos Relacional Normalizada en 4FN | ✅ 100% | 15 tablas en PostgreSQL 16 sin MVDs, migraciones Flyway automáticas (`V1` y `V2`) y $\ge 20$ registros por entidad en `db/data.sql`. |
| **4** | Documentación Completa del Proyecto | ✅ 100% | `README.md` estructurado, diagrama relacional PNG y Mermaid, guía de configuración `application.yml`, Swagger UI interactivo, `HANDOFF.md` y `TESTING_INTEGRIDAD.md`. |
| **5** | Frontend Responsivo con HTML, CSS y JS | ✅ 100% | Single Page Application en `frontend/` con Vite, Tailwind CSS v3, diseño adaptable (móvil, tablet, escritorio) y navegación dinámica por roles. |
| **6** | Funcionalidades de Negocio del Sistema | ✅ 100% | Gestión de usuarios/proveedores, CRUD de herramientas con fotos, reservas con control de disponibilidad, pagos simulados, facturación HTML e inspección con daños. |
| **7** | Pruebas de API y Despliegue Tomcat | ✅ 100% | Colección completa en `docs/postman_collection.json` con auto-captura de JWT, tests unitarios en Maven (`mvnw test`) y Tomcat embebido en puerto `8085`. |
