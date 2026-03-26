import { Schema, model, Document, Types } from 'mongoose';

export interface IRole extends Document {
  restaurant_id: Types.ObjectId;
  role_name: string;
  permissions: string[];
}

const RoleSchema = new Schema<IRole>(
  {
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    role_name: { type: String, required: true },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

export const Role = model<IRole>('Role', RoleSchema);

export interface IStaff extends Document {
  restaurant_id: Types.ObjectId;
  role_id: Types.ObjectId;
  staff_name: string;
  email: string;
  password_hash: string;
  pin_code_hash: string;
}

const StaffSchema = new Schema<IStaff>(
  {
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    role_id: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    staff_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true },
    pin_code_hash: { type: String, required: true },
  },
  { timestamps: true }
);

// Index for efficient PIN lookups by restaurant
StaffSchema.index({ restaurant_id: 1 });

export const Staff = model<IStaff>('Staff', StaffSchema);
