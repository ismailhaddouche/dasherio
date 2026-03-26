import { Request, Response } from 'express';
import * as DishService from '../services/dish.service';

export async function listDishes(req: Request, res: Response): Promise<void> {
  try {
    const dishes = await DishService.getDishesByRestaurant(req.user!.restaurantId, req.lang);
    res.json(dishes);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createDish(req: Request, res: Response): Promise<void> {
  try {
    const dish = await DishService.createDish({ ...req.body, restaurant_id: req.user!.restaurantId });
    res.status(201).json(dish);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateDish(req: Request, res: Response): Promise<void> {
  try {
    const dish = await DishService.updateDish(String(req.params.id), req.body);
    if (!dish) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(dish);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteDish(req: Request, res: Response): Promise<void> {
  try {
    await DishService.deleteDish(String(req.params.id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function toggleDishStatus(req: Request, res: Response): Promise<void> {
  try {
    const dish = await DishService.toggleDishStatus(String(req.params.id));
    res.json(dish);
  } catch (err: any) {
    if (err.message === 'DISH_NOT_FOUND') { res.status(404).json({ error: 'Not found' }); return; }
    res.status(500).json({ error: 'Server error' });
  }
}

export async function listCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await DishService.getCategoriesByRestaurant(req.user!.restaurantId);
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = await DishService.getCategoryById(String(req.params.id));
    if (!category) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = await DishService.createCategory({ ...req.body, restaurant_id: req.user!.restaurantId });
    res.status(201).json(category);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = await DishService.updateCategory(String(req.params.id), req.body);
    if (!category) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    await DishService.deleteCategory(String(req.params.id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
