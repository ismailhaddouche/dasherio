import { Types } from 'mongoose';
import { Staff, IStaff, Role, IRole } from '../models/staff.model';
import { BaseRepository, validateObjectId } from './base.repository';

export { validateObjectId };

export class UserRepository extends BaseRepository<IStaff> {
  constructor() {
    super(Staff);
  }

  async findByEmail(email: string): Promise<IStaff | null> {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByRestaurantId(restaurantId: string): Promise<IStaff[]> {
    validateObjectId(restaurantId, 'restaurant_id');
    return this.model
      .find({ restaurant_id: new Types.ObjectId(restaurantId) })
      .populate('role_id')
      .lean()
      .exec();
  }

  async findByRestaurantIdWithPassword(restaurantId: string): Promise<IStaff[]> {
    validateObjectId(restaurantId, 'restaurant_id');
    return this.model
      .find({ restaurant_id: new Types.ObjectId(restaurantId) })
      .select('+password_hash +pin_code_hash')
      .exec();
  }

  async findByIdWithRole(id: string): Promise<IStaff | null> {
    validateObjectId(id, 'staff_id');
    return this.model.findById(id).populate('role_id').exec();
  }

  async createUser(
    data: Partial<IStaff> & {
      restaurant_id: string;
      role_id: string;
      email: string;
      password_hash: string;
      pin_code_hash: string;
    }
  ): Promise<IStaff> {
    validateObjectId(data.restaurant_id, 'restaurant_id');
    validateObjectId(data.role_id, 'role_id');

    return this.create({
      ...data,
      restaurant_id: new Types.ObjectId(data.restaurant_id),
      role_id: new Types.ObjectId(data.role_id),
      email: data.email.toLowerCase(),
    });
  }

  async updateUser(id: string, data: Partial<IStaff>): Promise<IStaff | null> {
    validateObjectId(id, 'staff_id');
    if (data.email) {
      data.email = data.email.toLowerCase();
    }
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteUser(id: string): Promise<IStaff | null> {
    validateObjectId(id, 'staff_id');
    return this.model.findByIdAndDelete(id).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.model.countDocuments({ email: email.toLowerCase() }).exec();
    return count > 0;
  }

  async countByRestaurant(restaurantId: string): Promise<number> {
    validateObjectId(restaurantId, 'restaurant_id');
    return this.model.countDocuments({ restaurant_id: new Types.ObjectId(restaurantId) }).exec();
  }
}

export class RoleRepository extends BaseRepository<IRole> {
  constructor() {
    super(Role);
  }

  async findByRestaurantId(restaurantId: string): Promise<IRole[]> {
    validateObjectId(restaurantId, 'restaurant_id');
    return this.model
      .find({ restaurant_id: new Types.ObjectId(restaurantId) })
      .lean()
      .exec();
  }

  async findByName(restaurantId: string, roleName: string): Promise<IRole | null> {
    validateObjectId(restaurantId, 'restaurant_id');
    return this.model.findOne({
      restaurant_id: new Types.ObjectId(restaurantId),
      role_name: roleName,
    });
  }

  async createRole(
    data: Partial<IRole> & { restaurant_id: string; role_name: string }
  ): Promise<IRole> {
    validateObjectId(data.restaurant_id, 'restaurant_id');
    return this.create({
      ...data,
      restaurant_id: new Types.ObjectId(data.restaurant_id),
      permissions: data.permissions || [],
    });
  }

  async updateRole(id: string, data: Partial<IRole>): Promise<IRole | null> {
    validateObjectId(id, 'role_id');
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async deleteRole(id: string): Promise<IRole | null> {
    validateObjectId(id, 'role_id');
    return this.model.findByIdAndDelete(id).exec();
  }

  async existsByName(restaurantId: string, roleName: string): Promise<boolean> {
    validateObjectId(restaurantId, 'restaurant_id');
    const count = await this.model.countDocuments({
      restaurant_id: new Types.ObjectId(restaurantId),
      role_name: roleName,
    });
    return count > 0;
  }
}
