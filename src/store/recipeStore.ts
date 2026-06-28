/**
 * Recipe Store
 * Manages family recipes. Shapes mirror core/recipes/serializers.py
 * (RecipeListSerializer / RecipeSerializer). Recipe ids are `public_id`.
 */

import {create} from 'zustand';
import type {MiniUser} from './familyStore';

/** RecipeListSerializer */
export interface Recipe {
  public_id: string;
  title: string;
  title_ar?: string;
  cover_image?: string | null;
  category_name?: string | null;
  difficulty?: string;
  total_time_minutes?: number;
  servings?: number;
  is_halal: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  average_rating?: number | null;
  ratings_count: number;
  created_by_name?: string;
  original_creator?: string | null;
  created: string;
}

export interface RecipeIngredient {
  public_id?: string;
  name: string;
  name_ar?: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  is_optional?: boolean;
  order?: number;
  group?: string;
}

export interface RecipeStep {
  public_id?: string;
  step_number: number;
  instruction: string;
  instruction_ar?: string;
  tip?: string;
  image?: string | null;
  duration_minutes?: number | null;
}

export interface RecipeNote {
  public_id: string;
  author: MiniUser;
  content: string;
  is_tip: boolean;
  created: string;
}

/** RecipeSerializer (detail) */
export interface RecipeDetail extends Recipe {
  family?: string;
  created_by: MiniUser | null;
  description?: string;
  story?: string;
  category?: string | null;
  cuisine?: string | null;
  cuisine_name?: string | null;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  video_url?: string | null;
  origin_location?: string | null;
  is_published?: boolean;
  is_gluten_free?: boolean;
  views_count?: number;
  saves_count?: number;
  tags?: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  notes?: RecipeNote[];
  is_saved?: boolean;
  times_cooked?: number;
}

interface RecipeState {
  // State
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;

  // Actions
  setRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedCategory: (category: string) => void;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  // Initial state
  recipes: [],
  isLoading: false,
  error: null,
  selectedCategory: 'All',

  // Actions
  setRecipes: (recipes) => set({recipes}),

  addRecipe: (recipe) =>
    set((state) => ({recipes: [recipe, ...state.recipes]})),

  removeRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.filter((recipe) => recipe.public_id !== id),
    })),

  setLoading: (value) => set({isLoading: value}),
  setError: (error) => set({error}),
  setSelectedCategory: (category) => set({selectedCategory: category}),
}));
