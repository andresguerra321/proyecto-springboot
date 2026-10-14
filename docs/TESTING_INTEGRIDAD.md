# Guía Paso a Paso para Pruebas de Integridad del Sistema ToolRent

Este documento detalla el procedimiento exhaustivo para verificar la **integridad funcional, de datos, de seguridad y de integración** entre la arquitectura hexagonal de **Spring Boot 3 + PostgreSQL 16** y el frontend reactivo desacoplado en **Vite + Tailwind CSS v3**.

---

## 📋 Tabla de Contenidos
1. [Prerrequisitos y Verificación de Servicios](#1-prerrequisitos-y-verificación-de-servicios)
2. [Matriz de Cuentas y Credenciales de Prueba](#2-matriz-de-cuentas-y-credenciales-de-prueba)
3. [Fase 1: Verificación de Integridad de la Base de Datos y Backend](#fase-1-verificación-de-integridad-de-la-base-de-datos-y-backend)
4. [Fase 2: Pruebas del Catálogo Público (Sin Autenticación)](#fase-2-pruebas-del-catálogo-público-sin-autenticación)
5. [Fase 3: Flujo Completo de Alquiler y Facturación (Rol: CLIENTE)](#fase-3-flujo-completo-de-alquiler-y-facturación-rol-cliente)
6. [Fase 4: Flujo Operativo y Gestión de Inventario (Rol: PROVEEDOR)](#fase-4-flujo-operativo-y-gestión-de-inventario-rol-proveedor)
7. [Fase 5: Supervisión, Analítica y Usuarios (Rol: ADMIN)](#fase-5-supervisión-analítica-y-usuarios-rol-admin)
8. [Fase 6: Pruebas de Seguridad (RBAC, Anti-IDOR y Sesión)](#fase-6-pruebas-de-seguridad-rbac-anti-idor-y-sesión)
9. [Fase 7: Verificación de Compilación y Empaquetado](#fase-7-verificación-de-compilación-y-empaquetado)
10. [Checklist Final de Aceptación](#10-checklist-final-de-aceptación)

---

## 1. Prerrequisitos y Verificación de Servicios

Antes de iniciar las pruebas, comprueba que los contenedores y el servidor de desarrollo web estén activos:

### 1.1. Verificar Contenedores Docker
Abre una terminal y ejecuta:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
**Resultado esperado:**
- `renta_herramientas_db`: Estado `Up`, puerto `0.0.0.0:5434->5432/tcp`.
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
En una terminal separada:
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
| **ADMINISTRADOR** | `admin_principal` | `admin@rentaequipos.com` | N/A (Acceso Total) | `#/admin` |
| **PROVEEDOR** | `prov_maquinaria_bog` | `contacto@maquinariabogota.com` | Maquinaria Bogotá S.A.S. | `#/provider` |
| **PROVEEDOR #2** | `prov_equipos_med` | `ventas@equiposmedellin.com` | Equipos Medellín Ltda. | `#/provider` |
| **CLIENTE** | `cliente_carlos_gomez` | `carlos.gomez@constructora.com` | Constructora Gómez & Asoc. | `#/client` |
| **CLIENTE #2** | `cliente_maria_rodriguez` | `maria.rodriguez@ingenieria.com` | M&R Ingeniería Civil | `#/client` |

---

## Fase 1: Verificación de Integridad de la Base de Datos y Backend

### Paso 1.1: Revisión de Swagger UI
1. Abre tu navegador en: `http://localhost:8085/swagger-ui.html`
2. Verifica que se listen todos los controladores REST:
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

---

## Fase 2: Pruebas del Catálogo Público (Sin Autenticación)

El catálogo debe permitir la navegación y búsqueda libre a cualquier visitante sin exigir credenciales iniciales.

### Paso 2.1: Navegación y Renderizado del Catálogo
1. Ingresa a `http://localhost:5173/`.
2. Observa la barra de navegación con el logotipo de ToolRent, buscador, selector de vistas y botón de **"Iniciar Sesión"**.
3. Verifica que la cuadrícula muestre herramientas reales obtenidas desde `GET /api/v1/tools` con sus fotos, marcas, precios diarios y badges de estado (`DISPONIBLE`).

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
1. Haz clic sobre cualquier tarjeta de herramienta (ej. un taladro o retroexcavadora).
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

## Fase 3: Flujo Completo de Alquiler y Facturación (Rol: CLIENTE)

### Paso 3.1: Inicio de Sesión como Cliente
1. Haz clic en **"Iniciar Sesión"** en la barra superior.
2. Ingresa las credenciales:
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
   - Se abre el visor oficial de factura con membrete corporativo de ToolRent, NIT legal, datos del cliente y desglose de valores.
   - Al presionar **"Imprimir"**, se abre el diálogo nativo de impresión del sistema operativo con hoja formateada `@media print`.

### Paso 3.5: Verificación del Historial en el Panel del Cliente (`#/client`)
1. Observa el panel de cliente:
   - Métricas: Total de alquileres activos, completados y gasto acumulado.
   - Tabla de alquileres con badges de estado actualizados en tiempo real.

---

## Fase 4: Flujo Operativo y Gestión de Inventario (Rol: PROVEEDOR)

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
2. **Criterio de éxito:** Los números corresponden con los datos devueltos por `GET /api/v1/reporting/provider/{providerId}`.

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

### Paso 4.5: Ciclo de Vida del Alquiler (Confirmar, Entregar, Recibir)
1. Ve a la sección **"Solicitudes de Alquiler Recientes"** del panel del proveedor.
2. Localiza la solicitud generada previamente por el cliente:
   - **Paso A: Confirmar Reserva:** Haz clic en **"Confirmar"**. La reserva pasa a `CONFIRMED`.
   - **Paso B: Registrar Entrega:** Cuando el cliente retira el equipo en bodega, haz clic en **"Registrar entrega"**. La reserva pasa a `IN_PROGRESS` y la herramienta pasa a estado `RENTED`.
   - **Paso C: Registrar Devolución:** Al concluir los días contratados, haz clic en **"Registrar devolución"**.

### Paso 4.6: Inspección Física y Reporte de Averías (4FN)
1. Al pulsar "Registrar devolución", se abrirá el **Modal de Inspección Técnica**:
   - Selecciona el estado del equipo: marca la casilla **"¿Se detectaron daños físicos o averías?"**.
   - **Descripción del daño:** `Broquero descalibrado por sobrecalentamiento.`
   - **Costo de Reparación / Reposición:** `45000`.
2. Presiona **"Finalizar Inspección y Cerrar Alquiler"**.
3. **Criterio de éxito:**
   - Se crea el acta en la tabla `rental_inspections` y el detalle en `damage_reports`.
   - La reserva pasa al estado `COMPLETED`.
   - La herramienta pasa automáticamente al estado `MAINTENANCE` (ya no se muestra como disponible en el catálogo hasta que sea reparada).

---

## Fase 5: Supervisión, Analítica y Usuarios (Rol: ADMIN)

### Paso 5.1: Inicio de Sesión como Administrador
1. Cierra sesión e ingresa con:
   - **Usuario:** `admin_principal`
   - **Contraseña:** `Password123*`
2. El sistema otorga acceso al **Panel de Administración** (`#/admin`).

### Paso 5.2: Verificación de Métricas Globales y Analítica
1. En `#/admin`, comprueba que las 4 métricas superiores exhiban:
   - **Ingresos Totales Facturados:** Sumatoria real desde `/api/v1/reporting/income`.
   - **Alquileres Activos:** Conteo de transacciones vivas.
   - **Usuarios Registrados:** Total de usuarios en la tabla `users` (42+ registros).
   - **Disponibilidad de Inventario:** Porcentaje y desglose de herramientas.
2. Comprueba los 3 gráficos SVG interactivos:
   - Gráfico de barras: *Herramientas más alquiladas*.
   - Ranking: *Clientes frecuentes con mayor volumen*.
   - Gráfico de dona: *Estado de inventario (Disponibles vs. Alquiladas vs. Mantenimiento)*.

### Paso 5.3: Gestión Integral de Usuarios (User Management)
1. En la tabla de usuarios de `#/admin`, prueba la navegación por pestañas:
   - `Todos` (muestra el universo completo de cuentas).
   - `Clientes` (filtra únicamente usuarios con rol `ROLE_CLIENTE`).
   - `Proveedores` (filtra cuentas con perfil de empresa y rol `ROLE_PROVEEDOR`).
   - `Administradores` (filtra administradores del sistema).
2. **Buscador en vivo:** Escribe `"Bogotá"` o `"Carlos"`. Verifica que la tabla filtre en tiempo real.
3. **Creación de Usuario desde Admin:** Haz clic en **"+ Nuevo Usuario"**, completa el formulario seleccionando el rol y valida que se inserte en la base de datos.
4. **Cambio de Estado:** Alterna el switch de activación de un usuario de prueba para habilitar/deshabilitar su acceso.

---

## Fase 6: Pruebas de Seguridad (RBAC, Anti-IDOR y Sesión)

### Paso 6.1: Validación de Guardias de Ruta (RBAC Frontend)
1. Cierra sesión para quedar como visitante anónimo.
2. Intenta ingresar directamente por URL a:
   - `http://localhost:5173/#/admin`
   - **Criterio de éxito:** La interfaz bloquea el acceso, muestra una pantalla de acceso denegado y solicita credenciales administrativas.
3. Inicia sesión como `cliente_carlos_gomez` (Rol `CLIENTE`).
4. Intenta navegar a `http://localhost:5173/#/provider`.
5. **Criterio de éxito:** El sistema muestra una alerta clara indicando que tu cuenta tiene rol de Cliente y se requiere perfil de Proveedor para acceder.

### Paso 6.2: Validación Anti-IDOR en el Backend (Spring Security)
1. Obtén el token JWT del cliente autenticado (desde las DevTools del navegador: `localStorage.getItem('toolrent_token')`).
2. Intenta hacer una petición vía `curl` para consultar las reservas de otro cliente con ID diferente:
```bash
curl -X GET "http://localhost:8085/api/v1/rentals/client/c0000000-0000-0000-0000-000000000002" \
     -H "Authorization: Bearer <TOKEN_DE_CARLOS_GOMEZ>"
```
- **Criterio de éxito:** El backend responde con código HTTP **`403 Forbidden`** o **`401 Unauthorized`**, protegiendo la privacidad de los datos contra referencias directas no autorizadas.

### Paso 6.3: Cierre de Sesión Seguro
1. Haz clic en el avatar del usuario y selecciona **"Cerrar Sesión"**.
2. **Criterio de éxito:**
   - El token JWT se elimina por completo de `localStorage`.
   - La campana de notificaciones se oculta.
   - La vista regresa al catálogo público en estado limpio sin retención de datos en memoria.

---

## Fase 7: Verificación de Compilación y Empaquetado

### Paso 7.1: Compilación de Producción del Frontend
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

### Paso 7.2: Previsualización de Producción
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
- [ ] **Catálogo Público:** Carga herramientas desde PostgreSQL, filtros por categoría y búsqueda en vivo operativos.
- [ ] **Modal de Login:** Despliega la nueva fotografía de alta resolución ([login.png](file:///c:/Users/andre/OneDrive/Escritorio/proyectos/CAMPUS/proyecto%20springboot/frontend/src/assets/login.png)) y valida credenciales reales vía JWT.
- [ ] **Flujo Cliente:** Inicio de sesión, selección de rango de fechas, reserva, pago simulado y emisión de factura con IVA 19%.
- [ ] **Visor de Factura:** Membrete oficial y soporte para impresión directa (`window.print()`).
- [ ] **Flujo Proveedor:** KPIs en vivo, publicación de herramientas (POST), edición (PUT) y retiro (DELETE).
- [ ] **Ciclo de Alquiler:** Confirmación, entrega física (`IN_PROGRESS`), devolución y reporte de daños a `MAINTENANCE`.
- [ ] **Flujo Admin:** Métricas de ingresos reales, gráficos SVG dinámicos y administración de usuarios por pestañas de roles.
- [ ] **Seguridad RBAC:** Rutas protegidas contra accesos anónimos o con roles insuficientes.
- [ ] **Anti-IDOR:** Peticiones forzadas a recursos ajenos denegadas con HTTP `403`.
- [ ] **Compilación:** `npm run build` en `frontend/` y `mvnw clean test` en `backend/` exitosos al 100%.
