import { Types } from 'mongoose';
import { MenuLanguage, IMenuLanguage } from '../models/menu-language.model';
import { BaseRepository, validateObjectId } from './base.repository';

export class MenuLanguageRepository extends BaseRepository<IMenuLanguage> {
  constructor() {
    super(MenuLanguage);
  }

  async findByRestaurantId(restaurantId: string): Promise<IMenuLanguage[]> {
    validateObjectId(restaurantId, 'restaurant_id');
    return this.model
      .find({ restaurant_id: new Types.ObjectId(restaurantId) })
      .sort({ order: 1 })
      .lean()
      .exec();
  }

  async findDefault(restaurantId: string): Promise<IMenuLanguage | null> {
    validateObjectId(restaurantId, 'restaurant_id');
    return this.model
      .findOne({ restaurant_id: new Types.ObjectId(restaurantId), is_default: true })
      .lean()
      .exec();
  }

  async createLanguage(data: {
    restaurant_id: string;
    name: string;
    code: string;
    is_default?: boolean;
    linked_app_lang?: string | null;
    order?: number;
  }): Promise<IMenuLanguage> {
    validateObjectId(data.restaurant_id, 'restaurant_id');
    return this.create({
      ...data,
      restaurant_id: new Types.ObjectId(data.restaurant_id),
    });
  }

  async updateLanguage(id: string, data: Partial<Pick<IMenuLanguage, 'name' | 'code' | 'is_default' | 'linked_app_lang' | 'order'>>): Promise<IMenuLanguage | null> {
    validateObjectId(id, 'menu_language_id');
    return this.model.findByIdAndUpdate(id, data, { new: true }).lean().exec();
  }

  async deleteLanguage(id: string): Promise<IMenuLanguage | null> {
    validateObjectId(id, 'menu_language_id');
    return this.model.findByIdAndDelete(id).lean().exec();
  }

  async clearDefault(restaurantId: string): Promise<void> {
    validateObjectId(restaurantId, 'restaurant_id');
    await this.model.updateMany(
      { restaurant_id: new Types.ObjectId(restaurantId) },
      { is_default: false }
    );
  }

  async getMaxOrder(restaurantId: string): Promise<number> {
    validateObjectId(restaurantId, 'restaurant_id');
    const last = await this.model
      .findOne({ restaurant_id: new Types.ObjectId(restaurantId) })
      .sort({ order: -1 })
      .lean()
      .exec();
    return last ? last.order + 1 : 0;
  }
}
