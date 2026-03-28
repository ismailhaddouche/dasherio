import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository, RoleRepository } from '../repositories/user.repository';
import { Restaurant } from '../models/restaurant.model';

const userRepo = new UserRepository();
const roleRepo = new RoleRepository();

const JWT_SECRET: string = process.env.JWT_SECRET || '';
const JWT_EXPIRES: string = process.env.JWT_EXPIRES || '8h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface TokenPayload {
  staffId: string;
  restaurantId: string;
  role: string;
  permissions: string[];
  name: string;
}

interface UserPreferences {
  language: string;
  theme: string;
}

interface AuthResult {
  token: string;
  user: TokenPayload & { preferences: UserPreferences };
}

async function buildAuthResult(
  staff: { 
    _id: { toString(): string }; 
    restaurant_id: { toString(): string }; 
    role_id: { toString(): string }; 
    staff_name: string;
    language?: string;
    theme?: string;
  },
  restaurant: { default_language?: string; default_theme?: string } | null
): Promise<AuthResult> {
  const role = await roleRepo.findById(staff.role_id.toString());
  const permissions = role?.permissions ?? [];

  const payload: TokenPayload = {
    staffId: staff._id.toString(),
    restaurantId: staff.restaurant_id.toString(),
    role: role?.role_name ?? '',
    permissions,
    name: staff.staff_name,
  };

  const preferences: UserPreferences = {
    language: staff.language ?? restaurant?.default_language ?? 'es',
    theme: staff.theme ?? restaurant?.default_theme ?? 'light',
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
  
  return { token, user: { ...payload, preferences } };
}

export async function loginWithUsername(username: string, password: string): Promise<AuthResult> {
  const staff = await userRepo.findByUsername(username.toLowerCase());
  if (!staff) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(password, staff.password_hash);
  if (!isPasswordValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const restaurant = await Restaurant.findById(staff.restaurant_id);
  return buildAuthResult(staff, restaurant);
}

export async function loginWithPin(pin: string, restaurantId: string): Promise<AuthResult> {
  const staffMembers = await userRepo.findByRestaurantId(restaurantId);
  const restaurant = await Restaurant.findById(restaurantId);

  for (const staff of staffMembers) {
    const isPinValid = await bcrypt.compare(pin, staff.pin_code_hash);
    if (isPinValid) {
      return buildAuthResult(staff, restaurant);
    }
  }

  throw new Error('INVALID_PIN');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}
