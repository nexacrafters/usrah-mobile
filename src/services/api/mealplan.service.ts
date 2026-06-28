/**
 * Meal Plan API Service
 * Maps to core/recipes meal-plan endpoints — the family's weekly food plan,
 * one entry per (date, meal type). Uses free-text custom meals (no recipe
 * required) so planning is quick.
 *
 * Routes (core/recipes/urls.py):
 *   GET    /recipes/meal-plans/?family_id=<id>&start_date=&end_date=  -> MealPlan[]
 *   POST   /recipes/meal-plans/   {family_id, date, meal_type, custom_meal, notes}
 *   PATCH  /recipes/meal-plans/<id>/
 *   DELETE /recipes/meal-plans/<id>/
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'suhoor'
  | 'iftar';

export interface MealPlan {
  public_id: string;
  date: string;
  meal_type: MealType;
  recipe: number | null;
  recipe_title?: string | null;
  custom_meal: string;
  notes: string;
  is_completed: boolean;
  created: string;
}

export interface CreateMealPlan {
  date: string;
  meal_type: MealType;
  custom_meal?: string;
  notes?: string;
}

class MealPlanService {
  async list(startDate: string, endDate: string): Promise<MealPlan[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/recipes/meal-plans/', {
        params: {family_id: familyId, start_date: startDate, end_date: endDate},
      });
      return unwrapList<MealPlan>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async create(data: CreateMealPlan): Promise<MealPlan> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const response = await apiClient.post<MealPlan>('/recipes/meal-plans/', {
        family_id: familyId,
        ...data,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async update(id: string, data: Partial<CreateMealPlan> & {is_completed?: boolean}): Promise<MealPlan> {
    try {
      const response = await apiClient.patch<MealPlan>(`/recipes/meal-plans/${id}/`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/recipes/meal-plans/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new MealPlanService();
