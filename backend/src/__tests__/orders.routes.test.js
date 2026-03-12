import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { setupDB, teardownDB, clearDB } from './setup.js';
import app from '../app.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.middleware.js';

process.env.JWT_SECRET = 'test_secret_key_for_testing';

let adminToken;

beforeAll(async () => {
    await setupDB();
    const admin = new User({ username: 'orderadmin', password: 'password123', role: 'admin', restaurantSlug: 'test' });
    await admin.save();
    adminToken = generateToken({ userId: admin._id.toString(), username: 'orderadmin', role: 'admin' });
});

afterAll(async () => {
    await teardownDB();
});

beforeEach(async () => {
    await Order.deleteMany({});
});

describe('Order Routes — Integration Tests', () => {

    describe('GET /api/orders', () => {
        it('should return active orders (auth required)', async () => {
            await Order.create({
                tableNumber: '1',
                totemId: 1,
                items: [{ name: 'Sopa', price: 5, quantity: 1 }],
                totalAmount: 5,
                status: 'active'
            });

            const res = await request(app)
                .get('/api/orders')
                .set('Cookie', [`disher_token=${adminToken}`]);

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].tableNumber).toBe('1');
        });

        it('should reject without auth token', async () => {
            const res = await request(app).get('/api/orders');
            expect(res.status).toBe(403);
        });

        it('should not return completed orders', async () => {
            await Order.create([
                { tableNumber: '1', totemId: 1, items: [{ name: 'A', price: 5, quantity: 1 }], totalAmount: 5, status: 'active' },
                { tableNumber: '2', totemId: 2, items: [{ name: 'B', price: 8, quantity: 1 }], totalAmount: 8, status: 'completed' }
            ]);

            const res = await request(app)
                .get('/api/orders')
                .set('Cookie', [`disher_token=${adminToken}`]);

            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].status).toBe('active');
        });
    });

    describe('GET /api/orders/table/:tableNumber', () => {
        it('should return an active order for a table (public)', async () => {
            await Order.create({
                tableNumber: 'T5',
                totemId: 5,
                items: [{ name: 'Pizza', price: 12, quantity: 1 }],
                totalAmount: 12,
                status: 'active'
            });

            const res = await request(app).get('/api/orders/table/T5');
            expect(res.status).toBe(200);
            expect(res.body.data.tableNumber).toBe('T5');
        });

        it('should return null for a table with no active order', async () => {
            const res = await request(app).get('/api/orders/table/NONEXIST');
            expect(res.status).toBe(200);
            expect(res.body.data).toBeNull();
        });
    });

    describe('POST /api/orders/table/:tableNumber/add-items', () => {
        it('should add items to a new table order', async () => {
            const res = await request(app)
                .post('/api/orders/table/T10/add-items')
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({
                    items: [
                        { name: 'Hamburguesa', price: 10, quantity: 2 },
                        { name: 'Cerveza', price: 3, quantity: 1 }
                    ]
                });

            if (res.status !== 200) console.log('[DEBUG] add-items fail:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            expect(res.body.data.items.length).toBe(2);
            expect(res.body.data.totalAmount).toBe(23); // 10*2 + 3*1
        });

        it('should add items to an existing table order', async () => {
            await Order.create({
                tableNumber: 'T10',
                totemId: 10,
                items: [{ name: 'Ensalada', price: 6, quantity: 1 }],
                totalAmount: 6,
                status: 'active'
            });

            const res = await request(app)
                .post('/api/orders/table/T10/add-items')
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({
                    items: [{ name: 'Postre', price: 5, quantity: 1 }]
                });

            if (res.status !== 200) console.log('[DEBUG] add-items existing fail:', JSON.stringify(res.body, null, 2));
            expect(res.status).toBe(200);
            expect(res.body.data.items.length).toBe(2);
            expect(res.body.data.totalAmount).toBe(11);
        });

        it('should reject empty items array', async () => {
            const res = await request(app)
                .post('/api/orders/table/T10/add-items')
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({ items: [] });

            expect(res.status).toBe(400);
        });

        it('should reject items with missing name', async () => {
            const res = await request(app)
                .post('/api/orders/table/T10/add-items')
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({ items: [{ price: 5, quantity: 1 }] });

            expect(res.status).toBe(400);
        });

        it('should reject items with negative price', async () => {
            const res = await request(app)
                .post('/api/orders/table/T10/add-items')
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({ items: [{ name: 'X', price: -5, quantity: 1 }] });

            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/orders/:orderId', () => {
        it('should update order status', async () => {
            const order = await Order.create({
                tableNumber: '1',
                totemId: 1,
                items: [{ name: 'A', price: 5, quantity: 1 }],
                totalAmount: 5,
                status: 'active'
            });

            const res = await request(app)
                .patch(`/api/orders/${order._id}`)
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({ status: 'completed' });

            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe('completed');
        });

        it('should reject invalid status value', async () => {
            const order = await Order.create({
                tableNumber: '1',
                totemId: 1,
                items: [{ name: 'A', price: 5, quantity: 1 }],
                totalAmount: 5,
                status: 'active'
            });

            const res = await request(app)
                .patch(`/api/orders/${order._id}`)
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({ status: 'invalid_status' });

            expect(res.status).toBe(400);
        });

        it('should reject update with empty body', async () => {
            const order = await Order.create({
                tableNumber: '1',
                totemId: 1,
                items: [{ name: 'A', price: 5, quantity: 1 }],
                totalAmount: 5
            });

            const res = await request(app)
                .patch(`/api/orders/${order._id}`)
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/orders/:orderId/items/:itemId', () => {
        it('should update item status', async () => {
            const order = await Order.create({
                tableNumber: '1',
                totemId: 1,
                items: [{ name: 'Sopa', price: 5, quantity: 1, status: 'pending' }],
                totalAmount: 5
            });
            const itemId = order.items[0]._id;

            const res = await request(app)
                .patch(`/api/orders/${order._id}/items/${itemId}`)
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({ status: 'preparing' });

            expect(res.status).toBe(200);
            const updatedItem = res.body.data.items.find(i => i._id === itemId.toString());
            expect(updatedItem.status).toBe('preparing');
        });

        it('should reject invalid item status', async () => {
            const order = await Order.create({
                tableNumber: '1',
                totemId: 1,
                items: [{ name: 'Sopa', price: 5, quantity: 1 }],
                totalAmount: 5
            });
            const itemId = order.items[0]._id;

            const res = await request(app)
                .patch(`/api/orders/${order._id}/items/${itemId}`)
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({ status: 'flying' });

            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /api/orders/:orderId/items/bulk-status', () => {
        it('should bulk update all non-served item statuses', async () => {
            const order = await Order.create({
                tableNumber: '1',
                totemId: 1,
                items: [
                    { name: 'A', price: 5, quantity: 1, status: 'pending' },
                    { name: 'B', price: 8, quantity: 1, status: 'preparing' },
                    { name: 'C', price: 3, quantity: 1, status: 'served' }
                ],
                totalAmount: 16
            });

            const res = await request(app)
                .patch(`/api/orders/${order._id}/items/bulk-status`)
                .set('Cookie', [`disher_token=${adminToken}`])
                .send({ status: 'ready' });

            expect(res.status).toBe(200);
            const items = res.body.data.items;
            expect(items[0].status).toBe('ready');
            expect(items[1].status).toBe('ready');
            expect(items[2].status).toBe('served'); // should NOT change
        });
    });
});
