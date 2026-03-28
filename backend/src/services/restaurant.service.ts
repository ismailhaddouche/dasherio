import { RestaurantRepository } from '../repositories/restaurant.repository';
import { IRestaurant } from '../models/restaurant.model';

// Repository instance
const restaurantRepo = new RestaurantRepository();

// Type for restaurant update data (all fields optional)
export type UpdateRestaurantData = Partial<Pick<IRestaurant, 
  | 'restaurant_name'
  | 'restaurant_url'
  | 'logo_image_url'
  | 'social_links'
  | 'tax_rate'
  | 'tips_state'
  | 'tips_type'
  | 'tips_rate'
  | 'default_language'
  | 'default_theme'
  | 'currency'
>>;

export async function getRestaurantById(id: string): Promise<IRestaurant | null> {
  return restaurantRepo.findByIdLean(id);
}

export async function updateRestaurant(
  id: string, 
  data: UpdateRestaurantData
): Promise<IRestaurant | null> {
  return restaurantRepo.updateRestaurant(id, data);
}
