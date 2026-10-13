# 📋 Documento de Traspaso y Estado del Proyecto (HANDOFF.md)

**Proyecto:** Plataforma de Renta de Herramientas y Equipos de Construcción  
**Fecha:** Octubre 2026  
**Tecnologías:** Spring Boot 3.4.x, Java 17/21, PostgreSQL 16, Flyway, Maven Multi-Módulo, Spring Security, JWT, Docker, H2 (Testing)  
**Ramas Actuales en Remoto:** `main`, `develop`, `frontend`  

---

## 🎯 1. Visión General y Propósito del Proyecto

El proyecto consiste en una plataforma integral para la gestión y alquiler de maquinaria y herramientas industriales orientada a tres actores principales:
1. **Clientes (Contratistas y Particulares):** Exploran equipos, reservan por rangos de fechas, pagan en línea y consultan facturas e historial.
2. **Proveedores de Equipos:** Publican y administran el inventario de herramientas (especificaciones, fotos, precios), gestionan solicitudes de alquiler y controlan entregas y devoluciones.
3. **Administradores del Sistema:** Monitorean usuarios, supervisan alquileres globales y analizan reportes financieros y operativos.

El desarrollo se rige por los lineamientos del documento institucional [docs/ejercicioDemo.md](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/docs/ejercicioDemo.md).

---

## 🏗️ 2. ¿Cómo lo estamos haciendo? (Arquitectura y Metodología)

El sistema se ha diseñado bajo los más altos estándares de ingeniería de software empresarial:

### 2.1. Arquitectura Hexagonal (Puertos y Adaptadores)
Cada módulo vertical implementa una separación estricta en tres capas concéntricas:
- **Capa de Dominio (`domain`):** Núcleo agnóstico de frameworks. Contiene las entidades puras (`Tool`, `Rental`, `User`, `Invoice`), Value Objects (`Money`, `DateRange`), enumeraciones de estado y los **Puertos** (interfaces como `ToolRepository`, `RentalRepository`, `JwtTokenPort`).
- **Capa de Aplicación (`application`):** Orquesta los casos de uso (`ToolUseCase`, `RentalUseCase`, `BillingUseCase`, `AuthUseCase`) y define los DTOs de entrada y salida (Records inmutables).
- **Capa de Infraestructura (`infrastructure`):** Implementa los adaptadores tecnológicos:
  - *Adaptadores de Entrada (Inbound):* Controladores REST (`ToolController`, `RentalController`, `BillingController`, `AuthController`, `UserController`).
  - *Adaptadores de Salida (Outbound):* Repositorios de persistencia basados en Spring Data JPA (`ToolRepositoryAdapter`, `RentalRepositoryAdapter`), entidades JPA (`ToolJpaEntity`, etc.), codificadores BCrypt y filtros JWT.

```
       [ HTTP Request / Swagger / Postman ]
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
| [`shared-kernel`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/shared-kernel) | Value Objects transversales (`Money`, `DateRange`), excepciones base y manejador global | Spring Web, Jackson, Validation |
| [`identity`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/identity) | Autenticación, gestión de credenciales, roles y generación/validación de tokens JWT | `shared-kernel`, Spring Security, JJWT, Spring Data JPA |
| [`catalog`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/catalog) | Gestión de herramientas, categorías, fichas técnicas y fotografías | `shared-kernel`, Spring Data JPA |
| [`rental`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/rental) | Contratos de alquiler, cálculo de días, reservas y ciclo de vida de entrega/devolución | `shared-kernel`, `catalog`, Spring Data JPA |
| [`billing`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/billing) | Transacciones de pago y generación de facturas con discriminación de IVA (19%) | `shared-kernel`, `rental`, Spring Data JPA |
| [`reporting`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/reporting) | Consultas analíticas y reportes de solo lectura (ingresos, equipos más rentados, clientes top) | `shared-kernel`, Spring Data JPA |
| [`bootstrap`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/bootstrap) | Ensamblador final de Spring Boot, configuración de seguridad global, OpenAPI Swagger y migraciones Flyway | Agrega todos los módulos anteriores |

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
- **Volumen:** Cumple rigurosamente el requisito de $\ge 20$ registros por entidad (42 usuarios, 25 herramientas, 25 fotos, 25 fichas, 22 reservas, 22 pagos, 20 facturas).

---

### 2.4. Seguridad y Control de Acceso (Spring Security 6 + JWT)
- **Estrategia Stateless:** Manejo de sesiones sin estado; cada petición autenticada valida el encabezado `Authorization: Bearer <token>`.
- **Roles Implementados:** `ROLE_CLIENTE`, `ROLE_PROVEEDOR`, `ROLE_ADMIN`.
- **Rutas Públicas:**
  - `/api/v1/auth/register` y `/api/v1/auth/login`
  - `GET /api/v1/tools/**` (catálogo y categorías abiertas para exploración pública)
  - `/swagger-ui/**` y `/v3/api-docs/**`
  - `/api/v1/health`
- **Rutas Protegidas:**
  - Registro, actualización y eliminación de herramientas: `PROVEEDOR` y `ADMIN`.
  - Crear reservas y realizar pagos: `CLIENTE`.
  - Listado de usuarios y métricas avanzadas: `ADMIN`.

---

### 2.5. Estrategia de Ramas en Git (Git Flow)
El repositorio remoto (`https://github.com/andresguerra321/proyecto-springboot.git`) cuenta con:
1. `main`: Rama de producción estable.
2. `develop`: Rama de integración donde reside todo el backend consolidado, probado y documentado.
3. `frontend`: Rama creada a partir de `develop`, dedicada exclusivamente a la construcción de las interfaces de usuario web.

---

### 2.6. Suite de Pruebas Automatizadas
Se implementó una arquitectura de pruebas en dos niveles:
1. **Pruebas Unitarias de Dominio y Casos de Uso:**
   - [`MoneyTest.java`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/shared-kernel/src/test/java/com/campus/rentaequipos/shared/domain/valueobject/MoneyTest.java): Operaciones monetarias, factores y redondeo `HALF_UP`.
   - [`DateRangeTest.java`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/shared-kernel/src/test/java/com/campus/rentaequipos/shared/domain/valueobject/DateRangeTest.java): Cálculo exacto de días y solapamientos de fechas.
   - [`ToolUseCaseTest.java`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/catalog/src/test/java/com/campus/rentaequipos/catalog/application/usecase/ToolUseCaseTest.java): Lógica de negocio del catálogo con Mockito.
   - [`RentalUseCaseTest.java`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/rental/src/test/java/com/campus/rentaequipos/rental/application/usecase/RentalUseCaseTest.java): Confirmación, cancelación y liberación de stock de herramientas.
2. **Pruebas de Integración con H2 en Memoria:**
   - [backend/bootstrap/src/test/resources/application.yml](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/backend/bootstrap/src/test/resources/application.yml) configura una base de datos H2 en modo compatibilidad PostgreSQL para ejecutar `mvnw clean test` de forma 100% aislada, sin necesidad de tener Docker levantado en la máquina host.

---

## 📦 3. ¿Qué llevamos hasta ahora? (Inventario de Entregables)

### 3.1. Matriz de Endpoints Implementados y Probados

```
AUTH & USUARIOS:
  POST   /api/v1/auth/register           -> Registro público con asignación de roles
  POST   /api/v1/auth/login              -> Autenticación pública y generación de JWT
  GET    /api/v1/users/me                -> Consulta de identidad del usuario autenticado
  GET    /api/v1/users                   -> Listado de usuarios registrados (ADMIN)
  GET    /api/v1/users/{id}              -> Detalle de usuario por UUID

CATÁLOGO DE HERRAMIENTAS:
  GET    /api/v1/tools                   -> Listado público con filtros (?status=&categoryId=&search=)
  GET    /api/v1/tools/categories        -> Listado de categorías maestras
  GET    /api/v1/tools/{id}              -> Detalle técnico de herramienta
  POST   /api/v1/tools                   -> Registrar nueva herramienta (PROVEEDOR/ADMIN)
  PUT    /api/v1/tools/{id}              -> Actualizar herramienta existente (PROVEEDOR/ADMIN)
  DELETE /api/v1/tools/{id}              -> Eliminar herramienta (PROVEEDOR/ADMIN)

RESERVAS Y ALQUILERES:
  POST   /api/v1/rentals                 -> Crear reserva de alquiler (CLIENTE)
  GET    /api/v1/rentals                 -> Listar todas las reservas del sistema
  GET    /api/v1/rentals/{id}            -> Detalle de una reserva e ítems contratados
  GET    /api/v1/rentals/client/{id}     -> Historial de alquileres de un cliente
  PATCH  /api/v1/rentals/{id}/confirm    -> Confirmar reserva (PROVEEDOR/ADMIN)
  PATCH  /api/v1/rentals/{id}/start      -> Registrar entrega de equipo (IN_PROGRESS)
  PATCH  /api/v1/rentals/{id}/complete   -> Registrar devolución y liberar herramientas (COMPLETED)
  PATCH  /api/v1/rentals/{id}/cancel     -> Cancelar reserva y liberar herramientas (CANCELLED)

FACTURACIÓN Y PAGOS:
  POST   /api/v1/billing/payments        -> Procesar pago, confirmar reserva y emitir factura
  GET    /api/v1/billing/payments/{id}   -> Consultar comprobante de pago
  GET    /api/v1/billing/payments/rental/{rentalId} -> Pagos asociados a una reserva
  GET    /api/v1/billing/invoices/{id}   -> Consultar factura legal (con IVA 19%)
  GET    /api/v1/billing/invoices/rental/{rentalId} -> Factura emitida para un alquiler

REPORTES:
  GET    /api/v1/reporting/income             -> Ingresos brutos consolidados
  GET    /api/v1/reporting/most-rented-tools  -> Top herramientas más demandadas
  GET    /api/v1/reporting/frequent-clients   -> Top clientes con más transacciones

SISTEMA:
  GET    /api/v1/health                  -> Healthcheck de disponibilidad de la API
```

### 3.2. Documentación y Recursos Auxiliares
- **Guía de Compilación:** [docs/COMPILACION.md](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/docs/COMPILACION.md) (Maven CLI, generación de `.jar` y conversión a `.war` para Apache Tomcat externo).
- **Guía de Despliegue:** [docs/DESPLIEGUE.md](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/docs/DESPLIEGUE.md) (Docker Compose multistage, PostgreSQL 16 y variables de entorno).
- **Diagrama Relacional:**
  - Imagen física: [docs/diagrama_relacional.png](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/docs/diagrama_relacional.png).
  - Diagrama interactivo Mermaid: Incorporado en el [README.md](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/README.md#L18-L45).
- **Colección de Postman:** [docs/postman_collection.json](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/docs/postman_collection.json) estructurada con 7 carpetas de peticiones y script dinámico para almacenamiento de token `{{token}}`.

---

## ⚖️ 4. Balance frente a los Requisitos de `ejercicioDemo.md`

| Requisito del Documento Demo | Estado | Observación |
| :--- | :---: | :--- |
| **Arquitectura Hexagonal + DDD + Multi-módulo** | ✅ 100% | 7 módulos Maven desacoplados por dominio |
| **Normalización en 4FN** | ✅ 100% | 15 tablas sin MVDs + justificación teórica |
| **Al menos 20 registros por entidad** | ✅ 100% | Semilla completa en `data.sql` y `V2__seed_data.sql` |
| **Documentación (README, COMPILACION, DESPLIEGUE)** | ✅ 100% | Completa y probada |
| **Seguridad JWT con roles (Admin, Proveedor, Cliente)** | ✅ 100% | Spring Security 6, BCrypt y filtros por rol |
| **CRUD completo de Herramientas, Reservas y Pagos** | ✅ 100% | Métodos `GET`, `POST`, `PUT`, `PATCH`, `DELETE` implementados |
| **Documentación OpenAPI / Swagger** | ✅ 100% | Swagger UI expuesto en `/swagger-ui.html` con Bearer Auth |
| **Colección de Postman** | ✅ 100% | Exportada en `docs/postman_collection.json` |
| **Pruebas Automatizadas** | ✅ 100% | Tests unitarios + contexto H2 pasando al 100% |
| **Docker Compose** | ✅ 100% | Configuración con Postgres 16 y app backend |
| **Reportes y Estadísticas** | 🟡 85% | Listos ingresos, herramientas top y clientes top; falta disponibilidad de inventario |
| **Devoluciones con Reporte de Daños** | 🟡 50% | Tablas listas en BD; falta exponer endpoints REST de inspecciones |
| **Frontend Responsivo con Paneles por Rol** | 🔴 Pendiente | Carpeta creada; código de interfaz pendiente de desarrollo |

---

## 🗺️ 5. Hoja de Ruta (Roadmap) y Siguientes Pasos

Para el relevo o continuación inmediata del proyecto:

1. **Prioridad 1: Desarrollo del Frontend (Rama `frontend`)**
   - Construir la interfaz de usuario responsiva (móviles, tablets y escritorio).
   - Implementar el almacenamiento del token JWT en el cliente (`localStorage` o `sessionStorage`) e interceptor HTTP.
   - Desarrollar las 3 vistas especializadas:
     - *Vista Cliente:* Catálogo interactivo con buscador y filtros, modal de fechas de alquiler, formulario de pago y visualización de factura.
     - *Vista Proveedor:* Panel de gestión de herramientas (formulario con fotos y specs) y control de solicitudes de reserva.
     - *Vista Admin:* Tabla de usuarios registrados y dashboard con métricas financieras.

2. **Prioridad 2: Pulir Endpoints Menores del Backend (Opcional)**
   - Añadir endpoint `GET /api/v1/reporting/tool-availability` (conteo de herramientas por estado: disponibles, alquiladas, mantenimiento).
   - Exponer controlador de inspecciones físicas y daños (`/api/v1/inspections`) aprovechando las tablas `rental_inspections` y `damage_reports` ya existentes en la base de datos.

3. **Prioridad 3: Fusión Final y Entrega**
   - Unificar la rama `frontend` sobre `develop` mediante Pull Request.
   - Realizar la fusión de `develop` hacia `main`.
   - Validar el despliegue con `docker-compose up -d --build`.
