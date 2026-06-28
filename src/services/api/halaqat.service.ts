/**
 * Halaqat (study circles) API Service
 * Maps to core/halaqat endpoints. All ids are `public_id` UUID strings.
 *
 * Routes (confirmed from core/halaqat/urls.py + views.py + serializers.py):
 *   GET    /halaqat/?category=&level=&is_online=&search=  -> Halaqa[] (paginated or array)
 *   GET    /halaqat/<id>/                                 -> HalaqaDetail (sessions, reviews)
 *   POST   /halaqat/<id>/enroll/                          -> HalaqaEnrollment (201)
 *   POST   /halaqat/<id>/unenroll/  {reason?}             -> {message}
 */

import apiClient, {handleApiError, unwrapList} from './client';

export interface HalaqaInstructor {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

export interface Halaqa {
  id: string;
  title: string;
  title_ar?: string;
  description?: string;
  instructor?: HalaqaInstructor | null;
  schedule?: string;
  duration_minutes?: number;
  max_students?: number;
  enrolled_count?: number;
  is_full?: boolean;
  is_online?: boolean;
  category?: string;
  level?: string;
  is_active?: boolean;
  average_rating?: number;
  thumbnail?: string | null;
  start_date?: string | null;
  created?: string;
}

export interface HalaqaSession {
  id: string;
  session_number?: number;
  date?: string;
  time?: string;
  duration?: number;
  topic?: string;
  topic_ar?: string;
  description?: string;
  recording_url?: string | null;
  notes?: string;
  is_cancelled?: boolean;
  cancellation_reason?: string;
  created?: string;
}

export interface HalaqaReview {
  id: string;
  user?: HalaqaInstructor | null;
  rating?: number;
  comment?: string;
  created?: string;
}

export interface HalaqaDetail extends Halaqa {
  description_ar?: string;
  meeting_link?: string | null;
  location?: string;
  duration_weeks?: number;
  sessions?: HalaqaSession[];
  reviews?: HalaqaReview[];
}

export interface HalaqaEnrollment {
  id: string;
  halaqa: string;
  halaqa_title?: string;
  status?: string;
  enrolled_at?: string | null;
  completed_at?: string | null;
  created?: string;
}

export interface ListHalaqatParams {
  category?: string;
  level?: string;
  is_online?: boolean;
  search?: string;
}

class HalaqatService {
  /** List available study circles. */
  async listHalaqat(params?: ListHalaqatParams): Promise<Halaqa[]> {
    try {
      const response = await apiClient.get('/halaqat/', {params});
      return unwrapList<Halaqa>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Full halaqa detail (sessions + reviews). */
  async getHalaqa(id: string): Promise<HalaqaDetail> {
    try {
      const response = await apiClient.get<HalaqaDetail>(`/halaqat/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Enroll (join) the current user in a study circle. */
  async join(id: string): Promise<HalaqaEnrollment> {
    try {
      const response = await apiClient.post<HalaqaEnrollment>(
        `/halaqat/${id}/enroll/`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Leave a study circle the user has joined. */
  async leave(id: string, reason?: string): Promise<{message: string}> {
    try {
      const response = await apiClient.post<{message: string}>(
        `/halaqat/${id}/unenroll/`,
        {reason: reason ?? ''},
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new HalaqatService();
