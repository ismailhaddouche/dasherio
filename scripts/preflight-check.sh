#!/usr/bin/env bash
# =============================================================================
# DisherIo - Pre-flight Check
# Valida que el entorno cumple todos los requisitos antes de instalar
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

check_pass() { echo -e "${GREEN}✓${NC} $1"; }
check_fail() { echo -e "${RED}✗${NC} $1"; }
check_warn() { echo -e "${YELLOW}!${NC} $1"; }
info() { echo -e "${BLUE}→${NC} $1"; }

echo -e "${BOLD}DisherIO - Pre-flight Check${NC}"
echo "=============================="
echo ""

ERRORS=0
WARNS=0

# 1. Verificar sistema operativo
info "Verificando sistema operativo..."
if [ -f /etc/os-release ]; then
    OS=$(grep ^ID= /etc/os-release | cut -d'=' -f2 | tr -d '"')
    VERSION=$(grep ^VERSION_ID= /etc/os-release | cut -d'=' -f2 | tr -d '"')
    check_pass "OS: $OS $VERSION"
else
    check_warn "No se pudo detectar el OS"
    ((WARNS++))
fi

# 2. Verificar arquitectura
info "Verificando arquitectura..."
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "aarch64" ]; then
    check_pass "Arquitectura: $ARCH"
else
    check_warn "Arquitectura no estandar: $ARCH"
    ((WARNS++))
fi

# 3. Verificar RAM
info "Verificando memoria RAM..."
RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "$RAM_MB" -ge 2048 ]; then
    check_pass "RAM: ${RAM_MB}MB (≥2GB recomendado)"
elif [ "$RAM_MB" -ge 1024 ]; then
    check_warn "RAM: ${RAM_MB}MB (1GB funciona pero es lento)"
    ((WARNS++))
else
    check_fail "RAM: ${RAM_MB}MB (insuficiente, minimo 1GB)"
    ((ERRORS++))
fi

# 4. Verificar espacio en disco
info "Verificando espacio en disco..."
DISK_GB=$(df -BG "$ROOT_DIR" | awk 'NR==2 {print $4}' | tr -d 'G')
if [ "$DISK_GB" -ge 10 ]; then
    check_pass "Disco: ${DISK_GB}GB disponible (≥10GB recomendado)"
elif [ "$DISK_GB" -ge 5 ]; then
    check_warn "Disco: ${DISK_GB}GB disponible (minimo aceptable)"
    ((WARNS++))
else
    check_fail "Disco: ${DISK_GB}GB disponible (insuficiente)"
    ((ERRORS++))
fi

# 5. Verificar si es root
info "Verificando permisos..."
if [ "$EUID" -eq 0 ]; then
    check_pass "Ejecutando como root"
else
    check_fail "Se requiere ejecutar como root (sudo)"
    ((ERRORS++))
fi

# 6. Verificar conectividad a internet
info "Verificando conectividad..."
if ping -c 1 -W 5 8.8.8.8 >/dev/null 2>&1 || ping -c 1 -W 5 1.1.1.1 >/dev/null 2>&1; then
    check_pass "Conectividad a internet: OK"
else
    check_fail "Sin conectividad a internet"
    ((ERRORS++))
fi

# 7. Verificar puertos disponibles
info "Verificando puertos..."
for PORT in 80 443 3000 4200 27017; do
    if ss -tlnp | grep -q ":${PORT} "; then
        check_warn "Puerto ${PORT} esta ocupado"
        ((WARNS++))
    else
        check_pass "Puerto ${PORT} disponible"
    fi
done

# 8. Verificar Docker
info "Verificando Docker..."
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
    check_pass "Docker instalado: $DOCKER_VERSION"
    
    if docker info >/dev/null 2>&1; then
        check_pass "Docker daemon ejecutandose"
    else
        check_fail "Docker daemon no esta ejecutandose"
        ((ERRORS++))
    fi
else
    check_warn "Docker no instalado (se instalara durante el setup)"
fi

# 9. Verificar Docker Compose
info "Verificando Docker Compose..."
if docker compose version >/dev/null 2>&1 || docker-compose version >/dev/null 2>&1; then
    check_pass "Docker Compose disponible"
else
    check_warn "Docker Compose no instalado (se instalara durante el setup)"
fi

# 10. Verificar estructura del proyecto
info "Verificando estructura del proyecto..."
REQUIRED_FILES=(
    "docker-compose.yml"
    "backend/Dockerfile"
    "frontend/Dockerfile"
    "backend/package.json"
    "frontend/package.json"
    "backend/src/index.ts"
)

for FILE in "${REQUIRED_FILES[@]}"; do
    if [ -f "$ROOT_DIR/$FILE" ]; then
        check_pass "Archivo: $FILE"
    else
        check_fail "Falta archivo: $FILE"
        ((ERRORS++))
    fi
done

# 11. Verificar que los puertos estan disponibles para Docker
info "Verificando conflictos de red Docker..."
if docker network ls | grep -q "disherio_disherio_net"; then
    check_warn "Red Docker 'disherio_disherio_net' ya existe"
    ((WARNS++))
else
    check_pass "Red Docker disponible"
fi

# 12. Verificar version de Node en Docker
info "Verificando imagenes Docker base..."
if docker pull node:20-alpine >/dev/null 2>&1; then
    check_pass "Imagen node:20-alpine disponible"
else
    check_warn "No se pudo verificar imagen node:20-alpine"
    ((WARNS++))
fi

# Resumen
echo ""
echo "=============================="
echo -e "${BOLD}Resumen:${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNS -eq 0 ]; then
    echo -e "${GREEN}Todos los checks pasaron. Listo para instalar.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}$WARNS advertencias. Puedes continuar pero revisa las advertencias.${NC}"
    exit 0
else
    echo -e "${RED}$ERRORS errores encontrados. Corrige los errores antes de continuar.${NC}"
    echo -e "${YELLOW}$WARNS advertencias.${NC}"
    exit 1
fi
