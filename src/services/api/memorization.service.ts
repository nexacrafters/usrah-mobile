/**
 * Memorization (Hifz) API Service.
 * Maps to core/islamic memorization endpoints — track new memorization and a
 * spaced revision schedule (Quran, mutun, hadith...). Personal by default.
 *
 *   GET  /islamic/memorization/[?status=memorizing|memorized]  -> Memorization[]
 *   GET  /islamic/memorization/due/                            -> due today
 *   POST /islamic/memorization/   {type, title, reference, family_id?}
 *   POST /islamic/memorization/<id>/revise/  {quality}
 *   DELETE /islamic/memorization/<id>/
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

export type MemorizationType = 'quran' | 'matn' | 'hadith' | 'dua' | 'poem' | 'other';
export type RevisionQuality = 'again' | 'hard' | 'good' | 'easy';

export interface Memorization {
  public_id: string;
  type: MemorizationType;
  title: string;
  reference: string;
  status: 'memorizing' | 'memorized';
  next_revision: string | null;
  last_revised: string | null;
  strength: number;
  notes: string;
  is_due: boolean;
}

export interface CreateMemorization {
  type: MemorizationType;
  title: string;
  reference?: string;
  notes?: string;
  shareWithFamily?: boolean;
}

class MemorizationService {
  async list(status?: 'memorizing' | 'memorized'): Promise<Memorization[]> {
    try {
      const res = await apiClient.get('/islamic/memorization/', {
        params: status ? {status} : undefined,
      });
      return unwrapList<Memorization>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async due(): Promise<Memorization[]> {
    try {
      const res = await apiClient.get('/islamic/memorization/due/');
      return unwrapList<Memorization>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async create(data: CreateMemorization): Promise<Memorization> {
    const {shareWithFamily, ...rest} = data;
    try {
      const res = await apiClient.post<Memorization>('/islamic/memorization/', {
        ...rest,
        family_id: shareWithFamily ? getCurrentFamilyId() : undefined,
      });
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async revise(id: string, quality: RevisionQuality): Promise<Memorization> {
    try {
      const res = await apiClient.post<Memorization>(
        `/islamic/memorization/${id}/revise/`,
        {quality},
      );
      return res.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await apiClient.delete(`/islamic/memorization/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new MemorizationService();
