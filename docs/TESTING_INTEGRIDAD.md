# Guía Paso a Paso para Pruebas de Integridad del Sistema ToolRent

Este documento detalla el procedimiento exhaustivo para verificar la **integridad funcional, de datos, de reglas de negocio, de seguridad y de integración** entre la arquitectura hexagonal de **Spring Boot 3 + PostgreSQL 16** y el frontend reactivo desacoplado en **Vite + Tailwind CSS v3**.

---

## 📋 Tabla de Contenidos
1. [Prerrequisitos y Verificación de Servicios](#1-prerrequisitos-y-verificación-de-servicios)
2. [Matriz de Cuentas y Credenciales de Prueba](#2-matriz-de-cuentas-y-credenciales-de-prueba)
3. [Fase 1: Verificación de Integridad de la Base de Datos y Backend](#fase-1-verificación-de-integridad-de-la-base-de-datos-y-backend)
4. [Fase 2: Pruebas del Catálogo Público (Sin Autenticación)](#fase-2-pruebas-del-catálogo-público-sin-autenticación)
5. [Fase 3: Flujo Completo de Alquiler, Reglas de Negocio y Facturación (Rol: CLIENTE)](#fase-3-flujo-completo-de-alquiler-reglas-de-negocio-y-facturación-rol-cliente)
6. [Fase 4: Flujo Operativo y Gestión de Inventario Completo (Rol: PROVEEDOR)](#fase-4-flujo-operativo-y-gestión-de-inventario-completo-rol-proveedor)
7. [Fase 5: Supervisión, Analítica, Verificación y Usuarios (Rol: ADMIN)](#fase-5-supervisión-analítica-verificación-y-usuarios-rol-admin)
8. [Fase 6: Pruebas de Seguridad (RBAC, Anti-IDOR Cruzado y Sesión)](#fase-6-pruebas-de-seguridad-rbac-anti-idor-cruzado-y-sesión)
9. [Fase 7: Verificación de Responsividad, Compilación y Empaquetado](#fase-7-verificación-de-responsividad-compilación-y-empaquetado)
10. [Checklist Final de Aceptación](#10-checklist-final-de-aceptación)

---

## 1. Prerrequisitos y Verificación de Servicios

Antes de iniciar las pruebas, comprueba que los contenedores de Docker y el servidor de desarrollo web estén activos:

### 1.1. Verificar Contenedores Docker
Abre una terminal y ejecuta:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
**Resultado esperado:**
- `renta_herramientas_postgres`: Estado `Up`, puerto `0.0.0.0:5434->5432/tcp`.
- `renta_herramientas_app`: Estado `Up`, puerto `0.0.0.0:8085->8080/tcp`.

Si no están encendidos, ejecútalos con:
```bash
docker-compose up -d --build
```

### 1.2. Probar Ping de Salud de la API
Ejecuta en terminal:
```bash
curl -s http://localhost:8085/api/v1/health
```
**Respuesta esperada:**
```json
{"status":"UP","application":"renta-equipos-api"}
```

### 1.3. Iniciar el Frontend Web
En una terminal separada, ingresa al directorio `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Acceso en el navegador: 👉 **`http://localhost:5173/`**

---

## 2. Matriz de Cuentas y Credenciales de Prueba

La base de datos PostgreSQL se encuentra poblada con cuentas maestras y de prueba creadas mediante las migraciones de Flyway (`V2__seed_data.sql`).

> **Contraseña universal para todas las cuentas de prueba:** `Password123*`

| Rol del Sistema | Nombre de Usuario (`username`) | Correo Electrónico | Perfil Comercial Asociado | Panel Principal |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | `admin_principal` | `admin@rentaequipos.com` | N/A (Acceso Total de Sistema) | `#/admin` |
| **PROVEEDOR** | `prov_maquinaria_bog` | `contacto@maquinariabogota.com` | Maquinaria Bogotá S.A.S. | `#/provider` |
| **PROVEEDOR #2** | `prov_equipos_med` | `ventas@equiposmedellin.com` | Equipos Medellín Ltda. | `#/provider` |
| **CLIENTE** | `cliente_carlos_gomez` | `carlos.gomez@constructora.com` | Constructora Gómez & Asoc. | `#/client` |
| **CLIENTE #2** | `cliente_maria_rodriguez` | `maria.rodriguez@ingenieria.com` | M&R Ingeniería Civil | `#/client` |

---

## Fase 1: Verificación de Integridad de la Base de Datos y Backend

### Paso 1.1: Revisión de Swagger UI
1. Abre tu navegador en: `http://localhost:8085/swagger-ui.html`
2. Verifica que se listen todos los controladores REST documentados con OpenAPI:
   - `auth-controller`
   - `users-controller`
   - `clients-controller`
   - `providers-controller`
   - `tools-controller`
   - `rentals-controller`
   - `inspections-controller`
   - `billing-controller`
   - `reporting-controller`

### Paso 1.2: Ejecución de la Suite de Pruebas Unitarias de Spring Boot
Ejecuta en la raíz o en `backend/`:
```bash
cd backend
./mvnw clean test
```
*(En Windows: `mvnw.cmd clean test`)*
- **Criterio de éxito:** `BUILD SUCCESS` con 0 fallos (`Failures: 0, Errors: 0`).

### Paso 1.3: Auditoría de Volumen de Datos Semilla (>= 20 registros por entidad en 4FN)
Ejecuta en terminal una consulta SQL directa contra el contenedor de PostgreSQL para demostrar el cumplimiento del requisito de población mínima por tabla en Cuarta Forma Normal:
```bash
docker exec -it renta_herramientas_postgres psql -U postgres -d renta_herramientas_db -c "
SELECT 'users' AS entidad, COUNT(*) AS total FROM users UNION ALL
SELECT 'client_profiles', COUNT(*) FROM client_profiles UNION ALL
SELECT 'provider_profiles', COUNT(*) FROM provider_profiles UNION ALL
SELECT 'categories', COUNT(*) FROM categories UNION ALL
SELECT 'tools', COUNT(*) FROM tools UNION ALL
SELECT 'tool_images', COUNT(*) FROM tool_images UNION ALL
SELECT 'tool_specifications', COUNT(*) FROM tool_specifications UNION ALL
SELECT 'rentals', COUNT(*) FROM rentals UNION ALL
SELECT 'rental_items', COUNT(*) FROM rental_items UNION ALL
SELECT 'payments', COUNT(*) FROM payments UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices UNION ALL
SELECT 'rental_inspections', COUNT(*) FROM rental_inspections UNION ALL
SELECT 'damage_reports', COUNT(*) FROM damage_reports;"
```
- **Criterio de éxito:** Todas las entidades principales retornan un conteo $\ge$ 20 registros (42 usuarios, 20 perfiles de cliente, 20 perfiles de proveedor, 20 categorías, 25 herramientas, 22 reservas, 22 pagos, 20 facturas, 20 inspecciones, 20 reportes de daño).

### Paso 1.4: Importación y Prueba de Colección Postman
1. Abre Postman e importa la colección: [`docs/postman_collection.json`](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/docs/postman_collection.json).
2. Ejecuta la petición **Login** en la carpeta de *Autenticación*.
3. Verifica que el script integrado capture automáticamente el token JWT en la variable `{{token}}` y que las peticiones protegidas subsiguientes funcionen con Bearer Auth.

---

## Fase 2: Pruebas del Catálogo Público (Sin Autenticación)

El catálogo debe permitir la navegación y búsqueda libre a cualquier visitante sin exigir credenciales iniciales.

### Paso 2.1: Navegación y Renderizado del Catálogo
1. Ingresa a `http://localhost:5173/`.
2. Observa la barra de navegación con el logotipo de ToolRent, buscador en tiempo real, selector de vistas y botón de **"Iniciar Sesión"**.
3. Verifica que la cuadrícula muestre herramientas reales obtenidas desde `GET /api/v1/tools` con sus fotos, marcas, precios diarios en COP y badges de estado (`DISPONIBLE`).

### Paso 2.2: Búsqueda en Tiempo Real
1. Escribe en el buscador de la barra superior: `"Taladro"`, `"DeWalt"` o `"Caterpillar"`.
2. **Criterio de éxito:** Las tarjetas del catálogo se filtran inmediatamente coincidiendo con el término ingresado.
3. Borra el término para restaurar la vista completa.

### Paso 2.3: Filtrado por Categorías
1. Haz clic en las etiquetas horizontales superiores (*Pills*):
   - `Herramienta Eléctrica`
   - `Maquinaria Pesada`
   - `Construcción y Demolición`
2. **Criterio de éxito:** La lista cambia para mostrar únicamente las herramientas asociadas a dicha categoría (consumiendo `/api/v1/tools?categoryId=...`).

### Paso 2.4: Ficha Técnica y Cálculo de Días de Alquiler
1. Haz clic sobre cualquier tarjeta de herramienta (ej. un rotomartillo o retroexcavadora).
2. Se desplegará el **Modal de Ficha Técnica**:
   - Galería de imágenes en alta resolución.
   - Especificaciones técnicas normalizadas en 4FN (potencia, peso, voltaje, etc.).
   - Tarjeta comercial del proveedor dueño del equipo.
3. Modifica la fecha de inicio y fecha de fin:
   - **Criterio de éxito:** El resumen de costo multiplica dinámicamente `(Días × Precio Diario) + Depósito de Garantía = Total Estimado`.

### Paso 2.5: Guardián de Invitados al Intentar Alquilar
1. Estando en el modal de detalle sin iniciar sesión, haz clic en **"Reservar Ahora"**.
2. **Criterio de éxito:** El sistema intercepta la acción, no permite la reserva anónima y abre automáticamente el **Modal de Inicio de Sesión / Registro**.

---

## Fase 3: Flujo Completo de Alquiler, Reglas de Negocio y Facturación (Rol: CLIENTE)

### Paso 3.0: Registro de Nuevo Usuario y Creación Automática de Perfil Comercial
1. En el modal dividido de acceso (con fotografía de fondo `login.png`), cambia a la pestaña **"Regístrate"**.
2. Selecciona visualmente la tarjeta de rol interactivo: **"Cliente"** (*"Quiero alquilar equipos"*).
3. Completa los campos requeridos (nombre, correo nuevo, contraseña segura) y presiona **"Crear cuenta"**.
4. **Criterio de éxito:** El sistema invoca `POST /api/v1/auth/register` y crea automáticamente el perfil comercial asociado en `/api/v1/clients`.

### Paso 3.1: Inicio de Sesión como Cliente Existente
1. Si creaste un usuario nuevo, puedes cerrar sesión para probar las credenciales maestras.
2. Haz clic en **"Iniciar Sesión"** e ingresa:
   - **Usuario / Correo:** `cliente_carlos_gomez`
   - **Contraseña:** `Password123*`
3. Presiona **"Iniciar sesión"**.
4. **Criterio de éxito:**
   - La barra de navegación se actualiza mostrando el avatar con las iniciales `CG`, el nombre de Carlos Gómez y el badge `CLIENTE`.
   - Se muestra un Toast verde de confirmación: `"¡Bienvenido, Carlos Gómez!"`.

### Paso 3.2: Creación de Solicitud de Reserva
1. Selecciona una herramienta disponible (ej. *Taladro Percutor DeWalt* o *Generador Diésel*).
2. Selecciona un rango de fechas válido (ej. del día siguiente al subsiguiente, 2 a 3 días).
3. Haz clic en **"Confirmar Reserva"**.
4. El sistema envía `POST /api/v1/rentals` con el JSON de reserva:
   - **Criterio de éxito:** Se crea la reserva en estado `PENDING` en la base de datos PostgreSQL y se genera el registro del alquiler.

### Paso 3.3: Pago en Línea Simulado
1. Tras confirmar la reserva, el sistema abrirá la pasarela de pago o mostrará el botón de pago en la reserva.
2. Selecciona el método de pago (Tarjeta de Crédito o Transferencia Bancaria) y confirma la transacción.
3. El frontend despacha `POST /api/v1/billing/payments`:
   - **Criterio de éxito:**
     - Se registra la transacción en la tabla `payments`.
     - La reserva pasa al estado `CONFIRMED`.
     - Se emite automáticamente la factura legal correspondiente con IVA del 19%.

### Paso 3.4: Visualización e Impresión de Factura Legal
1. Ve al menú superior y selecciona **"Mis Alquileres"** (`#/client`).
2. Ubica la reserva recién pagada y presiona el botón **"Ver Factura"**.
3. **Criterio de éxito:**
   - Se abre el visor oficial de factura con membrete corporativo de ToolRent, NIT legal, datos del cliente y desglose de valores (*Subtotal, IVA 19%, Total*).
   - Al presionar **"Imprimir"**, se abre el diálogo nativo de impresión del sistema operativo con hoja formateada `@media print` (o endpoint `/api/v1/billing/invoices/{id}/html`).

### Paso 3.5: Verificación del Historial en el Panel del Cliente (`#/client`)
1. Observa el panel de cliente:
   - Métricas: Total de alquileres activos, completados y gasto acumulado.
   - Tabla de alquileres con badges de estado actualizados en tiempo real.

### Paso 3.6: Prueba de Regla de Negocio — Bloqueo por Solapamiento de Fechas (`DateRange.overlaps`)
1. Toma nota de la herramienta y las fechas exactas reservadas en el Paso 3.2.
2. Cierra sesión e ingresa con el **Cliente #2** (`cliente_maria_rodriguez` / `Password123*`).
3. Abre la ficha técnica de la misma herramienta e intenta reservarla en un rango de fechas que se cruce parcial o totalmente con la reserva de Carlos Gómez.
4. **Criterio de éxito:**
   - El endpoint `GET /api/v1/tools/{id}/availability` reporta los rangos ocupados.
   - El backend rechaza el solapamiento lanzando `BusinessRuleViolationException` (HTTP 400/409), impidiendo que dos clientes alquilen el mismo equipo en las mismas fechas.

### Paso 3.7: Cancelación de Reserva y Liberación de Equipo
1. Con cualquier cliente, crea una reserva nueva en fechas futuras y presiona el botón **"Cancelar"** (`PATCH /api/v1/rentals/{id}/cancel`).
2. **Criterio de éxito:** La reserva cambia a estado `CANCELLED` y la herramienta libera su disponibilidad (`AVAILABLE`) inmediatamente.

---

## Fase 4: Flujo Operativo y Gestión de Inventario Completo (Rol: PROVEEDOR)

### Paso 4.1: Inicio de Sesión como Proveedor
1. Haz clic en el menú del usuario y presiona **"Cerrar Sesión"**.
2. Vuelve a abrir el modal de autenticación e ingresa:
   - **Usuario / Correo:** `prov_maquinaria_bog`
   - **Contraseña:** `Password123*`
3. Presiona **"Iniciar sesión"**.
4. **Criterio de éxito:**
   - Redirección automática o acceso habilitado a **"Panel de Proveedor"** (`#/provider`).
   - El navbar muestra el badge `PROVEEDOR` y la empresa *Maquinaria Bogotá S.A.S.*

### Paso 4.2: Verificación de KPIs en Vivo
1. En `#/provider`, observa las 4 tarjetas superiores:
   - **Herramientas Disponibles:** Porcentaje respecto al inventario total del proveedor.
   - **En Alquiler:** Contador de herramientas actualmente arrendadas.
   - **En Mantenimiento:** Herramientas con averías o en revisión técnica.
   - **Solicitudes Pendientes:** Contador de alquileres por confirmar.
2. **Criterio de éxito:** Los números corresponden con los datos calculados por `GET /api/v1/reporting/provider/{providerId}`.

### Paso 4.3: Publicación de Nueva Herramienta (CRUD - Create)
1. Haz clic en el botón superior **"+ Nueva Herramienta"**.
2. Se desplegará el Drawer lateral:
   - **Nombre:** `Rotomartillo Industrial SDS-Max`
   - **Categoría:** Selecciona `Herramienta Eléctrica` (cargada dinámicamente desde `/api/v1/tools/categories`).
   - **Marca:** `Bosch Professional`
   - **Modelo:** `GBH 8-45 D`
   - **Precio por Día:** `85000`
   - **Depósito de Garantía:** `250000`
   - **Descripción:** `Equipo de alta potencia para demolición y perforación en concreto reforzado.`
   - **URL de Imagen:** Ingresa una URL válida de imagen o usa la provista por defecto.
3. Haz clic en **"Guardar Herramienta"**.
4. **Criterio de éxito:**
   - La petición `POST /api/v1/tools` responde con código `201 Created`.
   - Aparece un Toast verde confirmando la creación.
   - La nueva herramienta aparece de inmediato en la tabla de inventario del proveedor y en el catálogo público general.

### Paso 4.4: Modificación de Herramienta Existente (CRUD - Update)
1. En la tabla de herramientas, haz clic en el botón **"Editar"** (icono de lápiz) sobre la herramienta recién creada.
2. Modifica el precio por día a `92000`.
3. Haz clic en **"Actualizar Herramienta"**.
4. **Criterio de éxito:** La petición `PUT /api/v1/tools/{id}` actualiza el registro en PostgreSQL y el nuevo precio se refleja al instante.

### Paso 4.5: Subida de Fotografía por Archivo Multipart (`/uploads/**`)
1. Desde Swagger UI (`/swagger-ui.html`) o el formulario de imagen, ejecuta `POST /api/v1/tools/{id}/images/upload` adjuntando una imagen física (`.jpg` o `.png`).
2. **Criterio de éxito:** El archivo se almacena en el servidor y se sirve estáticamente al consultar `http://localhost:8085/uploads/<nombre_archivo>`.

### Paso 4.6: Eliminación / Retiro de Herramienta (CRUD - Delete)
1. Crea una herramienta de prueba adicional y presiona el botón **"Eliminar"** (`DELETE /api/v1/tools/{id}`).
2. **Criterio de éxito:** El registro se elimina o retira del catálogo sin romper la integridad referencial.

### Paso 4.7: Ciclo de Vida del Alquiler (Confirmar, Entregar, Recibir)
1. Ve a la sección **"Solicitudes de Alquiler Recientes"** del panel del proveedor.
2. Localiza la solicitud generada previamente por el cliente:
   - **Paso A: Confirmar Reserva (Aprobación Operativa):** Si la reserva se encuentra en estado `PENDING` (por ejemplo, en modalidad contra-entrega o pre-reserva), haz clic en **"Confirmar"** (`PATCH /api/v1/rentals/{id}/confirm`). La reserva pasa a `CONFIRMED`. *(Nota: Si el cliente ya realizó el pago en el Paso 3.3, el sistema ya habrá promovido automáticamente la reserva a `CONFIRMED` y este método responderá de manera segura e idempotente).*
   - **Paso B: Registrar Entrega (Despacho de Bodega):** Cuando el cliente retira el equipo en bodega, haz clic en **"Registrar entrega"** (`PATCH /api/v1/rentals/{id}/start`). La reserva pasa a `IN_PROGRESS` y las herramientas asociadas pasan a estado `RENTED`.
   - **Paso C: Registrar Devolución:** Al concluir los días contratados y retornar el equipo, haz clic en **"Registrar devolución"** (`PATCH /api/v1/rentals/{id}/complete`).

### Paso 4.8: Inspección Física y Reporte de Averías (4FN)
1. Al pulsar "Registrar devolución", se abrirá el **Modal de Inspección Técnica**:
   - Selecciona el estado del equipo: marca la casilla **"¿Se detectaron daños físicos o averías?"**.
   - **Descripción del daño:** `Broquero descalibrado por sobrecalentamiento.`
   - **Costo de Reparación / Reposición:** `45000`.
2. Presiona **"Finalizar Inspección y Cerrar Alquiler"**.
3. **Criterio de éxito:**
   - Se crea el acta en la tabla `rental_inspections` (`POST /api/v1/inspections`) y el detalle en `damage_reports` (`POST /api/v1/inspections/{id}/damages`).
   - La reserva pasa al estado `COMPLETED`.
   - La herramienta pasa automáticamente al estado `MAINTENANCE` (ya no se muestra como disponible en el catálogo hasta que sea reparada).

---

## Fase 5: Supervisión, Analítica, Verificación y Usuarios (Rol: ADMIN)

### Paso 5.1: Inicio de Sesión como Administrador
1. Cierra sesión e ingresa con:
   - **Usuario:** `admin_principal`
   - **Contraseña:** `Password123*`
2. El sistema otorga acceso al **Panel de Administración** (`#/admin`).

### Paso 5.2: Verificación de Métricas Globales y Analítica
1. En `#/admin`, comprueba que las 4 métricas superiores exhiban datos reales:
   - **Ingresos Totales Facturados:** Sumatoria real desde `/api/v1/reporting/income`.
   - **Alquileres Activos:** Conteo de transacciones vivas.
   - **Usuarios Registrados:** Total de usuarios en la tabla `users` (42+ registros).
   - **Disponibilidad de Inventario:** Porcentaje y desglose de herramientas.
2. Comprueba los 3 gráficos SVG interactivos:
   - Gráfico de barras: *Herramientas más alquiladas* (`/api/v1/reporting/most-rented-tools`).
   - Ranking: *Clientes frecuentes con mayor volumen* (`/api/v1/reporting/frequent-clients`).
   - Gráfico de dona: *Estado de inventario (Disponibles vs. Alquiladas vs. Mantenimiento)* (`/api/v1/reporting/tool-availability`).

### Paso 5.3: Gestión Integral de Usuarios (User Management)
1. En la tabla de usuarios de `#/admin`, prueba la navegación por pestañas:
   - `Todos` (muestra el universo completo de cuentas).
   - `Clientes` (filtra únicamente usuarios con rol `ROLE_CLIENTE`).
   - `Proveedores` (filtra cuentas con perfil de empresa y rol `ROLE_PROVEEDOR`).
   - `Administradores` (filtra administradores del sistema).
2. **Buscador en vivo:** Escribe `"Bogotá"` o `"Carlos"`. Verifica que la tabla filtre en tiempo real.
3. **Creación de Usuario desde Admin:** Haz clic en **"+ Nuevo Usuario"**, completa el formulario seleccionando el rol y valida que se inserte en la base de datos.
4. **Cambio de Estado:** Alterna el switch de activación de un usuario de prueba para habilitar/deshabilitar su acceso.

### Paso 5.4: Verificación Formal de Empresas Proveedoras (`PATCH /verify`)
1. En la gestión de proveedores o vía API, ejecuta la aprobación formal de una empresa proveedora:
   - `PATCH /api/v1/providers/{id}/verify`
2. **Criterio de éxito:** El atributo `verified` del proveedor cambia a `true` en la base de datos PostgreSQL.

### Paso 5.5: Inventario Global y Centro de Notificaciones Interactivo
1. En `#/admin`, despliega el acordeón **"Inventario Global de Herramientas"** y verifica la tabla consolidada de todos los equipos registrados en la plataforma.
2. Haz clic en la **Campana de Notificaciones** (`#btn-navbar-notifications`) en el navbar superior:
   - Filtra entre *Todas* y *No leídas*.
   - Haz clic en una notificación de evento (`RENTAL`, `PAYMENT`, `DAMAGE`) y comprueba la redirección contextual (*Deep Linking*).
   - Presiona **"Marcar todas como leídas"** y verifica que el contador del badge se actualice reactivamente.

---

## Fase 6: Pruebas de Seguridad (RBAC, Anti-IDOR Cruzado y Sesión)

### Paso 6.1: Validación de Guardias de Ruta (RBAC Frontend)
1. Cierra sesión para quedar como visitante anónimo.
2. Intenta ingresar directamente por URL a:
   - `http://localhost:5173/#/admin`
   - **Criterio de éxito:** La interfaz bloquea el acceso, muestra una pantalla de acceso denegado y solicita credenciales administrativas.
3. Inicia sesión como `cliente_carlos_gomez` (Rol `CLIENTE`).
4. Intenta navegar a `http://localhost:5173/#/provider`.
5. **Criterio de éxito:** El sistema muestra una alerta clara indicando que tu cuenta tiene rol de Cliente y se requiere perfil de Proveedor para acceder.

### Paso 6.2: Validación Anti-IDOR en el Backend (Cliente vs. Cliente)
1. Obtén el token JWT del cliente autenticado (desde las DevTools del navegador: `localStorage.getItem('toolrent_token')`).
2. Intenta hacer una petición vía `curl` para consultar las reservas de otro cliente con ID diferente:
```bash
curl -X GET "http://localhost:8085/api/v1/rentals/client/c0000000-0000-0000-0000-000000000002" \
     -H "Authorization: Bearer <TOKEN_DE_CARLOS_GOMEZ>"
```
- **Criterio de éxito:** El backend responde con código HTTP **`403 Forbidden`** o **`401 Unauthorized`**, protegiendo la privacidad de los datos contra referencias directas no autorizadas.

### Paso 6.3: Validación Anti-IDOR Cruzado (Proveedor vs. Proveedor Competidor)
1. Obtén el token JWT de `prov_maquinaria_bog` (Proveedor #1).
2. Intenta consultar por API los alquileres exclusivos de `prov_equipos_med` (Proveedor #2):
```bash
curl -i -X GET "http://localhost:8085/api/v1/rentals/provider/d0000000-0000-0000-0000-000000000002" \
     -H "Authorization: Bearer <TOKEN_PROVEEDOR_BOGOTA>"
```
- **Criterio de éxito:** El backend bloquea la consulta con HTTP **`403 Forbidden`**, impidiendo que un proveedor espíe las operaciones de otro competidor.

### Paso 6.4: Cierre de Sesión Seguro
1. Haz clic en el avatar del usuario y selecciona **"Cerrar Sesión"**.
2. **Criterio de éxito:**
   - El token JWT se elimina por completo de `localStorage`.
   - La campana de notificaciones se oculta.
   - La vista regresa al catálogo público en estado limpio sin retención de datos en memoria.

### Paso 6.5: Pruebas de Ciberseguridad y Pentesting Local (SQLi, XSS, Path Traversal y Escalada de Privilegios)

Para demostrar en vivo durante la sustentación técnica la solidez de la arquitectura y la defensa en profundidad del backend, ejecuta estas pruebas con `curl`:

#### 1. Intento de SQL Injection en el Buscador de Herramientas (`?search=`)
```bash
curl -i -G "http://localhost:8085/api/v1/tools" --data-urlencode "search=' OR 1=1; DROP TABLE tools; --"
```
- **Resultado:** Código HTTP **`200 OK`** devolviendo `[]` (lista vacía).
- **Mecanismo de Defensa:** El filtrado de búsqueda se ejecuta en memoria sobre un Java Stream (`ToolUseCase.java`) mediante `.toLowerCase().contains(...)`, haciéndolo estructuralmente inmune a inyecciones SQL sin ejecutar sentencias dinámicas en la base de datos.

#### 2. Intento de SQL Injection en Parámetro de Ruta (`{id}`)
```bash
curl -i "http://localhost:8085/api/v1/tools/1%20OR%201=1"
```
- **Resultado:** Código HTTP **`400 Bad Request`** inmediato.
- **Mecanismo de Defensa:** El tipado fuerte de `java.util.UUID` en Spring MVC intercepta la cadena maliciosa antes de que alcance la capa de aplicación o JPA.

#### 3. Intento de Escalada de Privilegios en Registro Público (`POST /api/v1/auth/register`)
```bash
curl -i -X POST "http://localhost:8085/api/v1/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"username":"intruso_admin","email":"intruso@test.com","password":"Password123*","roles":["ROLE_ADMIN"]}'
```
- **Resultado:** Código HTTP **`409 Conflict`** (o `400 Bad Request`) con detalle `"El registro público no permite la asignación de roles administrativos. Solo se admiten ROLE_CLIENTE o ROLE_PROVEEDOR."`.
- **Mecanismo de Defensa:** `AuthUseCase.java` inspecciona el contexto de seguridad (`SecurityContextHolder`). Si la petición no proviene de un `ROLE_ADMIN` previamente autenticado, se aborta la asignación de roles privilegiados.

#### 4. Intento de Stored XSS y Path Traversal en Carga de Archivos (`POST /images/upload`)
- **Mecanismo de Defensa (`ToolController.java`):**
  - **Anti-Stored XSS:** Valida que el `Content-Type` comience por `image/` y rechaza expresamente formatos con capacidad de script embebido (`.svg`, `.html`), limitando las extensiones a `.jpg`, `.jpeg`, `.png` y `.webp`.
  - **Anti-Path Traversal:** El nombre original se limpia descartando rutas relativas (`Paths.get(...).getFileName()`), sustituyendo caracteres no alfanuméricos (`[^a-zA-Z0-9._-]`), asignando un prefijo aleatorio `UUID.randomUUID()` y comprobando que `targetPath.normalize().startsWith(uploadDir)`. Cargas maliciosas son abortadas con `IllegalArgumentException` o `SecurityException`.

---

## Fase 7: Verificación de Responsividad, Compilación y Empaquetado

### Paso 7.1: Prueba de Diseño Responsivo (Móvil, Tablet y Escritorio)
1. Abre las DevTools del navegador (`F12`) y activa el *Device Toolbar* (`Ctrl + Shift + M`).
2. Prueba las siguientes resoluciones:
   - **Móvil (375px - iPhone SE / iPhone 14):** Verifica el menú hamburguesa móvil (`#mobile-btn-notifs`), tarjetas apiladas a 1 columna y tablas con scroll horizontal limpio sin desbordar el viewport.
   - **Tablet (768px - iPad Mini):** Verifica cuadrícula a 2 columnas y Drawers laterales adaptables.
   - **Escritorio (1440px):** Verifica la distribución completa y espaciados del sistema de diseño ToolRent.

### Paso 7.2: Compilación de Producción del Frontend
Ejecuta en la carpeta `frontend/`:
```bash
cd frontend
npm run build
```
**Criterio de éxito:**
- Finalización sin errores de sintaxis ni assets faltantes (`built in ~1.7s`).
- Generación de la carpeta `frontend/dist/` conteniendo:
  - `dist/index.html`
  - `dist/assets/index-[hash].js`
  - `dist/assets/index-[hash].css`
  - `dist/assets/login-[hash].png` (nueva imagen de alta resolución sincronizada).

### Paso 7.3: Previsualización de Producción
Ejecuta:
```bash
npm run preview
```
- Abre `http://localhost:4173/` y comprueba que la SPA sirva los bundles optimizados con la misma fluidez y conectividad a la API de Spring Boot.

---

## 10. Checklist Final de Aceptación

Marca cada casilla a medida que completes la verificación del sistema:

- [ ] **Infraestructura:** Docker Compose arriba con PostgreSQL en puerto `5434` y Spring Boot en puerto `8085`.
- [ ] **Health Check:** `http://localhost:8085/api/v1/health` responde `{"status":"UP"}`.
- [ ] **Volumen de Datos Semilla:** Verificación SQL de $\ge$ 20 registros en cada una de las tablas del modelo 4FN.
- [ ] **Catálogo Público:** Carga herramientas desde PostgreSQL, filtros por categoría y búsqueda en vivo operativos.
- [ ] **Modal de Login y Registro:** Despliega la fotografía de alta resolución (`login.png`), permite registro con creación de perfil comercial y valida credenciales vía JWT.
- [ ] **Flujo Cliente:** Inicio de sesión, selección de rango de fechas, reserva, cancelación, pago simulado y emisión de factura con IVA 19%.
- [ ] **Control de Solapamiento (DateRange):** Bloqueo efectivo al intentar reservar una misma herramienta en fechas cruzadas.
- [ ] **Visor de Factura:** Membrete oficial y soporte para impresión directa (`window.print()`).
- [ ] **Flujo Proveedor:** KPIs en vivo, publicación de herramientas (POST), edición (PUT), subida de imagen (`/uploads/**`) y retiro (DELETE).
- [ ] **Ciclo de Alquiler e Inspección 4FN:** Confirmación, entrega física (`IN_PROGRESS`), devolución (`COMPLETED`) y reporte de daños con paso automático a `MAINTENANCE`.
- [ ] **Flujo Admin:** Métricas de ingresos reales, gráficos SVG dinámicos, verificación de proveedores (`PATCH /verify`), acordeón de inventario global y gestión de usuarios.
- [ ] **Centro de Notificaciones y Responsividad:** Campana reactiva con *Deep Linking* y diseño adaptable en móvil, tablet y escritorio.
- [ ] **Seguridad RBAC y Anti-IDOR:** Rutas protegidas por rol y peticiones forzadas a recursos de otros clientes o proveedores denegadas con HTTP `403`.
- [ ] **Pentesting y Defensas de Seguridad:** Inmunidad a SQLi en buscador (Stream en memoria), tipado fuerte UUID (HTTP 400), bloqueo de escalada a ADMIN en registro público y sanitización multipart anti-Stored XSS / Path Traversal.
- [ ] **Compilación:** `npm run build` en `frontend/` y `mvnw clean test` en `backend/` exitosos al 100%.
