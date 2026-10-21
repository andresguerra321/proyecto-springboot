#!/usr/bin/env bash
# ==============================================================================
# ToolRent - Script Rápido de Inicio (Linux / macOS)
# Levanta Docker Compose y lanza el servidor de desarrollo del Frontend
# ==============================================================================

set -e

echo "========================================================"
echo "  ToolRent - Iniciando Plataforma Completa (Linux/Mac)"
echo "========================================================"
echo ""

echo "[1/3] Levantando Contenedores (PostgreSQL + Backend + pgAdmin)..."
docker compose up -d

echo ""
echo "[2/3] Verificando salud del Backend en http://localhost:8085..."
sleep 4

echo ""
echo "[3/3] Iniciando Frontend SPA (Vite) en http://localhost:5173..."
cd frontend
npm run dev -- --host
