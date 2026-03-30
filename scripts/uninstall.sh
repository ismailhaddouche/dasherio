#!/usr/bin/env bash
# =============================================================================
# DisherIO — Uninstaller
# Detiene contenedores, elimina imágenes y borra el directorio del proyecto
# Usage: sudo ./scripts/uninstall.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

[[ $EUID -eq 0 ]] || { echo -e "${RED}Ejecuta como root: sudo ./scripts/uninstall.sh${NC}"; exit 1; }

err()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
log()  { echo -e "${BLUE}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[ADVERTENCIA]${NC} $*"; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo -e "${CYAN}"
echo "  ██████╗ ██╗███████╗██╗  ██╗███████╗██████╗ ██╗ ██████╗"
echo "  ██╔══██╗██║██╔════╝██║  ██║██╔════╝██╔══██╗██║██╔═══██╗"
echo "  ██║  ██║██║███████╗███████║█████╗  ██████╔╝██║██║   ██║"
echo "  ██║  ██║██║╚════██║██╔══██║██╔══╝  ██╔══██╗██║██║   ██║"
echo "  ██████╔╝██║███████║██║  ██║███████╗██║  ██║██║╚██████╔╝"
echo "  ╚═════╝ ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝"
echo -e "${NC}"
echo -e "  ${BOLD}Desinstalador — Sistema de gestión de restaurantes${NC}"
echo ""

# ── Confirmación ──────────────────────────────────────────────────────────────
echo -e "${RED}${BOLD}  ADVERTENCIA: Esta acción es IRREVERSIBLE.${NC}"
echo ""
echo -e "  Se eliminarán:"
echo -e "    • Todos los contenedores Docker de DisherIO"
echo -e "    • Volúmenes (base de datos, uploads, caché Caddy)"
echo -e "    • Imágenes Docker personalizadas (disherio-backend, disherio-frontend)"
echo -e "    • Imágenes base sin uso (mongo:7, caddy:2-alpine, node:20-alpine)"
echo -e "    • Directorio del proyecto: ${BOLD}$ROOT_DIR${NC}"
echo ""
read -r -p "  ¿Confirmas la desinstalación completa? (escribe 'si' para continuar): " CONFIRM
echo ""
[[ "$CONFIRM" == "si" ]] || { echo -e "${YELLOW}Desinstalación cancelada.${NC}"; exit 0; }

# ── Paso 1: Detener y eliminar contenedores + volúmenes + orphans ─────────────
echo -e "\n${CYAN}=== PASO 1/4: DETENIENDO Y ELIMINANDO CONTENEDORES ===${NC}\n"

if [[ -f "$ROOT_DIR/docker-compose.yml" ]]; then
  cd "$ROOT_DIR"
  log "Deteniendo servicios y eliminando contenedores, redes y volúmenes..."
  docker compose down --volumes --remove-orphans 2>/dev/null && ok "Contenedores, redes y volúmenes eliminados" \
    || warn "No se encontraron contenedores activos (puede que ya estuvieran parados)"
else
  warn "docker-compose.yml no encontrado, intentando eliminar contenedores por nombre..."
  for container in disherio_caddy disherio_frontend disherio_backend disherio_mongo; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
      docker rm -f "$container" && ok "Contenedor $container eliminado"
    fi
  done
  for volume in disherio_mongo_data disherio_uploads disherio_caddy_data disherio_caddy_config; do
    if docker volume ls --format '{{.Name}}' | grep -q "^${volume}$"; then
      docker volume rm "$volume" && ok "Volumen $volume eliminado"
    fi
  done
  if docker network ls --format '{{.Name}}' | grep -q "^disherio_disherio_net$"; then
    docker network rm disherio_disherio_net && ok "Red disherio_disherio_net eliminada"
  fi
fi

# ── Paso 2: Eliminar imágenes personalizadas ──────────────────────────────────
echo -e "\n${CYAN}=== PASO 2/4: ELIMINANDO IMÁGENES PERSONALIZADAS ===${NC}\n"

for image in disherio-backend:latest disherio-frontend:latest; do
  if docker image inspect "$image" &>/dev/null; then
    docker rmi "$image" && ok "Imagen $image eliminada"
  else
    log "Imagen $image no encontrada, omitiendo"
  fi
done

# ── Paso 3: Limpiar imágenes base sin uso ─────────────────────────────────────
echo -e "\n${CYAN}=== PASO 3/4: LIMPIANDO IMÁGENES SIN USO (PRUNE) ===${NC}\n"

log "Ejecutando docker image prune para eliminar imágenes huérfanas y sin uso..."
docker image prune -af 2>/dev/null && ok "Imágenes sin uso eliminadas" \
  || warn "No se pudo ejecutar image prune"

# ── Paso 4: Eliminar directorio del proyecto ──────────────────────────────────
echo -e "\n${CYAN}=== PASO 4/4: ELIMINANDO DIRECTORIO DEL PROYECTO ===${NC}\n"

log "Eliminando directorio: $ROOT_DIR"
rm -rf "$ROOT_DIR" && ok "Directorio $ROOT_DIR eliminado" \
  || err "No se pudo eliminar el directorio $ROOT_DIR"

# ── Fin ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  DisherIO desinstalado correctamente.${NC}"
echo ""
