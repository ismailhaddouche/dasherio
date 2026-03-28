import { Request, Response, NextFunction } from 'express';
import i18next from 'i18next';
import { logger } from '../config/logger';
import { AppError } from '../utils/async-handler';

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

// Mapa de códigos de error HTTP por código de error de la aplicación
const ERROR_STATUS_MAP: Record<string, number> = {
  INVALID_CREDENTIALS: 401,
  INVALID_PIN: 401,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  DISH_NOT_FOUND: 404,
  DISH_NOT_AVAILABLE: 400,
  SESSION_NOT_ACTIVE: 400,
  SESSION_NOT_FOUND: 404,
  ORDER_NOT_FOUND: 404,
  ITEM_NOT_FOUND: 404,
  PAYMENT_NOT_FOUND: 404,
  TICKET_NOT_FOUND: 404,
  TOTEM_NOT_FOUND: 404,
  RESTAURANT_NOT_FOUND: 404,
  INVALID_STATE_TRANSITION: 400,
  REQUIRES_POS_AUTHORIZATION: 403,
  REQUIRES_AUTHORIZATION: 403,
  NO_ITEMS_TO_PAY: 400,
  CANNOT_DELETE_ITEM_NOT_ORDERED: 400,
  ITEM_NOT_FOUND_OR_ALREADY_PROCESSED: 400,
  UPDATE_FAILED: 500,
  CATEGORY_HAS_DISHES: 409,
  VALIDATION_ERROR: 400,
  RATE_LIMIT_EXCEEDED: 429,
};

/**
 * Middleware de error global
 * Debe ser registrado AL FINAL de todas las rutas
 * Captura errores y devuelve JSON consistente con traducciones
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Determinar status code
  let statusCode = 500;
  let errorCode = 'SERVER_ERROR';
  let errorMessage: string;

  if (err instanceof AppError && err.isOperational) {
    // Errores operacionales conocidos
    statusCode = err.statusCode;
    errorCode = err.message;
    errorMessage = i18next.t(`errors:${err.message}`, { lng: req.lang });
  } else if (err.name === 'ValidationError' || err.name === 'CastError') {
    // Errores de Mongoose
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = i18next.t('errors:VALIDATION_ERROR', { lng: req.lang });
  } else if (err.name === 'MongoServerError' && (err as MongoServerError).code === 11000) {
    // Error de duplicado en MongoDB
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    errorMessage = i18next.t('errors:DUPLICATE_RESOURCE', { 
      lng: req.lang,
      defaultValue: 'El recurso ya existe' 
    });
  } else {
    // Verificar si el mensaje es un código de error conocido
    const knownCode = ERROR_STATUS_MAP[err.message];
    if (knownCode) {
      statusCode = knownCode;
      errorCode = err.message;
      errorMessage = i18next.t(`errors:${err.message}`, { lng: req.lang });
    } else {
      // Error desconocido
      statusCode = 500;
      errorCode = 'SERVER_ERROR';
      errorMessage = i18next.t('errors:SERVER_ERROR', { lng: req.lang });
    }
  }

  // Logging con pino
  logger.error({
    err: {
      message: err.message,
      name: err.name,
      stack: err.stack,
      statusCode,
      errorCode,
    },
    type: 'error_handler',
  }, 'Error capturado por el manejador global');

  // Responder con JSON consistente (nunca HTML)
  res.status(statusCode).json({
    error: errorMessage,
    errorCode: errorCode,
    status: statusCode,
  });
}

/**
 * Middleware para rutas no encontradas (404)
 * Debe ser registrado DESPUÉS de todas las rutas válidas
 * y ANTES del errorHandler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const message = i18next.t('errors:NOT_FOUND', { lng: req.lang });
  res.status(404).json({
    error: message,
    errorCode: 'NOT_FOUND',
    status: 404,
  });
}
