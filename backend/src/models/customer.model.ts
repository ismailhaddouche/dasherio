import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  restaurant_id: Types.ObjectId;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  created_at: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customer_name: { type: String, required: true },
    customer_email: { type: String },
    customer_phone: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export const Customer = model<ICustomer>('Customer', CustomerSchema);
