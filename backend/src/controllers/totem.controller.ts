import { Request, Response } from 'express';
import { asyncHandler, createError } from '../utils/async-handler';
import * as TotemService from '../services/totem.service';
import * as DishService from '../services/dish.service';
import * as OrderService from '../services/order.service';

export const listTotems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const totems = await TotemService.getTotemsByRestaurant(req.user!.restaurantId);
  res.json(totems);
});

export const getTotem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const totem = await TotemService.getTotemById(String(req.params.id));
  if (!totem) {
    throw createError.notFound('TOTEM_NOT_FOUND');
  }
  // Verify totem belongs to user's restaurant
  if (totem.restaurant_id.toString() !== req.user!.restaurantId) {
    throw createError.forbidden('FORBIDDEN');
  }
  res.json(totem);
});

export const createTotem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const totem = await TotemService.createTotem({ ...req.body, restaurant_id: req.user!.restaurantId });
  res.status(201).json(totem);
});

export const updateTotem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const totem = await TotemService.updateTotem(String(req.params.id), req.body);
  res.json(totem);
});

export const deleteTotem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await TotemService.deleteTotem(String(req.params.id));
  res.status(204).end();
});

export const regenerateQr = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const qr = await TotemService.regenerateQr(String(req.params.id));
  res.json({ qr });
});

export const startSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const session = await TotemService.startSession(String(req.params.totemId));
  res.status(201).json(session);
});

export const getMenuByQR = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const totem = await TotemService.getTotemByQR(String(req.params.qr));
  if (!totem) {
    throw createError.notFound('TOTEM_NOT_FOUND');
  }
  res.json(totem);
});

// BUG-04: public endpoint so the QR-facing totem page can load the menu without a JWT
export const getMenuDishes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const totem = await TotemService.getTotemByQR(String(req.params.qr));
  if (!totem) {
    throw createError.notFound('TOTEM_NOT_FOUND');
  }
  const restaurantId = totem.restaurant_id.toString();
  const [categories, dishes] = await Promise.all([
    DishService.getCategoriesByRestaurant(restaurantId),
    DishService.getDishesByRestaurant(restaurantId),
  ]);
  res.json({ categories, dishes });
});

export const getActiveSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sessions = await TotemService.getActiveSessionsByRestaurant(req.user!.restaurantId);
  res.json(sessions);
});

// Public: get or create session for a totem via QR
export const getOrCreateSessionByQR = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { session, totem } = await TotemService.getOrCreateSessionByQR(String(req.params.qr));
  res.json({
    session_id: session._id,
    totem_id: totem._id,
    totem_name: totem.totem_name,
    restaurant_id: totem.restaurant_id,
    totem_state: session.totem_state,
  });
});

// Public: create order + items from totem QR page (no auth needed)
export const createPublicOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { session } = await TotemService.getOrCreateSessionByQR(String(req.params.qr));

  if (session.totem_state !== 'STARTED') {
    throw createError.badRequest('SESSION_NOT_ACTIVE');
  }

  const { items } = req.body as { items: Array<{ dishId: string; quantity: number; variantId?: string; extras?: string[] }> };
  if (!items || !items.length) {
    throw createError.badRequest('NO_ITEMS');
  }

  const order = await OrderService.createOrder(session._id.toString());
  const createdItems = [];

  for (const item of items) {
    for (let i = 0; i < (item.quantity || 1); i++) {
      const created = await OrderService.addItemToOrder(
        order._id.toString(),
        session._id.toString(),
        item.dishId,
        undefined,
        item.variantId,
        item.extras ?? []
      );
      createdItems.push(created);
    }
  }

  res.status(201).json({ order_id: order._id, items: createdItems });
});
