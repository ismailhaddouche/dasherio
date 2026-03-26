import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';
import * as OrderController from '../controllers/order.controller';

const router = Router();

router.use(authMiddleware);

// BUG-05: KDS needs to load all active kitchen items on page mount, not just listen to WS
router.get('/kitchen', requirePermission('read', 'KDS'), OrderController.getKitchenItems);
router.get('/session/:sessionId', requirePermission('read', 'Order'), OrderController.getSessionItems);
router.post('/', requirePermission('create', 'Order'), OrderController.createOrder);
router.post('/items', requirePermission('create', 'ItemOrder'), OrderController.addItem);
router.patch('/items/:id/state', requirePermission('update', 'ItemOrder'), OrderController.updateItemState);
router.post('/payments', requirePermission('create', 'Payment'), OrderController.createPayment);
router.patch('/payments/:id/ticket', requirePermission('update', 'Payment'), OrderController.markTicketPaid);

export default router;
