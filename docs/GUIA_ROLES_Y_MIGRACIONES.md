# Guía de Cambios Frecuentes: Roles de Usuario y Base de Datos (Flyway)

Documento de apoyo para tareas de mantenimiento y posibles variaciones de examen sobre el backend de la
**Plataforma de Renta de Herramientas** (Spring Boot + PostgreSQL + Flyway + JWT).

> **Datos de entorno usados en esta guía:**  
> - **API:** `http://localhost:8085`  
> - **PostgreSQL:** Puerto `5434` (Docker) o `5432` (Linux nativo)  
> - **Base de datos:** `renta_herramientas_db`  
> - **Usuario / Clave:** `postgres` / `postgres`  
> - **Contenedor:** `renta_herramientas_postgres`  
> - **Credenciales de prueba:** Ver [GUIA_RAPIDA_EXAMEN.md](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/docs/GUIA_RAPIDA_EXAMEN.md).

---

## 📑 Índice
1. [Parte 1. Cambiar el Rol de un Usuario desde Swagger / Postman](#parte-1-cambiar-el-rol-de-un-usuario-desde-swagger--postman)
   - [Reglas y Funcionamiento](#cómo-funciona-en-este-proyecto)
   - [Procedimiento Paso a Paso (Carlos Gómez a ADMIN)](#procedimiento-ejemplo-carlos-gómez-de-cliente-a-administrador)
   - [Diagnóstico de Errores Comunes](#puntos-que-suelen-hacer-fallar)
   - [Variación de Examen: "Solo un Administrador"](#si-el-enunciado-trae-una-regla-extra-ej-solo-puede-haber-un-administrador)
2. [Parte 2. Modificaciones de Base de Datos con Flyway](#parte-2-cambiar-la-base-de-datos-flyway)
   - [Reglas de Oro del Proyecto](#reglas-de-oro-de-este-proyecto)
   - [Flujo Completo de Nueva Migración](#flujo-completo-para-agregar-o-modificar-algo)
   - [Plantillas SQL Idempotentes](#plantillas-de-sql)
   - [Problemas Frecuentes y Diagnóstico](#problemas-frecuentes)
   - [Comandos de Reinicio y Acceso psql](#reiniciar-la-base-desde-cero-solo-en-desarrollo)

---

## Parte 1. Cambiar el rol de un usuario desde Swagger / Postman

### Cómo funciona en este proyecto

- El endpoint es **`PUT /api/v1/users/{id}`** y está protegido con `@PreAuthorize("hasRole('ADMIN')")`.
- Solo un **ADMIN** puede cambiar roles. Con un token de cliente o proveedor la respuesta es:
  `"Acceso denegado: no tiene permisos para acceder a este recurso."` (**403 Forbidden**).
- El registro público (`POST /api/v1/auth/register`) **no permite** auto-asignarse `ROLE_ADMIN`.
- Un administrador **no puede quitarse a sí mismo** el rol `ROLE_ADMIN` (control antifail para no dejar el sistema huérfano).
- No existe límite en la cantidad de administradores simultáneos.
- Roles válidos: `ROLE_ADMIN`, `ROLE_PROVEEDOR`, `ROLE_CLIENTE`.

---

### Procedimiento (Ejemplo: Carlos Gómez de cliente a administrador)

#### 1. Iniciar sesión como ADMIN
`POST http://localhost:8085/api/v1/auth/login`
```json
{
  "username": "admin_principal",
  "password": "Password123*"
}
```

#### 2. Copiar el Token JWT
Copia el campo `token` y en Swagger pulsa **Authorize** (o en Postman agrega el header `Authorization: Bearer <TOKEN>`).

#### 3. Consultar ID del usuario a modificar
`GET http://localhost:8085/api/v1/users`
Localiza a `cliente_carlos_gomez` (ID de semilla: `c0000000-0000-0000-0000-000000000001`).

#### 4. Ejecutar el cambio de rol
`PUT http://localhost:8085/api/v1/users/c0000000-0000-0000-0000-000000000001`
* **Headers:** `Authorization: Bearer <TOKEN_ADMIN>`, `Content-Type: application/json`
* **Body:**
```json
{
  "email": "carlos.gomez@constructora.com",
  "roles": ["ROLE_ADMIN"]
}
```

#### 5. Verificar el cambio
* **En la respuesta:** Status `200 OK` con `"roles": ["ROLE_ADMIN"]`.
* **En Base de Datos (DBeaver / psql):**
```sql
SELECT u.id, u.username, u.email, r.name as rol
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.username = 'cliente_carlos_gomez';
```

---

### Puntos que suelen hacer fallar

| Síntoma | Causa | Solución |
|---|---|---|
| **403 Forbidden** | Token sin rol ADMIN, sin Authorize o vencido | Repetir login como `admin_principal` y volver a autorizar |
| **400 Bad Request** por correo | Falta el campo `email` (es obligatorio) o formato inválido | Enviar el correo actual del usuario en el body |
| **400 Bad Request** "Rol inválido" | Nombre de rol mal escrito | Usar exactamente `ROLE_ADMIN`, `ROLE_PROVEEDOR` o `ROLE_CLIENTE` |
| El usuario sigue viéndose como cliente | El rol viaja dentro de los claims del JWT | El usuario debe volver a iniciar sesión para generar un nuevo JWT con su nuevo rol |
| El usuario perdió su rol anterior | La lista `roles` **reemplaza** el conjunto completo | Si debe ser proveedor Y admin, enviar: `["ROLE_PROVEEDOR", "ROLE_ADMIN"]` |

---

### Si el enunciado trae una regla extra (ej. "solo puede haber un administrador")

Esa regla **no existe** por defecto en este proyecto, pero si el examen la llega a solicitar:

1. **Ubicación en el código:** `backend/identity/src/main/java/com/campus/rentaequipos/identity/application/usecase/AuthUseCase.java` en el método `updateUser`.
2. **Implementación recomendada:**
   ```java
   if (newRoles.contains(Role.ROLE_ADMIN)) {
       long adminCount = userRepository.findAll().stream()
               .filter(u -> u.getRoles().contains(Role.ROLE_ADMIN) && !u.getId().equals(id))
               .count();
       if (adminCount >= 1) {
           throw new BusinessRuleViolationException("Solo puede existir un único Administrador en el sistema");
       }
   }
   ```
3. **Distinción técnica de errores:**
   - Un **403** es falta de permisos de seguridad en el JWT.
   - Un **400 / 409** con mensaje descriptivo es una regla de negocio del caso de uso.

---

## Parte 2. Cambiar la base de datos (Flyway)

### Reglas de oro de este proyecto

- `HIBERNATE_DDL_AUTO` vale **`none`**: Hibernate **no crea ni modifica** tablas ni columnas en producción o en ejecución real. Si agregas un atributo a una entidad JPA y no creas la migración en Flyway, la aplicación fallará con `PSQLException: column "..." does not exist`.
- Flyway está activo y las migraciones viven en:
  `backend/bootstrap/src/main/resources/db/migration/`.
- **Historial de migraciones del proyecto:**
  - `V1__create_schema.sql` (Esquema base 4FN)
  - `V2__seed_data.sql` (Datos iniciales de prueba)
  - `V3__warranty_claims.sql` (Garantías)
  - `V4__user_notifications.sql` (Notificaciones)
  - `V5__add_rental_delivery_info.sql` (Dirección de entrega y teléfono)
  - `V6__rental_exam_enhancements.sql` (Motivo de rechazo, versión para concurrencia optimista y tabla `rental_status_history`)
  - **👉 La siguiente migración que debes crear en el examen es: `V7__<nombre>.sql`**.
- **NUNCA edites una migración ya ejecutada (`V1`–`V6`).** Con `validate-on-migrate: false` Flyway no alertará, pero tampoco la volverá a correr. Crea siempre un archivo con la versión consecutiva siguiente.

---

### Flujo completo para agregar o modificar algo

1. **Crear el archivo SQL:**
   `backend/bootstrap/src/main/resources/db/migration/V7__descripcion_corta.sql`  
   *(Formato estricto: `V` mayúscula, número de versión consecutivo, dos guiones bajos `__`, nombre en minúsculas con guiones bajos, extensión `.sql`)*.
2. **Escribir SQL idempotente:**
   Usar `IF NOT EXISTS` y `ON CONFLICT DO NOTHING`.
3. **Actualizar el código Java en este orden (Arquitectura Hexagonal):**
   - Entidad JPA (`...JpaEntity`): agregar `@Column`.
   - Modelo de dominio (ej. `Rental`, `Tool`, etc.): agregar campo inmutable y getter.
   - Adaptador de persistencia (`...RepositoryAdapter`): mapear en `toDomain()` y `toEntity()`.
   - DTOs: agregar al record de request y response.
   - Caso de uso y controlador: agregar la lógica o exponer en el endpoint.
4. **Reiniciar la aplicación.** Flyway detecta el archivo y aplica la migración automáticamente al arrancar.
5. **Verificar en Base de Datos:**
   ```sql
   SELECT installed_rank, version, description, success, installed_on
   FROM flyway_schema_history
   ORDER BY installed_rank DESC;
   ```
   La última fila debe mostrar `success = true`.

---

### Plantillas de SQL Idempotentes

#### 1. Agregar una columna opcional:
```sql
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS observation VARCHAR(500);
```

#### 2. Agregar una columna obligatoria con valor por defecto:
```sql
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL';
```

#### 3. Crear una tabla nueva con clave foránea e índice:
```sql
CREATE TABLE IF NOT EXISTS tool_maintenance_records (
    id UUID PRIMARY KEY,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    performed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_maintenance_tool_id 
    ON tool_maintenance_records(tool_id);
```

#### 4. Modificar el tipo o longitud de una columna existente:
```sql
ALTER TABLE rentals ALTER COLUMN contact_phone TYPE VARCHAR(50);
```

---

### Problemas Frecuentes

| Problema | Causa probable | Qué hacer |
|---|---|---|
| `column "x" does not exist` al arrancar | Falta la migración SQL o no se reinició Spring Boot | Crear la migración `V7` y reiniciar la app |
| La migración no se ejecuta | Nombre mal escrito (`V7_` con 1 solo guion bajo o en otra carpeta) | Verificar que tenga dos guiones bajos `__` y esté en `backend/bootstrap/.../db/migration/` |
| `success = false` en `flyway_schema_history` | Error de sintaxis SQL dentro de la migración | Corregir el SQL, borrar la fila fallida en `flyway_schema_history` o recrear la BD |
| Modifiqué `V1` o `V2` y no hizo nada | Flyway no vuelve a ejecutar migraciones ya registradas | Revertir el archivo anterior y crear la nueva versión consecutiva |
| Error de foreign key al borrar | Restricciones `ON DELETE RESTRICT` | Usar borrado lógico (`enabled = false` o `status = 'RETIRED'`) |

---

### Reiniciar la base desde cero (Entorno de desarrollo)

Si la base de datos se corrompe durante las pruebas, puedes recrearla limpiamente con:

```bash
# Con Docker:
docker compose down -v
docker compose up -d postgres

# Con PostgreSQL nativo en Linux:
sudo -u postgres psql -c "DROP DATABASE renta_herramientas_db;"
sudo -u postgres psql -c "CREATE DATABASE renta_herramientas_db OWNER postgres;"
```
Al arrancar Spring Boot, Flyway ejecutará desde `V1` hasta la última versión y dejará la base de datos 100% limpia y funcional.

---

### Acceso Directo por Consola a la Base de Datos

```bash
# Si usas Docker:
docker exec -it renta_herramientas_postgres psql -U postgres -d renta_herramientas_db

# Si usas Postgres nativo en Linux:
psql -h localhost -p 5432 -U postgres -d renta_herramientas_db
```
Comandos rápidos dentro de `psql`:
- `\dt` : Listar todas las tablas.
- `\d rentals` : Ver columnas y tipos de la tabla `rentals`.
- `\q` : Salir.
