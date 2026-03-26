import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Restaurant } from '../models/restaurant.model';
import { Role, Staff } from '../models/staff.model';
import { logger } from '../config/logger';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/disherio';
  await mongoose.connect(uri);
  logger.info('Connected for seeding');

  let restaurant = await Restaurant.findOne({ restaurant_name: 'DisherIo Demo' });
  if (!restaurant) {
    restaurant = await Restaurant.create({
      restaurant_name: 'DisherIo Demo',
      tax_rate: 10,
      currency: 'EUR',
      language: 'es',
    });
    logger.info('Restaurant created');
  }

  let adminRole = await Role.findOne({ restaurant_id: restaurant._id, role_name: 'Admin' });
  if (!adminRole) {
    adminRole = await Role.create({
      restaurant_id: restaurant._id,
      role_name: 'Admin',
      permissions: ['ADMIN'],
    });
    logger.info('Admin role created');
  }

  const existing = await Staff.findOne({ email: 'admin@disherio.com' });
  if (!existing) {
    const password_hash = await bcrypt.hash('admin1234', 12);
    const pin_code_hash = await bcrypt.hash('0000', 12);
    await Staff.create({
      restaurant_id: restaurant._id,
      role_id: adminRole._id,
      staff_name: 'Admin',
      email: 'admin@disherio.com',
      password_hash,
      pin_code_hash,
    });
    logger.info('Admin staff created: admin@disherio.com / admin1234');
  }

  await mongoose.disconnect();
  logger.info('Seeding complete');
}

seed().catch((err) => { logger.error(err); process.exit(1); });
