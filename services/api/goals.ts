/**
 * Family Goals API Service
 * Handles family savings goals, progress tracking
 */
import { apiClient } from './client';
import { PaginatedResponse } from './config';

// Types
export interface FamilyGoal {
  id: string;
  public_id: string;
  family: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  category: GoalCategory;
  deadline?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  contributors: GoalContributor[];
  milestones: GoalMilestone[];
  created_by: {
    id: string;
    full_name: string;
  };
  created: string;
  updated: string;
}

export type GoalCategory =
  | 'hajj'
  | 'umrah'
  | 'education'
  | 'home'
  | 'car'
  | 'emergency'
  | 'wedding'
  | 'charity'
  | 'other';

export interface GoalContributor {
  user_id: string;
  full_name: string;
  total_contributed: number;
  last_contribution?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  amount: number;
  reached_at?: string;
}

export interface GoalContribution {
  id: string;
  goal: string;
  user: {
    id: string;
    full_name: string;
  };
  amount: number;
  note?: string;
  created: string;
}

// Request interfaces
interface CreateGoalRequest {
  family_id: string;
  title: string;
  description?: string;
  target_amount: number;
  currency?: string;
  category: GoalCategory;
  deadline?: string;
}

interface ContributeRequest {
  amount: number;
  note?: string;
}

/**
 * Family Goals API Service
 */
export const goalsApi = {
  // ==================== Goals ====================

  /**
   * Get family goals
   */
  async getGoals(
    familyId: string,
    status?: 'active' | 'completed' | 'all'
  ): Promise<FamilyGoal[]> {
    const params = new URLSearchParams({ family_id: familyId });
    if (status && status !== 'all') params.append('status', status);
    const response = await apiClient.get<{ results: FamilyGoal[] }>(
      `/goals/?${params.toString()}`
    );
    return response.results;
  },

  /**
   * Get single goal
   */
  async getGoal(id: string): Promise<FamilyGoal> {
    return apiClient.get<FamilyGoal>(`/goals/${id}/`);
  },

  /**
   * Create goal
   */
  async createGoal(data: CreateGoalRequest): Promise<FamilyGoal> {
    return apiClient.post<FamilyGoal>('/goals/', data);
  },

  /**
   * Update goal
   */
  async updateGoal(id: string, data: Partial<CreateGoalRequest>): Promise<FamilyGoal> {
    return apiClient.patch<FamilyGoal>(`/goals/${id}/`, data);
  },

  /**
   * Delete goal
   */
  async deleteGoal(id: string): Promise<void> {
    return apiClient.delete(`/goals/${id}/`);
  },

  /**
   * Pause goal
   */
  async pauseGoal(id: string): Promise<FamilyGoal> {
    return apiClient.post<FamilyGoal>(`/goals/${id}/pause/`, {});
  },

  /**
   * Resume goal
   */
  async resumeGoal(id: string): Promise<FamilyGoal> {
    return apiClient.post<FamilyGoal>(`/goals/${id}/resume/`, {});
  },

  // ==================== Contributions ====================

  /**
   * Get goal contributions
   */
  async getContributions(goalId: string): Promise<GoalContribution[]> {
    const response = await apiClient.get<{ results: GoalContribution[] }>(
      `/goals/${goalId}/contributions/`
    );
    return response.results;
  },

  /**
   * Add contribution
   */
  async contribute(goalId: string, data: ContributeRequest): Promise<GoalContribution> {
    return apiClient.post<GoalContribution>(
      `/goals/${goalId}/contributions/`,
      data
    );
  },

  // ==================== Milestones ====================

  /**
   * Add milestone
   */
  async addMilestone(goalId: string, title: string, amount: number): Promise<GoalMilestone> {
    return apiClient.post<GoalMilestone>(`/goals/${goalId}/milestones/`, {
      title,
      amount,
    });
  },

  // ==================== Helpers ====================

  /**
   * Calculate progress percentage
   */
  calculateProgress(goal: FamilyGoal): number {
    if (goal.target_amount <= 0) return 0;
    return Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  },

  /**
   * Get category display info
   */
  getCategoryInfo(category: GoalCategory): { label: string; labelAr: string; icon: string; color: string } {
    const categories: Record<GoalCategory, { label: string; labelAr: string; icon: string; color: string }> = {
      hajj: { label: 'Hajj', labelAr: 'الحج', icon: 'mosque', color: '#10b981' },
      umrah: { label: 'Umrah', labelAr: 'العمرة', icon: 'mosque', color: '#06b6d4' },
      education: { label: 'Education', labelAr: 'التعليم', icon: 'book', color: '#8b5cf6' },
      home: { label: 'Home', labelAr: 'المنزل', icon: 'home', color: '#f59e0b' },
      car: { label: 'Car', labelAr: 'سيارة', icon: 'car', color: '#3b82f6' },
      emergency: { label: 'Emergency', labelAr: 'طوارئ', icon: 'alert', color: '#ef4444' },
      wedding: { label: 'Wedding', labelAr: 'زواج', icon: 'heart', color: '#ec4899' },
      charity: { label: 'Charity', labelAr: 'صدقة', icon: 'gift', color: '#14b8a6' },
      other: { label: 'Other', labelAr: 'أخرى', icon: 'target', color: '#6b7280' },
    };
    return categories[category] || categories.other;
  },
};
