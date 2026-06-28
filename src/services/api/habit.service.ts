/**
 * Habits API Service — everyday-life consistency tracker.
 * Maps to core/islamic habit endpoints. Habits are personal by default; pass a
 * family_id only when the user opts to share consistency with the family.
 *
 *   GET  /islamic/habits/                 -> Habit[] (with today's progress + streak)
 *   POST /islamic/habits/   {name, ...}
 *   POST /islamic/habits/<id>/log/  {count?}   (omit count = +1 increment)
 *   PATCH/DELETE /islamic/habits/<id>/
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

export type HabitCategory =
  | 'worship'
  | 'quran'
  | 'dhikr'
  | 'health'
  | 'fitness'
  | 'food'
  | 'learning'
  | 'other';

export interface Habit {
  public_id: string;
  name: string;
  icon: string;
  color: string;
  category: HabitCategory;
  target_count: number;
  unit: string;
  is_active: boolean;
  order: number;
  today_count?: number;
  completed_today?: boolean;
  streak?: number;
}

export interface CreateHabit {
  name: string;
  icon?: string;
  color?: string;
  category?: HabitCategory;
  target_count?: number;
  unit?: string;
  shareWithFamily?: boolean;
}

class HabitService {
  async list(): Promise<Habit[]> {
    try {
      const res = await apiClient.get('/islamic/habits/');
      return unwrapList<Habit>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async create(data: CreateHabit): Promise<Habit> {
    const {shareWithFamily, ...rest} = data;
    try {
      const res = await apiClient.post<Habit>('/islamic/habits/', {
        ...rest,
        family_id: shareWithFamily ? getCurrentFamilyId() : undefined,
      });
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Log progress: omit count to increment by one. */
  async log(id: string, count?: number): Promise<{count: number; completed: boolean; streak: number}> {
    try {
      const res = await apiClient.post(`/islamic/habits/${id}/log/`, {count});
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/islamic/habits/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new HabitService();
