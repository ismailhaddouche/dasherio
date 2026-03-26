import { z } from 'zod';

export const SocialLinksSchema = z.object({
  facebook_url: z.string().url().optional(),
  instagram_url: z.string().url().optional(),
});

export const RestaurantSchema = z.object({
  restaurant_name: z.string().min(2),
  restaurant_url: z.string().url().optional(),
  logo_image_url: z.string().url().optional(),
  social_links: SocialLinksSchema.optional(),
  tax_rate: z.number().min(0).max(100),
  tips_state: z.boolean().default(false),
  tips_type: z.enum(['MANDATORY', 'VOLUNTARY']).optional(),
  tips_rate: z.number().min(0).max(100).optional(),
  language: z.string().default('es'),
  theme: z.string().default('light'),
  currency: z.string().default('EUR'),
});

export const PrinterSchema = z.object({
  restaurant_id: z.string(),
  printer_name: z.string().min(1),
  printer_ip: z.string(),
  printer_connection: z.enum(['TCP', 'BLUETOOTH', 'USB']),
});
