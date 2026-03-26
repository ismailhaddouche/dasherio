import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as DashboardController from '../controllers/dashboard.controller';
import * as LogsController from '../controllers/logs.controller';

const router = Router();

router.use(authMiddleware);

// Dashboard statistics endpoints
router.get('/stats', DashboardController.getDashboardStats);

// Logs endpoints
router.get('/logs', LogsController.getLogs);
router.get('/logs/users', LogsController.getLogUsers);

export default router;
