/**
 * Pantry / Kitchen Supplies API Service
 * Maps to core/recipes pantry endpoints — the shared household inventory of
 * what's stocked in the kitchen, with quantities and a "running low" flag.
 *
 * Routes (core/recipes/urls.py):
 *   GET    /recipes/pantry/?family_id=<id>[&category=&low=true]  -> PantryItem[]
 *   POST   /recipes/pantry/   {family_id, name, quantity, category, notes, is_low}
 *   PATCH  /recipes/pantry/<id>/
 *   DELETE /recipes/pantry/<id>/
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

export type PantryCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'grains'
  | 'spices'
  | 'canned'
  | 'frozen'
  | 'bakery'
  | 'beverages'
  | 'cleaning'
  | 'other';

export interface PantryItem {
  public_id: string;
  name: string;
  quantity: string;
  category: PantryCategory;
  is_low: boolean;
  notes: string;
  created: string;
  updated: string;
}

export interface CreatePantryItem {
  name: string;
  quantity?: string;
  category?: PantryCategory;
  notes?: string;
  is_low?: boolean;
}

class PantryService {
  async list(params?: {category?: PantryCategory; low?: boolean}): Promise<PantryItem[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/recipes/pantry/', {
        params: {
          family_id: familyId,
          category: params?.category,
          low: params?.low ? 'true' : undefined,
        },
      });
      return unwrapList<PantryItem>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async create(data: CreatePantryItem): Promise<PantryItem> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const response = await apiClient.post<PantryItem>('/recipes/pantry/', {
        family_id: familyId,
        ...data,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async update(id: string, data: Partial<CreatePantryItem>): Promise<PantryItem> {
    try {
      const response = await apiClient.patch<PantryItem>(`/recipes/pantry/${id}/`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/recipes/pantry/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new PantryService();
