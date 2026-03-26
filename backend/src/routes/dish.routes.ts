import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { requirePermission } from '../middlewares/rbac';
import * as DishController from '../controllers/dish.controller';

const router = Router();

router.use(authMiddleware);

// Categories
router.get('/categories', DishController.listCategories);
router.get('/categories/:id', DishController.getCategory);
router.post('/categories', requirePermission('create', 'Category'), DishController.createCategory);
router.patch('/categories/:id', requirePermission('update', 'Category'), DishController.updateCategory);
router.delete('/categories/:id', requirePermission('delete', 'Category'), DishController.deleteCategory);

// Dishes
router.get('/', DishController.listDishes);
router.post('/', requirePermission('create', 'Dish'), DishController.createDish);
router.put('/:id', requirePermission('update', 'Dish'), DishController.updateDish);
router.delete('/:id', requirePermission('delete', 'Dish'), DishController.deleteDish);
router.patch('/:id/toggle', requirePermission('update', 'Dish'), DishController.toggleDishStatus);

export default router;
