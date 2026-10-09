# Modelo de Datos y Normalización (4FN) - PostgreSQL 16

## 🏛️ Justificación y Cumplimiento de la Cuarta Forma Normal (4FN)

El diseño del modelo relacional se fundamenta en los principios de normalización rigurosa para garantizar la integridad referencial, evitar redundancias y prevenir anomalías de inserción, actualización y borrado.

### 1. Primera Forma Normal (1FN)
- **Atomicidad:** Cada columna almacena valores indivisibles (no hay listas separadas por comas ni cadenas compuestas).
- **Identificación unívoca:** Cada tupla posee una clave primaria definida (`UUID` o `SERIAL`).
- **Sin grupos repetitivos:** Atributos como imágenes o especificaciones técnicas no se almacenan como `img1, img2, img3` ni `spec1, spec2`.

### 2. Segunda Forma Normal (2FN)
- Cumple con 1FN.
- Todos los atributos que no forman parte de la clave primaria dependen funcionalmente de la totalidad de la clave primaria (no existen dependencias parciales sobre claves compuestas).
- En la tabla de unión `user_roles(user_id, role_id)`, no existen atributos descriptivos que dependan únicamente de `user_id` o `role_id`.

### 3. Tercera Forma Normal (3FN)
- Cumple con 2FN.
- No existen dependencias transitivas entre atributos no clave ($X \to Y$ y $Y \to Z$).
- Los datos fiscales y de ubicación del proveedor residen en `provider_profiles`, no en `tools`.
- Los datos del cliente residen en `client_profiles`, no en `rentals`.
- Los precios históricos pactados al momento de la reserva se preservan inmutables en `rental_items` como snapshot de la transacción contable.

### 4. Forma Normal de Boyce-Codd (BCNF)
- Cumple con 3FN.
- En toda dependencia funcional no trivial $X \to Y$, el determinante $X$ es una superclave / clave candidata.

### 5. Cuarta Forma Normal (4FN)
- Cumple con BCNF.
- **Eliminación de Dependencias Multivaluadas (MVDs) No Triviales:**
  Una dependencia multivaluada $X \twoheadrightarrow Y \mid Z$ ocurre cuando para un mismo valor de $X$, existen conjuntos independientes de valores de $Y$ y $Z$. Si se mantuvieran en la misma tabla, se generaría un producto cartesiano con redundancia crítica.

  **Casos de aplicación en este modelo:**
  1. **Herramientas, Imágenes y Especificaciones Técnicas:**
     - Una herramienta tiene múltiples imágenes ($tool\_id \twoheadrightarrow image\_url$).
     - Una herramienta tiene múltiples especificaciones técnicas ($tool\_id \twoheadrightarrow (spec\_name, spec\_value)$).
     - Las imágenes y las especificaciones son completamente independientes entre sí.
     - **Solución 4FN:** Se segregan en las relaciones independientes `tool_images` y `tool_specifications`.
  2. **Usuarios y Roles:**
     - Un usuario puede tener múltiples roles independientes de sus perfiles de negocio ($user\_id \twoheadrightarrow role\_id$).
     - **Solución 4FN:** Tabla relacional `user_roles(user_id, role_id)`.
  3. **Reservas y Herramientas Alquiladas:**
     - Una orden de alquiler puede incluir múltiples herramientas.
     - **Solución 4FN:** Tabla intermedia `rental_items(id, rental_id, tool_id, daily_price, total_price, status)`.
  4. **Inspecciones e Incidencias / Daños Físicos:**
     - Una inspección de entrega/devolución puede registrar 0 o múltiples herramientas con daños específicos.
     - **Solución 4FN:** Desacoplado en `damage_reports` vinculado a la inspección y a la herramienta puntual.

---

## 📊 Matriz de Entidades y Conteos (Mínimo 20 Registros)

| # | Entidad / Tabla | Propósito en el Dominio | Total Registros Semilla | Cumple $\ge 20$ |
|---|---|---|:---:|:---:|
| 1 | `roles` | Catálogo de roles y permisos del sistema | 20 | ✅ Sí |
| 2 | `users` | Identidades, credenciales y estados de usuario | 42 | ✅ Sí |
| 3 | `user_roles` | Asignación normalizada de roles a usuarios | 42 | ✅ Sí |
| 4 | `provider_profiles` | Perfil comercial y fiscal de empresas proveedoras | 20 | ✅ Sí |
| 5 | `client_profiles` | Perfil de contratistas y particulares | 20 | ✅ Sí |
| 6 | `categories` | Taxonomía de maquinaria y herramientas | 20 | ✅ Sí |
| 7 | `tools` | Catálogo maestro de equipos y precios diarios | 25 | ✅ Sí |
| 8 | `tool_images` | Múltiples fotografías por equipo (4FN) | 25 | ✅ Sí |
| 9 | `tool_specifications` | Fichas técnicas y parámetros operativos (4FN) | 25 | ✅ Sí |
| 10 | `rentals` | Encabezados de contratos de alquiler / reserva | 22 | ✅ Sí |
| 11 | `rental_items` | Detalle de herramientas alquiladas (4FN) | 25 | ✅ Sí |
| 12 | `rental_inspections` | Inspecciones físicas de entrega y recepción | 22 | ✅ Sí |
| 13 | `damage_reports` | Reportes de siniestros, costos y daños (4FN) | 20 | ✅ Sí |
| 14 | `payments` | Transacciones y comprobantes de pasarela | 22 | ✅ Sí |
| 15 | `invoices` | Facturas legales con discriminación de IVA (19%) | 20 | ✅ Sí |

---

## 🗃️ Versionamiento con Flyway

Las migraciones de base de datos se encuentran versionadas bajo el estándar de Flyway en:
- `bootstrap/src/main/resources/db/migration/V1__create_schema.sql`: Creación de extensiones, tablas, restricciones e índices.
- `bootstrap/src/main/resources/db/migration/V2__seed_data.sql`: Población inicial con datos consistentes y hashes de contraseñas con BCrypt.
