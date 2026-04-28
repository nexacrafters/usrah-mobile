/**
 * Village Network API Service
 * Handles neighbors, announcements, and shared items
 */
import { apiClient } from './client';
import { ENDPOINTS, PaginatedResponse } from './config';

// Types
export interface Neighbor {
  id: string;
  family_id: string;
  family_name: string;
  distance?: string;
  distance_km?: number;
  member_count: number;
  is_online: boolean;
  is_verified: boolean;
  trust_score: number;
  joined_at: string;
}

export interface Announcement {
  id: string;
  family_id: string;
  family_name: string;
  title: string;
  content: string;
  type: 'event' | 'help' | 'recipe' | 'general' | 'alert';
  category: 'general' | 'event' | 'help' | 'alert';
  is_urgent: boolean;
  event_date?: string;
  created: string;
  expires_at?: string;
}

export interface SharedItem {
  id: string;
  family_id: string;
  family_name: string;
  name: string;
  title: string;
  owner_name: string;
  description?: string;
  category: 'tool' | 'book' | 'food' | 'clothing' | 'other';
  status: 'available' | 'borrowed' | 'unavailable';
  image_url?: string;
  created: string;
}

export interface VillageHelper {
  id: string;
  name: string;
  phone?: string;
  skill: string;
  specialty: string;
  is_available: boolean;
  distance_km?: number;
  rating?: number;
}

// Request interfaces
interface CreateAnnouncementRequest {
  title: string;
  content: string;
  category: 'general' | 'event' | 'help' | 'alert';
  expires_at?: string;
}

interface CreateSharedItemRequest {
  title: string;
  description?: string;
  category: 'tool' | 'book' | 'food' | 'clothing' | 'other';
  image_url?: string;
}

/**
 * Village Network API Service
 */
export const villageApi = {
  // ==================== Neighbors ====================

  /**
   * Get nearby families
   */
  async getNeighbors(limit: number = 20): Promise<Neighbor[]> {
    const response = await apiClient.get<{ results: Neighbor[] }>(
      `/village/neighbors/?limit=${limit}`
    );
    return response.results;
  },

  /**
   * Connect with a neighbor
   */
  async connectWithNeighbor(familyId: string): Promise<void> {
    return apiClient.post('/village/neighbors/connect/', { family_id: familyId });
  },

  // ==================== Announcements ====================

  /**
   * Get village announcements
   */
  async getAnnouncements(page: number = 1): Promise<PaginatedResponse<Announcement>> {
    return apiClient.get<PaginatedResponse<Announcement>>(
      `/village/announcements/?page=${page}`
    );
  },

  /**
   * Create announcement
   */
  async createAnnouncement(data: CreateAnnouncementRequest): Promise<Announcement> {
    return apiClient.post<Announcement>('/village/announcements/', data);
  },

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id: string): Promise<void> {
    return apiClient.delete(`/village/announcements/${id}/`);
  },

  // ==================== Shared Items ====================

  /**
   * Get shared items
   */
  async getSharedItems(
    category?: string,
    page: number = 1
  ): Promise<PaginatedResponse<SharedItem>> {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.append('category', category);
    return apiClient.get<PaginatedResponse<SharedItem>>(
      `/village/items/?${params.toString()}`
    );
  },

  /**
   * Create shared item
   */
  async createSharedItem(data: CreateSharedItemRequest): Promise<SharedItem> {
    return apiClient.post<SharedItem>('/village/items/', data);
  },

  /**
   * Request to borrow item
   */
  async requestItem(itemId: string, message?: string): Promise<void> {
    return apiClient.post(`/village/items/${itemId}/request/`, { message });
  },

  /**
   * Update item status
   */
  async updateItemStatus(
    itemId: string,
    status: 'available' | 'borrowed' | 'unavailable'
  ): Promise<SharedItem> {
    return apiClient.patch<SharedItem>(`/village/items/${itemId}/`, { status });
  },

  /**
   * Delete shared item
   */
  async deleteSharedItem(id: string): Promise<void> {
    return apiClient.delete(`/village/items/${id}/`);
  },

  // ==================== Village Helpers ====================

  /**
   * Get village helpers (emergency contacts)
   */
  async getVillageHelpers(): Promise<VillageHelper[]> {
    const response = await apiClient.get<{ results: VillageHelper[] }>(
      '/village/helpers/'
    );
    return response.results;
  },

  // ==================== Emergency Alerts ====================

  /**
   * Send emergency alert to all neighbors
   */
  async sendAlert(
    type: 'medical' | 'fire' | 'security' | 'baby' | 'car' | 'utility',
    message: string
  ): Promise<void> {
    return apiClient.post('/village/alerts/', { type, message });
  },
};
