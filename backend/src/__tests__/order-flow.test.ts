import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createOrder, addItemToOrder, updateItemState, createPayment, calculateSessionTotal } from '../services/order.service';
import { Restaurant } from '../models/restaurant.model';
import { Role, Staff } from '../models/staff.model';
import { Totem, TotemSession } from '../models/totem.model';
import { Dish, Category } from '../models/dish.model';

// Mock socket.io getIO to avoid real socket server
jest.mock('../config/socket', () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Order Flow Integration', () => {
  let restaurantId: string;
  let staffId: string;
  let sessionId: string;
  let orderId: string;
  let dishId: string;

  beforeAll(async () => {
    const restaurant = await Restaurant.create({ restaurant_name: 'FlowTest', tax_rate: 10 });
    restaurantId = restaurant._id.toString();

    const role = await Role.create({ restaurant_id: restaurantId, role_name: 'POS', permissions: ['POS'] });
    const staff = await Staff.create({
      restaurant_id: restaurantId, role_id: role._id,
      staff_name: 'Camarero', email: 'pos@test.com', password_hash: 'x', pin_code_hash: await bcrypt.hash('0001', 12),
    });
    staffId = staff._id.toString();

    const cat = await Category.create({
      restaurant_id: restaurantId,
      category_name: { es: 'Cocina', en: 'Kitchen', fr: 'Cuisine', ar: '' },
    });

    const dish = await Dish.create({
      restaurant_id: restaurantId,
      category_id: cat._id,
      disher_name: { es: 'Paella', en: 'Paella', fr: 'Paella', ar: '' },
      disher_price: 12,
      disher_type: 'KITCHEN',
      disher_status: 'ACTIVATED',
    });
    dishId = dish._id.toString();

    const totem = await Totem.create({ restaurant_id: restaurantId, totem_name: 'Mesa 1', totem_type: 'STANDARD' });
    const session = await TotemSession.create({ totem_id: totem._id });
    sessionId = session._id.toString();
  });

  it('should create an order in an active session', async () => {
    const order = await createOrder(sessionId, staffId);
    expect(order._id).toBeDefined();
    orderId = order._id.toString();
  });

  it('should add a KITCHEN item to the order with price snapshot', async () => {
    const item = await addItemToOrder(orderId, sessionId, dishId);
    expect(item.item_state).toBe('ORDERED');
    expect(item.item_base_price).toBe(12);
    expect(item.item_name_snapshot.es).toBe('Paella');
    expect(item.item_disher_type).toBe('KITCHEN');
  });

  it('should transition item to ON_PREPARE', async () => {
    const items = await addItemToOrder(orderId, sessionId, dishId);
    const updated = await updateItemState(items._id.toString(), 'ON_PREPARE', staffId, ['POS']);
    expect(updated).not.toBeNull();
    expect(updated!.item_state).toBe('ON_PREPARE');
  });

  it('should calculate session total correctly', async () => {
    const result = await calculateSessionTotal(sessionId);
    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(result.subtotal);
    expect(result.tax).toBeGreaterThan(0);
  });

  it('should create a payment and close the session', async () => {
    const payment = await createPayment(sessionId, 'ALL');
    expect(payment.payment_type).toBe('ALL');
    expect(payment.payment_total).toBeGreaterThan(0);
    expect(payment.tickets).toHaveLength(1);
  });

  it('should block TAS from canceling ON_PREPARE items without POS', async () => {
    const item = await addItemToOrder(orderId, sessionId, dishId);
    await updateItemState(item._id.toString(), 'ON_PREPARE', staffId, ['TAS']);
    await expect(
      updateItemState(item._id.toString(), 'CANCELED', staffId, ['TAS'])
    ).rejects.toThrow('REQUIRES_POS_AUTHORIZATION');
  });
});
