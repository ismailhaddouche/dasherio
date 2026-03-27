import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';
import * as StaffController from '../controllers/staff.controller';

const router = Router();

router.use(authMiddleware);

// Staff members
router.get('/', requirePermission('read', 'Staff'), StaffController.listStaff);
router.get('/:id', requirePermission('read', 'Staff'), StaffController.getStaff);
router.post('/', requirePermission('create', 'Staff'), StaffController.createStaff);
router.patch('/:id', requirePermission('update', 'Staff'), StaffController.updateStaff);
router.delete('/:id', requirePermission('delete', 'Staff'), StaffController.deleteStaff);

// Roles
router.get('/roles/all', requirePermission('read', 'Role'), StaffController.listRoles);
router.post('/roles', requirePermission('create', 'Role'), StaffController.createRole);

export default router;
