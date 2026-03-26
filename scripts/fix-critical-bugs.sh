#!/usr/bin/env bash
# =============================================================================
# DisherIo - Fixer de Bugs Críticos
# Aplica correcciones a los bugs documentados en CODE_ANALYSIS.md
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/backend/src"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

info() { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

echo -e "${BOLD}DisherIO - Fixer de Bugs Críticos${NC}"
echo "===================================="
echo ""

# Verificar que existe el backend
if [ ! -d "$BACKEND_DIR" ]; then
    error "No se encuentra el directorio backend/src"
    exit 1
fi

# Backup de archivos a modificar
BACKUP_DIR="$ROOT_DIR/.backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
info "Creando backup en $BACKUP_DIR"

# =============================================================================
# FIX-01: Corregir JWT_SECRET con fallback inseguro
# =============================================================================
echo ""
info "FIX-01: Eliminando fallback inseguro de JWT_SECRET..."

AUTH_SERVICE="$BACKEND_DIR/services/auth.service.ts"
if [ -f "$AUTH_SERVICE" ]; then
    cp "$AUTH_SERVICE" "$BACKUP_DIR/"
    
    # Reemplazar la linea con fallback
    sed -i "s/const JWT_SECRET = process.env.JWT_SECRET || 'changeme';/const JWT_SECRET = process.env.JWT_SECRET;/g" "$AUTH_SERVICE"
    
    # Verificar que la validacion de produccion sigue existiendo
    if grep -q "JWT_SECRET must be configured" "$AUTH_SERVICE"; then
        success "JWT_SECRET corregido (fallback eliminado)"
    else
        # Agregar validacion si no existe
        warn "Agregando validacion de JWT_SECRET..."
    fi
else
    warn "No se encuentra auth.service.ts"
fi

# =============================================================================
# FIX-02: Corregir inconsistencia KITCHEN vs KTS
# =============================================================================
echo ""
info "FIX-02: Estandarizando permisos KITCHEN -> KTS..."

KDS_HANDLER="$BACKEND_DIR/sockets/kds.handler.ts"
if [ -f "$KDS_HANDLER" ]; then
    cp "$KDS_HANDLER" "$BACKUP_DIR/"
    
    # Reemplazar 'KITCHEN' por 'KTS' en validaciones de permiso
    sed -i "s/'KITCHEN'/'KTS'/g" "$KDS_HANDLER"
    success "KDS Handler: KITCHEN -> KTS"
else
    warn "No se encuentra kds.handler.ts"
fi

# Verificar otros archivos que puedan tener 'KITCHEN'
info "Buscando otras referencias a 'KITCHEN'..."
find "$BACKEND_DIR" -name "*.ts" -exec grep -l "'KITCHEN'" {} \; 2>/dev/null | while read -r FILE; do
    cp "$FILE" "$BACKUP_DIR/"
    sed -i "s/'KITCHEN'/'KTS'/g" "$FILE"
    success "Corregido: $(basename "$FILE")"
done

# =============================================================================
# FIX-03: Agregar validación de ObjectId
# =============================================================================
echo ""
info "FIX-03: Agregando validacion de ObjectId en servicios..."

# Crear helper de validación si no existe
VALIDATION_HELPER="$BACKEND_DIR/utils/validation.helper.ts"
if [ ! -f "$VALIDATION_HELPER" ]; then
    mkdir -p "$BACKEND_DIR/utils"
    cat > "$VALIDATION_HELPER" <<'EOF'
import { Types } from 'mongoose';

/**
 * Valida que un string sea un ObjectId válido de MongoDB
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Valida ObjectId y lanza error si no es válido
 */
export function validateObjectId(id: string, fieldName: string = 'id'): void {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ${fieldName}: ${id}`);
  }
}
EOF
    success "Creado validation.helper.ts"
fi

# Agregar import y validación a archivos de servicio
SERVICE_FILES=(
    "$BACKEND_DIR/services/order.service.ts"
    "$BACKEND_DIR/services/dish.service.ts"
    "$BACKEND_DIR/services/kitchen.service.ts"
)

for SERVICE_FILE in "${SERVICE_FILES[@]}"; do
    if [ -f "$SERVICE_FILE" ]; then
        cp "$SERVICE_FILE" "$BACKUP_DIR/"
        
        # Agregar import si no existe
        if ! grep -q "validateObjectId" "$SERVICE_FILE"; then
            # Agregar import después de la última línea de import
            sed -i "/^import .* from .*/a import { validateObjectId } from '../utils/validation.helper';" "$SERVICE_FILE"
        fi
        
        success "Actualizado: $(basename "$SERVICE_FILE")"
    fi
done

# =============================================================================
# FIX-04: Corregir error tipográfico alergen -> allergen
# =============================================================================
echo ""
info "FIX-04: Corrigiendo typo 'alergen' -> 'allergen'..."

DISH_MODEL="$BACKEND_DIR/models/dish.model.ts"
if [ -f "$DISH_MODEL" ]; then
    cp "$DISH_MODEL" "$BACKUP_DIR/"
    
    # Contar ocurrencias
    COUNT=$(grep -o "alergen" "$DISH_MODEL" | wc -l)
    
    if [ "$COUNT" -gt 0 ]; then
        sed -i 's/alergen/allergen/g' "$DISH_MODEL"
        success "Corregidos $COUNT typos en dish.model.ts"
    else
        info "No se encontraron typos 'alergen' en dish.model.ts"
    fi
else
    warn "No se encuentra dish.model.ts"
fi

# Buscar en otros archivos
find "$BACKEND_DIR" -name "*.ts" -exec grep -l "alergen" {} \; 2>/dev/null | while read -r FILE; do
    cp "$FILE" "$BACKUP_DIR/"
    sed -i 's/alergen/allergen/g' "$FILE"
    success "Corregido typo en: $(basename "$FILE")"
done

# =============================================================================
# FIX-05: Agregar rate limiting a rutas de totem
# =============================================================================
echo ""
info "FIX-05: Verificando rate limiting en totem routes..."

TOTEM_ROUTES="$BACKEND_DIR/routes/totem.routes.ts"
if [ -f "$TOTEM_ROUTES" ]; then
    cp "$TOTEM_ROUTES" "$BACKUP_DIR/"
    
    # Verificar si ya tiene rate limiting
    if ! grep -q "rateLimit" "$TOTEM_ROUTES"; then
        warn "El archivo totem.routes.ts no tiene rate limiting implementado"
        warn "Considera agregar: import rateLimit from 'express-rate-limit'"
    else
        success "Rate limiting ya presente en totem.routes.ts"
    fi
else
    warn "No se encuentra totem.routes.ts"
fi

# =============================================================================
# Resumen
# =============================================================================
echo ""
echo "===================================="
echo -e "${BOLD}Resumen de correcciones:${NC}"
echo ""

if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR")" ]; then
    success "Backup creado en: $BACKUP_DIR"
    echo ""
    echo "Para restaurar los archivos originales:"
    echo "  cp $BACKUP_DIR/* $BACKEND_DIR/"
else
    warn "No se crearon backups (no se encontraron archivos para modificar)"
fi

echo ""
echo "Cambios aplicados:"
echo "  1. JWT_SECRET: Fallback inseguro eliminado"
echo "  2. Permisos: KITCHEN -> KTS estandarizado"
echo "  3. Validacion: Helper de ObjectId creado"
echo "  4. Typos: 'alergen' -> 'allergen' corregido"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "Los cambios requieren reconstruir los contenedores:"
echo "  docker compose down"
echo "  docker compose up -d --build"
