/**
 * Shopping List API Service
 * Maps to core/recipes shopping-list endpoints. The shared family grocery list
 * — husband & wife both add items, either checks them off at the store, both
 * see it. Item ids are `public_id` UUID strings.
 *
 * Routes (confirmed from core/recipes/urls.py + views.py + serializers.py):
 *   GET    /recipes/shopping-list/?family_id=<id>        -> ShoppingItem[] (paginated)
 *   POST   /recipes/shopping-list/   {family_id, name, quantity, notes}  -> ShoppingItem
 *   POST   /recipes/shopping-list/<id>/purchase/         -> ShoppingItem (marks purchased)
 *   PATCH  /recipes/shopping-list/<id>/  {is_purchased}  -> ShoppingItem (un-purchase)
 *   DELETE /recipes/shopping-list/<id>/                  -> 204
 *   POST   /recipes/shopping-list/clear-purchased/  {family_id}  -> {deleted_count}
 *
 * NOTE: The backend `purchase/` endpoint only marks an item purchased (it does
 * NOT toggle). To un-check an item we PATCH the detail endpoint with
 * is_purchased=false (+ purchased_by/purchased_at are read-only and cleared by
 * the model). `togglePurchased` chooses the correct call based on current state.
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

/** Minimal user shape returned by the API UserMiniSerializer. */
export interface UserMini {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

/** A single shopping list item (ShoppingListItemSerializer). */
export interface ShoppingItem {
  public_id: string;
  name: string;
  quantity: string;
  is_purchased: boolean;
  added_by: UserMini | null;
  purchased_by: UserMini | null;
  purchased_at: string | null;
  notes: string;
  from_recipe: string | null;
  recipe_title?: string | null;
  created: string;
}

export interface AddShoppingItemRequest {
  name: string;
  quantity?: string;
  notes?: string;
}

class ShoppingService {
  /** List items for the active family. Returns [] when no family is selected. */
  async listItems(): Promise<ShoppingItem[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/recipes/shopping-list/', {
        params: {family_id: familyId},
      });
      return unwrapList<ShoppingItem>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Add an item to the active family's shopping list. */
  async addItem(data: AddShoppingItemRequest): Promise<ShoppingItem> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const response = await apiClient.post<ShoppingItem>(
        '/recipes/shopping-list/',
        {
          family_id: familyId,
          name: data.name,
          quantity: data.quantity ?? '',
          notes: data.notes ?? '',
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Toggle an item's purchased state.
   * - Marking purchased uses the dedicated `purchase/` endpoint (also records
   *   who/when).
   * - Un-marking PATCHes the detail endpoint (the `purchase/` view only sets
   *   true).
   */
  async togglePurchased(
    itemId: string,
    isPurchased: boolean,
  ): Promise<ShoppingItem> {
    try {
      if (isPurchased) {
        const response = await apiClient.patch<ShoppingItem>(
          `/recipes/shopping-list/${itemId}/`,
          {is_purchased: false},
        );
        return response.data;
      }
      const response = await apiClient.post<ShoppingItem>(
        `/recipes/shopping-list/${itemId}/purchase/`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Delete an item from the shopping list. */
  async deleteItem(itemId: string): Promise<void> {
    try {
      await apiClient.delete(`/recipes/shopping-list/${itemId}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Remove all purchased items from the active family's list. */
  async clearPurchased(): Promise<{deleted_count: number}> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const response = await apiClient.post<{deleted_count: number}>(
        '/recipes/shopping-list/clear-purchased/',
        {family_id: familyId},
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new ShoppingService();
