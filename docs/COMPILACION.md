# Guía de Compilación del Proyecto

Esta guía describe el proceso de compilación, construcción y empaquetado del backend multi-módulo con Maven y Java 17.

---

## 📋 Requisitos Previos

1. **Java Development Kit (JDK):** Versión 17 o superior instalada (`java -version`).
2. **Maven:** Se incluye el Maven Wrapper oficial (`mvnw`), por lo que no es estrictamente necesario tener Maven instalado de forma global.

---

## 🏗 Estructura Multi-módulo de Compilación

El proyecto está compuesto por los siguientes módulos orquestados por el POM raíz:

1. `shared-kernel`: Clases transversales, Value Objects (`Money`, `DateRange`) y excepciones de dominio.
2. `identity`: Autenticación, usuarios, roles, JWT y perfiles de cliente/proveedor.
3. `catalog`: Catálogo de herramientas, inventario, categorías y disponibilidad.
4. `rental`: Reservas, control de alquileres, entregas y devoluciones.
5. `billing`: Pagos, facturación y recibos.
6. `reporting`: Consultas de analítica, estadísticas de rentabilidad e historial.
7. `bootstrap`: Módulo ensamblador que contiene la clase `@SpringBootApplication` y genera el ejecutable empaquetado (`bootstrap.jar`).

---

## 🛠 Comandos de Compilación

### 1. Limpiar y compilar todos los módulos (sin tests)
```bash
# En Linux / macOS
./mvnw clean package -DskipTests

# En Windows PowerShell
.\mvnw.cmd clean package -DskipTests
```

### 2. Compilar ejecutando pruebas unitarias
```bash
./mvnw clean package
# o en Windows
.\mvnw.cmd clean package
```

### 3. Compilar un solo módulo específico (ej. `shared-kernel` o `identity`)
```bash
./mvnw clean install -pl shared-kernel -am
```

---

## 📦 Artefacto Resultante

El JAR ejecutable se genera en el directorio `target` del módulo `bootstrap`:

```
bootstrap/target/bootstrap-1.0.0-SNAPSHOT.jar
```

Para ejecutar el JAR compilado manualmente:

```bash
java -jar bootstrap/target/bootstrap-1.0.0-SNAPSHOT.jar
```
