import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { i18n, middleware as i18nMiddleware } from './i18n.js';
import { responseHandler } from './middleware/response.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ── Security ─────────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true }
}));

// ── Performance ──────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.DOMAIN, /\.disher\.io$/]
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
}));

// ── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── I18n ─────────────────────────────────────────────────────────────────────
app.use(i18nMiddleware.handle(i18n));

// ── Standardized Response Helpers ────────────────────────────────────────────
app.use(responseHandler);

// ── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 2000 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.error(req.t?.('errors.too_many_requests') || 'Too many requests', 429);
    }
});
app.use('/api/', apiLimiter);

// ── Static Files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.error(req.t?.('ERRORS.ROUTE_NOT_FOUND', { route: req.originalUrl }) || 'Route not found', 404);
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error(`[SERVER ERROR] ${new Date().toISOString()}:`, err.message);

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.error(messages[0], 400, err);
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.error(req.t?.('ERRORS.UNAUTHORIZED') || 'Unauthorized', 401);
    }

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? (req.t?.('ERRORS.INTERNAL_SERVER_ERROR') || 'Internal server error')
        : err.message;

    res.error(message, statusCode, err);
});

export default app;
