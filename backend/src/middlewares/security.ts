import { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

export function applySecurityMiddleware(app: Express): void {
  app.use(helmet());

  // Strict CORS configuration
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : process.env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:4200', 'http://localhost:3000'];

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    console.error('ERROR: FRONTEND_URL must be set in production');
    process.exit(1);
  }

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(compression());
}
