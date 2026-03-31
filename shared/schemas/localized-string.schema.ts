import { z } from 'zod';

// Legacy schemas (kept for backward compatibility with existing code that may reference them)
export const LocalizedStringSchema = z.object({
  es: z.string().optional().default(''),
  en: z.string().optional().default(''),
  fr: z.string().optional().default(''),
  ar: z.string().optional().default(''),
});

export const LocalizedStringOptionalSchema = z.object({
  es: z.string().optional().default(''),
  en: z.string().optional().default(''),
  fr: z.string().optional().default(''),
  ar: z.string().optional().default(''),
});

// New: array-based localized field (lang references a MenuLanguage _id)
export const LocalizedEntrySchema = z.object({
  lang: z.string(),
  value: z.string().default(''),
});

export const LocalizedFieldSchema = z.array(LocalizedEntrySchema).default([]);
