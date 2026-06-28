/**
 * Recipe API Service
 * Maps to core/recipes endpoints. Recipe ids are `public_id` UUID strings.
 *
 * Routes (confirmed from core/recipes/urls.py + views.py):
 *   GET    /recipes/?family_id=<id>[&category_id=&difficulty=&search=]  -> RecipeListSerializer[]
 *   POST   /recipes/create/   {family_id, title, ...}                   -> RecipeSerializer
 *   GET    /recipes/<id>/                                               -> RecipeSerializer
 *   POST   /recipes/<id>/save/                                          -> {saved: bool}
 *   POST   /recipes/<id>/rate/   {rating}
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';
import type {
  Recipe,
  RecipeDetail,
  RecipeIngredient,
  RecipeStep,
} from '../../store/recipeStore';

export interface CreateRecipeRequest {
  title: string;
  title_ar?: string;
  description?: string;
  story?: string;
  category_id?: string | null;
  cuisine_id?: string | null;
  difficulty?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  is_halal?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  tags?: string[];
  ingredients?: Partial<RecipeIngredient>[];
  steps?: Partial<RecipeStep>[];
}

class RecipeService {
  /** List recipes for the active family. Returns [] when no family is selected. */
  async getRecipes(params?: {
    category_id?: string;
    difficulty?: string;
    search?: string;
  }): Promise<Recipe[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/recipes/', {
        params: {family_id: familyId, ...params},
      });
      return unwrapList<Recipe>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Full recipe detail (ingredients, steps, notes). */
  async getRecipe(recipeId: string): Promise<RecipeDetail> {
    try {
      const response = await apiClient.get<RecipeDetail>(
        `/recipes/${recipeId}/`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Create a recipe in the active family. */
  async createRecipe(data: CreateRecipeRequest): Promise<RecipeDetail> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const response = await apiClient.post<RecipeDetail>('/recipes/create/', {
        family_id: familyId,
        ...data,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Toggle save/unsave on a recipe. */
  async toggleSaveRecipe(recipeId: string): Promise<{saved: boolean}> {
    try {
      const response = await apiClient.post(`/recipes/${recipeId}/save/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Rate a recipe (1-5). */
  async rateRecipe(recipeId: string, rating: number): Promise<unknown> {
    try {
      const response = await apiClient.post(`/recipes/${recipeId}/rate/`, {
        rating,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new RecipeService();
