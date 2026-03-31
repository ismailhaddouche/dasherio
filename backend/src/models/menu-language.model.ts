import { Schema, model, Document, Types } from 'mongoose';

export interface IMenuLanguage extends Document {
  restaurant_id: Types.ObjectId;
  name: string;
  code: string;
  is_default: boolean;
  linked_app_lang: string | null;
  order: number;
}

const MenuLanguageSchema = new Schema<IMenuLanguage>(
  {
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, lowercase: true },
    is_default: { type: Boolean, default: false },
    linked_app_lang: { type: String, enum: ['es', 'en', 'fr', null], default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

MenuLanguageSchema.index({ restaurant_id: 1, code: 1 }, { unique: true });

export const MenuLanguage = model<IMenuLanguage>('MenuLanguage', MenuLanguageSchema);
