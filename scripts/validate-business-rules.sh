#!/usr/bin/env bash
# =============================================================================
# DisherIo - Validador de Logica de Negocio
# Verifica que todas las reglas de negocio esten implementadas correctamente
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend/src"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

check_pass() { echo -e "${GREEN}✓${NC} $1"; }
check_fail() { echo -e "${RED}✗${NC} $1"; }
check_warn() { echo -e "${YELLOW}!${NC} $1"; }
info() { echo -e "${BLUE}→${NC} $1"; }

echo -e "${CYAN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║     DisherIO - Validador de Lógica de Negocio                ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

ERRORS=0
WARNS=0

echo -e "${BOLD}Verificando reglas de negocio...${NC}"
echo ""

# =============================================================================
# REGLA 1: Solo usuarios con permiso KTS pueden acceder a KDS
# =============================================================================
info "Regla 1: Permisos KDS (KTS)"
KDS_HANDLER="$BACKEND_DIR/sockets/kds.handler.ts"
if [ -f "$KDS_HANDLER" ]; then
    if grep -q "permissions.includes('KTS')" "$KDS_HANDLER"; then
        check_pass "KDS verifica permiso 'KTS'"
    elif grep -q "permissions.includes('KITCHEN')" "$KDS_HANDLER"; then
        check_fail "KDS usa permiso 'KITCHEN' (debe ser 'KTS')"
        ((ERRORS++))
    else
        check_fail "KDS no verifica permisos correctamente"
        ((ERRORS++))
    fi
else
    check_warn "No se encuentra kds.handler.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 2: Transiciones de estado de items validas
# =============================================================================
info "Regla 2: Transiciones de estado de items"
ORDER_SERVICE="$BACKEND_DIR/services/order.service.ts"
if [ -f "$ORDER_SERVICE" ]; then
    # Verificar que existen las transiciones validas
    if grep -q "ORDERED.*ON_PREPARE.*CANCELED" "$ORDER_SERVICE" && \
       grep -q "ON_PREPARE.*SERVED.*CANCELED" "$ORDER_SERVICE"; then
        check_pass "Transiciones de estado definidas correctamente"
    else
        check_warn "Verificar transiciones de estado manualmente"
        ((WARNS++))
    fi
    
    # Verificar autorizacion para cancelar items en preparacion
    if grep -q "REQUIRES_POS_AUTHORIZATION" "$ORDER_SERVICE"; then
        check_pass "Cancelacion de items ON_PREPARE requiere autorizacion POS/ADMIN"
    else
        check_warn "Verificar autorizacion para cancelar items en preparacion"
        ((WARNS++))
    fi
else
    check_warn "No se encuentra order.service.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 3: Precios siempre positivos
# =============================================================================
info "Regla 3: Validacion de precios"
DISH_MODEL="$BACKEND_DIR/models/dish.model.ts"
if [ -f "$DISH_MODEL" ]; then
    if grep -q "min: 0" "$DISH_MODEL"; then
        check_pass "Modelos validan precios >= 0"
    else
        check_fail "Modelos no validan precios negativos"
        ((ERRORS++))
    fi
else
    check_warn "No se encuentra dish.model.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 4: Email siempre lowercase y unico
# =============================================================================
info "Regla 4: Validacion de email"
STAFF_MODEL="$BACKEND_DIR/models/staff.model.ts"
if [ -f "$STAFF_MODEL" ]; then
    if grep -q "unique: true" "$STAFF_MODEL" && grep -q "lowercase: true" "$STAFF_MODEL"; then
        check_pass "Email es unico y lowercase"
    else
        check_fail "Email no tiene validaciones correctas"
        ((ERRORS++))
    fi
else
    check_warn "No se encuentra staff.model.ts"
    ((WARNS++))
fi

# Verificar en repositorio
USER_REPO="$BACKEND_DIR/repositories/user.repository.ts"
if [ -f "$USER_REPO" ]; then
    if grep -q "email.toLowerCase()" "$USER_REPO"; then
        check_pass "Repositorio normaliza email a lowercase"
    else
        check_warn "Repositorio podria no normalizar email"
        ((WARNS++))
    fi
else
    check_warn "No se encuentra user.repository.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 5: JWT_SECRET obligatorio en produccion
# =============================================================================
info "Regla 5: JWT_SECRET requerido"
AUTH_SERVICE="$BACKEND_DIR/services/auth.service.ts"
if [ -f "$AUTH_SERVICE" ]; then
    if grep -q "JWT_SECRET environment variable is required" "$AUTH_SERVICE"; then
        check_pass "JWT_SECRET es obligatorio (sin fallback inseguro)"
    elif grep -q "'changeme'" "$AUTH_SERVICE"; then
        check_fail "JWT_SECRET tiene fallback 'changeme' (inseguro)"
        ((ERRORS++))
    else
        check_warn "Verificar validacion de JWT_SECRET"
        ((WARNS++))
    fi
else
    check_warn "No se encuentra auth.service.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 6: Rate limiting en rutas publicas
# =============================================================================
info "Regla 6: Rate limiting en rutas publicas"
TOTEM_ROUTES="$BACKEND_DIR/routes/totem.routes.ts"
if [ -f "$TOTEM_ROUTES" ]; then
    if grep -q "qrLimiter\|qrBruteForceLimiter" "$TOTEM_ROUTES"; then
        check_pass "Rutas publicas de QR tienen rate limiting"
    else
        check_fail "Rutas publicas de QR sin rate limiting"
        ((ERRORS++))
    fi
else
    check_warn "No se encuentra totem.routes.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 7: Validacion de ObjectId en parametros
# =============================================================================
info "Regla 7: Validacion de ObjectId"
BASE_REPO="$BACKEND_DIR/repositories/base.repository.ts"
if [ -f "$BASE_REPO" ]; then
    if grep -q "validateObjectId" "$BASE_REPO"; then
        check_pass "BaseRepository valida ObjectId"
    else
        check_fail "BaseRepository no valida ObjectId"
        ((ERRORS++))
    fi
else
    check_warn "No se encuentra base.repository.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 8: Platos desactivados no deben aparecer en menu
# =============================================================================
info "Regla 8: Filtrado de platos desactivados"
if [ -f "$DISH_MODEL" ]; then
    if grep -q "disher_status.*ACTIVATED" "$DISH_MODEL"; then
        check_pass "Modelo tiene campo disher_status"
    else
        check_warn "Verificar campo disher_status en modelo"
        ((WARNS++))
    fi
fi

if [ -f "$ORDER_SERVICE" ]; then
    if grep -q "DISH_NOT_AVAILABLE" "$ORDER_SERVICE"; then
        check_pass "Servicio verifica que el plato este activado"
    else
        check_warn "Verificar validacion de disher_status en order.service"
        ((WARNS++))
    fi
fi

# =============================================================================
# REGLA 9: Manejo de errores en sockets
# =============================================================================
info "Regla 9: Manejo de errores en sockets"
if [ -f "$KDS_HANDLER" ]; then
    if grep -q "kds:error" "$KDS_HANDLER"; then
        check_pass "KDS handler notifica errores al cliente"
    else
        check_fail "KDS handler no notifica errores al cliente"
        ((ERRORS++))
    fi
else
    check_warn "No se encuentra kds.handler.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 10: Propinas calculadas correctamente
# =============================================================================
info "Regla 10: Calculo de propinas"
if [ -f "$ORDER_SERVICE" ]; then
    if grep -q "tips_state\|tips_type\|tips_rate" "$ORDER_SERVICE"; then
        check_pass "Servicio considera configuracion de propinas"
    else
        check_warn "Verificar calculo de propinas"
        ((WARNS++))
    fi
fi

# =============================================================================
# REGLA 11: Impuestos calculados correctamente
# =============================================================================
info "Regla 11: Calculo de impuestos"
TAX_UTILS="$BACKEND_DIR/utils/tax.ts"
if [ -f "$TAX_UTILS" ]; then
    if grep -q "extractTax" "$TAX_UTILS"; then
        check_pass "Utilidad de impuestos existe"
    else
        check_warn "Verificar utilidad de impuestos"
        ((WARNS++))
    fi
else
    check_warn "No se encuentra utils/tax.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 12: Totem session debe estar activa para crear orden
# =============================================================================
info "Regla 12: Validacion de sesion de totem"
if [ -f "$ORDER_SERVICE" ]; then
    if grep -q "SESSION_NOT_ACTIVE" "$ORDER_SERVICE"; then
        check_pass "Servicio verifica que la sesion este activa"
    else
        check_fail "Servicio no verifica estado de sesion"
        ((ERRORS++))
    fi
fi

# =============================================================================
# REGLA 13: No se puede eliminar categoria con platos
# =============================================================================
info "Regla 13: Proteccion de categorias con platos"
DISH_SERVICE="$BACKEND_DIR/services/dish.service.ts"
if [ -f "$DISH_SERVICE" ]; then
    if grep -q "CATEGORY_HAS_DISHES" "$DISH_SERVICE"; then
        check_pass "No se puede eliminar categoria con platos"
    else
        check_warn "Verificar proteccion de categorias"
        ((WARNS++))
    fi
else
    check_warn "No se encuentra dish.service.ts"
    ((WARNS++))
fi

# =============================================================================
# REGLA 14: Backup de credenciales
# =============================================================================
info "Regla 14: Persistencia de credenciales"
INSTALLER="$SCRIPT_DIR/install-fixed.sh"
if [ -f "$INSTALLER" ]; then
    if grep -q ".credentials" "$INSTALLER"; then
        check_pass "Instalador guarda credenciales en archivo seguro"
    else
        check_warn "Verificar persistencia de credenciales"
        ((WARNS++))
    fi
else
    check_warn "No se encuentra install-fixed.sh"
    ((WARNS++))
fi

# =============================================================================
# Resumen
# =============================================================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}              ${BOLD}Resumen de Validacion${NC}                         ${CYAN}║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════════════╣${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNS -eq 0 ]; then
    echo -e "${CYAN}║${NC}  ${GREEN}✓ Todas las reglas de negocio estan implementadas${NC}          ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${CYAN}║${NC}  ${YELLOW}! $WARNS advertencias${NC}                                        ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Reglas criticas: OK | Revisar advertencias                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${CYAN}║${NC}  ${RED}✗ $ERRORS errores criticos${NC}                                   ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${YELLOW}$WARNS advertencias${NC}                                          ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    
    echo ""
    echo "Ejecutar fixers para corregir:"
    echo "  sudo ./scripts/fix-critical-bugs.sh      # Bugs criticos"
    echo "  sudo ./scripts/fix-security-ratelimit.sh # Rate limiting"
    echo "  sudo ./scripts/fix-performance.sh        # Optimizaciones"
    
    exit 1
fi
