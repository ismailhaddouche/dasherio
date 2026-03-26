import { z } from 'zod';

export const TotemSchema = z.object({
  restaurant_id: z.string(),
  totem_name: z.string().min(1),
  totem_qr: z.string().optional(),
  totem_type: z.enum(['STANDARD', 'TEMPORARY']),
  totem_start_date: z.date().optional(),
});

export const TotemSessionSchema = z.object({
  totem_id: z.string(),
  session_date_start: z.date().optional(),
  totem_state: z.enum(['STARTED', 'COMPLETE', 'PAID']).default('STARTED'),
});

export const CustomerSchema = z.object({
  customer_name: z.string().min(1),
  session_id: z.string(),
});
