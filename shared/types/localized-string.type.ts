import { z } from 'zod';
import { LocalizedStringSchema, LocalizedStringOptionalSchema, LocalizedEntrySchema, LocalizedFieldSchema } from '../schemas/localized-string.schema';

// Legacy types (kept for backward compatibility)
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type LocalizedStringOptional = z.infer<typeof LocalizedStringOptionalSchema>;

// New array-based localized field types
export type LocalizedEntry = z.infer<typeof LocalizedEntrySchema>;
export type LocalizedField = z.infer<typeof LocalizedFieldSchema>;
