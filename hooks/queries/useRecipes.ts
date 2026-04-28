/**
 * Recipes Query Hooks
 * React Query hooks for family recipes
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { recipesApi } from '../../services/api/recipes';
import { queryKeys, invalidateQueries } from '../../services/queryClient';
import { DEMO_MODE, DEMO_RECIPES } from '../../services/demoMode';
import type { Recipe, RecipeIngredient, RecipeStep } from '../../types/models';

interface RecipeFilters {
  family_id: string;
  category?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  search?: string;
  author_id?: string;
}

// Mutable demo recipes
let demoRecipesData = [...DEMO_RECIPES];

/**
 * Get recipes with pagination
 */
export function useRecipes(filters: RecipeFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.recipes.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      if (DEMO_MODE) {
        let filtered = [...demoRecipesData];
        if (filters.difficulty) {
          filtered = filtered.filter(r => r.difficulty === filters.difficulty);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter(r =>
            r.title.toLowerCase().includes(search) ||
            r.title_ar?.toLowerCase().includes(search)
          );
        }
        return {
          results: filtered,
          next: null,
          page: 1,
          count: filtered.length,
        };
      }
      return recipesApi.getRecipes({ ...filters, page: pageParam });
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!filters.family_id,
  });
}

/**
 * Get single recipe
 */
export function useRecipe(id: string) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        const recipe = demoRecipesData.find(r => r.id === id);
        if (recipe) {
          return {
            ...recipe,
            ingredients: [
              { id: '1', name: 'دجاج', amount: 1, unit: 'كيلو' },
              { id: '2', name: 'أرز', amount: 2, unit: 'كوب' },
              { id: '3', name: 'بصل', amount: 2, unit: 'حبة' },
              { id: '4', name: 'ملح', amount: 1, unit: 'ملعقة صغيرة' },
            ],
            steps: [
              { id: '1', order: 1, instruction: 'نغسل الدجاج ونقطعه', time_minutes: 10 },
              { id: '2', order: 2, instruction: 'نحمر البصل مع البهارات', time_minutes: 5 },
              { id: '3', order: 3, instruction: 'نضيف الدجاج ونقلب', time_minutes: 15 },
              { id: '4', order: 4, instruction: 'نضيف الأرز والماء ونترك على نار هادئة', time_minutes: 30 },
            ],
          };
        }
        return null;
      }
      return recipesApi.getRecipe(id);
    },
    enabled: !!id,
  });
}

/**
 * Create recipe
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      name: string;
      description?: string;
      category?: string;
      cuisine?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      prep_time_minutes?: number;
      cook_time_minutes?: number;
      servings?: number;
      is_vegetarian?: boolean;
      is_halal?: boolean;
      ingredients: Array<{
        name: string;
        amount: number;
        unit: string;
        notes?: string;
      }>;
      steps: Array<{
        order: number;
        instruction: string;
        time_minutes?: number;
      }>;
    }) => {
      if (DEMO_MODE) {
        const newRecipe = {
          id: `demo-recipe-${Date.now()}`,
          title: data.name,
          title_ar: data.name,
          description: data.description || '',
          prep_time: data.prep_time_minutes || 15,
          cook_time: data.cook_time_minutes || 30,
          servings: data.servings || 4,
          difficulty: data.difficulty || 'medium',
          image: null,
          author: { full_name: 'أحمد' },
          rating: 0,
          ratings_count: 0,
        };
        demoRecipesData.unshift(newRecipe as any);
        return newRecipe;
      }
      return recipesApi.createRecipe(data);
    },
    onSuccess: () => {
      invalidateQueries.recipes();
    },
  });
}

/**
 * Update recipe
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Recipe> }) => {
      if (DEMO_MODE) {
        const index = demoRecipesData.findIndex(r => r.id === id);
        if (index !== -1) {
          demoRecipesData[index] = { ...demoRecipesData[index], ...data } as any;
          return demoRecipesData[index];
        }
        return null;
      }
      return recipesApi.updateRecipe(id, data);
    },
    onSuccess: (recipe: any) => {
      if (recipe) {
        queryClient.setQueryData(queryKeys.recipes.detail(recipe.id), recipe);
        invalidateQueries.recipes();
      }
    },
  });
}

/**
 * Delete recipe
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        const index = demoRecipesData.findIndex(r => r.id === id);
        if (index !== -1) {
          demoRecipesData.splice(index, 1);
        }
        return { success: true };
      }
      return recipesApi.deleteRecipe(id);
    },
    onSuccess: () => {
      invalidateQueries.recipes();
    },
  });
}

/**
 * Upload recipe image
 */
export function useUploadRecipeImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, imageUri }: { recipeId: string; imageUri: string }) => {
      if (DEMO_MODE) {
        const index = demoRecipesData.findIndex(r => r.id === recipeId);
        if (index !== -1) {
          demoRecipesData[index] = { ...demoRecipesData[index], image: imageUri } as any;
          return demoRecipesData[index];
        }
        return null;
      }
      return recipesApi.uploadImage(recipeId, imageUri);
    },
    onSuccess: (recipe: any) => {
      if (recipe) {
        queryClient.setQueryData(queryKeys.recipes.detail(recipe.id), recipe);
      }
    },
  });
}

/**
 * Add ingredient to recipe
 */
export function useAddIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      ingredient,
    }: {
      recipeId: string;
      ingredient: {
        name: string;
        amount: number;
        unit: string;
        notes?: string;
      };
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-ing-${Date.now()}`, ...ingredient };
      }
      return recipesApi.addIngredient(recipeId, ingredient);
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.detail(recipeId),
      });
    },
  });
}

/**
 * Remove ingredient from recipe
 */
export function useRemoveIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      ingredientId,
    }: {
      recipeId: string;
      ingredientId: string;
    }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return recipesApi.removeIngredient(recipeId, ingredientId);
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.detail(recipeId),
      });
    },
  });
}

/**
 * Add step to recipe
 */
export function useAddStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      step,
    }: {
      recipeId: string;
      step: {
        order: number;
        instruction: string;
        time_minutes?: number;
      };
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-step-${Date.now()}`, ...step };
      }
      return recipesApi.addStep(recipeId, step);
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.detail(recipeId),
      });
    },
  });
}

/**
 * Remove step from recipe
 */
export function useRemoveStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      stepId,
    }: {
      recipeId: string;
      stepId: string;
    }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return recipesApi.removeStep(recipeId, stepId);
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.detail(recipeId),
      });
    },
  });
}

/**
 * Rate recipe
 */
export function useRateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      rating,
      review,
    }: {
      recipeId: string;
      rating: number;
      review?: string;
    }) => {
      if (DEMO_MODE) {
        const index = demoRecipesData.findIndex(r => r.id === recipeId);
        if (index !== -1) {
          const recipe = demoRecipesData[index];
          const newCount = (recipe.ratings_count || 0) + 1;
          const currentTotal = (recipe.rating || 0) * (recipe.ratings_count || 0);
          demoRecipesData[index] = {
            ...recipe,
            rating: (currentTotal + rating) / newCount,
            ratings_count: newCount,
          } as any;
        }
        return { success: true };
      }
      return recipesApi.rateRecipe(recipeId, rating, review);
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.detail(recipeId),
      });
    },
  });
}

/**
 * Mark recipe as cooked
 */
export function useMarkCooked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      servingsMade,
      notes,
    }: {
      recipeId: string;
      servingsMade?: number;
      notes?: string;
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-cook-${Date.now()}`, recipe_id: recipeId, servings: servingsMade, notes };
      }
      return recipesApi.markCooked(recipeId, servingsMade, notes);
    },
    onSuccess: (_, { recipeId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.detail(recipeId),
      });
    },
  });
}

/**
 * Get cooking history for recipe
 */
export function useCookingHistory(recipeId: string) {
  return useQuery({
    queryKey: [...queryKeys.recipes.detail(recipeId), 'history'],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', cooked_by: { full_name: 'فاطمة' }, date: '2026-04-20', servings: 6 },
          { id: '2', cooked_by: { full_name: 'أم أحمد' }, date: '2026-04-15', servings: 4 },
        ];
      }
      return recipesApi.getCookingHistory(recipeId);
    },
    enabled: !!recipeId,
  });
}

/**
 * Get family cooking history
 */
export function useFamilyCookingHistory(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.recipes.all, 'cooking-history', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', recipe: DEMO_RECIPES[0], cooked_by: { full_name: 'فاطمة' }, date: '2026-04-20' },
          { id: '2', recipe: DEMO_RECIPES[1], cooked_by: { full_name: 'أم أحمد' }, date: '2026-04-18' },
        ];
      }
      return recipesApi.getFamilyCookingHistory(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get recipe categories
 */
export function useRecipeCategories(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.recipes.all, 'categories', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', name: 'Main Dishes', name_ar: 'أطباق رئيسية' },
          { id: '2', name: 'Soups', name_ar: 'شوربات' },
          { id: '3', name: 'Desserts', name_ar: 'حلويات' },
          { id: '4', name: 'Salads', name_ar: 'سلطات' },
        ];
      }
      return recipesApi.getCategories(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Get recipe cuisines
 */
export function useRecipeCuisines(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.recipes.all, 'cuisines', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', name: 'Saudi', name_ar: 'سعودي' },
          { id: '2', name: 'Lebanese', name_ar: 'لبناني' },
          { id: '3', name: 'Egyptian', name_ar: 'مصري' },
          { id: '4', name: 'Moroccan', name_ar: 'مغربي' },
        ];
      }
      return recipesApi.getCuisines(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Search recipes
 */
export function useSearchRecipes(familyId: string, query: string) {
  return useQuery({
    queryKey: [...queryKeys.recipes.all, 'search', familyId, query],
    queryFn: async () => {
      if (DEMO_MODE) {
        const search = query.toLowerCase();
        return demoRecipesData.filter(r =>
          r.title.toLowerCase().includes(search) ||
          r.title_ar?.toLowerCase().includes(search)
        );
      }
      return recipesApi.searchRecipes(familyId, query);
    },
    enabled: !!familyId && query.length >= 2,
  });
}

/**
 * Get meal plans
 */
export function useMealPlans(familyId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.recipes.mealPlans(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', date: '2026-04-21', meal_type: 'lunch', recipe: DEMO_RECIPES[0] },
          { id: '2', date: '2026-04-21', meal_type: 'dinner', recipe: DEMO_RECIPES[1] },
          { id: '3', date: '2026-04-22', meal_type: 'lunch', recipe: DEMO_RECIPES[2] },
        ];
      }
      return recipesApi.getMealPlans(familyId, startDate, endDate);
    },
    enabled: !!familyId,
  });
}

/**
 * Create meal plan
 */
export function useCreateMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      date: string;
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      recipe_id: string;
      servings?: number;
      notes?: string;
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-meal-${Date.now()}`, ...data };
      }
      return recipesApi.createMealPlan(data);
    },
    onSuccess: (_, { family_id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.mealPlans(family_id),
      });
    },
  });
}

/**
 * Delete meal plan
 */
export function useDeleteMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, familyId }: { id: string; familyId: string }) => {
      if (DEMO_MODE) {
        return familyId;
      }
      return recipesApi.deleteMealPlan(id).then(() => familyId);
    },
    onSuccess: (familyId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.mealPlans(familyId as string),
      });
    },
  });
}

/**
 * Get shopping list
 */
export function useShoppingList(familyId: string) {
  return useQuery({
    queryKey: queryKeys.recipes.shoppingList(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', item: 'دجاج', quantity: 2, unit: 'كيلو', is_checked: false },
          { id: '2', item: 'أرز', quantity: 5, unit: 'كيلو', is_checked: false },
          { id: '3', item: 'بصل', quantity: 1, unit: 'كيلو', is_checked: true },
          { id: '4', item: 'طماطم', quantity: 1, unit: 'كيلو', is_checked: false },
        ];
      }
      return recipesApi.getShoppingList(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Add to shopping list
 */
export function useAddToShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      item: string;
      quantity?: number;
      unit?: string;
      recipe_id?: string;
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-shop-${Date.now()}`, ...data, is_checked: false };
      }
      return recipesApi.addToShoppingList(data);
    },
    onSuccess: (_, { family_id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.shoppingList(family_id),
      });
    },
  });
}

/**
 * Add recipe ingredients to shopping list
 */
export function useAddRecipeToShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      recipeId,
      servings,
    }: {
      familyId: string;
      recipeId: string;
      servings?: number;
    }) => {
      if (DEMO_MODE) {
        return { success: true, items_added: 4 };
      }
      return recipesApi.addRecipeToShoppingList(familyId, recipeId, servings);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.shoppingList(familyId),
      });
    },
  });
}

/**
 * Toggle shopping list item
 */
export function useToggleShoppingListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, familyId }: { itemId: string; familyId: string }) => {
      if (DEMO_MODE) {
        return familyId;
      }
      return recipesApi.toggleShoppingListItem(itemId).then(() => familyId);
    },
    onSuccess: (familyId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.shoppingList(familyId as string),
      });
    },
  });
}

/**
 * Clear completed shopping items
 */
export function useClearCompletedShoppingItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (familyId: string) => {
      if (DEMO_MODE) {
        return familyId;
      }
      return recipesApi.clearCompletedItems(familyId).then(() => familyId);
    },
    onSuccess: (familyId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.shoppingList(familyId as string),
      });
    },
  });
}
