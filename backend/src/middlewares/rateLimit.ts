import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errorCode: 'RATE_LIMIT_EXCEEDED' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { errorCode: 'AUTH_RATE_LIMIT_EXCEEDED' },
});

// Rate limiter especifico para endpoints de QR (acceso publico)
export const qrLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { errorCode: 'QR_RATE_LIMIT_EXCEEDED' },
  skip: (_req) => {
    // Opcional: skip rate limiting para IPs internas/development
    return process.env.NODE_ENV === 'development';
  },
});

// Rate limiter mas estricto para prevenir fuerza bruta de tokens QR
export const qrBruteForceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { errorCode: 'QR_BRUTE_FORCE_DETECTED' },
  handler: (req, res, _next, options) => {
    // Loggear intentos sospechosos
    logger.warn({ ip: req.ip }, 'QR brute force attempt detected');
    res.status(429).json(options.message);
  },
});
