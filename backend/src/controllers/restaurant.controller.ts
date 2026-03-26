import { Request, Response } from 'express';
import * as RestaurantService from '../services/restaurant.service';

export async function getMyRestaurant(req: Request, res: Response): Promise<void> {
  try {
    const restaurant = await RestaurantService.getRestaurantById(req.user!.restaurantId);
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }
    res.json(restaurant);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateMyRestaurant(req: Request, res: Response): Promise<void> {
  try {
    const restaurant = await RestaurantService.updateRestaurant(req.user!.restaurantId, req.body);
    res.json(restaurant);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}
