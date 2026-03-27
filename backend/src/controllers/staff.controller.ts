import { Request, Response } from 'express';
import { asyncHandler, createError } from '../utils/async-handler';
import { Types } from 'mongoose';
import { Staff, Role, IStaff } from '../models/staff.model';
import bcrypt from 'bcryptjs';

// Get all staff for the restaurant
export const listStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const restaurantId = req.user!.restaurantId;
  
  const staff = await Staff.find({ restaurant_id: new Types.ObjectId(restaurantId) })
    .populate('role_id', 'role_name permissions')
    .select('-password_hash -pin_code_hash')
    .lean();

  res.json(staff);
});

// Get single staff member
export const getStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = req.user!.restaurantId;

  const staff = await Staff.findOne({
    _id: new Types.ObjectId(id as string),
    restaurant_id: new Types.ObjectId(restaurantId)
  })
    .populate('role_id', 'role_name permissions')
    .select('-password_hash -pin_code_hash')
    .lean();

  if (!staff) {
    throw createError.notFound('Miembro del personal no encontrado');
  }

  res.json(staff);
});

// Create new staff member
export const createStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const restaurantId = req.user!.restaurantId;
  const { staff_name, username, password, pin_code, role_id } = req.body;

  // Normalize username
  const normalizedUsername = username.toLowerCase().trim();

  // Check if username already exists in this restaurant
  const existingStaff = await Staff.findOne({ 
    username: normalizedUsername,
    restaurant_id: new Types.ObjectId(restaurantId)
  });
  if (existingStaff) {
    throw createError.conflict('El usuario ya existe en este restaurante');
  }

  // Hash password and PIN
  const password_hash = await bcrypt.hash(password, 10);
  const pin_code_hash = await bcrypt.hash(pin_code, 10);

  const staff = await Staff.create({
    restaurant_id: new Types.ObjectId(restaurantId),
    role_id: new Types.ObjectId(role_id as string),
    staff_name,
    username: normalizedUsername,
    password_hash,
    pin_code_hash
  });

  const staffResponse = await Staff.findById(staff._id)
    .populate('role_id', 'role_name permissions')
    .select('-password_hash -pin_code_hash')
    .lean();

  res.status(201).json(staffResponse);
});

// Update staff member
export const updateStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = req.user!.restaurantId;
  const { staff_name, username, role_id, password, pin_code } = req.body;

  const staff = await Staff.findOne({
    _id: new Types.ObjectId(id as string),
    restaurant_id: new Types.ObjectId(restaurantId)
  });

  if (!staff) {
    throw createError.notFound('Miembro del personal no encontrado');
  }

  // Check username uniqueness if changing
  if (username && username.toLowerCase().trim() !== staff.username) {
    const normalizedUsername = username.toLowerCase().trim();
    const existing = await Staff.findOne({ 
      username: normalizedUsername,
      restaurant_id: new Types.ObjectId(restaurantId)
    });
    if (existing) {
      throw createError.conflict('El usuario ya existe en este restaurante');
    }
    staff.username = normalizedUsername;
  }

  // Update fields
  if (staff_name) staff.staff_name = staff_name;
  if (role_id) staff.role_id = new Types.ObjectId(role_id as string);
  
  // Update passwords if provided
  if (password) {
    staff.password_hash = await bcrypt.hash(password, 10);
  }
  if (pin_code) {
    staff.pin_code_hash = await bcrypt.hash(pin_code, 10);
  }

  await staff.save();

  const staffResponse = await Staff.findById(staff._id)
    .populate('role_id', 'role_name permissions')
    .select('-password_hash -pin_code_hash')
    .lean();

  res.json(staffResponse);
});

// Delete staff member
export const deleteStaff = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const restaurantId = req.user!.restaurantId;

  const staff = await Staff.findOneAndDelete({
    _id: new Types.ObjectId(id as string),
    restaurant_id: new Types.ObjectId(restaurantId)
  });

  if (!staff) {
    throw createError.notFound('Miembro del personal no encontrado');
  }

  res.status(204).end();
});

// Get available roles
export const listRoles = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const restaurantId = req.user!.restaurantId;

  const roles = await Role.find({
    $or: [
      { restaurant_id: new Types.ObjectId(restaurantId) },
      { restaurant_id: { $exists: false } } // System default roles
    ]
  }).lean();

  res.json(roles);
});

// Create role
export const createRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const restaurantId = req.user!.restaurantId;
  const { role_name, permissions } = req.body;

  const role = await Role.create({
    restaurant_id: new Types.ObjectId(restaurantId),
    role_name,
    permissions: permissions || []
  });

  res.status(201).json(role);
});
