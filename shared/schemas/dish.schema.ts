import { z } from 'zod';
import { LocalizedStringSchema, LocalizedStringOptionalSchema } from './localized-string.schema';

export const VariantSchema = z.object({
  variant_id: z.string().optional(),
  variant_name: LocalizedStringSchema,
  variant_description: LocalizedStringOptionalSchema.optional(),
  variant_url_image: z.string().url().optional(),
  variant_price: z.number().min(0),
});

export const ExtraSchema = z.object({
  extra_id: z.string().optional(),
  extra_name: LocalizedStringSchema,
  extra_description: LocalizedStringOptionalSchema.optional(),
  extra_price: z.number().min(0),
  extra_url_image: z.string().url().optional(),
});

export const CategorySchema = z.object({
  restaurant_id: z.string(),
  category_name: LocalizedStringSchema,
  category_order: z.number().int().min(0).default(0),
  category_description: LocalizedStringOptionalSchema.optional(),
  category_image_url: z.string().url().optional(),
});

export const AllergenSchema = z.object({
  alergen_name: LocalizedStringSchema,
});

export const DishSchema = z.object({
  restaurant_id: z.string(),
  category_id: z.string(),
  disher_name: LocalizedStringSchema,
  disher_description: LocalizedStringOptionalSchema.optional(),
  disher_url_image: z.string().url().optional(),
  disher_status: z.enum(['ACTIVATED', 'DESACTIVATED']).default('ACTIVATED'),
  disher_price: z.number().min(0),
  disher_type: z.enum(['KITCHEN', 'SERVICE']),
  disher_alergens: z.array(z.string()).default([]),
  disher_variant: z.boolean().default(false),
  variants: z.array(VariantSchema).default([]),
  extras: z.array(ExtraSchema).default([]),
});
