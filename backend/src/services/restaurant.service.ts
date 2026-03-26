import { RestaurantRepository } from '../repositories/restaurant.repository';

// Repository instance
const restaurantRepo = new RestaurantRepository();

export async function getRestaurantById(id: string) {
  return restaurantRepo.findByIdLean(id);
}

export async function updateRestaurant(id: string, data: any) {
  return restaurantRepo.updateRestaurant(id, data);
}
