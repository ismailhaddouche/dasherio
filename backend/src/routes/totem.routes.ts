import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';
import { qrLimiter, qrBruteForceLimiter } from '../middlewares/rateLimit';
import * as TotemController from '../controllers/totem.controller';

const router = Router();

// Public routes: QR menu access with rate limiting to prevent abuse
router.get('/menu/:qr', qrBruteForceLimiter, TotemController.getMenuByQR);
router.get('/menu/:qr/dishes', qrLimiter, TotemController.getMenuDishes);

// Protected routes require authentication
router.use(authMiddleware);

router.get('/', requirePermission('read', 'Totem'), TotemController.listTotems);
router.post('/', requirePermission('create', 'Totem'), TotemController.createTotem);
router.delete('/:id', requirePermission('delete', 'Totem'), TotemController.deleteTotem);
router.post('/:totemId/session', requirePermission('create', 'TotemSession'), TotemController.startSession);

export default router;
