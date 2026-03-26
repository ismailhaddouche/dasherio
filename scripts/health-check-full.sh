#!/usr/bin/env bash
# =============================================================================
# DisherIo - Health Check Completo
# Verifica que todos los servicios funcionan correctamente
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

check_pass() { echo -e "${GREEN}✓${NC} $1"; }
check_fail() { echo -e "${RED}✗${NC} $1"; }
check_warn() { echo -e "${YELLOW}!${NC} $1"; }
info() { echo -e "${BLUE}→${NC} $1"; }

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║           DisherIO - Health Check                            ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

ERRORS=0
WARNS=0

# 1. Verificar contenedores corriendo
info "Verificando contenedores..."
CONTAINERS=("disherio_mongo" "disherio_backend" "disherio_frontend" "disherio_caddy")
for CONTAINER in "${CONTAINERS[@]}"; do
    if docker ps --format "{{.Names}}" | grep -q "^${CONTAINER}$"; then
        STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "unknown")
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "none")
        
        if [ "$STATUS" = "running" ]; then
            if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "none" ]; then
                check_pass "$CONTAINER: $STATUS ($HEALTH)"
            else
                check_warn "$CONTAINER: $STATUS (health: $HEALTH)"
                ((WARNS++))
            fi
        else
            check_fail "$CONTAINER: $STATUS"
            ((ERRORS++))
        fi
    else
        check_fail "$CONTAINER: No ejecutandose"
        ((ERRORS++))
    fi
done

# 2. Verificar conectividad de red
info "Verificando red Docker..."
if docker network inspect disherio_disherio_net >/dev/null 2>&1; then
    check_pass "Red Docker 'disherio_disherio_net' existe"
else
    check_fail "Red Docker no encontrada"
    ((ERRORS++))
fi

# 3. Verificar MongoDB
info "Verificando MongoDB..."
if docker exec disherio_mongo mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q "1"; then
    check_pass "MongoDB responde a pings"
    
    # Verificar base de datos disherio
    DB_EXISTS=$(docker exec disherio_mongo mongosh --quiet --eval "db.getMongo().getDBNames().includes('disherio')" 2>/dev/null || echo "false")
    if [ "$DB_EXISTS" = "true" ]; then
        check_pass "Base de datos 'disherio' existe"
        
        # Contar colecciones
        COLLECTIONS=$(docker exec disherio_mongo mongosh disherio --quiet --eval "db.getCollectionNames().length" 2>/dev/null || echo "0")
        if [ "$COLLECTIONS" -gt 0 ]; then
            check_pass "Colecciones en BD: $COLLECTIONS"
        else
            check_warn "No hay colecciones en la base de datos"
            ((WARNS++))
        fi
    else
        check_warn "Base de datos 'disherio' no encontrada"
        ((WARNS++))
    fi
else
    check_fail "MongoDB no responde"
    ((ERRORS++))
fi

# 4. Verificar Backend API
info "Verificando Backend API..."
BACKEND_HEALTH=$(docker exec disherio_backend wget -qO- http://127.0.0.1:3000/health 2>/dev/null || echo "")
if [ -n "$BACKEND_HEALTH" ]; then
    check_pass "Backend API health check: OK"
    
    # Intentar obtener version o estado
    if echo "$BACKEND_HEALTH" | grep -q "ok\|healthy\|up"; then
        check_pass "Backend reporta estado saludable"
    fi
else
    check_fail "Backend API no responde en /health"
    ((ERRORS++))
fi

# 5. Verificar Frontend
info "Verificando Frontend..."
FRONTEND_STATUS=$(docker exec disherio_caddy wget -qO- http://frontend:4200 2>/dev/null | head -c 100 || echo "")
if [ -n "$FRONTEND_STATUS" ]; then
    check_pass "Frontend responde"
else
    check_warn "Frontend no responde (puede ser normal si aun esta cargando)"
    ((WARNS++))
fi

# 6. Verificar Caddy (reverse proxy)
info "Verificando Caddy..."
CADDY_CONFIG=$(docker exec disherio_caddy cat /etc/caddy/Caddyfile 2>/dev/null | head -5 || echo "")
if [ -n "$CADDY_CONFIG" ]; then
    check_pass "Caddy configurado"
else
    check_warn "No se pudo leer configuracion de Caddy"
fi

# 7. Verificar credenciales admin
info "Verificando credenciales de administrador..."
if [ -f "$ROOT_DIR/.credentials" ]; then
    check_pass "Archivo de credenciales existe"
    
    # Verificar que el usuario existe en BD
    ADMIN_EXISTS=$(docker exec disherio_mongo mongosh disherio --quiet --eval "
        db.staffs.findOne({email: 'admin@disherio.com'}) ? 'EXISTS' : 'NOT_FOUND'
    " 2>/dev/null || echo "ERROR")
    
    if [ "$ADMIN_EXISTS" = "EXISTS" ]; then
        check_pass "Usuario admin encontrado en BD"
    elif [ "$ADMIN_EXISTS" = "NOT_FOUND" ]; then
        check_fail "Usuario admin NO encontrado en BD"
        ((ERRORS++))
    else
        check_warn "No se pudo verificar usuario admin"
        ((WARNS++))
    fi
else
    check_warn "Archivo de credenciales no encontrado"
    ((WARNS++))
fi

# 8. Verificar volúmenes
info "Verificando volúmenes Docker..."
VOLUMES=("disherio_mongo_data" "disherio_uploads" "disherio_caddy_data")
for VOLUME in "${VOLUMES[@]}"; do
    if docker volume inspect "$VOLUME" >/dev/null 2>&1; then
        check_pass "Volumen '$VOLUME' existe"
    else
        check_warn "Volumen '$VOLUME' no encontrado"
        ((WARNS++))
    fi
done

# 9. Verificar logs de errores
info "Verificando logs recientes..."
RECENT_ERRORS=$(docker logs --since=5m disherio_backend 2>&1 | grep -i "error\|exception" | wc -l)
if [ "$RECENT_ERRORS" -eq 0 ]; then
    check_pass "No hay errores recientes en backend"
else
    check_warn "Hay $RECENT_ERRORS errores recientes en backend"
    ((WARNS++))
fi

# 10. Verificar acceso externo (si hay IP publica)
info "Verificando acceso externo..."
PUBLIC_IP=$(curl -s --max-time 5 https://api.ipify.org 2>/dev/null || echo "")
if [ -n "$PUBLIC_IP" ]; then
    # Intentar acceder via Caddy
    EXTERNAL_STATUS=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "http://$PUBLIC_IP" 2>/dev/null || echo "000")
    if [ "$EXTERNAL_STATUS" = "200" ] || [ "$EXTERNAL_STATUS" = "302" ]; then
        check_pass "Acceso externo disponible (HTTP $EXTERNAL_STATUS)"
    elif [ "$EXTERNAL_STATUS" = "000" ]; then
        check_warn "No se pudo verificar acceso externo (posible firewall)"
    else
        check_warn "Acceso externo retorna HTTP $EXTERNAL_STATUS"
    fi
else
    check_warn "Sin IP publica detectable"
fi

# Resumen
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}                     ${BOLD}Resumen de Health Check${NC}                    ${CYAN}║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNS -eq 0 ]; then
    echo -e "${CYAN}║${NC}  ${GREEN}✓ Todos los servicios funcionan correctamente${NC}                ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${CYAN}║${NC}  ${YELLOW}! $WARNS advertencias detectadas${NC}                              ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  El sistema funciona pero revisa las advertencias              ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${CYAN}║${NC}  ${RED}✗ $ERRORS errores detectados${NC}                                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${YELLOW}$WARNS advertencias${NC}                                            ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    
    echo ""
    echo "Comandos utiles para diagnostico:"
    echo "  docker compose logs -f backend"
    echo "  docker compose logs -f mongo"
    echo "  docker exec disherio_mongo mongosh disherio"
    
    exit 1
fi
