import { Router } from 'express';
import * as ImageController from '../controllers/image.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Endpoint for dishes - Requires AUTH
router.post('/dishes', 
  authenticate, 
  ImageController.uploadMiddleware.single('image'), 
  ImageController.uploadDishImage
);

// Endpoint for categories - Requires AUTH
router.post('/categories', 
  authenticate, 
  ImageController.uploadMiddleware.single('image'), 
  ImageController.uploadCategoryImage
);

// Endpoint for restaurant logo - Requires AUTH
router.post('/restaurant', 
  authenticate, 
  ImageController.uploadMiddleware.single('image'), 
  ImageController.uploadRestaurantLogo
);

export default router;
