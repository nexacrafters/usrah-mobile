/**
 * Goals API Service (REMOTE / online)
 *
 * Family savings goals the whole family contributes toward (Hajj, a car, a
 * home...). Unlike the offline-first finance vertical, goals talk DIRECTLY to
 * the API via `apiClient` (auth token auto-attached) — there is no local mirror.
 *
 * Backend (core/goals):
 *   GET  /goals/?family_id=<id>            list goals for the active family
 *   POST /goals/create/                    create a goal
 *   GET  /goals/<goal_id>/                 goal detail (+ contributions/milestones)
 *   POST /goals/<goal_id>/contributions/   add a contribution {amount, note?}
 *   POST /goals/<goal_id>/pause/           pause an active goal
 *   POST /goals/<goal_id>/resume/          resume a paused goal
 *   GET  /goals/categories/                available category {value,label} list
 *
 * `id` is the goal's public UUID (with dashes); it is what the detail / action
 * routes expect. Money fields come back as decimal STRINGS.
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

/** Default currency for the app (Tunisian Dinar). */
export const DEFAULT_CURRENCY = 'TND';

/** Thrown by mutating methods when there is no active family context. */
const NO_FAMILY_MESSAGE = 'Please create or select a family first.';

export type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export type GoalCategory =
  | 'hajj'
  | 'emergency'
  | 'education'
  | 'home'
  | 'vehicle'
  | 'travel'
  | 'wedding'
  | 'charity'
  | 'other';

/** Minimal user shape returned by UserMiniSerializer. */
export interface GoalUser {
  public_id?: string;
  full_name?: string;
  avatar?: string | null;
}

/** A goal as returned by the list endpoint (GoalListSerializer). */
export interface Goal {
  id: string;
  family: string;
  created_by: GoalUser | null;
  title: string;
  description?: string;
  category: GoalCategory | string;
  target_amount: string;
  current_amount: string;
  currency: string;
  deadline: string | null;
  status: GoalStatus;
  color: string;
  icon: string;
  progress_percentage: number;
  remaining_amount: string;
  created: string;
  updated: string;
}

/** A single contribution (GoalContributionSerializer). */
export interface GoalContribution {
  id: string;
  user: GoalUser | null;
  amount: string;
  note?: string;
  created: string;
}

/** A milestone (GoalMilestoneSerializer). */
export interface GoalMilestone {
  id: string;
  title: string;
  amount: string;
  is_reached: boolean;
  reached_at: string | null;
  created: string;
}

/** Full goal detail (GoalDetailSerializer extends the list shape). */
export interface GoalDetail extends Goal {
  contributions: GoalContribution[];
  milestones: GoalMilestone[];
  contributors_count: number;
  total_contributions: number;
}

/** A selectable category option (GoalCategoriesView). */
export interface GoalCategoryOption {
  value: string;
  label: string;
}

/**
 * Create payload (GoalCreateSerializer). `family_id` is injected from the
 * active family by the service; callers supply the rest. `target_amount` must
 * be > 0; `deadline` is 'YYYY-MM-DD'.
 */
export interface CreateGoalRequest {
  title: string;
  target_amount: number | string;
  deadline?: string | null;
  description?: string;
  category?: GoalCategory | string;
  currency?: string;
  color?: string;
  icon?: string;
}

class GoalsService {
  /** List goals for the active family. Returns [] when there is no family. */
  async listGoals(): Promise<Goal[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) return [];
    try {
      const response = await apiClient.get('/goals/', {
        params: {family_id: familyId},
      });
      return unwrapList<Goal>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Create a goal against the active family. Returns the created goal detail. */
  async createGoal(data: CreateGoalRequest): Promise<GoalDetail> {
    const familyId = getCurrentFamilyId();
    if (!familyId) throw new Error(NO_FAMILY_MESSAGE);
    try {
      const response = await apiClient.post<GoalDetail>('/goals/create/', {
        family_id: familyId,
        currency: DEFAULT_CURRENCY,
        ...data,
        // Omit a blank deadline so DRF treats it as null, not an invalid date.
        deadline: data.deadline?.trim() ? data.deadline.trim() : undefined,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Fetch a single goal with its contributions + milestones. */
  async getGoal(id: string): Promise<GoalDetail> {
    try {
      const response = await apiClient.get<GoalDetail>(`/goals/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Add a contribution to an ACTIVE goal. Returns the created contribution. */
  async contribute(
    goalId: string,
    amount: number | string,
    note?: string,
  ): Promise<GoalContribution> {
    try {
      const response = await apiClient.post<GoalContribution>(
        `/goals/${goalId}/contributions/`,
        {amount, ...(note && note.trim() ? {note: note.trim()} : {})},
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Pause an active goal. Returns the updated goal detail. */
  async pauseGoal(id: string): Promise<GoalDetail> {
    try {
      const response = await apiClient.post<GoalDetail>(`/goals/${id}/pause/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Resume a paused goal. Returns the updated goal detail. */
  async resumeGoal(id: string): Promise<GoalDetail> {
    try {
      const response = await apiClient.post<GoalDetail>(`/goals/${id}/resume/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** List the available goal categories. Returns [] on failure. */
  async listCategories(): Promise<GoalCategoryOption[]> {
    try {
      const response = await apiClient.get('/goals/categories/');
      return unwrapList<GoalCategoryOption>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new GoalsService();
