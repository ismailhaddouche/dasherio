import { Schema, model, Document, Types } from 'mongoose';

export interface IStaff extends Document {
  restaurant_id: Types.ObjectId;
  staff_name: string;
  staff_email: string;
  staff_password_hash: string;
  staff_pin_hash?: string;
  role: 'Admin' | 'Manager' | 'Waiter' | 'Kitchen' | 'Cashier';
  permissions: string[];
  is_active: boolean;
}

const StaffSchema = new Schema<IStaff>(
  {
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    staff_name: { type: String, required: true },
    staff_email: { type: String, required: true, unique: true },
    staff_password_hash: { type: String, required: true },
    staff_pin_hash: { type: String },
    role: { 
      type: String, 
      enum: ['Admin', 'Manager', 'Waiter', 'Kitchen', 'Cashier'],
      required: true 
    },
    permissions: [{ type: String }],
    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Staff = model<IStaff>('Staff', StaffSchema);
