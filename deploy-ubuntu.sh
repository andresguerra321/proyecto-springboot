#!/usr/bin/env bash
# ==============================================================================
# ToolRent - Despliegue Automatizado para Linux Ubuntu
# Instala prerrequisitos (Docker / Compose si faltan) y levanta la plataforma
# ==============================================================================

set -e

# Colores para salida en consola
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}       🏗️  ToolRent - Despliegue Automatizado en Ubuntu Linux     ${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# 1. Comprobar permisos sudo si es necesario instalar dependencias
check_command() {
    command -v "$1" >/dev/null 2>&1
}

# 2. Instalar Docker si no está presente
if ! check_command docker; then
    echo -e "${YELLOW}[1/5] Docker no detectado. Instalando Docker en Ubuntu...${NC}"
    if [ "$EUID" -ne 0 ]; then
        sudo apt-get update
        sudo apt-get install -y ca-certificates curl gnupg lsb-release
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        sudo usermod -aG docker "$USER" || true
    else
        apt-get update && apt-get install -y docker.io docker-compose-v2
    fi
    echo -e "${GREEN}✓ Docker instalado con éxito.${NC}"
else
    echo -e "${GREEN}✓ Docker ya está instalado.${NC}"
fi

# 3. Asegurar que el servicio de Docker esté corriendo
echo -e "${BLUE}[2/5] Verificando servicio Docker...${NC}"
if ! sudo systemctl is-active --quiet docker; then
    echo -e "${YELLOW}Iniciando servicio de Docker...${NC}"
    sudo systemctl start docker
fi

# 4. Construir y levantar contenedores (PostgreSQL 16, Spring Boot API, pgAdmin)
echo -e "${BLUE}[3/5] Levantando contenedores con Docker Compose...${NC}"
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif check_command docker-compose; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="sudo docker compose"
fi

$DOCKER_COMPOSE_CMD up -d --build

echo ""
echo -e "${BLUE}[4/5] Esperando a que PostgreSQL y Backend estén listos...${NC}"
sleep 8

# Esperar a que el backend responda UP
MAX_RETRIES=20
COUNT=0
until curl -s http://localhost:8085/api/v1/health | grep -q "UP" || [ $COUNT -eq $MAX_RETRIES ]; do
    echo -e "${YELLOW}Esperando inicialización del API REST (intento $((COUNT+1))/$MAX_RETRIES)...${NC}"
    sleep 3
    COUNT=$((COUNT+1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}Nota: El backend aún está completando el arranque. Continúa en segundo plano.${NC}"
else
    echo -e "${GREEN}✓ Backend Spring Boot activo y respondiendo UP en http://localhost:8085${NC}"
fi

# 5. Instalar Node.js para el Frontend si no existe
echo -e "${BLUE}[5/5] Verificando entorno para el Frontend (Vite)...${NC}"
if ! check_command node || ! check_command npm; then
    echo -e "${YELLOW}Node.js/npm no detectados. Instalando Node.js (LTS)...${NC}"
    if [ "$EUID" -ne 0 ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
fi

# Instalar dependencias del frontend si falta node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Instalando dependencias de frontend con npm...${NC}"
    cd frontend && npm install && cd ..
fi

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}       🎉  ¡TOOLRENT ESTÁ LISTO Y OPERATIVO EN UBUNTU!          ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
echo -e "🌐 ${BLUE}Servicios Activos:${NC}"
echo -e "   • Frontend Web SPA:        ${GREEN}http://localhost:5173${NC}"
echo -e "   • Backend REST API:        ${GREEN}http://localhost:8085/api/v1${NC}"
echo -e "   • Documentación Swagger:   ${GREEN}http://localhost:8085/swagger-ui.html${NC}"
echo -e "   • Base de Datos Postgres:  ${GREEN}localhost:5434 (renta_herramientas_db)${NC}"
echo -e "   • Interfaz pgAdmin:        ${GREEN}http://localhost:5050${NC}"
echo ""
echo -e "🔑 ${BLUE}Credenciales de Prueba (Contraseña universal: Password123*):${NC}"
echo -e "   • Admin:      admin_principal      (admin@rentaequipos.com)"
echo -e "   • Proveedor:  prov_maquinaria_bog  (contacto@maquinariabogota.com)"
echo -e "   • Cliente 1:  cliente_carlos_gomez (carlos.gomez@constructora.com)"
echo -e "   • Cliente 2:  cliente_maria_rodriguez (maria.rodriguez@ingenieria.com)"
echo ""
echo -e "${YELLOW}Iniciando servidor frontend... (Presiona Ctrl+C para detener el frontend)${NC}"
cd frontend && npm run dev -- --host
