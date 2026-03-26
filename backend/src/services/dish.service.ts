import { DishRepository, CategoryRepository } from '../repositories/dish.repository';
import { IDish, ICategory } from '../models/dish.model';
import { cache, CacheKeys } from './cache.service';

// Repository instances
const dishRepo = new DishRepository();
const categoryRepo = new CategoryRepository();

// Cache TTL en ms
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

// Tipos para crear/actualizar platos
interface LocalizedString {
  es: string;
  en?: string;
  fr?: string;
  ar?: string;
}

interface CreateVariantData {
  variant_name: LocalizedString;
  variant_description?: LocalizedString;
  variant_price: number;
  variant_url_image?: string;
}

interface CreateExtraData {
  extra_name: LocalizedString;
  extra_description?: LocalizedString;
  extra_price: number;
  extra_url_image?: string;
}

interface CreateDishData {
  restaurant_id: string;
  category_id: string;
  disher_name: LocalizedString;
  disher_description?: LocalizedString;
  disher_price: number;
  disher_type: 'KITCHEN' | 'SERVICE';
  disher_status?: 'ACTIVATED' | 'DESACTIVATED';
  disher_alergens?: string[];
  disher_variant?: boolean;
  variants?: CreateVariantData[];
  extras?: CreateExtraData[];
}

interface UpdateDishData extends Partial<CreateDishData> {}

interface CreateCategoryData {
  restaurant_id: string;
  category_name: LocalizedString;
  category_description?: LocalizedString;
  category_order?: number;
  category_image_url?: string;
}

interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export async function getDishesByRestaurant(restaurantId: string, _lang: string = 'es'): Promise<IDish[]> {
  const cacheKey = CacheKeys.dishByRestaurant(restaurantId);
  const cached = cache.get<IDish[]>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const dishes = await dishRepo.findActiveByRestaurantId(restaurantId);
  cache.set(cacheKey, dishes, CACHE_TTL);
  return dishes;
}

export async function getDishById(dishId: string): Promise<IDish | null> {
  const cacheKey = CacheKeys.dishById(dishId);
  const cached = cache.get<IDish>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const dish = await dishRepo.findByIdWithDetails(dishId);
  if (dish) {
    cache.set(cacheKey, dish, CACHE_TTL);
  }
  return dish;
}

export async function createDish(data: CreateDishData): Promise<IDish> {
  const dish = await dishRepo.createDish(data as any);
  // Invalidar cache
  cache.delete(CacheKeys.dishByRestaurant(data.restaurant_id));
  return dish;
}

export async function updateDish(dishId: string, data: UpdateDishData): Promise<IDish | null> {
  const existing = await dishRepo.findById(dishId);
  if (!existing) return null;
  
  const updated = await dishRepo.updateDish(dishId, data as any);
  
  // Invalidar caches
  cache.delete(CacheKeys.dishById(dishId));
  if (data.restaurant_id) {
    cache.delete(CacheKeys.dishByRestaurant(data.restaurant_id));
  } else {
    cache.delete(CacheKeys.dishByRestaurant(existing.restaurant_id.toString()));
  }
  
  return updated;
}

export async function deleteDish(dishId: string): Promise<IDish | null> {
  const existing = await dishRepo.findById(dishId);
  if (!existing) return null;
  
  const deleted = await dishRepo.delete(dishId);
  
  // Invalidar caches
  cache.delete(CacheKeys.dishById(dishId));
  cache.delete(CacheKeys.dishByRestaurant(existing.restaurant_id.toString()));
  
  return deleted;
}

export async function toggleDishStatus(dishId: string): Promise<IDish | null> {
  const existing = await dishRepo.findById(dishId);
  if (!existing) return null;
  
  const updated = await dishRepo.toggleStatus(dishId);
  
  // Invalidar caches
  cache.delete(CacheKeys.dishById(dishId));
  cache.delete(CacheKeys.dishByRestaurant(existing.restaurant_id.toString()));
  
  return updated;
}

export async function getCategoriesByRestaurant(restaurantId: string): Promise<ICategory[]> {
  const cacheKey = CacheKeys.categoriesByRestaurant(restaurantId);
  const cached = cache.get<ICategory[]>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const categories = await categoryRepo.findByRestaurantId(restaurantId);
  cache.set(cacheKey, categories, CACHE_TTL);
  return categories;
}

export async function getCategoryById(id: string): Promise<ICategory | null> {
  const cacheKey = CacheKeys.categoryById(id);
  const cached = cache.get<ICategory>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const category = await categoryRepo.findById(id);
  if (category) {
    cache.set(cacheKey, category, CACHE_TTL);
  }
  return category;
}

export async function createCategory(data: CreateCategoryData): Promise<ICategory> {
  const category = await categoryRepo.createCategory(data as any);
  cache.delete(CacheKeys.categoriesByRestaurant(data.restaurant_id));
  return category;
}

export async function updateCategory(id: string, data: UpdateCategoryData): Promise<ICategory | null> {
  const existing = await categoryRepo.findById(id);
  if (!existing) return null;
  
  const updated = await categoryRepo.updateCategory(id, data as any);
  
  // Invalidar caches
  cache.delete(CacheKeys.categoryById(id));
  if (data.restaurant_id) {
    cache.delete(CacheKeys.categoriesByRestaurant(data.restaurant_id));
  } else {
    cache.delete(CacheKeys.categoriesByRestaurant(existing.restaurant_id.toString()));
  }
  
  return updated;
}

export async function deleteCategory(id: string): Promise<ICategory | null> {
  const existing = await categoryRepo.findById(id);
  if (!existing) return null;
  
  // Verificar que no haya platos usando esta categoria
  const dishesInCategory = await dishRepo.countByCategory(id);
  if (dishesInCategory > 0) {
    throw new Error('CATEGORY_HAS_DISHES');
  }
  
  const deleted = await categoryRepo.deleteCategory(id);
  
  // Invalidar caches
  cache.delete(CacheKeys.categoryById(id));
  cache.delete(CacheKeys.categoriesByRestaurant(existing.restaurant_id.toString()));
  
  return deleted;
}
