import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const PinSchema = z.object({
  pin_code: z.string().length(4).regex(/^\d{4}$/),
  restaurant_id: z.string().min(1),
});
