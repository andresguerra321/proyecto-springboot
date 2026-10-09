# Guía de Despliegue del Proyecto

Esta guía describe el procedimiento para desplegar la plataforma utilizando **Docker y Docker Compose** (método principal y recomendado) o mediante **Apache Tomcat / Jar Autónomo**.

---

## 🐳 Método 1: Despliegue con Docker y Docker Compose (Recomendado)

### 📋 Requisitos
- **Docker Engine:** Versión 20.10+ o Docker Desktop instalado y corriendo.
- **Docker Compose:** Versión 2.0+.

### ⚙ 1. Configuración de Variables de Entorno
Copia o verifica el archivo `.env` en la raíz del proyecto:

```env
# Puerto en el Host para la API REST
APP_PORT=8085

# Configuración de PostgreSQL
DB_PORT=5434
DB_NAME=renta_herramientas_db
DB_USER=postgres
DB_PASSWORD=postgres

# Modo Hibernate
HIBERNATE_DDL_AUTO=update

# Llave Secreta JWT y tiempo de expiración (24h)
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000
```

### 🚀 2. Construcción y Despliegue
Ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker compose up -d --build
```

Docker se encargará de:
1. Compilar los módulos con Maven en una etapa temporal (`builder`).
2. Generar la imagen runtime mínima con Eclipse Temurin JRE 17.
3. Iniciar el contenedor de PostgreSQL (`renta_herramientas_postgres`) y esperar a que esté saludable (*healthy*).
4. Iniciar el contenedor de la aplicación (`renta_herramientas_app`).

### 🔍 3. Comprobación del Despliegue
Verifica el estado de los contenedores:

```bash
docker compose ps
```

Accede a la verificación en tu navegador:
- **Health Check:** [http://localhost:8085/api/v1/health](http://localhost:8085/api/v1/health)
- **Documentación Swagger:** [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html)

### 🛑 4. Detener el Despliegue
```bash
docker compose down
```

---

## ☕ Método 2: Despliegue Standalone (JAR Embebido)

Si se cuenta con un servidor PostgreSQL ya configurado:

1. Compilar el proyecto:
   ```bash
   ./mvnw clean package -DskipTests
   ```
2. Ejecutar el artefacto especificando las variables de base de datos:
   ```bash
   java -Dserver.port=8085 \
        -Dspring.datasource.url=jdbc:postgresql://localhost:5432/renta_herramientas_db \
        -Dspring.datasource.username=postgres \
        -Dspring.datasource.password=postgres \
        -jar bootstrap/target/bootstrap-1.0.0-SNAPSHOT.jar
   ```
