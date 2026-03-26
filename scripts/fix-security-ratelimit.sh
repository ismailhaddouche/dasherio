#!/usr/bin/env bash
# =============================================================================
# DisherIo - Fixer de Rate Limiting y Seguridad
# Agrega rate limiting a rutas publicas de QR (SEC-02)
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

echo -e "${BOLD}DisherIO - Fixer de Rate Limiting${NC}"
echo "===================================="
echo ""

# Backup
BACKUP_DIR="$ROOT_DIR/.backup-ratelimit-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# =============================================================================
# FIX-01: Agregar rate limiting especifico para rutas de QR
# =============================================================================
info "FIX-01: Agregando rate limiting a rutas de QR..."

RATE_LIMIT_FILE="$BACKEND_DIR/middlewares/rateLimit.ts"
if [ -f "$RATE_LIMIT_FILE" ]; then
    cp "$RATE_LIMIT_FILE" "$BACKUP_DIR/"
    
    # Verificar si ya existe qrLimiter
    if ! grep -q "qrLimiter" "$RATE_LIMIT_FILE"; then
        cat >> "$RATE_LIMIT_FILE" <<'EOF'

// Rate limiter específico para endpoints de QR (acceso público)
export const qrLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many QR scans, please try again later.' },
  skip: (req) => {
    // Opcional: skip rate limiting para IPs internas/development
    return process.env.NODE_ENV === 'development';
  },
});

// Rate limiter más estricto para prevenir fuerza bruta de tokens QR
export const qrBruteForceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, QR code may be invalid.' },
  handler: (req, res, next, options) => {
    // Loggear intentos sospechosos
    console.warn(`[RateLimit] QR brute force detected from IP: ${req.ip}`);
    res.status(429).json(options.message);
  },
});
EOF
        success "Rate limiters para QR agregados"
    else
        info "Rate limiters para QR ya existen"
    fi
else
    error "No se encuentra rateLimit.ts"
fi

# =============================================================================
# FIX-02: Aplicar rate limiting a rutas de totem
# =============================================================================
info "FIX-02: Aplicando rate limiting a rutas publicas de totem..."

TOTEM_ROUTES="$BACKEND_DIR/routes/totem.routes.ts"
if [ -f "$TOTEM_ROUTES" ]; then
    cp "$TOTEM_ROUTES" "$BACKUP_DIR/"
    
    # Verificar si ya tiene los imports y aplicaciones
    if ! grep -q "qrLimiter" "$TOTEM_ROUTES"; then
        # Reemplazar el archivo completo con la version segura
        cat > "$TOTEM_ROUTES" <<'EOF'
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';
import { qrLimiter, qrBruteForceLimiter } from '../middlewares/rateLimit';
import * as TotemController from '../controllers/totem.controller';

const router = Router();

// Public routes: QR menu access with rate limiting to prevent abuse
router.get('/menu/:qr', qrBruteForceLimiter, TotemController.getMenuByQR);
// BUG-04 FIX: Added rate limiting to public dish endpoint
router.get('/menu/:qr/dishes', qrLimiter, TotemController.getMenuDishes);

// Protected routes require authentication
router.use(authMiddleware);

router.get('/', requirePermission('read', 'Totem'), TotemController.listTotems);
router.post('/', requirePermission('create', 'Totem'), TotemController.createTotem);
router.delete('/:id', requirePermission('delete', 'Totem'), TotemController.deleteTotem);
router.post('/:totemId/session', requirePermission('create', 'TotemSession'), TotemController.startSession);

export default router;
EOF
        success "Rutas de totem protegidas con rate limiting"
    else
        info "Rate limiting ya aplicado en totem.routes.ts"
    fi
else
    error "No se encuentra totem.routes.ts"
fi

# =============================================================================
# FIX-03: Mejorar manejo de errores en KDS handler
# =============================================================================
info "FIX-03: Mejorando manejo de errores en KDS handler..."

KDS_HANDLER="$BACKEND_DIR/sockets/kds.handler.ts"
if [ -f "$KDS_HANDLER" ]; then
    cp "$KDS_HANDLER" "$BACKUP_DIR/"
    
    # Crear version mejorada con notificacion de errores al cliente
    cat > "$KDS_HANDLER" <<'EOF'
import { Server } from 'socket.io';
import { ItemOrder } from '../models/order.model';
import { logger } from '../config/logger';
import { AuthenticatedSocket } from '../middlewares/socketAuth';

export function registerKdsHandlers(io: Server, socket: AuthenticatedSocket): void {
  // Verify user has kitchen permissions (KTS = Kitchen Table Service)
  const user = socket.user;
  if (!user || !user.permissions.includes('KTS')) {
    logger.warn({ socketId: socket.id }, 'Unauthorized KDS connection attempt');
    socket.emit('kds:error', { message: 'INSUFFICIENT_PERMISSIONS', required: 'KTS' });
    socket.disconnect();
    return;
  }

  socket.on('kds:join', (sessionId: string) => {
    // Validate sessionId format
    if (!sessionId || typeof sessionId !== 'string') {
      socket.emit('kds:error', { message: 'INVALID_SESSION_ID' });
      return;
    }
    
    socket.join(`session:${sessionId}`);
    logger.info({ socketId: socket.id, userId: user.staffId, sessionId }, 'KDS joined session room');
    socket.emit('kds:joined', { sessionId });
  });

  socket.on('kds:item_prepare', async ({ itemId }: { itemId: string }) => {
    try {
      // Validate itemId
      if (!itemId || typeof itemId !== 'string') {
        socket.emit('kds:error', { message: 'INVALID_ITEM_ID', itemId });
        return;
      }

      // Atomic update to prevent race conditions
      const item = await ItemOrder.findOneAndUpdate(
        { _id: itemId, item_state: 'ORDERED' },
        { item_state: 'ON_PREPARE' },
        { new: true }
      );

      if (!item) {
        logger.warn({ itemId, userId: user.staffId }, 'Item not found or not in ORDERED state');
        // FIX: Notify client of error
        socket.emit('kds:error', { 
          message: 'ITEM_NOT_FOUND_OR_INVALID_STATE', 
          itemId,
          details: 'Item may not exist or is not in ORDERED state'
        });
        return;
      }

      io.to(`session:${item.session_id.toString()}`).emit('item:state_changed', {
        itemId: item._id,
        newState: 'ON_PREPARE',
      });

      // Confirm success to sender
      socket.emit('kds:item_prepared', { itemId, newState: 'ON_PREPARE' });
      logger.info({ itemId, userId: user.staffId }, 'Item marked as ON_PREPARE');
    } catch (err: any) {
      logger.error({ err, itemId, userId: user.staffId }, 'kds:item_prepare error');
      socket.emit('kds:error', { 
        message: 'INTERNAL_ERROR', 
        itemId,
        details: err.message 
      });
    }
  });

  socket.on('kds:item_serve', async ({ itemId }: { itemId: string }) => {
    try {
      // Validate itemId
      if (!itemId || typeof itemId !== 'string') {
        socket.emit('kds:error', { message: 'INVALID_ITEM_ID', itemId });
        return;
      }

      // Atomic update to prevent race conditions
      const item = await ItemOrder.findOneAndUpdate(
        { _id: itemId, item_state: 'ON_PREPARE' },
        { item_state: 'SERVED' },
        { new: true }
      );

      if (!item) {
        logger.warn({ itemId, userId: user.staffId }, 'Item not found or not in ON_PREPARE state');
        // FIX: Notify client of error
        socket.emit('kds:error', { 
          message: 'ITEM_NOT_FOUND_OR_INVALID_STATE', 
          itemId,
          details: 'Item may not exist or is not in ON_PREPARE state'
        });
        return;
      }

      io.to(`session:${item.session_id.toString()}`).emit('item:state_changed', {
        itemId: item._id,
        newState: 'SERVED',
      });

      // Confirm success to sender
      socket.emit('kds:item_served', { itemId, newState: 'SERVED' });
      logger.info({ itemId, userId: user.staffId }, 'Item marked as SERVED');
    } catch (err: any) {
      logger.error({ err, itemId, userId: user.staffId }, 'kds:item_serve error');
      socket.emit('kds:error', { 
        message: 'INTERNAL_ERROR', 
        itemId,
        details: err.message 
      });
    }
  });
}
EOF
        success "KDS handler mejorado con notificaciones de error al cliente"
    else
        info "KDS handler no encontrado"
    fi
else
    error "No se encuentra kds.handler.ts"
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
    echo "Para restaurar: cp $BACKUP_DIR/* \$BACKEND_DIR/"
fi

echo ""
echo "Cambios aplicados:"
echo "  1. Rate limiting agregado para endpoints QR (qrLimiter, qrBruteForceLimiter)"
echo "  2. Rutas /menu/:qr protegidas contra fuerza bruta"
echo "  3. Rutas /menu/:qr/dishes protegidas contra abuso"
echo "  4. KDS handler ahora notifica errores al cliente via socket"
echo "  5. Permiso corregido: KITCHEN -> KTS"
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "Reconstruir contenedores:"
echo "  docker compose down && docker compose up -d --build"
