# 🚀 Guía Rápida para el Examen: Gestión de Reservas y Alquileres

Documento de referencia inmediata para presentar la prueba técnica de Spring Boot en Campus Lands. Contiene credenciales, endpoints exactos, ejemplos de JSON para Postman, consultas SQL de comprobación y reglas de negocio implementadas.

---

## 🔑 1. Credenciales de Prueba

Todas las cuentas usan la contraseña: **`Password123*`**

| Rol | Usuario | Correo | ID Perfil (BD) |
| :--- | :--- | :--- | :--- |
| **PROVEEDOR** | `prov_maquinaria_bog` | `contacto@maquinariabogota.com` | `d0000000-0000-0000-0000-000000000001` |
| **CLIENTE 1** | `cliente_carlos_gomez` | `carlos.gomez@constructora.com` | `c1000000-0000-0000-0000-000000000001` |
| **ADMIN** | `admin_principal` | `admin@rentaequipos.com` | N/A |

### ⚡ Obtener Token JWT en Postman:
`POST http://localhost:8085/api/v1/auth/login`
```json
{
  "username": "prov_maquinaria_bog",
  "password": "Password123*"
}
```
*Copia el token del response (`token`) y úsalo en el Header `Authorization: Bearer <TOKEN>`.*

---

## 📌 2. Endpoints Clave del Examen

### A. Aprobar Reserva (`PENDING` → `CONFIRMED`)
* **Método y URL:** `POST http://localhost:8085/api/reservas/{id}/aprobar`
* **Alias estándar:** `POST http://localhost:8085/api/v1/rentals/{id}/aprobar`
* **Permisos:** Rol `PROVEEDOR` (dueño de los equipos) o `ADMIN`.
* **Reglas de negocio validadas:**
  1. La reserva debe estar en estado `PENDING`. Si no, lanza `400 Bad Request` con mensaje de regla de negocio.
  2. Valida que las herramientas asociadas no estén en `MAINTENANCE` ni `RETIRED`.
  3. Revalida que no existan otras reservas activas (`CONFIRMED` o `IN_PROGRESS`) que se solapen en las mismas fechas. Si hay solapamiento, lanza `409 Conflict` (`HerramientaNoDisponibleException`).

---

### B. Rechazar Reserva (`PENDING` → `REJECTED`)
* **Método y URL:** `POST http://localhost:8085/api/reservas/{id}/rechazar`
* **Alias estándar:** `POST http://localhost:8085/api/v1/rentals/{id}/rechazar`
* **Permisos:** Rol `PROVEEDOR` (dueño de los equipos) o `ADMIN`.
* **Reglas de negocio validadas:**
  1. Solo se pueden rechazar reservas en estado `PENDING`. Si no, lanza `400 Bad Request`.
  2. Pasa el estado a `REJECTED` y no bloquea el inventario.

---

### C. Listar Reservas y Filtrar por Estado
* **Por estado general:** `GET http://localhost:8085/api/reservas?status=PENDING`
* **Endpoint específico de pendientes:** `GET http://localhost:8085/api/reservas/pendientes`
* **Por proveedor con filtro:** `GET http://localhost:8085/api/v1/rentals/provider/{providerId}?status=PENDING`
* **Permisos:** Proveedor logueado o Admin.

---

### D. Cancelación con Regla de Negocio (24 Horas)
* **Método y URL:** `PATCH http://localhost:8085/api/v1/rentals/{id}/cancel`
* **Permisos:** `CLIENTE` dueño, `PROVEEDOR` o `ADMIN`.
* **Regla de negocio:**
  - Si el **Cliente** intenta cancelar y faltan menos de 24 horas para la fecha de inicio (`startDate`), el sistema bloquea la acción lanzando `BusinessRuleViolationException` (`400 Bad Request`).
  - No se pueden cancelar reservas en estado `IN_PROGRESS` o `COMPLETED`.

---

### E. Inspección Técnica sobre la Reserva
* **Método y URL:** `POST http://localhost:8085/api/v1/rentals/{id}/inspection`
* **Headers:** `Authorization: Bearer <TOKEN>` (Proveedor o Admin), `Content-Type: application/json`
* **Body:**
```json
{
  "inspectionType": "RETURN",
  "status": "DAMAGED",
  "inspectorNotes": "Se evidencia fractura en la carcasa por caída en obra.",
  "inspectorUserId": "d0000000-0000-0000-0000-000000000001"
}
```
* **Efecto automático:**
  - Si `status == "DAMAGED"`, las herramientas asociadas pasan automáticamente a estado **`MAINTENANCE`**.
  - Si `status == "PASSED"`, las herramientas retornan a estado **`AVAILABLE`**.

---

### F. Recargo por Devolución Tardía en Devolución (`complete`)
* **Método y URL:** `PATCH http://localhost:8085/api/v1/rentals/{id}/complete`
* **Consulta previa del recargo:** `GET http://localhost:8085/api/v1/rentals/{id}/late-fee`
* **Regla:**
  - Si la devolución se realiza cuando `LocalDate.now() > endDate`, calcula automáticamente los días de retraso:
    $$\text{Recargo} = \text{días de retraso} \times \text{tarifa diaria total} \times 1.5$$
  - Suma este valor directamente al `totalAmount` de la reserva y libera las herramientas.

---

### G. Resumen del Proveedor (`summary`)
* **Método y URL:** `GET http://localhost:8085/api/v1/rentals/provider/{providerId}/summary`
* **Respuesta JSON:**
```json
{
  "providerId": "d0000000-0000-0000-0000-000000000001",
  "totalRentals": 5,
  "countByStatus": {
    "PENDING": 1,
    "CONFIRMED": 2,
    "COMPLETED": 2
  },
  "totalCompletedIncome": 640000.00
}
```

---

### H. Extender Reserva
* **Método y URL:** `PATCH http://localhost:8085/api/v1/rentals/{id}/extend`
* **Body:**
```json
{
  "newEndDate": "2026-11-15"
}
```
* **Regla:** Valida máximo 30 días acumulados, valida solapamiento de fechas solo en el nuevo tramo adicional y recalcula subtotales con descuentos escalonados.

---

## 🗄️ 3. Consultas SQL Rápidas para DBeaver / pgAdmin

### Conexión a Base de Datos:
* **Host:** `localhost`
* **Puerto:** `5434`
* **Database:** `renta_herramientas_db`
* **User / Password:** `postgres` / `postgres`

### Ver todas las reservas con estado y cliente:
```sql
SELECT r.id, r.rental_code, r.start_date, r.end_date, r.total_amount, r.status, cp.full_name as cliente
FROM rentals r
JOIN client_profiles cp ON r.client_id = cp.id
ORDER BY r.start_date DESC;
```

### Comprobar cambio de estado después de aprobar o rechazar:
```sql
SELECT id, rental_code, status, total_amount FROM rentals WHERE rental_code = 'RNT-20261025-001';
```

### Ver estado de las herramientas del catálogo:
```sql
SELECT id, name, brand, model, daily_price, status 
FROM tools 
ORDER BY name;
```

---

## 🛠️ 4. Comandos de Compilación y Ejecución

* **Compilar y correr todos los tests:**
  ```powershell
  cd backend
  .\mvnw.cmd test
  ```
* **Iniciar backend Spring Boot:**
  ```powershell
  cd backend
  .\mvnw.cmd spring-boot:run -pl bootstrap
  ```
* **Swagger UI interactivo:** [http://localhost:8085/swagger-ui.html](http://localhost:8085/swagger-ui.html)
