import { MenuLanguageRepository } from '../repositories/menu-language.repository';
import { createError } from '../utils/async-handler';
import type { IMenuLanguage } from '../models/menu-language.model';

const repo = new MenuLanguageRepository();

export async function getByRestaurant(restaurantId: string): Promise<IMenuLanguage[]> {
  return repo.findByRestaurantId(restaurantId);
}

export async function getDefault(restaurantId: string): Promise<IMenuLanguage | null> {
  return repo.findDefault(restaurantId);
}

export async function create(data: {
  restaurant_id: string;
  name: string;
  code: string;
  is_default?: boolean;
  linked_app_lang?: string | null;
}): Promise<IMenuLanguage> {
  const order = await repo.getMaxOrder(data.restaurant_id);

  // If first language or marked as default, ensure it's default
  const existing = await repo.findByRestaurantId(data.restaurant_id);
  const isDefault = existing.length === 0 ? true : !!data.is_default;

  if (isDefault && existing.length > 0) {
    await repo.clearDefault(data.restaurant_id);
  }

  return repo.createLanguage({
    ...data,
    is_default: isDefault,
    order,
  });
}

export async function update(
  id: string,
  data: Partial<Pick<IMenuLanguage, 'name' | 'code' | 'linked_app_lang' | 'order'>>
): Promise<IMenuLanguage | null> {
  return repo.updateLanguage(id, data);
}

export async function setDefault(id: string, restaurantId: string): Promise<IMenuLanguage | null> {
  await repo.clearDefault(restaurantId);
  return repo.updateLanguage(id, { is_default: true });
}

export async function remove(id: string): Promise<void> {
  const lang = await repo.findById(id);
  if (!lang) throw createError.notFound('MENU_LANGUAGE_NOT_FOUND');
  if (lang.is_default) throw createError.badRequest('CANNOT_DELETE_DEFAULT_LANGUAGE');
  await repo.deleteLanguage(id);
}
