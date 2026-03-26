import { Request, Response } from 'express';
import * as OrderService from '../services/order.service';

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const { session_id } = req.body;
    const order = await OrderService.createOrder(session_id, req.user!.staffId);
    res.status(201).json(order);
  } catch (err: any) {
    if (err.message === 'SESSION_NOT_ACTIVE') { res.status(400).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Server error' });
  }
}

export async function addItem(req: Request, res: Response): Promise<void> {
  try {
    const { order_id, session_id, dish_id, customer_id, variant_id, extras } = req.body;
    const item = await OrderService.addItemToOrder(order_id, session_id, dish_id, customer_id, variant_id, extras);
    res.status(201).json(item);
  } catch (err: any) {
    const clientErrors = ['DISH_NOT_FOUND', 'DISH_NOT_AVAILABLE'];
    if (clientErrors.includes(err.message)) { res.status(400).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Server error' });
  }
}

export async function updateItemState(req: Request, res: Response): Promise<void> {
  try {
    const { state } = req.body;
    const item = await OrderService.updateItemState(
      String(req.params.id),
      state,
      req.user!.staffId,
      req.user!.permissions
    );
    res.json(item);
  } catch (err: any) {
    const clientErrors = ['ITEM_NOT_FOUND', 'INVALID_STATE_TRANSITION', 'REQUIRES_POS_AUTHORIZATION'];
    if (clientErrors.includes(err.message)) { res.status(400).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getKitchenItems(req: Request, res: Response): Promise<void> {
  try {
    const items = await OrderService.getKitchenItems(req.user!.restaurantId);
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function getSessionItems(req: Request, res: Response): Promise<void> {
  try {
    const items = await OrderService.getSessionItems(String(req.params.sessionId));
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  try {
    const { session_id, payment_type, parts, tips } = req.body;
    const payment = await OrderService.createPayment(session_id, payment_type, parts, tips);
    res.status(201).json(payment);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
}

export async function markTicketPaid(req: Request, res: Response): Promise<void> {
  try {
    const { ticket_part } = req.body;
    const payment = await OrderService.markTicketPaid(String(req.params.id), ticket_part);
    res.json(payment);
  } catch (err: any) {
    const clientErrors = ['PAYMENT_NOT_FOUND', 'TICKET_NOT_FOUND'];
    if (clientErrors.includes(err.message)) { res.status(404).json({ error: err.message }); return; }
    res.status(500).json({ error: 'Server error' });
  }
}
