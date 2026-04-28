/**
 * Halaqat (Islamic Study Circles) API Service
 * Handles study circles, sessions, and enrollment
 */
import { apiClient } from './client';
import { PaginatedResponse } from './config';

// Types
export interface Halaqa {
  id: string;
  public_id: string;
  title: string;
  description?: string;
  teacher: {
    id: string;
    full_name: string;
    avatar?: string;
  };
  category: HalaqaCategory;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: 'arabic' | 'english' | 'both';
  schedule: HalaqaSchedule;
  max_students: number;
  enrolled_count: number;
  is_enrolled: boolean;
  is_online: boolean;
  meeting_link?: string;
  location?: string;
  status: 'active' | 'upcoming' | 'completed' | 'paused';
  rating?: number;
  reviews_count: number;
  created: string;
}

export type HalaqaCategory =
  | 'quran'
  | 'tajweed'
  | 'tafsir'
  | 'hadith'
  | 'fiqh'
  | 'seerah'
  | 'arabic'
  | 'children'
  | 'women'
  | 'general';

export interface HalaqaSchedule {
  days: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[];
  time: string; // HH:MM format
  duration_minutes: number;
  timezone: string;
}

export interface HalaqaSession {
  id: string;
  halaqa: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  recording_url?: string;
  notes?: string;
  attendance_count: number;
}

export interface HalaqaEnrollment {
  id: string;
  halaqa: string;
  user: {
    id: string;
    full_name: string;
  };
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  enrolled_at: string;
  completed_at?: string;
}

export interface HalaqaReview {
  id: string;
  user: {
    id: string;
    full_name: string;
  };
  rating: number;
  comment?: string;
  created: string;
}

// Request interfaces
interface CreateHalaqaRequest {
  title: string;
  description?: string;
  category: HalaqaCategory;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: 'arabic' | 'english' | 'both';
  schedule: HalaqaSchedule;
  max_students?: number;
  is_online: boolean;
  meeting_link?: string;
  location?: string;
}

interface HalaqaFilters {
  category?: HalaqaCategory;
  level?: 'beginner' | 'intermediate' | 'advanced';
  language?: 'arabic' | 'english' | 'both';
  is_online?: boolean;
  status?: 'active' | 'upcoming';
  page?: number;
}

/**
 * Halaqat API Service
 */
export const halaqatApi = {
  // ==================== Halaqat (Study Circles) ====================

  /**
   * Get halaqat list
   */
  async getHalaqat(filters?: HalaqaFilters): Promise<PaginatedResponse<Halaqa>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    return apiClient.get<PaginatedResponse<Halaqa>>(
      `/halaqat/?${params.toString()}`
    );
  },

  /**
   * Get single halaqa
   */
  async getHalaqa(id: string): Promise<Halaqa> {
    return apiClient.get<Halaqa>(`/halaqat/${id}/`);
  },

  /**
   * Create halaqa (for teachers)
   */
  async createHalaqa(data: CreateHalaqaRequest): Promise<Halaqa> {
    return apiClient.post<Halaqa>('/halaqat/', data);
  },

  /**
   * Update halaqa
   */
  async updateHalaqa(id: string, data: Partial<CreateHalaqaRequest>): Promise<Halaqa> {
    return apiClient.patch<Halaqa>(`/halaqat/${id}/`, data);
  },

  /**
   * Delete halaqa
   */
  async deleteHalaqa(id: string): Promise<void> {
    return apiClient.delete(`/halaqat/${id}/`);
  },

  // ==================== Enrollment ====================

  /**
   * Enroll in halaqa
   */
  async enroll(halaqaId: string): Promise<HalaqaEnrollment> {
    return apiClient.post<HalaqaEnrollment>(`/halaqat/${halaqaId}/enroll/`, {});
  },

  /**
   * Unenroll from halaqa
   */
  async unenroll(halaqaId: string): Promise<void> {
    return apiClient.post(`/halaqat/${halaqaId}/unenroll/`, {});
  },

  /**
   * Get my enrollments
   */
  async getMyEnrollments(): Promise<HalaqaEnrollment[]> {
    const response = await apiClient.get<{ results: HalaqaEnrollment[] }>(
      '/halaqat/my-enrollments/'
    );
    return response.results;
  },

  /**
   * Get enrolled students (for teachers)
   */
  async getEnrolledStudents(halaqaId: string): Promise<HalaqaEnrollment[]> {
    const response = await apiClient.get<{ results: HalaqaEnrollment[] }>(
      `/halaqat/${halaqaId}/students/`
    );
    return response.results;
  },

  // ==================== Sessions ====================

  /**
   * Get halaqa sessions
   */
  async getSessions(halaqaId: string): Promise<HalaqaSession[]> {
    const response = await apiClient.get<{ results: HalaqaSession[] }>(
      `/halaqat/${halaqaId}/sessions/`
    );
    return response.results;
  },

  /**
   * Get upcoming sessions across all enrolled halaqat
   */
  async getUpcomingSessions(): Promise<HalaqaSession[]> {
    const response = await apiClient.get<{ results: HalaqaSession[] }>(
      '/halaqat/upcoming-sessions/'
    );
    return response.results;
  },

  /**
   * Mark attendance
   */
  async markAttendance(sessionId: string): Promise<void> {
    return apiClient.post(`/halaqat/sessions/${sessionId}/attend/`, {});
  },

  // ==================== Reviews ====================

  /**
   * Get halaqa reviews
   */
  async getReviews(halaqaId: string): Promise<HalaqaReview[]> {
    const response = await apiClient.get<{ results: HalaqaReview[] }>(
      `/halaqat/${halaqaId}/reviews/`
    );
    return response.results;
  },

  /**
   * Add review
   */
  async addReview(
    halaqaId: string,
    rating: number,
    comment?: string
  ): Promise<HalaqaReview> {
    return apiClient.post<HalaqaReview>(`/halaqat/${halaqaId}/reviews/`, {
      rating,
      comment,
    });
  },

  // ==================== Helpers ====================

  /**
   * Get category display info
   */
  getCategoryInfo(category: HalaqaCategory): { label: string; labelAr: string; icon: string; color: string } {
    const categories: Record<HalaqaCategory, { label: string; labelAr: string; icon: string; color: string }> = {
      quran: { label: 'Quran', labelAr: 'القرآن', icon: 'book', color: '#10b981' },
      tajweed: { label: 'Tajweed', labelAr: 'التجويد', icon: 'music', color: '#06b6d4' },
      tafsir: { label: 'Tafsir', labelAr: 'التفسير', icon: 'book-open', color: '#8b5cf6' },
      hadith: { label: 'Hadith', labelAr: 'الحديث', icon: 'scroll', color: '#f59e0b' },
      fiqh: { label: 'Fiqh', labelAr: 'الفقه', icon: 'scale', color: '#3b82f6' },
      seerah: { label: 'Seerah', labelAr: 'السيرة', icon: 'user', color: '#ec4899' },
      arabic: { label: 'Arabic', labelAr: 'العربية', icon: 'type', color: '#14b8a6' },
      children: { label: 'Children', labelAr: 'الأطفال', icon: 'baby', color: '#f472b6' },
      women: { label: 'Women', labelAr: 'النساء', icon: 'heart', color: '#a855f7' },
      general: { label: 'General', labelAr: 'عام', icon: 'star', color: '#6b7280' },
    };
    return categories[category] || categories.general;
  },

  /**
   * Get level display info
   */
  getLevelInfo(level: 'beginner' | 'intermediate' | 'advanced'): { label: string; labelAr: string; color: string } {
    const levels = {
      beginner: { label: 'Beginner', labelAr: 'مبتدئ', color: '#22c55e' },
      intermediate: { label: 'Intermediate', labelAr: 'متوسط', color: '#f59e0b' },
      advanced: { label: 'Advanced', labelAr: 'متقدم', color: '#ef4444' },
    };
    return levels[level];
  },

  /**
   * Format schedule display
   */
  formatSchedule(schedule: HalaqaSchedule, isRTL: boolean = false): string {
    const dayNames: Record<string, { en: string; ar: string }> = {
      sunday: { en: 'Sun', ar: 'أحد' },
      monday: { en: 'Mon', ar: 'إثنين' },
      tuesday: { en: 'Tue', ar: 'ثلاثاء' },
      wednesday: { en: 'Wed', ar: 'أربعاء' },
      thursday: { en: 'Thu', ar: 'خميس' },
      friday: { en: 'Fri', ar: 'جمعة' },
      saturday: { en: 'Sat', ar: 'سبت' },
    };

    const days = schedule.days
      .map((d) => (isRTL ? dayNames[d].ar : dayNames[d].en))
      .join(', ');

    return `${days} @ ${schedule.time}`;
  },
};
