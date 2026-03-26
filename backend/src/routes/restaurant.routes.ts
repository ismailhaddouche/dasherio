import { Router } from 'express';
import * as RestaurantController from '../controllers/restaurant.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.get('/me', authenticate, RestaurantController.getMyRestaurant);
router.patch('/me', authenticate, RestaurantController.updateMyRestaurant);

export default router;
