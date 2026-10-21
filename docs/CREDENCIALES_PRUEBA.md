# 🔐 Credenciales y Accesos de Prueba - ToolRent Platform

Documento de referencia rápida local con **las 4 credenciales activas del sistema**, los **5 productos oficiales de prueba** del proveedor y **0 alquileres iniciales** para pruebas limpias de extremo a extremo.

---

## ⚡ Cuentas Activas del Sistema (4 Usuarios)

> **🔑 Contraseña Universal para las 4 cuentas:** `Password123*`

| Rol | Nombre de Usuario | Correo Electrónico | Perfil Comercial / Personal | Panel Asociado |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | `admin_principal` | `admin@rentaequipos.com` | Administrador Maestro ToolRent | [#/admin](http://localhost:5173/#/admin) |
| **PROVEEDOR** | `prov_maquinaria_bog` | `contacto@maquinariabogota.com` | Maquinaria y Equipos Bogotá S.A.S. | [#/provider](http://localhost:5173/#/provider) |
| **CLIENTE 1** | `cliente_carlos_gomez` | `carlos.gomez@constructora.com` | Carlos Alberto Gómez Peña | [#/client](http://localhost:5173/#/client) |
| **CLIENTE 2** | `cliente_maria_rodriguez` | `maria.rodriguez@ingenieria.com` | María Camila Rodríguez León | [#/client](http://localhost:5173/#/client) |

---

## 🏗️ Maquinaria Inicial en Catálogo (5 Productos del Proveedor)

Todas las herramientas pertenecen a **Maquinaria y Equipos Bogotá S.A.S.**, se encuentran en estado `AVAILABLE` y cuentan con imágenes locales de alta fidelidad:

1. **Martillo Demoledor Hexagonal 30kg** (Bosch GSH 27 VC) - Demolición y Perforación ($85.000 / día)
2. **Mezcladora de Concreto 1.5 Bultos** (Cipsa Maxi 10) - Hormigón y Concreto ($55.000 / día)
3. **Andamio Certificado Multidireccional Layher 6m** (Layher Allround 2.0) - Elevación y Andamiaje ($35.000 / día)
4. **Generador Eléctrico Diésel Insonorizado 10kVA** (Caterpillar DE9.5E3) - Generación de Energía ($120.000 / día)
5. **Apisonador Canguro 4HP** (Mikasa MTX-70HDR) - Compactación de Suelos ($60.000 / día)

---

## 📋 Estado de Alquileres

- **Alquileres Activos o Históricos:** `0` (Ningún cliente tiene órdenes ni alquileres registrados; base de datos limpia para flujo de prueba completo desde el carrito / catálogo hasta el checkout).

---

## 🌐 URLs y Enlaces de Acceso

- **Frontend General:** [http://localhost:5173/](http://localhost:5173/)
- **Catálogo Público:** [http://localhost:5173/#/catalog](http://localhost:5173/#/catalog)
- **Panel Administrador:** [http://localhost:5173/#/admin](http://localhost:5173/#/admin)
- **Panel Proveedor:** [http://localhost:5173/#/provider](http://localhost:5173/#/provider)
- **Panel Cliente:** [http://localhost:5173/#/client](http://localhost:5173/#/client)

---

## 🗄️ Infraestructura y Base de Datos (PostgreSQL 16)

- **Host & Puerto:** `localhost:5434` (interno Docker: `5432`)
- **Base de Datos:** `renta_herramientas_db`
- **Usuario:** `postgres`
- **Contraseña:** `postgres`
