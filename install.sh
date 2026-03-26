#!/usr/bin/env bash
# =============================================================================
# DisherIO - One-Command Installer
# Instalacion simplificada: solo git clone + install
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔════════════════════════════════════════════════════════════════╗"
echo "  ║           DisherIO - One-Command Installer                     ║"
echo "  ╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: Ejecutar como root (sudo)${NC}"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "$ROOT_DIR/docker-compose.yml" ]; then
    echo -e "${RED}ERROR: No se encuentra docker-compose.yml${NC}"
    echo "Asegurate de ejecutar este script desde el repositorio clonado:"
    echo "  git clone https://github.com/ismailhaddouche/disherio.git"
    echo "  cd disherio"
    echo "  sudo ./install.sh"
    exit 1
fi

echo -e "${BLUE}Iniciando instalacion automatica de DisherIO...${NC}"
echo ""

# Ejecutar el instalador universal
cd "$ROOT_DIR"
bash "$SCRIPT_DIR/install-universal.sh"
