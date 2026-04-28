/**
 * Recipes API Service
 * Handles family recipe collection and meal planning
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import {
  Recipe,
  RecipeCooked,
  Ingredient,
  RecipeStep,
  RecipeDifficulty,
  PaginatedResponse,
} from '../../types/models';

// Request interfaces
interface CreateRecipeRequest {
  family_id: string;
  title: string;
  description?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  category?: string;
  tags?: string[];
  origin_story?: string;
  original_author?: string;
  ingredients: CreateIngredientRequest[];
  steps: CreateStepRequest[];
}

interface CreateIngredientRequest {
  name: string;
  quantity: string;
  unit: string;
  notes?: string;
  order: number;
}

interface CreateStepRequest {
  step_number: number;
  instruction: string;
  duration_minutes?: number;
  tips?: string;
}

interface UpdateRecipeRequest {
  title?: string;
  description?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  category?: string;
  tags?: string[];
  origin_story?: string;
  is_favorite?: boolean;
}

interface RecipeFilters {
  family_id: string;
  category?: string;
  difficulty?: RecipeDifficulty;
  search?: string;
  is_favorite?: boolean;
  tags?: string[];
  page?: number;
}

interface CookRecipeRequest {
  cooked_at?: string;
  rating?: number;
  notes?: string;
}

/**
 * Recipes API Service
 */
export const recipesApi = {
  // ==================== Recipes ====================

  /**
   * Get list of recipes
   */
  async getRecipes(filters: RecipeFilters): Promise<PaginatedResponse<Recipe>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    return apiClient.get<PaginatedResponse<Recipe>>(
      `${ENDPOINTS.recipes.list}?${params.toString()}`
    );
  },

  /**
   * Get a single recipe
   */
  async getRecipe(id: string): Promise<Recipe> {
    return apiClient.get<Recipe>(ENDPOINTS.recipes.detail(id));
  },

  /**
   * Create a new recipe
   */
  async createRecipe(data: CreateRecipeRequest): Promise<Recipe> {
    return apiClient.post<Recipe>(ENDPOINTS.recipes.create, data);
  },

  /**
   * Update a recipe
   */
  async updateRecipe(id: string, data: UpdateRecipeRequest): Promise<Recipe> {
    return apiClient.patch<Recipe>(ENDPOINTS.recipes.detail(id), data);
  },

  /**
   * Delete a recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.recipes.detail(id));
  },

  /**
   * Upload cover image for a recipe
   */
  async uploadCoverImage(recipeId: string, imageUri: string): Promise<Recipe> {
    const formData = new FormData();
    formData.append('cover_image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'cover.jpg',
    } as any);

    return apiClient.uploadFile<Recipe>(ENDPOINTS.recipes.detail(recipeId), formData);
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string, isFavorite: boolean): Promise<Recipe> {
    return this.updateRecipe(id, { is_favorite: isFavorite });
  },

  // ==================== Cooking History ====================

  /**
   * Mark recipe as cooked
   */
  async markCooked(recipeId: string, data?: CookRecipeRequest): Promise<RecipeCooked> {
    return apiClient.post<RecipeCooked>(ENDPOINTS.recipes.cooked(recipeId), {
      cooked_at: data?.cooked_at || new Date().toISOString(),
      rating: data?.rating,
      notes: data?.notes,
    });
  },

  /**
   * Get cooking history for a recipe
   */
  async getCookingHistory(recipeId: string): Promise<RecipeCooked[]> {
    const response = await apiClient.get<{ results: RecipeCooked[] }>(
      ENDPOINTS.recipes.history(recipeId)
    );
    return response.results;
  },

  /**
   * Upload photo for cooked instance
   */
  async uploadCookedPhoto(
    recipeId: string,
    cookedId: string,
    imageUri: string
  ): Promise<RecipeCooked> {
    const formData = new FormData();
    formData.append('photo', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'cooked.jpg',
    } as any);

    return apiClient.uploadFile<RecipeCooked>(
      `${ENDPOINTS.recipes.cooked(recipeId)}${cookedId}/`,
      formData
    );
  },

  // ==================== Ingredients & Steps ====================

  /**
   * Add ingredient to recipe
   */
  async addIngredient(recipeId: string, ingredient: CreateIngredientRequest): Promise<Recipe> {
    return apiClient.post<Recipe>(`${ENDPOINTS.recipes.detail(recipeId)}ingredients/`, ingredient);
  },

  /**
   * Update ingredient
   */
  async updateIngredient(
    recipeId: string,
    ingredientId: string,
    data: Partial<CreateIngredientRequest>
  ): Promise<Recipe> {
    return apiClient.patch<Recipe>(
      `${ENDPOINTS.recipes.detail(recipeId)}ingredients/${ingredientId}/`,
      data
    );
  },

  /**
   * Delete ingredient
   */
  async deleteIngredient(recipeId: string, ingredientId: string): Promise<void> {
    return apiClient.delete(`${ENDPOINTS.recipes.detail(recipeId)}ingredients/${ingredientId}/`);
  },

  /**
   * Add step to recipe
   */
  async addStep(recipeId: string, step: CreateStepRequest): Promise<Recipe> {
    return apiClient.post<Recipe>(`${ENDPOINTS.recipes.detail(recipeId)}steps/`, step);
  },

  /**
   * Update step
   */
  async updateStep(
    recipeId: string,
    stepId: string,
    data: Partial<CreateStepRequest>
  ): Promise<Recipe> {
    return apiClient.patch<Recipe>(
      `${ENDPOINTS.recipes.detail(recipeId)}steps/${stepId}/`,
      data
    );
  },

  /**
   * Delete step
   */
  async deleteStep(recipeId: string, stepId: string): Promise<void> {
    return apiClient.delete(`${ENDPOINTS.recipes.detail(recipeId)}steps/${stepId}/`);
  },

  // ==================== Shopping List ====================

  /**
   * Generate shopping list from recipes
   */
  async generateShoppingList(recipeIds: string[]): Promise<{
    ingredients: { name: string; quantity: string; unit: string; checked: boolean }[];
  }> {
    return apiClient.post<{
      ingredients: { name: string; quantity: string; unit: string; checked: boolean }[];
    }>(ENDPOINTS.recipes.shoppingList, { recipe_ids: recipeIds });
  },

  // ==================== Search & Filter ====================

  /**
   * Search recipes
   */
  async searchRecipes(familyId: string, query: string): Promise<Recipe[]> {
    const response = await this.getRecipes({
      family_id: familyId,
      search: query,
    });
    return response.results;
  },

  /**
   * Get favorite recipes
   */
  async getFavorites(familyId: string): Promise<Recipe[]> {
    const response = await this.getRecipes({
      family_id: familyId,
      is_favorite: true,
    });
    return response.results;
  },

  /**
   * Get recipes by category
   */
  async getByCategory(familyId: string, category: string): Promise<Recipe[]> {
    const response = await this.getRecipes({
      family_id: familyId,
      category,
    });
    return response.results;
  },

  /**
   * Get quick recipes (under 30 minutes)
   */
  async getQuickRecipes(familyId: string): Promise<Recipe[]> {
    const allRecipes = await this.getRecipes({ family_id: familyId });
    return allRecipes.results.filter(
      (r) => r.prep_time_minutes + r.cook_time_minutes <= 30
    );
  },
};
