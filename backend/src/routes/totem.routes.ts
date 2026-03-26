import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';
import * as TotemController from '../controllers/totem.controller';

const router = Router();

// Public routes: QR menu access (no auth required)
router.get('/menu/:qr', TotemController.getMenuByQR);
// BUG-04: totem component was calling GET /api/dishes (auth-protected) from a public QR page
router.get('/menu/:qr/dishes', TotemController.getMenuDishes);

router.use(authMiddleware);

router.get('/', requirePermission('read', 'Totem'), TotemController.listTotems);
router.post('/', requirePermission('create', 'Totem'), TotemController.createTotem);
router.delete('/:id', requirePermission('delete', 'Totem'), TotemController.deleteTotem);
router.post('/:totemId/session', requirePermission('create', 'TotemSession'), TotemController.startSession);

export default router;
