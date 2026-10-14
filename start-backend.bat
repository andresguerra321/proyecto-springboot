@echo off
title ToolRent - Spring Boot Backend Launcher (Puerto 8085)
echo ========================================================
echo   ToolRent - Iniciando Motor Spring Boot 3 + JPA
echo ========================================================
echo.

echo [1/2] Verificando base de datos PostgreSQL (puerto 5434)...
docker compose up -d postgres 2>nul || (
    echo [AVISO] Docker no esta en ejecucion o postgres ya esta arriba. Continuando...
)

echo.
echo [2/2] Iniciando aplicacion Spring Boot en http://localhost:8085...
echo Presiona Ctrl+C para detener el servidor.
echo.

cd /d "%~dp0\backend"
call mvnw.cmd spring-boot:run -pl bootstrap
pause
