# 🐧 Guía Maestra de Examen: Entorno Linux + Postman Paso a Paso con Capturas

Esta guía está diseñada para que en la sala de computo con **Linux (Ubuntu / Debian)** configures todo el entorno en 5 minutos, ejecutes el backend sin errores y generes las **capturas exactas de Postman y Base de Datos** que solicita el examen.

---

## 📋 Índice Rápido
1. [Puesta a Punto en Linux (Java, Postgres, Permisos y Ejecución)](#-1-puesta-a-punto-en-linux)
2. [Paso a Paso en Postman con Capturas para el Examen](#-2-paso-a-paso-en-postman-y-capturas)
   - [Paso A: Obtener Token JWT](#paso-a-login-y-obtención-de-token-jwt)
   - [Paso B: Crear Reserva PENDING de Prueba](#paso-b-crear-reserva-pending-de-prueba)
   - [CAPTURA 1: Aprobar Reserva (POST .../aprobar)](#-captura-1-aprobar-reserva-exitosa-post-apireservasidaprobar)
   - [CAPTURA 2: Base de Datos DBeaver / pgAdmin / psql](#-captura-2-evidencia-en-base-de-datos-dbeaver-o-psql)
   - [CAPTURA 3: Rechazar Reserva con Motivo (POST .../rechazar)](#-captura-3-rechazar-reserva-con-motivo-post-apireservasidrechazar)
   - [CAPTURAS EXTRA: 409 Conflict y 400 Bad Request](#-capturas-extra-para-asegurar-calificación-impecable-50)
3. [Entrega en Git desde Terminal Linux](#-3-entrega-en-git-desde-terminal-linux)
4. [Solución Rápida a Problemas Típicos de Linux](#-4-solución-rápida-a-problemas-típicos-de-linux)

---

## 🐧 1. Puesta a Punto en Linux

### 1.1. Verificar o Instalar Java 17 y Utilidades
Abre la terminal en Linux (`Ctrl + Alt + T`) y verifica:
```bash
java -version
```
> Debe responder `openjdk version "17.0.x"` o superior. Si no está instalado:
```bash
sudo apt update && sudo apt install -y openjdk-17-jdk git curl
```

---

### 1.2. Puesta a Punto de PostgreSQL (Elige Opción A o B)

#### ✅ OPCIÓN A: Con Docker Compose (La más rápida si Docker está instalado)
Desde la raíz del proyecto clonado:
```bash
docker compose up -d postgres
```
- Esto levanta PostgreSQL 16 en el puerto host **`5434`** (evita cualquier conflicto con Postgres local).
- Comprueba que esté activo:
  ```bash
  docker ps
  ```

#### ✅ OPCIÓN B: Con PostgreSQL Nativo de Linux (Sin Docker)
Si la máquina de Campus tiene PostgreSQL instalado directamente como servicio del sistema (puerto estándar `5432`):
```bash
# 1. Asegurar que el servicio esté corriendo
sudo systemctl start postgresql

# 2. Crear usuario postgres con clave postgres y la base de datos
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE renta_herramientas_db OWNER postgres;"
```
> **Nota de puerto en Opción B:** Como el PostgreSQL nativo usa el puerto `5432` (y el archivo `application.yml` tiene por defecto `5434`), al iniciar la app solo defines la variable de entorno:
> `export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/renta_herramientas_db`

---

### 1.3. Permisos de Ejecución y Compilación Maven
El repositorio ya tiene `backend/mvnw` configurado con permisos ejecutables y saltos de línea Unix (LF). No obstante, para garantizar:
```bash
cd backend
chmod +x mvnw
```

Ejecutar pruebas unitarias para validar que todo compile:
```bash
./mvnw clean test
```
> Verás: `BUILD SUCCESS` (los 8 módulos compilados y 21 tests de rental en verde).

---

### 1.4. Iniciar el Backend Spring Boot
Desde la carpeta `backend`:
```bash
# Si usaste Docker (puerto 5434):
./mvnw spring-boot:run -pl bootstrap

# Si usaste Postgres nativo de Linux (puerto 5432):
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/renta_herramientas_db ./mvnw spring-boot:run -pl bootstrap
```

El servidor arrancará en: **`http://localhost:8085`**
- **Swagger UI interactivo:** [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html)
- Flyway aplicará automáticamente todas las migraciones (`V1` a `V6`).

---

## 📮 2. Paso a Paso en Postman y Capturas

En Postman, puedes importar la colección oficial incluida en el proyecto:
- Archivo: `docs/postman_collection.json`
- Variable de colección `baseUrl`: `http://localhost:8085`

---

### Paso A: Login y Obtención de Token JWT
Antes de llamar a cualquier endpoint protegido, necesitas el token de autenticación.

* **Método y URL:** `POST http://localhost:8085/api/v1/auth/login`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**
```json
{
  "username": "prov_maquinaria_bog",
  "password": "Password123*"
}
```
* **Respuesta (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwcm92X21hcXVpbmFyaWFfYm9nIiwiZXhwIjoxNzk...",
  "type": "Bearer",
  "username": "prov_maquinaria_bog",
  "roles": ["ROLE_PROVEEDOR"]
}
```
> **Acción:** Copia el valor de `token`. En las siguientes peticiones, agrégalo en la pestaña **Headers** como:  
> `Authorization: Bearer <TOKEN_COPIADO>`  
> *(O en la pestaña **Auth** seleccionando Type: **Bearer Token**)*.

---

### Paso B: Crear Reserva PENDING de Prueba
Para poder aprobarla y rechazarla, creamos una reserva inicial con el cliente Carlos Gómez.

* **1. Obtener Token de Cliente:**
  `POST http://localhost:8085/api/v1/auth/login`
  ```json
  {
    "username": "cliente_carlos_gomez",
    "password": "Password123*"
  }
  ```
  *(Copia este token de cliente temporalmente)*.

* **2. Crear la Reserva:**
  `POST http://localhost:8085/api/v1/rentals`
  * **Headers:**
    - `Authorization: Bearer <TOKEN_CLIENTE>`
    - `Content-Type: application/json`
  * **Body (raw JSON):**
  ```json
  {
    "clientId": "e0000000-0000-0000-0000-000000000001",
    "startDate": "2026-11-01",
    "endDate": "2026-11-05",
    "toolIds": [
      "11111111-0000-0000-0000-000000000001"
    ],
    "deliveryAddress": "Calle 100 # 15-20, Obra Torre Norte, Bogotá",
    "contactPhone": "+57 300 123 4567"
  }
  ```
* **Respuesta (201 Created):**
  Anota el `"id"` devuelto (ejemplo: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`) y el `"rentalCode"` (`RNT-XXXXXX`). El estado inicial es **`PENDING`**.

> 💡 **Atajo SQL alternativo:** Si no quieres hacer la llamada de cliente, puedes insertar una reserva PENDING directamente en PostgreSQL ejecutando:
> ```sql
> INSERT INTO rentals (id, rental_code, client_id, start_date, end_date, total_days, subtotal, deposit, total_amount, status, created_at, updated_at)
> VALUES ('a1b2c3d4-e5f6-7890-abcd-1234567890ab', 'RNT-EXAMEN-001', 'e0000000-0000-0000-0000-000000000001', '2026-11-01', '2026-11-05', 4, 340000.00, 480000.00, 820000.00, 'PENDING', NOW(), NOW());
> 
> INSERT INTO rental_items (id, rental_id, tool_id, daily_price, total_price, status)
> VALUES ('b1b2c3d4-e5f6-7890-abcd-1234567890ab', 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', '11111111-0000-0000-0000-000000000001', 85000.00, 340000.00, 'RESERVED');
> ```

---

### 📸 CAPTURA 1: Aprobar Reserva Exitosa (`POST .../aprobar`)
*(Cumple requisito: "Captura de Postman mostrando una llamada exitosa a .../aprobar y el JSON de respuesta")*

1. **Método y URL:**
   `POST http://localhost:8085/api/reservas/a1b2c3d4-e5f6-7890-abcd-1234567890ab/aprobar`
   *(Reemplaza el UUID por el de tu reserva creada)*
2. **Headers:**
   - `Authorization: Bearer <TOKEN_PROVEEDOR>`
3. **Body:** *(Vacío / None)*
4. **Respuesta Esperada:**
   - **Status:** `200 OK`
   - **JSON:**
   ```json
   {
     "id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
     "rentalCode": "RNT-EXAMEN-001",
     "clientId": "e0000000-0000-0000-0000-000000000001",
     "startDate": "2026-11-01",
     "endDate": "2026-11-05",
     "totalDays": 4,
     "subtotal": 340000.00,
     "deposit": 480000.00,
     "totalAmount": 820000.00,
     "status": "CONFIRMED",
     "items": [
       {
         "id": "b1b2c3d4-e5f6-7890-abcd-1234567890ab",
         "toolId": "11111111-0000-0000-0000-000000000001",
         "dailyPrice": 85000.00,
         "totalPrice": 340000.00,
         "status": "RESERVED"
       }
     ],
     "deliveryAddress": "Calle 100 # 15-20, Obra Torre Norte, Bogotá",
     "contactPhone": "+57 300 123 4567",
     "rejectionReason": null
   }
   ```
📷 **Qué debe verse en tu captura:**
- Método `POST` y la URL `/api/reservas/{id}/aprobar`.
- El recuadro verde de Status: `200 OK`.
- El campo `"status": "CONFIRMED"` en el JSON de respuesta.

---

### 📸 CAPTURA 2: Evidencia en Base de Datos (DBeaver o psql)
*(Cumple requisito: "Captura de la base de datos (DBeaver/pgAdmin) mostrando el estado de la reserva cambiado de PENDIENTE a APROBADA")*

Abre DBeaver (o una terminal con `docker exec -it renta_herramientas_postgres psql -U postgres -d renta_herramientas_db`) y ejecuta:

```sql
SELECT id, rental_code, status, total_amount, updated_at 
FROM rentals 
WHERE rental_code = 'RNT-EXAMEN-001';
```

Resultado visible:
| id | rental_code | status | total_amount | updated_at |
| :--- | :--- | :--- | :--- | :--- |
| `a1b2c3d4-...` | `RNT-EXAMEN-001` | **`CONFIRMED`** | `820000.00` | `2026-10-25 21:10:00` |

Y para impresionar al profesor con la auditoría implementada:
```sql
SELECT rental_id, from_status, to_status, changed_by, changed_at, notes
FROM rental_status_history
WHERE rental_id = 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';
```

📷 **Qué debe verse en tu captura:**
- La cuadrícula de DBeaver con la consulta SQL arriba y la fila resaltada con `status` = `CONFIRMED`.

---

### 📸 CAPTURA 3: Rechazar Reserva con Motivo (`POST .../rechazar`)
*(Cumple requisito: "Captura de Postman mostrando una llamada exitosa a .../rechazar")*

Crea una segunda reserva de prueba (o cambia una a `PENDING` para rechazarla).

1. **Método y URL:**
   `POST http://localhost:8085/api/reservas/{id_de_la_reserva}/rechazar`
2. **Headers:**
   - `Authorization: Bearer <TOKEN_PROVEEDOR>`
   - `Content-Type: application/json`
3. **Body (raw JSON):**
   ```json
   {
     "reason": "Herramienta comprometida en mantenimiento preventivo no programado"
   }
   ```
4. **Respuesta Esperada:**
   - **Status:** `200 OK`
   - **JSON:**
   ```json
   {
     "id": "c2d3e4f5-...",
     "rentalCode": "RNT-EXAMEN-002",
     "status": "REJECTED",
     "rejectionReason": "Herramienta comprometida en mantenimiento preventivo no programado"
   }
   ```
📷 **Qué debe verse en tu captura:**
- Método `POST` y la URL `/api/reservas/{id}/rechazar`.
- El recuadro verde de Status: `200 OK`.
- El campo `"status": "REJECTED"`.
- El campo `"rejectionReason"` con el motivo enviado en el body.

---

### 🌟 CAPTURAS EXTRA: Para Asegurar Calificación Impecable (5.0)

Si el profesor te pide pruebas de robustez o validaciones de reglas de negocio:

#### 1. Intento de Aprobar una Reserva ya Aprobada (`400 Bad Request`)
Vuelve a enviar `POST .../aprobar` sobre la misma reserva que ya aprobaste:
- **Status:** `400 Bad Request`
- **JSON:**
  ```json
  {
    "status": 400,
    "error": "Bad Request",
    "message": "Solo se pueden aprobar reservas PENDIENTES (estado actual: CONFIRMED).",
    "timestamp": "2026-10-25T21:15:00"
  }
  ```

#### 2. Conflicto de Disponibilidad por Cruce de Fechas (`409 Conflict`)
Intenta aprobar una reserva con fechas que se solapan con otra reserva confirmada sobre la misma herramienta:
- **Status:** `409 Conflict` (¡No es 400 genérico, es 409 Conflict!)
- **JSON:**
  ```json
  {
    "status": 409,
    "error": "Conflict",
    "message": "La herramienta Martillo Demoledor Hexagonal 30kg ya tiene otra reserva aprobada en esas fechas",
    "timestamp": "2026-10-25T21:16:00"
  }
  ```

#### 3. Historial Completo de Trazabilidad (`GET .../historial`)
- **Método y URL:** `GET http://localhost:8085/api/reservas/{id}/historial`
- **Status:** `200 OK`
- **JSON:**
  ```json
  [
    {
      "fromStatus": null,
      "toStatus": "PENDING",
      "changedBy": "CLIENT",
      "notes": "Creación de reserva"
    },
    {
      "fromStatus": "PENDING",
      "toStatus": "CONFIRMED",
      "changedBy": "SYSTEM",
      "notes": "Reserva aprobada"
    }
  ]
  ```

#### 4. Calendario de Ocupación de la Herramienta (`GET /calendar`)
- **Método y URL:** `GET http://localhost:8085/api/v1/tools/11111111-0000-0000-0000-000000000001/calendar`
- **Status:** `200 OK`
- Muestra el array `bookedRanges` con las fechas exactas en que la herramienta está ocupada durante el año.

---

## 🚀 3. Entrega en Git desde Terminal Linux

Al terminar tus pruebas, realiza el commit y push desde Linux:

```bash
# 1. Ver qué archivos se modificaron
git status

# 2. Agregar todos los cambios
git add .

# 3. Hacer el commit con mensaje claro
git commit -m "feat: implementacion aprobacion y rechazo de reservas segun examen"

# 4. Enviar a GitHub
git push origin develop
```

---

## 🔧 4. Solución Rápida a Problemas Típicos de Linux

| Síntoma en Linux | Causa Común | Solución Inmediata |
| :--- | :--- | :--- |
| `bash: ./mvnw: Permission denied` | Falta el bit ejecutable | Ejecuta: `chmod +x backend/mvnw` |
| `/bin/sh^M: bad interpreter` | Saltos de línea Windows CRLF | Ejecuta: `sed -i 's/\r$//' backend/mvnw` o `dos2unix backend/mvnw` |
| `Connection refused: localhost:5434` | El contenedor Docker no está encendido | Ejecuta: `docker compose up -d postgres` |
| `Connection refused: localhost:5432` | El servicio PostgreSQL de Linux está apagado | Ejecuta: `sudo systemctl restart postgresql` |
| `Port 8085 is already in use` | Otra instancia de Spring Boot quedó abierta | Ejecuta: `sudo lsof -i :8085` y luego `kill -9 <PID>` |
| `403 Forbidden` al aprobar o rechazar | Estás usando el token de cliente o de otro proveedor | Haz login con `prov_maquinaria_bog` / `Password123*` y usa su token |
