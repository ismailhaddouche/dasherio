import { z } from 'zod';

export const LocalizedStringSchema = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
  fr: z.string().optional().default(''),
  ar: z.string().optional().default(''),
});

export const LocalizedStringOptionalSchema = z.object({
  es: z.string().optional().default(''),
  en: z.string().optional().default(''),
  fr: z.string().optional().default(''),
  ar: z.string().optional().default(''),
});
