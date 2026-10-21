# 🐧 Guía Completa de Instalación y Despliegue en Linux Ubuntu - ToolRent

Esta guía explica paso a paso cómo instalar y poner en marcha toda la plataforma **ToolRent** (Base de Datos PostgreSQL 16, Backend Spring Boot 3 y Frontend Web SPA Vite) en cualquier equipo o servidor con **Ubuntu Linux (20.04, 22.04, 24.04 LTS o superior)**.

---

## ❓ ¿Se puede usar un archivo `.exe` en Linux Ubuntu?

> [!NOTE]
> **No.** Los archivos con extensión `.exe` son ejecutables de **Microsoft Windows** (formato Portable Executable PE) y **no son compatibles de manera nativa con Linux**.
> 
> En el ecosistema Linux Ubuntu, el estándar idéntico y equivalente a un instalador de un solo clic es un **script Bash ejecutable (`.sh`)**. Por este motivo, el repositorio incluye el script automatizado [`deploy-ubuntu.sh`](../deploy-ubuntu.sh), el cual se encarga de verificar, instalar dependencias faltantes y poner en marcha los contenedores Docker en **uno o dos comandos**.

---

## 🚀 Método 1: Despliegue Automático en 2 Comandos (Recomendado)

Si tienes una máquina con Ubuntu recién formateada o que solo cuenta con lo básico, este método instala automáticamente Docker, Docker Compose y Node.js si hacen falta, compila los contenedores y lanza la aplicación.

### Paso 1: Clonar o copiar el repositorio en el equipo Ubuntu
```bash
git clone https://github.com/andresguerra321/proyecto-springboot.git
cd proyecto-springboot
```
*(Si copiaste el proyecto en un archivo `.zip` o `.tar.gz`, simplemente descomprímelo y entra en la carpeta)*:
```bash
unzip proyecto-springboot.zip
cd proyecto-springboot
```

### Paso 2: Dar permisos de ejecución y correr el instalador
```bash
chmod +x deploy-ubuntu.sh start-all.sh
./deploy-ubuntu.sh
```

El script ejecutará automáticamente:
1. Verificación e instalación de **Docker** y **Docker Compose** vía `apt` oficial.
2. Inicio y habilitación del servicio de Docker.
3. Descarga y compilación de los contenedores (`PostgreSQL 16`, `Spring Boot API` y `pgAdmin`).
4. Monitoreo de arranque hasta confirmar estado saludable (`healthcheck UP`).
5. Instalación de Node.js y dependencias de `frontend` (si aún no existen).
6. Lanzamiento del servidor web en `http://localhost:5173`.

---

## 🐳 Método 2: Despliegue Manual con Docker (Paso a Paso)

Si prefieres ejecutar cada comando de forma explícita:

### 1. Actualizar repositorios e instalar Docker y Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 curl nodejs npm
```

### 2. Dar permisos a tu usuario para usar Docker sin `sudo`
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Levantar la infraestructura (Base de Datos + API Spring Boot + pgAdmin)
Desde la raíz del proyecto:
```bash
docker compose up -d --build
```

Verificar que los contenedores estén corriendo y saludables:
```bash
docker ps
```
Deberás ver activos:
- `renta_herramientas_postgres` en el puerto `5434 -> 5432`
- `renta_herramientas_app` en el puerto `8085 -> 8080`
- `renta_herramientas_pgadmin` en el puerto `5050 -> 80`

Verificar que el API responda:
```bash
curl http://localhost:8085/api/v1/health
# Respuesta esperada: {"status":"UP"}
```

### 4. Iniciar el Frontend Web
En una terminal:
```bash
cd frontend
npm install
npm run dev -- --host
```

Abre tu navegador en: [http://localhost:5173](http://localhost:5173)

---

## ☕ Método 3: Despliegue Nativo (Sin Docker)

Si tu equipo Ubuntu **no permite virtualización o no tienes permisos de administrador** para instalar Docker, puedes correr Spring Boot y PostgreSQL nativamente:

### 1. Instalar Java 17, PostgreSQL y Node.js
```bash
sudo apt update
sudo apt install -y openjdk-17-jdk postgresql postgresql-contrib nodejs npm
```

### 2. Crear la base de datos en PostgreSQL local
```bash
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE renta_herramientas_db OWNER postgres;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE renta_herramientas_db TO postgres;"
```

Cargar el esquema y los datos iniciales limpios:
```bash
sudo -u postgres psql -d renta_herramientas_db -f db/schema.sql
sudo -u postgres psql -d renta_herramientas_db -f db/data.sql
```

### 3. Ejecutar el Backend Spring Boot
```bash
cd backend
./mvnw clean spring-boot:run -pl bootstrap
```
El API quedará escuchando en `http://localhost:8080` (o `8085` según tu configuración de `application.yml`).

### 4. Ejecutar el Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Credenciales y Cuentas de Acceso de Prueba

> **Contraseña universal para todas las cuentas:** `Password123*`

| Rol | Usuario | Correo Electrónico | Perfil Asociado |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin_principal` | `admin@rentaequipos.com` | Administrador Maestro ToolRent |
| **Proveedor** | `prov_maquinaria_bog` | `contacto@maquinariabogota.com` | Maquinaria y Equipos Bogotá S.A.S. |
| **Cliente 1** | `cliente_carlos_gomez` | `carlos.gomez@constructora.com` | Carlos Alberto Gómez Peña |
| **Cliente 2** | `cliente_maria_rodriguez` | `maria.rodriguez@ingenieria.com` | María Camila Rodríguez León |

*Todos los productos (5 herramientas) pertenecen a `Maquinaria y Equipos Bogotá S.A.S.` y el sistema inicia con 0 alquileres registrados para pruebas limpias.*

---

## 🌐 Resumen de Puertos y Servicios

| Componente | Puerto | URL Local |
| :--- | :---: | :--- |
| **Frontend Web SPA** | `5173` | [http://localhost:5173](http://localhost:5173) |
| **Backend REST API** | `8085` | [http://localhost:8085/api/v1](http://localhost:8085/api/v1) |
| **Swagger UI (Contratos OpenAPI)** | `8085` | [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html) |
| **Health Check (Actuator)** | `8085` | [http://localhost:8085/api/v1/health](http://localhost:8085/api/v1/health) |
| **pgAdmin 4** | `5050` | [http://localhost:5050](http://localhost:5050) *(admin@rentaequipos.com / admin123)* |
| **PostgreSQL 16** | `5434` | `localhost:5434` *(db: renta_herramientas_db)* |
