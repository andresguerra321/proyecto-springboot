# Guía de Despliegue (DESPLIEGUE.md)

Este documento contiene las instrucciones exactas para levantar el sistema "Renta Equipos" desde cero, usando contenedores Docker.

## Estrategia de Despliegue (Contenedores)
El sistema se empaqueta en imágenes Docker mediante un *Multistage Build*. Esto significa que el código fuente se compila y empaqueta **dentro del proceso de construcción de Docker** usando Maven, y posteriormente solo se traslada el archivo `.jar` resultante a la imagen de ejecución, garantizando una imagen ligera de Java 17 Alpine (Eclipse Temurin 17 JRE).

El `docker-compose.yml` orquesta dos servicios principales:
1. **postgres:** Base de datos PostgreSQL.
2. **app:** API de Spring Boot.

## Pasos para Levantar desde Cero

Sigue estrictamente este proceso en un entorno que posea Docker Engine instalado.

### Paso 1: Variables de Entorno (Opcional pero recomendado)
En la raíz del proyecto encontrarás el archivo `.env.example`. Puedes crear un archivo `.env` renombrándolo para inyectar configuraciones:
```bash
cp .env.example .env
```
*(Por defecto, `docker-compose` está diseñado para usar los valores seguros predeterminados si no configuras el archivo `.env`)*

### Paso 2: Ejecutar Docker Compose
Abre tu consola en la raíz del repositorio (donde se encuentra `docker-compose.yml`) e ingresa el siguiente comando:
```bash
docker-compose up -d --build
```

**¿Qué ocurre aquí?**
1. Docker bajará la imagen de `postgres:16-alpine`.
2. Se iniciará el contenedor `renta_herramientas_postgres`.
3. El contenedor `app` comenzará su construcción desde la carpeta `/backend` usando el `Dockerfile` interno. (Tomará unos minutos descargar las dependencias de Maven la primera vez).
4. El contenedor `app` esperará a que `postgres` esté saludable (`healthcheck`).
5. Cuando inicia el `app`, **Flyway** se ejecuta automáticamente aplicando las migraciones (esquema inicial y creación de registros en la base de datos).

### Paso 3: Verificación de Estado
Comprueba que los contenedores estén corriendo:
```bash
docker-compose ps
```
Ambos contenedores deberían mostrarse con estado `Up`.

Para visualizar los registros en tiempo real y comprobar que Spring Boot arrancó exitosamente:
```bash
docker logs -f renta_herramientas_app
```

### Paso 4: Probar la Disponibilidad
La API estará expuesta en el puerto **8085** de tu máquina local.
- **Swagger:** Navega en tu explorador web a: `http://localhost:8085/swagger-ui.html`
- Para detener el servicio de manera limpia, usa:
```bash
docker-compose down
```

## Cambiar el Despliegue a Servidor Tomcat Nativo
Si el requerimiento institucional dicta un despliegue sin contenedor Docker directamente en Apache Tomcat 10:
1. Sigue las instrucciones de compilación a `.war` definidas en `COMPILACION.md`.
2. Renombra el archivo generado a `ROOT.war` si deseas que la aplicación responda a `/`, o a `renta-equipos.war` para que responda a `/renta-equipos`.
3. Mueve este archivo al directorio `webapps/` de tu instalación de Tomcat.
4. Asegúrate de configurar las variables de entorno de base de datos en las propiedades del servidor (ej. en `setenv.sh` de Tomcat), ya que las propiedades del `application.yml` dependen de inyecciones del OS como `DB_HOST`, `DB_USER`, `DB_PASSWORD`.
