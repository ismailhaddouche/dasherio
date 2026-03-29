import { Request, Response, NextFunction } from 'express';
import i18next from 'i18next';
import { logger } from '../config/logger';
import { AppError } from '../utils/async-handler';
import { ErrorCode, ERROR_HTTP_STATUS_MAP, isErrorCode } from '@disherio/shared';

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

// Use centralized error status map from shared package
// This ensures consistency between backend and frontend
const ERROR_STATUS_MAP = ERROR_HTTP_STATUS_MAP;

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
    // Operational errors with explicit error codes
    statusCode = err.statusCode;
    // Check if the error message is a valid ErrorCode
    if (isErrorCode(err.message)) {
      errorCode = err.message;
      errorMessage = i18next.t(`errors:${err.message}`, { lng: req.lang });
    } else {
      // Fallback to generic server error
      errorCode = ErrorCode.SERVER_ERROR;
      errorMessage = i18next.t(`errors:${ErrorCode.SERVER_ERROR}`, { lng: req.lang });
    }
  } else if (err.name === 'ValidationError' || err.name === 'CastError') {
    // Mongoose validation errors
    statusCode = 400;
    errorCode = ErrorCode.VALIDATION_ERROR;
    errorMessage = i18next.t(`errors:${ErrorCode.VALIDATION_ERROR}`, { lng: req.lang });
  } else if (err.name === 'MongoServerError' && (err as MongoServerError).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    errorCode = ErrorCode.DUPLICATE_RESOURCE;
    errorMessage = i18next.t(`errors:${ErrorCode.DUPLICATE_RESOURCE}`, {
      lng: req.lang,
      defaultValue: 'El recurso ya existe'
    });
  } else {
    // Check if the error message is a known error code
    if (isErrorCode(err.message)) {
      statusCode = ERROR_STATUS_MAP[err.message];
      errorCode = err.message;
      errorMessage = i18next.t(`errors:${err.message}`, { lng: req.lang });
    } else {
      // Unknown error
      statusCode = 500;
      errorCode = ErrorCode.SERVER_ERROR;
      errorMessage = i18next.t(`errors:${ErrorCode.SERVER_ERROR}`, { lng: req.lang });
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
  const message = i18next.t(`errors:${ErrorCode.NOT_FOUND}`, { lng: req.lang });
  res.status(404).json({
    error: message,
    errorCode: ErrorCode.NOT_FOUND,
    status: 404,
  });
}
