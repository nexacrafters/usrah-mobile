/**
 * Calendar API Service
 * Handles family events and calendar management
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import type { CalendarEvent, PaginatedResponse } from '../../types/models';

interface CreateEventRequest {
  family_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  all_day?: boolean;
  location?: string;
  color?: string;
  reminder_minutes?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
}

interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  all_day?: boolean;
  location?: string;
  color?: string;
  reminder_minutes?: number;
}

interface EventFilters {
  family_id: string;
  start_date?: string;
  end_date?: string;
  page?: number;
}

/**
 * Calendar API Service
 */
export const calendarApi = {
  /**
   * Get events list
   */
  async getEvents(filters: EventFilters): Promise<PaginatedResponse<CalendarEvent>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return apiClient.get<PaginatedResponse<CalendarEvent>>(
      `${ENDPOINTS.calendar.events}?${params.toString()}`
    );
  },

  /**
   * Get events for a specific date range
   */
  async getEventsForMonth(familyId: string, year: number, month: number): Promise<CalendarEvent[]> {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const response = await this.getEvents({
      family_id: familyId,
      start_date: startDate,
      end_date: endDate,
    });

    return response.results;
  },

  /**
   * Get events for a specific date
   */
  async getEventsForDate(familyId: string, date: Date): Promise<CalendarEvent[]> {
    const dateStr = date.toISOString().split('T')[0];

    const response = await this.getEvents({
      family_id: familyId,
      start_date: dateStr,
      end_date: dateStr,
    });

    return response.results;
  },

  /**
   * Get single event
   */
  async getEvent(id: string): Promise<CalendarEvent> {
    return apiClient.get<CalendarEvent>(ENDPOINTS.calendar.eventDetail(id));
  },

  /**
   * Create event
   */
  async createEvent(data: CreateEventRequest): Promise<CalendarEvent> {
    return apiClient.post<CalendarEvent>(ENDPOINTS.calendar.events, data);
  },

  /**
   * Update event
   */
  async updateEvent(id: string, data: UpdateEventRequest): Promise<CalendarEvent> {
    return apiClient.patch<CalendarEvent>(ENDPOINTS.calendar.eventDetail(id), data);
  },

  /**
   * Delete event
   */
  async deleteEvent(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.calendar.eventDetail(id));
  },

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(familyId: string, days: number = 7): Promise<CalendarEvent[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const response = await this.getEvents({
      family_id: familyId,
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    return response.results;
  },

  /**
   * Get today's events
   */
  async getTodaysEvents(familyId: string): Promise<CalendarEvent[]> {
    return this.getEventsForDate(familyId, new Date());
  },
};
