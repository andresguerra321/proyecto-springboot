# RentaMaq — Frontend de la Plataforma de Renta de Equipos

Interfaz web moderna, responsiva y desacoplada construida con **Vite**, **Vanilla JavaScript (ES6 Modules)** y **Tailwind CSS v3**.

## 🎨 Características de Diseño y Arquitectura
- **Estética Industrial Premium:** Paleta de colores tailored (`slate-950`, acentos ámbar construcción `brand-500`, y esmeralda financiero), tipografía moderna (**Outfit** para encabezados e **Inter** para cuerpo de texto vía Google Fonts), bordes de vidrio (*glassmorphism*) y micro-animaciones fluidas.
- **Sin Frameworks Pesados:** Vanilla JavaScript modular y limpio sin dependencias de React o Vue, garantizando un bundle ultraliviano y rendimiento inmediato.
- **Seguridad JWT Stateless:** Almacenamiento seguro del token en `localStorage` con inyección transparente de `Authorization: Bearer <token>` en todas las peticiones a la API de Spring Boot (`http://localhost:8085/api/v1`).
- **Control de Roles (RBAC):**
  - **Cliente (`ROLE_CLIENTE`):** Catálogo de herramientas con búsqueda y categorías, validación de disponibilidad por fechas en vivo, simulación de pago, enlace directo a factura oficial imprimible con IVA, e historial de alquileres con opción de cancelación.
  - **Proveedor (`ROLE_PROVEEDOR`):** Panel con los **4 KPIs de negocio**, inventario de herramientas (CRUD con subida de imágenes multipart y URLs), solicitudes de alquiler con flujo de estados (`Confirmar` ➔ `Entregar`), y modal de inspección técnica con reporte de averías y daños en 4FN.
  - **Administrador (`ROLE_ADMIN`):** Verificación y aprobación de empresas proveedoras, auditoría de usuarios y roles, supervisión global de alquileres, y rankings analíticos de rentabilidad.

## 🚀 Cómo Ejecutar el Frontend Localmente

### 1. Pre-requisitos
- Node.js 18+ instalado.
- Backend de Spring Boot corriendo en el puerto `8085` (vía Docker Compose o ejecución local).

### 2. Instalación de Dependencias
```bash
cd frontend
npm install
```

### 3. Iniciar el Servidor de Desarrollo (Vite)
```bash
npm run dev
```
La aplicación estará disponible de inmediato en:
👉 **`http://localhost:5173/`**

### 4. Compilar para Producción
```bash
npm run build
```
Genera la carpeta optimizada `dist/` con el HTML, CSS purgado de Tailwind y JavaScript minificado.

---

## ⚡ Cuentas de Acceso Rápido para Demostración

En el modal de inicio de sesión (`Iniciar Sesión`), dispones de botones de un solo clic con las credenciales preconfiguradas del sistema:

| Rol | Usuario | Contraseña | Funcionalidad Principal |
|---|---|---|---|
| **Administrador** | `admin_principal` | `Password123*` | Supervisión general, verificación de proveedores, auditoría contable. |
| **Proveedor** | `prov_maquinaria_bog` | `Password123*` | 4 KPIs, inventario, actas de inspección y daños. |
| **Cliente** | `cli_constructora_col` | `Password123*` | Alquiler por fechas, checkout, descarga de facturas HTML. |
