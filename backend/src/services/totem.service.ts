import crypto from 'crypto';
import { TotemRepository, TotemSessionRepository, CustomerRepository } from '../repositories/totem.repository';
import { ItemOrderRepository } from '../repositories/order.repository';
import { ITotem, ITotemSession, ICustomer } from '../models/totem.model';
import { IItemOrder } from '../models/order.model';
import { CreateTotemData, UpdateTotemData } from '@disherio/shared';

// Repository instances
const totemRepo = new TotemRepository();
const totemSessionRepo = new TotemSessionRepository();
const customerRepo = new CustomerRepository();
const itemOrderRepo = new ItemOrderRepository();

export async function getTotemByQR(qrToken: string): Promise<ITotem | null> {
  return totemRepo.findByQR(qrToken);
}

export async function getTotemById(totemId: string): Promise<ITotem | null> {
  return totemRepo.findById(totemId);
}

export async function startSession(totemId: string): Promise<ITotemSession | null> {
  const existing = await totemSessionRepo.findActiveByTotemId(totemId);
  if (existing) return existing;
  return totemSessionRepo.createSession(totemId);
}

export async function closeSession(sessionId: string): Promise<ITotemSession | null> {
  return totemSessionRepo.updateState(sessionId, 'COMPLETE');
}

export async function createTotem(data: CreateTotemData): Promise<ITotem> {
  const qr = crypto.randomUUID();
  return totemRepo.createTotem({ ...data, totem_qr: qr });
}

export async function updateTotem(totemId: string, data: UpdateTotemData): Promise<ITotem | null> {
  return totemRepo.updateTotem(totemId, data);
}

export async function regenerateQr(totemId: string): Promise<string> {
  const newQr = crypto.randomUUID();
  await totemRepo.updateTotem(totemId, { totem_qr: newQr });
  return newQr;
}

export async function getTotemsByRestaurant(restaurantId: string): Promise<ITotem[]> {
  return totemRepo.findByRestaurantId(restaurantId);
}

export async function deleteTotem(totemId: string): Promise<ITotem | null> {
  // BUG-10: deleting a totem left active sessions orphaned.
  // We should at least mark them as complete or remove them.
  const sessions = await totemSessionRepo.findByTotemId(totemId);
  for (const session of sessions) {
    await totemSessionRepo.updateState(session._id.toString(), 'COMPLETE');
  }
  return totemRepo.deleteTotem(totemId);
}

export async function getActiveSessionsByRestaurant(restaurantId: string): Promise<unknown[]> {
  return totemSessionRepo.findActiveByRestaurantId(restaurantId);
}

/**
 * Get or create a session for a totem identified by QR.
 * If there's an active (STARTED) session, return it.
 * If not (no session, or last is COMPLETE/PAID), create a new one.
 */
export async function getOrCreateSessionByQR(qrToken: string): Promise<{ session: ITotemSession; totem: ITotem }> {
  const totem = await totemRepo.findByQR(qrToken);
  if (!totem) throw new Error('TOTEM_NOT_FOUND');

  const existing = await totemSessionRepo.findActiveByTotemId(totem._id.toString());
  if (existing) {
    return { session: existing, totem };
  }

  const session = await totemSessionRepo.createSession(totem._id.toString());
  return { session: session!, totem };
}

/**
 * Create a customer for a session
 */
export async function createCustomer(sessionId: string, customerName: string): Promise<ICustomer> {
  return customerRepo.createCustomer({
    session_id: sessionId,
    customer_name: customerName,
  } as any);
}

/**
 * Get customers by session ID
 */
export async function getCustomersBySession(sessionId: string): Promise<ICustomer[]> {
  return customerRepo.findBySessionId(sessionId);
}

/**
 * Get all items for a session (public - for totem view)
 */
export async function getSessionItems(sessionId: string): Promise<IItemOrder[]> {
  return itemOrderRepo.findActiveBySessionId(sessionId);
}

/**
 * Get items for a specific customer (public - for "My Orders" view)
 */
export async function getCustomerItems(customerId: string): Promise<IItemOrder[]> {
  return itemOrderRepo.findByCustomerId(customerId);
}
