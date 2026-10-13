# Guía de Compilación (COMPILACION.md)

Este documento detalla el proceso de compilación del proyecto utilizando **Maven** y una estructura multi-módulo basada en Arquitectura Hexagonal.

## Estructura de Módulos (Maven Multi-Module)
El proyecto está estructurado alrededor de un archivo `pom.xml` padre que agrega y gestiona la versión de los siguientes módulos:

- `shared-kernel`: Clases transversales sin dependencias de infraestructura pesada.
- `identity`: Módulo de autenticación (JWT, Roles).
- `catalog`: Módulo de catálogo de herramientas.
- `rental`: Módulo de reglas de negocio para reservas.
- `billing`: Pagos y facturas.
- `reporting`: Reportes en modo solo lectura.
- `bootstrap`: Módulo de inicialización, que empaca la aplicación Spring Boot y orquesta la inyección de dependencias (`SecurityConfig`, etc.).

**Nota Importante:** Ningún módulo de dominio depende del módulo `bootstrap`.

## Compilar Localmente (Con Maven)

Si deseas compilar la aplicación para verificar los errores, o para correr los test unitarios localmente fuera de Docker, sigue estos pasos:

### 1. Pre-requisitos
- **Java JDK 21**
- **Maven 3.9+** (Opcional, el proyecto incluye Maven Wrapper `mvnw`).

### 2. Ejecutar la compilación
Navega a la carpeta `backend` donde se encuentra el `pom.xml` raíz del proyecto:
```bash
cd backend
./mvnw clean install
```
*(En Windows usa `mvnw.cmd clean install`)*

### 3. Explicación del Proceso
- El ciclo `clean install` limpiará las carpetas `target/` de todos los sub-módulos.
- Compilará primero el `shared-kernel`.
- Luego compilará cada módulo vertical (`identity`, `catalog`, etc.).
- Finalmente, compilará el módulo `bootstrap` generando el archivo ejecutable (`fat-jar`) o archivo `war`.
- El archivo resultante se deposita en: `backend/bootstrap/target/bootstrap-1.0.0-SNAPSHOT.jar`.

## Empaquetado Alternativo para Tomcat Tradicional (.war)
Por defecto, la compilación genera un archivo `.jar` embebido. Si un requerimiento exige desplegarlo sobre un servidor Apache Tomcat nativo externo (no embebido), es necesario:
1. Ir al `pom.xml` del módulo `bootstrap` y cambiar `<packaging>jar</packaging>` por `<packaging>war</packaging>`.
2. Incluir la dependencia `spring-boot-starter-tomcat` con *scope provided*.
3. En la clase principal `RentaEquiposApplication`, heredar de `SpringBootServletInitializer` y sobrescribir el método `configure`.
4. Ejecutar nuevamente `./mvnw clean package` y localizar el archivo `.war` en la carpeta `target/`.
