import { z } from 'zod';
import { LocalizedStringSchema } from './localized-string.schema';

export const OrderSchema = z.object({
  session_id: z.string(),
  customer_id: z.string().optional(),
  staff_id: z.string().optional(),
  order_date: z.string().datetime().optional(),
});

const VariantSnapshotSchema = z.object({
  variant_id: z.string(),
  name: LocalizedStringSchema,
  price: z.number().min(0),
}).nullable();

const ExtraSnapshotSchema = z.object({
  extra_id: z.string(),
  name: LocalizedStringSchema,
  price: z.number().min(0),
});

export const ItemOrderSchema = z.object({
  order_id: z.string(),
  session_id: z.string(),
  item_dish_id: z.string(),
  customer_id: z.string().optional(),
  customer_name: z.string().optional(),
  item_state: z.enum(['ORDERED', 'ON_PREPARE', 'SERVED', 'CANCELED']).default('ORDERED'),
  item_disher_type: z.enum(['KITCHEN', 'SERVICE']),
  item_name_snapshot: LocalizedStringSchema,
  item_base_price: z.number().min(0),
  item_disher_variant: VariantSnapshotSchema.optional().default(null),
  item_disher_extras: z.array(ExtraSnapshotSchema).default([]),
});

export const PaymentTicketSchema = z.object({
  ticket_id: z.string().optional(),
  ticket_part: z.number().int().min(1),
  ticket_total_parts: z.number().int().min(1),
  ticket_amount: z.number().min(0),
  ticket_customer_name: z.string().optional(),
});

export const PaymentSchema = z.object({
  session_id: z.string(),
  payment_type: z.enum(['ALL', 'BY_USER', 'SHARED']),
  payment_total: z.number().min(0),
  payment_date: z.string().datetime().optional(),
  tickets: z.array(PaymentTicketSchema).default([]),
});
