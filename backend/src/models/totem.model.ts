import { Schema, model, Document, Types } from 'mongoose';

export interface ITotem extends Document {
  restaurant_id: Types.ObjectId;
  totem_name: string;
  totem_qr: string;
  totem_type: 'STANDARD' | 'TEMPORARY';
  totem_start_date: Date;
}

const TotemSchema = new Schema<ITotem>(
  {
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    totem_name: { type: String, required: true },
    totem_qr: { type: String, unique: true },
    totem_type: { type: String, enum: ['STANDARD', 'TEMPORARY'], required: true },
    totem_start_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Totem = model<ITotem>('Totem', TotemSchema);

export interface ITotemSession extends Document {
  totem_id: Types.ObjectId;
  session_date_start: Date;
  totem_state: 'STARTED' | 'COMPLETE' | 'PAID';
}

const TotemSessionSchema = new Schema<ITotemSession>(
  {
    totem_id: { type: Schema.Types.ObjectId, ref: 'Totem', required: true },
    session_date_start: { type: Date, default: Date.now },
    totem_state: { type: String, enum: ['STARTED', 'COMPLETE', 'PAID'], default: 'STARTED' },
  },
  { timestamps: true }
);

export const TotemSession = model<ITotemSession>('TotemSession', TotemSessionSchema);

export interface ICustomer extends Document {
  customer_name: string;
  session_id: Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customer_name: { type: String, required: true },
    session_id: { type: Schema.Types.ObjectId, ref: 'TotemSession', required: true },
  },
  { timestamps: true }
);

export const Customer = model<ICustomer>('Customer', CustomerSchema);
