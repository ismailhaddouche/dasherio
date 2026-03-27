import { Schema, model, Document, Types } from 'mongoose';

const LocalizedStringSchema = {
  es: { type: String, default: '' },
  en: { type: String, default: '' },
  fr: { type: String, default: '' },
  ar: { type: String, default: '' },
};

export interface IOrder extends Document {
  session_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  staff_id?: Types.ObjectId;
  order_date: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    session_id: { type: Schema.Types.ObjectId, ref: 'TotemSession', required: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'Customer' },
    staff_id: { type: Schema.Types.ObjectId, ref: 'Staff' },
    order_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', OrderSchema);

export interface IItemOrder extends Document {
  order_id: Types.ObjectId;
  session_id: Types.ObjectId;
  item_dish_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  item_state: 'ORDERED' | 'ON_PREPARE' | 'SERVED' | 'CANCELED';
  item_disher_type: 'KITCHEN' | 'SERVICE';
  item_name_snapshot: { es: string; en: string; fr: string; ar: string };
  item_base_price: number;
  item_disher_variant?: { variant_id: string; name: object; price: number } | null;
  item_disher_extras: { extra_id: string; name: object; price: number }[];
}

const ItemOrderSchema = new Schema<IItemOrder>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    session_id: { type: Schema.Types.ObjectId, ref: 'TotemSession', required: true, index: true },
    item_dish_id: { type: Schema.Types.ObjectId, ref: 'Dish', required: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'Customer' },
    item_state: {
      type: String,
      enum: ['ORDERED', 'ON_PREPARE', 'SERVED', 'CANCELED'],
      default: 'ORDERED',
      index: true,
    },
    item_disher_type: { type: String, enum: ['KITCHEN', 'SERVICE'], required: true, index: true },
    item_name_snapshot: LocalizedStringSchema,
    item_base_price: { type: Number, required: true, min: 0.01 }, // Must be greater than 0
    item_disher_variant: {
      variant_id: String,
      name: LocalizedStringSchema,
      price: Number,
    },
    item_disher_extras: [
      {
        extra_id: String,
        name: LocalizedStringSchema,
        price: Number,
      },
    ],
  },
  { timestamps: true }
);

// Compound index for kitchen queries
ItemOrderSchema.index({ session_id: 1, item_disher_type: 1, item_state: 1 });

export const ItemOrder = model<IItemOrder>('ItemOrder', ItemOrderSchema);

export interface IPayment extends Document {
  session_id: Types.ObjectId;
  payment_type: 'ALL' | 'BY_USER' | 'SHARED';
  payment_total: number;
  payment_date: Date;
  tickets: {
    ticket_id?: Types.ObjectId;
    ticket_part: number;
    ticket_total_parts: number;
    ticket_amount: number;
    ticket_customer_name?: string;
    paid: boolean;
  }[];
}

const PaymentSchema = new Schema<IPayment>(
  {
    session_id: { type: Schema.Types.ObjectId, ref: 'TotemSession', required: true },
    payment_type: { type: String, enum: ['ALL', 'BY_USER', 'SHARED'], required: true },
    payment_total: { type: Number, required: true, min: 0 },
    payment_date: { type: Date, default: Date.now },
    tickets: [
      {
        ticket_part: { type: Number, required: true },
        ticket_total_parts: { type: Number, required: true },
        ticket_amount: { type: Number, required: true, min: 0 },
        ticket_customer_name: String,
        paid: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
