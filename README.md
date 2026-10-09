# Plataforma de Renta de Herramientas y Equipos de Construcción

Backend desarrollado con **Spring Boot 3**, **Java 17**, **Spring Security (PostgreSQL)**, **JWT** y **Docker**, siguiendo los principios de **Arquitectura Hexagonal (Ports & Adapters)** y **Diseño Guiado por el Dominio (DDD)** con estructura modular.

---

## 📋 Tabla de Contenidos
- [Descripción General](#-descripción-general)
- [Arquitectura y Organización](#-arquitectura-y-organización)
- [Stack Tecnológico](#-stack-tecnológico)
- [Infraestructura y Contenedores (Docker)](#-infraestructura-y-contenedores-docker)
- [Configuración de Entorno (.env)](#-configuración-de-entorno-env)
- [Instrucciones de Compilación Local](#-instrucciones-de-compilación-local)
- [Instrucciones de Despliegue con Docker](#-instrucciones-de-despliegue-con-docker)
- [Endpoints y Verificación](#-endpoints-y-verificación)
- [Próximos Pasos](#-próximos-pasos)

---

## 📌 Descripción General

El sistema automatiza el alquiler de herramientas y maquinaria de construcción entre proveedores y clientes, con control de inventario, reservas, facturación y tres perfiles de usuario:
1. **ADMIN**: Gestión global de usuarios, reportes, supervisión de alquileres e incidencias.
2. **PROVEEDOR**: Publicación y gestión de catálogo de herramientas, aprobación de reservas y seguimiento de devoluciones.
3. **CLIENTE**: Búsqueda de equipos, reserva con fechas, pagos en línea y consulta de historial.

---

## 🏛 Arquitectura y Organización

El proyecto implementa **Arquitectura Hexagonal** y **DDD modular**:

```
src/main/java/com/campus/rentaequipos/
├── infrastructure/               # Adaptadores globales, configuraciones de infraestructura
│   ├── adapter/in/rest/          # Controladores transversales (HealthController, etc.)
│   └── config/                   # SecurityConfig, OpenApiConfig, CorsConfig
└── modules/                      # Módulos de dominio desacoplados (Hexagonal / DDD)
    ├── auth/                     # Autenticación, JWT y gestión de credenciales
    ├── user/                     # Administración de usuarios (Admin, Proveedor, Cliente)
    ├── tool/                     # Inventario de herramientas y maquinaria
    ├── rental/                   # Gestión de solicitudes de alquiler y reservas
    └── payment/                  # Pagos y facturación
```

Cada módulo contiene:
- `domain`: Modelos puros del negocio, Value Objects y Puertos (`port.in`, `port.out`).
- `application`: Casos de uso y servicios de aplicación.
- `infrastructure`: Adaptadores de entrada (REST API) y salida (persistencia JPA/PostgreSQL).

---

## 🛠 Stack Tecnológico

- **Lenguaje:** Java 17 (OpenJDK Temurin)
- **Framework:** Spring Boot 3.4.3
- **Seguridad:** Spring Security 6 con JWT (io.jsonwebtoken 0.12.6) y UserDetails en base de datos
- **Persistencia:** Spring Data JPA / Hibernate
- **Base de Datos:** PostgreSQL 16
- **Documentación de API:** Springdoc OpenAPI 2.8.5 (Swagger UI)
- **Contenedorización:** Docker y Docker Compose (multi-stage build)

---

## 🐳 Infraestructura y Contenedores (Docker)

El proyecto incluye:
- `Dockerfile`: Construcción optimizada multi-stage en dos fases:
  1. **Builder:** Compilación con Maven Wrapper sobre `eclipse-temurin:17-jdk-alpine` con cache de dependencias (`dependency:go-offline`).
  2. **Runtime:** Imagen mínima sobre `eclipse-temurin:17-jre-alpine` ejecutada con usuario sin privilegios (`appuser`) y configuración de memoria JVM optimizada para contenedores.
- `docker-compose.yml`:
  - **postgres**: Servicio PostgreSQL 16 (`renta_herramientas_postgres`) con volumen persistente y healthcheck activo (`pg_isready`).
  - **app**: Servicio Spring Boot (`renta_herramientas_app`) con healthcheck HTTP y dependencia reactiva al estado healthy de PostgreSQL.
- **Aislamiento de puertos:** Para evitar colisiones con otros contenedores del entorno, los puertos expuestos en el host son:
  - API Spring Boot: `8085` (mapeado a `8080` interno)
  - PostgreSQL: `5434` (mapeado a `5432` interno)

---

## ⚙ Configuración de Entorno (.env)

El archivo `.env` en la raíz del proyecto define las variables necesarias:

```env
# Puerto expuesto en el host para el backend
APP_PORT=8085

# Configuración de PostgreSQL
DB_PORT=5434
DB_NAME=renta_herramientas_db
DB_USER=postgres
DB_PASSWORD=postgres

# Hibernate DDL
HIBERNATE_DDL_AUTO=update

# Seguridad & JWT (clave HMAC-SHA256)
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000
```

---

## 🚀 Instrucciones de Compilación Local

Si deseas compilar la aplicación sin Docker (requiere Java 17 y PostgreSQL en ejecución):

```bash
# Dar permisos al wrapper si es necesario (Linux/macOS)
chmod +x mvnw

# Compilar y empaquetar el JAR
./mvnw clean package -DskipTests

# En Windows PowerShell
.\mvnw.cmd clean package -DskipTests
```

---

## 📦 Instrucciones de Despliegue con Docker

### 1. Iniciar los contenedores (Base de datos y API)
```bash
docker compose up -d --build
```

### 2. Verificar estado de los contenedores
```bash
docker compose ps
```

### 3. Ver logs en tiempo real
```bash
docker compose logs -f app
```

### 4. Detener los contenedores
```bash
docker compose down
```
*(Para eliminar también los volúmenes de datos, añadir `-v`: `docker compose down -v`)*

---

## 🌐 Endpoints y Verificación

Una vez levantado el entorno con Docker, puedes verificar la API:

| Recurso | URL | Método | Descripción |
|---|---|---|---|
| **Health Check** | [http://localhost:8085/api/v1/health](http://localhost:8085/api/v1/health) | `GET` | Estado del API, base de datos y configuración |
| **Swagger UI** | [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html) | `GET` | Documentación interactiva de la API |
| **OpenAPI Specs** | [http://localhost:8085/v3/api-docs](http://localhost:8085/v3/api-docs) | `GET` | Especificación JSON OpenAPI 3.0 |

---

## 📌 Próximos Pasos
1. **Entidades y Seguridad Spring Security en Base de Datos**:
   - Modelado de Usuarios y Roles (`ADMIN`, `PROVEEDOR`, `CLIENTE`) con 4FN.
   - Implementación de `UserDetailsService` cargando usuarios desde PostgreSQL.
   - Filtro `JwtAuthenticationFilter` y endpoints de registro/login.
2. **Módulos de Negocio**:
   - Módulo de Herramientas (inventario, categorías, disponibilidad).
   - Módulo de Reservas y Alquileres.
   - Módulo de Pagos y Facturación.
3. **Frontend**:
   - Desarrollo de la interfaz gráfica una vez consolidada la API.
