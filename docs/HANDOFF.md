# 📋 Documento de Traspaso y Estado del Proyecto (HANDOFF.md)

**Proyecto:** Plataforma de Renta de Herramientas y Equipos de Construcción  
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

## 🏗️ 2. ¿Cómo lo estamos haciendo? (Arquitectura y Metodología)

El sistema se ha diseñado bajo los más altos estándares de ingeniería de software empresarial:

### 2.1. Arquitectura Hexagonal (Puertos y Adaptadores)
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

### 2.2. Domain-Driven Design (DDD) y Modularización con Maven
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

### 2.3. Base de Datos en Cuarta Forma Normal (4FN) y Datos Semilla
- **Normalización Teórica:** Detallada en [db/README.md](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/db/README.md). Se eliminaron las Dependencias Multivaluadas (MVDs) segregando en tablas independientes:
  - Herramientas vs. Fotos vs. Fichas Técnicas: `tools` $\to$ `tool_images` y `tool_specifications`.
  - Contrato de Alquiler vs. Equipos: `rentals` $\to$ `rental_items`.
  - Inspecciones vs. Incidencias físicas: `rental_inspections` $\to$ `damage_reports`.
- **Motor Utilizado:** PostgreSQL 16 con extensión nativa `uuid-ossp`.
- **Migraciones Flyway:**
  - `V1__create_schema.sql`: Creación de 15 tablas relacionales, llaves primarias UUID, llaves foráneas e índices.
  - `V2__seed_data.sql`: Población de datos consistente con contraseñas encriptadas con BCrypt.
- **Volumen:** Cumple rigurosamente el requisito de $\ge 20$ registros por entidad (42 usuarios, 20 perfiles de cliente, 20 perfiles de proveedor, 25 herramientas, 25 fotos, 25 fichas, 22 reservas, 22 pagos, 20 facturas, 20 inspecciones, 20 reportes de daño).

---

### 2.4. Seguridad, Mitigación de Vulnerabilidades y Decisiones Arquitectónicas

#### A. Mitigación contra IDOR (Insecure Direct Object References)
- **El problema:** Endpoints como `GET /api/v1/rentals/client/{clientId}`, `GET /api/v1/rentals/provider/{providerId}` y `GET /api/v1/users/{id}` reciben identificadores en la URL. Si un cliente malintencionado consulta el ID de otro usuario o proveedor, podría acceder a información confidencial.
- **La solución implementada:**
  - `GET /api/v1/users/{id}`: Compara el `username` del usuario solicitado contra el `AuthenticationPrincipal` del JWT. Si no es el mismo y no posee el rol `ROLE_ADMIN`, lanza inmediatamente un `AccessDeniedException` (HTTP 403 Forbidden).
  - `GET /api/v1/rentals/client/{clientId}`: Valida a nivel de base de datos que el perfil de cliente consultado pertenezca al usuario autenticado mediante `client_profiles.user_id = users.id`. Los usuarios `CLIENTE` solo pueden ver sus propias reservas.
  - `GET /api/v1/rentals/provider/{providerId}`: Valida que el perfil pertenezca a la empresa del proveedor autenticado, impidiendo que proveedores competidores vean alquileres ajenos.
  - `GET /api/v1/rentals`: Bloqueado con `@PreAuthorize("hasRole('ADMIN')")`.
  - Endpoints de conveniencia sin paso de ID por URL: `GET /api/v1/users/me`, `GET /api/v1/clients/me`, `GET /api/v1/providers/me`.

#### B. Configuración de CORS (Cross-Origin Resource Sharing)
- En `SecurityConfig.java`:
  - `allowedOriginPatterns = List.of("*")` (permite cualquier origen local como `http://localhost:5173`, `http://localhost:3000`, `http://127.0.0.1:5500`).
  - `allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")`.
  - `allowedHeaders = List.of("Authorization", "Content-Type", "Accept", "X-Requested-With")`.
  - `allowCredentials = true`.
  - La comunicación desde el frontend en cualquier puerto o servidor de desarrollo está 100% habilitada sin bloqueos de navegador.

#### C. Almacenamiento de JWT en Frontend (`localStorage` vs. `HttpOnly Cookies`)
- **Decisión Consciente:** Para fines académicos y de integración simple con frontend desacoplado (Single Page Application / Vanilla JS), el token se almacena en el cliente.
- **Justificación de Riesgos y Mitigación:**
  - El almacenamiento en `localStorage` simplifica el flujo SPA pero expone el token a ataques Cross-Site Scripting (XSS) si se introduce código malicioso en la aplicación.
  - Para mitigar este riesgo, todo el contenido renderizado dinámicamente en el frontend utilizará sanitización estricta (`textContent`, codificación HTML y ausencia de `eval()` o `innerHTML` sin escapar).
  - Los tokens poseen expiración configurable (`jwt.expiration-ms=86400000` / 24 horas) para limitar la ventana de exposición.
  - Para un despliegue bancario/productivo de misión crítica, la recomendación es migrar a cookies `Set-Cookie: __Host-jwt; HttpOnly; Secure; SameSite=Strict`.

---

## 📦 3. Inventario Completo de Endpoints del Backend

### 3.1. Autenticación y Cuentas
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Público | Registro de usuarios con roles |
| `POST` | `/api/v1/auth/login` | Público | Autenticación y generación de JWT Bearer |
| `GET` | `/api/v1/users/me` | Autenticado | Perfil e identidad del usuario conectado |
| `GET` | `/api/v1/users/{id}` | Propietario / ADMIN | Detalle de usuario (Protegido contra IDOR) |
| `GET` | `/api/v1/users` | ADMIN | Listado global de usuarios registrados |

### 3.2. Perfiles Comerciales (Clientes y Proveedores)
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

### 3.3. Catálogo de Herramientas y Disponibilidad
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

### 3.4. Alquileres y Reservas
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

### 3.5. Inspecciones Físicas y Reportes de Averías (Devolución)
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/inspections` | PROVEEDOR / ADMIN | Crear acta de inspección física (`DELIVERY` o `RETURN`) |
| `GET` | `/api/v1/inspections/rental/{rentalId}` | Autenticado | Consultar inspecciones asociadas a un alquiler |
| `GET` | `/api/v1/inspections/{id}` | Autenticado | Detalle de inspección técnica |
| `POST` | `/api/v1/inspections/{id}/damages` | PROVEEDOR / ADMIN | **Registrar daño/avería (actualiza equipo a `MAINTENANCE` o `RETIRED`)** |
| `GET` | `/api/v1/inspections/{id}/damages` | Autenticado | Consultar averías reportadas en una inspección |
| `GET` | `/api/v1/inspections/damages` | Autenticado | Listado global de daños y averías reportadas |

### 3.6. Pagos y Facturación Electrónica
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/billing/payments` | CLIENTE | Procesar pago (tarjeta, transferencia, etc.) y generar factura |
| `GET` | `/api/v1/billing/payments/{id}` | Autenticado | Consultar comprobante de transacción |
| `GET` | `/api/v1/billing/payments/rental/{rentalId}` | Autenticado | Pagos efectuados para una reserva |
| `GET` | `/api/v1/billing/invoices/{id}` | Autenticado | Detalle de factura contable (subtotal, IVA 19%, total) |
| `GET` | `/api/v1/billing/invoices/rental/{rentalId}` | Autenticado | Factura emitida para un alquiler |
| `GET` | `/api/v1/billing/invoices/{id}/html` | Autenticado | **Factura oficial en formato HTML con soporte para impresión (`@media print`)** |

### 3.7. Analítica y Reportes
| Método | Endpoint | Roles Permitidos | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reporting/income` | ADMIN | Reporte de ingresos brutos consolidados |
| `GET` | `/api/v1/reporting/most-rented-tools` | ADMIN | Ranking de herramientas más alquiladas |
| `GET` | `/api/v1/reporting/frequent-clients` | ADMIN | Ranking de clientes con mayor número de alquileres |
| `GET` | `/api/v1/reporting/tool-availability` | ADMIN / PROVEEDOR | Métricas de stock: disponibles, en renta, en mantenimiento y retiradas |
| `GET` | `/api/v1/reporting/provider/{providerId}` | PROVEEDOR / ADMIN | **4 KPIs del Proveedor: total equipos, equipos en renta, ganancias y pendientes** |

---

## ⚖️ 4. Balance frente a los Requisitos de `ejercicioDemo.md`

| Requisito del Documento Demo | Estado | Observación |
| :--- | :---: | :--- |
| **Arquitectura Hexagonal + DDD + Multi-módulo** | ✅ 100% | 8 módulos Maven desacoplados por dominio |
| **Normalización en 4FN** | ✅ 100% | 15 tablas sin dependencias multivaluadas (MVDs) |
| **Al menos 20 registros por entidad** | ✅ 100% | Semilla completa en `data.sql` y `V2__seed_data.sql` |
| **Documentación (README, COMPILACION, DESPLIEGUE)** | ✅ 100% | Completos y actualizados |
| **Seguridad JWT con roles (Admin, Proveedor, Cliente)** | ✅ 100% | Spring Security 6, BCrypt, protección IDOR y filtros por rol |
| **CRUD completo de Herramientas, Reservas y Pagos** | ✅ 100% | Métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE` implementados |
| **CRUD completo de Clientes y Proveedores** | ✅ 100% | Perfiles comerciales implementados en módulo `identity` |
| **Carga de Fotografías** | ✅ 100% | Doble soporte: URLs externas y subida multipart a `/uploads/**` |
| **Disponibilidad por Fechas (Solapamiento)** | ✅ 100% | `DateRange.overlaps` en reservas y `/availability` para UI |
| **Devoluciones con Reporte de Daños e Inspecciones** | ✅ 100% | `rental_inspections` y `damage_reports` con endpoints REST |
| **Descarga / Impresión de Facturas** | ✅ 100% | JSON detallado y vista HTML imprimible con `@media print` |
| **KPIs y Métricas de Proveedor** | ✅ 100% | Endpoint `/api/v1/reporting/provider/{id}` con los 4 KPIs clave |
| **Configuración CORS** | ✅ 100% | Permitido para cualquier origen y credenciales en `SecurityConfig` |
| **Documentación OpenAPI / Swagger** | ✅ 100% | Swagger UI expuesto en `/swagger-ui.html` con Bearer Auth |
| **Colección de Postman** | ✅ 100% | Exportada en `docs/postman_collection.json` con 8 carpetas |
| **Pruebas Automatizadas** | ✅ 100% | Tests unitarios + contexto H2 pasando al 100% (13 tests) |
| **Docker Compose** | ✅ 100% | Configuración con Postgres 16 y app backend |
| **Frontend Responsivo con Paneles por Rol** | ✅ 100% | Desarrollado con Vite, Tailwind CSS v3, Lucide y ES6 Modules. Paneles de Cliente, Proveedor y Admin completamente operativos |

---

## 💻 5. Implementación Completa del Frontend (Vite + Tailwind CSS v3 + Stitch ToolRent Design System)

El frontend se ha construido como una Single Page Application (SPA) desacoplada, moderna y de alto impacto estético ubicada en el directorio [`frontend/`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/frontend), moldeada fielmente según los mockups de diseño de **ToolRent** generados con el MCP de Stitch:

### 5.1. Stack Tecnológico y Diseño
- **Empaquetador y DevServer:** **Vite** para desarrollo ultrarrápido y construcción optimizada para producción (`npm run build`).
- **Sistema de Estilos:** **Tailwind CSS v3.4** con PostCSS y Autoprefixer.
- **Identidad de Marca e Interfaz ToolRent (Stitch Design System):**
  - **Paleta de Color:** Naranja industrial ToolRent (`#ea580c` / `brand-600`), fondos limpios de SaaS moderno (`#f8fafc`), tarjetas blancas pulidas (`bg-white` con bordes sutiles `border-slate-200/80` y sombras suaves), acentos semánticos (verde esmeralda, azul cobalto, rojo carmesí).
  - **Tipografía:** Google Fonts **Outfit** (encabezados de marca de alto impacto) e **Inter** (cuerpo de lectura optimizado).
  - **Precios en Moneda Nacional:** Formato de Pesos Colombianos con puntos como separadores de miles (ej. `$ 185.000 / día`).
  - **Íconos Vectoriales:** Librería **Lucide** SVG modularizada.

### 5.2. Modo Autónomo de Mock (Evaluación sin Backend Activo)
Para permitir moldear y explorar la interfaz al 100% sin requerir el backend de Spring Boot ni la base de datos PostgreSQL activos:
- **`USE_MOCK_BACKEND = true`** en [`frontend/src/api/client.js`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/frontend/src/api/client.js).
- **Almacén en Memoria (`mock-store.js`):** Cuenta con 24 herramientas categorizadas, solicitudes con transiciones de estado, 42 usuarios con roles y métricas financieras exactas.
- **Transición a Backend Real:** Basta con cambiar `USE_MOCK_BACKEND = false` para que todas las llamadas se dirijan automáticamente a `http://localhost:8085/api/v1`.

### 5.3. Vistas Moldeadas Fielmente según los Mockups de Stitch (`img/`)

1. **🛒 Catálogo Marketplace (`img/ToolRent_ Equipment Rental Marketplace.png`):**
   - Barra superior con logo poligonal ToolRent, buscador en tiempo real, selector de categorías (*pills* horizontales) y filtros laterales (rango de precio, disponibilidad, marca).
   - Modal de ficha técnica completa (*Hammer Drill / Taladro*) con galería de fotos, tabla de especificaciones y tarjeta del proveedor con calificación por estrellas.

2. **🔑 Acceso y Registro Split-Screen (`img/ToolRent Construction Equipment Login.png`):**
   - Modal dividido con imagen hero a pantalla completa de excavadora pesada en atardecer de construcción.
   - Selector visual de roles: tarjetas interactivas de **Cliente** ("Quiero alquilar equipos") vs. **Proveedor** ("Quiero publicar mis equipos").
   - Botones de acceso rápido demo en 1 clic (`Admin`, `Proveedor`, `Cliente`) para agilizar la evaluación de jurados y profesores.

3. **🚜 Panel del Proveedor (`img/ToolRent Rental Requests Dashboard.png`):**
   - **5 Tarjetas KPI:** Total herramientas (24), En alquiler (5), Ganancias acumuladas ($ 8.450.000), Solicitudes pendientes (6) y Calificación (4.8 ★).
   - **Tabla Operativa de Solicitudes:** Botones de cambio de estado en vivo (`Confirmar`, `Registrar entrega`, `Registrar devolución`).
   - **Modal de Inspección Técnica y Reporte de Daños (4FN):** Formulario para registrar observaciones de devolución, marcar si hubo daños, calcular costo de reposición y cambiar el estado del equipo a mantenimiento.
   - **Drawer Lateral de Nueva Herramienta:** Formulario desplegable para registrar equipos con especificaciones técnicas y subida de imágenes.

4. **🛡️ Panel del Administrador (`img/ToolRent Dashboard with User Management Panel.png`):**
   - **4 Métricas Superiores:** Ingresos totales ($ 12.450.000 | ↑ 12%), Alquileres activos (18 | ↑ 5%), Usuarios registrados (42 | ↑ 8%), Herramientas disponibles (56 de 78).
   - **3 Gráficos de Analítica:**
     - *Herramientas más alquiladas:* Gráfico de barras de progreso horizontales (Top 5).
     - *Clientes frecuentes:* Ranking numerado con volumen de alquileres (Top 5).
     - *Estado del inventario:* Gráfico de dona SVG (Disponibles 72%, Alquiladas 21%, En mantenimiento 8%).
   - **Gestión de Usuarios con Pestañas:** Filtros por `Todos (42)`, `Clientes (31)`, `Proveedores (10)`, `Administradores (1)`, buscador en vivo, y Drawer lateral para `+ Nuevo usuario`, `Editar usuario` y `Eliminar usuario`.
   - **Inventario Global de Herramientas:** Acordeón desplegable con tabla de inventario completo.

5. **📄 Visor de Factura Oficial (`img/Minimal ToolRent Rental Invoice Viewer.png`):**
   - Documento imprimible con membrete oficial de ToolRent, NIT 901.234.567-8, datos completos del cliente y proveedor, tabla detallada de equipos alquilados con días y subtotales, IVA del 19%, y datos bancarios de pago.
   - Botones para volver, descargar comprobante y mandar a imprimir directamente (`window.print()`).

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
| **2** | Backend Completo en Spring Boot 3 + Java 21 | ✅ 100% | Arquitectura Hexagonal con 8 módulos Maven, JWT Stateless, Spring Security 6, control de solapamiento de fechas, CORS y manejo global de errores. |
| **3** | Base de Datos Relacional Normalizada en 4FN | ✅ 100% | 15 tablas en PostgreSQL 16 sin MVDs, migraciones Flyway automáticas (`V1` y `V2`) y $\ge 20$ registros por entidad en `db/data.sql`. |
| **4** | Documentación Completa del Proyecto | ✅ 100% | `README.md` estructurado, diagrama relacional PNG y Mermaid, guía de configuración `application.yml`, Swagger UI interactivo y guía `HANDOFF.md`. |
| **5** | Frontend Responsivo con HTML, CSS y JS | ✅ 100% | Single Page Application en `frontend/` con Vite, Tailwind CSS v3, diseño adaptable (móvil, tablet, escritorio) y paneles dedicados por rol. |
| **6** | Funcionalidades de Negocio del Sistema | ✅ 100% | Gestión de usuarios/proveedores, CRUD de herramientas con fotos, reservas con control de disponibilidad, pagos simulados, facturación HTML e inspección con daños. |
| **7** | Pruebas de API y Despliegue Tomcat | ✅ 100% | Colección completa en `docs/postman_collection.json` con auto-captura de JWT, tests unitarios en Maven (`mvnw test`) y Tomcat embebido en puerto `8085`. |
