import { Schema, model, Document, Types } from 'mongoose';

export interface IRestaurant extends Document {
  restaurant_name: string;
  restaurant_url?: string;
  logo_image_url?: string;
  social_links?: { facebook_url?: string; instagram_url?: string };
  tax_rate: number;
  tips_state: boolean;
  tips_type?: 'MANDATORY' | 'VOLUNTARY';
  tips_rate?: number;
  default_language: 'es' | 'en';
  default_theme: 'light' | 'dark';
  currency: string;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    restaurant_name: { type: String, required: true },
    restaurant_url: String,
    logo_image_url: String,
    social_links: {
      facebook_url: String,
      instagram_url: String,
    },
    tax_rate: { type: Number, required: true, default: 0 },
    tips_state: { type: Boolean, default: false },
    tips_type: { type: String, enum: ['MANDATORY', 'VOLUNTARY'] },
    tips_rate: Number,
    default_language: { type: String, enum: ['es', 'en'], default: 'es' },
    default_theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    currency: { type: String, default: 'EUR' },
  },
  { timestamps: true }
);

export const Restaurant = model<IRestaurant>('Restaurant', RestaurantSchema);

export interface IPrinter extends Document {
  restaurant_id: Types.ObjectId;
  printer_name: string;
  printer_ip: string;
  printer_connection: 'TCP' | 'BLUETOOTH' | 'USB';
}

const PrinterSchema = new Schema<IPrinter>(
  {
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    printer_name: { type: String, required: true },
    printer_ip: { type: String, required: true },
    printer_connection: { type: String, enum: ['TCP', 'BLUETOOTH', 'USB'], required: true },
  },
  { timestamps: true }
);

export const Printer = model<IPrinter>('Printer', PrinterSchema);
