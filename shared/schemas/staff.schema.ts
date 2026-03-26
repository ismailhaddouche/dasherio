import { z } from 'zod';

export const RoleSchema = z.object({
  restaurant_id: z.string(),
  role_name: z.string().min(2),
  permissions: z.array(z.string()),
});

export const StaffSchema = z.object({
  restaurant_id: z.string(),
  role_id: z.string(),
  staff_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  pin_code: z.string().length(4).regex(/^\d{4}$/),
});

export const StaffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const StaffPinSchema = z.object({
  pin_code: z.string().length(4).regex(/^\d{4}$/),
  restaurant_id: z.string(),
});
