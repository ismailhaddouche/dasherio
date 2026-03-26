import { DishRepository, CategoryRepository } from '../repositories/dish.repository';

// Repository instances
const dishRepo = new DishRepository();
const categoryRepo = new CategoryRepository();

export async function getDishesByRestaurant(restaurantId: string, _lang: string = 'es') {
  return dishRepo.findActiveByRestaurantId(restaurantId);
}

export async function getDishById(dishId: string) {
  return dishRepo.findByIdWithDetails(dishId);
}

export async function createDish(data: any) {
  return dishRepo.createDish(data);
}

export async function updateDish(dishId: string, data: any) {
  return dishRepo.updateDish(dishId, data);
}

export async function deleteDish(dishId: string) {
  return dishRepo.delete(dishId);
}

export async function toggleDishStatus(dishId: string) {
  return dishRepo.toggleStatus(dishId);
}

export async function getCategoriesByRestaurant(restaurantId: string) {
  return categoryRepo.findByRestaurantId(restaurantId);
}

export async function getCategoryById(id: string) {
  return categoryRepo.findById(id);
}

export async function createCategory(data: any) {
  return categoryRepo.createCategory(data);
}

export async function updateCategory(id: string, data: any) {
  return categoryRepo.updateCategory(id, data);
}

export async function deleteCategory(id: string) {
  return categoryRepo.deleteCategory(id);
}
