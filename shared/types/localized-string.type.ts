import { z } from 'zod';
import { LocalizedStringSchema, LocalizedStringOptionalSchema } from '../schemas/localized-string.schema';

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type LocalizedStringOptional = z.infer<typeof LocalizedStringOptionalSchema>;
