import { Request, Response } from 'express';
import * as TotemService from '../services/totem.service';
import * as DishService from '../services/dish.service';

export async function listTotems(req: Request, res: Response): Promise<void> {
  try {
    const totems = await TotemService.getTotemsByRestaurant(req.user!.restaurantId);
    res.json(totems);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createTotem(req: Request, res: Response): Promise<void> {
  try {
    const totem = await TotemService.createTotem({ ...req.body, restaurant_id: req.user!.restaurantId });
    res.status(201).json(totem);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteTotem(req: Request, res: Response): Promise<void> {
  try {
    await TotemService.deleteTotem(String(req.params.id));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function startSession(req: Request, res: Response): Promise<void> {
  try {
    const session = await TotemService.startSession(String(req.params.totemId));
    res.status(201).json(session);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getMenuByQR(req: Request, res: Response): Promise<void> {
  try {
    const totem = await TotemService.getTotemByQR(String(req.params.qr));
    if (!totem) { res.status(404).json({ error: 'Totem not found' }); return; }
    res.json(totem);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

// BUG-04: public endpoint so the QR-facing totem page can load the menu without a JWT
export async function getMenuDishes(req: Request, res: Response): Promise<void> {
  try {
    const totem = await TotemService.getTotemByQR(String(req.params.qr));
    if (!totem) { res.status(404).json({ error: 'Totem not found' }); return; }
    const restaurantId = (totem as any).restaurant_id.toString();
    const [categories, dishes] = await Promise.all([
      DishService.getCategoriesByRestaurant(restaurantId),
      DishService.getDishesByRestaurant(restaurantId),
    ]);
    res.json({ categories, dishes });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
