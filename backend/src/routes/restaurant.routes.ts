import { Router } from 'express';
import * as RestaurantController from '../controllers/restaurant.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/me', authenticate, RestaurantController.getMyRestaurant);
router.patch('/me', authenticate, RestaurantController.updateMyRestaurant);

// Settings endpoints
router.get('/settings', authenticate, RestaurantController.getRestaurantSettings);
router.patch('/settings', authenticate, RestaurantController.updateRestaurantSettings);

export default router;
