@echo off
title ToolRent - Plataforma Completa (Backend + Frontend)
echo ========================================================
echo   ToolRent - Iniciando Plataforma Completa
echo ========================================================
echo.

echo [1/3] Iniciando Contenedores de Base de Datos y Backend...
docker compose up -d
echo.

echo [2/3] Verificando conectividad con Backend en http://localhost:8085...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Iniciando Servidor de Desarrollo Frontend (Vite)...
cd /d "%~dp0\frontend"
start http://localhost:5173
call npm.cmd run dev
pause
