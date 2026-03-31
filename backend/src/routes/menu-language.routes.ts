import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';
import * as MenuLanguageController from '../controllers/menu-language.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', MenuLanguageController.list);
router.post('/', requirePermission('manage', 'Restaurant'), MenuLanguageController.create);
router.patch('/:id', requirePermission('manage', 'Restaurant'), MenuLanguageController.update);
router.post('/:id/set-default', requirePermission('manage', 'Restaurant'), MenuLanguageController.setDefault);
router.delete('/:id', requirePermission('manage', 'Restaurant'), MenuLanguageController.remove);

export default router;
