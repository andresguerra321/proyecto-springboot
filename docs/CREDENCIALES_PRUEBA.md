# 🔐 Credenciales y Accesos de Prueba - ToolRent Platform

Documento de referencia rápida local con **las 3 credenciales activas del sistema** (1 usuario por rol) para pruebas limpias sin datos residuales.

---

## ⚡ Cuentas Activas del Sistema (1 por Rol)

> **🔑 Contraseña Universal para las 3 cuentas:** `Password123*`

| Rol | Nombre de Usuario | Correo Electrónico | Perfil Comercial / Personal | Panel Asociado |
| :--- | :--- | :--- | :--- | :--- |
| **ADMINISTRADOR** | `admin_principal` | `admin@rentaequipos.com` | Administrador Maestro ToolRent | [#/admin](http://localhost:5173/#/admin) |
| **PROVEEDOR** | `prov_maquinaria_bog` | `contacto@maquinariabogota.com` | Maquinaria y Equipos Bogotá S.A.S. | [#/provider](http://localhost:5173/#/provider) |
| **CLIENTE** | `cliente_carlos_gomez` | `carlos.gomez@constructora.com` | Carlos Alberto Gómez Peña | [#/client](http://localhost:5173/#/client) |

---

## 🌐 URLs y Enlaces de Acceso

- **Frontend General:** [http://localhost:5173/](http://localhost:5173/)
- **Pantalla de Login:** [http://localhost:5173/#/login](http://localhost:5173/#/login)
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
- **Estado Actual:** Base de datos limpia con 3 usuarios, 20 categorías taxonómicas listas, y 0 registros de herramientas o alquileres (lista para pruebas desde cero).

---

## 🚀 Ejemplos de Login vía cURL

### Login Administrador:
```bash
curl -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin_principal", "password": "Password123*"}'
```

### Login Proveedor:
```bash
curl -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "prov_maquinaria_bog", "password": "Password123*"}'
```

### Login Cliente:
```bash
curl -X POST http://localhost:8085/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "cliente_carlos_gomez", "password": "Password123*"}'
```
Rol	Usuario (username)	Correo Electrónico	Contraseña	Perfil Asociado
ADMIN	admin_principal	admin@rentaequipos.com	Password123*	Administrador Maestro
PROVEEDOR	prov_maquinaria_bog	contacto@maquinariabogota.com	Password123*	Maquinaria y Equipos Bogotá S.A.S.
CLIENTE	cliente_carlos_gomez	carlos.gomez@constructora.com	Password123*	Carlos Alberto Gómez Peña
