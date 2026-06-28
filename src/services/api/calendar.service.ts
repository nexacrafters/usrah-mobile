/**
 * Calendar API Service
 * Maps to core/calendar endpoints. Event ids are `id` (public_id hex UUID).
 *
 * Routes (confirmed from core/calendar/urls.py + views.py + serializers.py):
 *   GET    /calendar/events/?family_id=<id>[&start_date=&end_date=&event_type=]
 *            -> EventListSerializer[]  (paginated -> unwrapList)
 *   POST   /calendar/events/create/   {family_id, title, start_date, ...}
 *            -> EventDetailSerializer
 *   GET    /calendar/events/<id>/                      -> EventDetailSerializer
 *   PATCH  /calendar/events/<id>/   (partial update)   -> EventDetailSerializer
 *   DELETE /calendar/events/<id>/
 *   GET    /calendar/upcoming/?family_id=<id>[&days=7] -> EventListSerializer[]
 *   GET    /calendar/today/?family_id=<id>             -> EventDetailSerializer[]
 *   GET    /calendar/month/?family_id=<id>&year=&month=-> EventListSerializer[]
 *   GET    /calendar/categories/?family_id=<id>        -> EventCategorySerializer[]
 *
 * family_id is the family public_id, sourced from getCurrentFamilyId().
 * All list calls return [] when no family is selected.
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

/** Server event_type choices (also used as lightweight default categories). */
export type EventType =
  | 'general'
  | 'birthday'
  | 'anniversary'
  | 'islamic'
  | 'school'
  | 'medical'
  | 'travel'
  | 'work'
  | 'prayer'
  | 'ramadan'
  | 'eid';

/** Lightweight event shape from EventListSerializer (calendar list views). */
export interface CalendarEvent {
  id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  end_date: string | null;
  end_time: string | null;
  all_day: boolean;
  color: string; // hex
  event_type: EventType;
  is_recurring: boolean;
  is_system: boolean;
}

/** Full event shape from EventDetailSerializer (create / detail / today). */
export interface CalendarEventDetail extends CalendarEvent {
  family: string;
  created_by: {public_id: string; full_name: string; avatar?: string | null} | null;
  title_ar?: string;
  description?: string;
  category: string | null;
  category_name?: string | null;
  location?: string;
  reminder_minutes?: number | null;
  recurrence_rule?: string;
  hijri_date?: string;
  use_hijri?: boolean;
  attendees_count?: number;
  accepted_count?: number;
  created?: string;
  updated?: string;
}

/** Event category from EventCategorySerializer. */
export interface EventCategory {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  color: string;
  is_system: boolean;
  created?: string;
}

export interface ListEventsParams {
  start_date?: string;
  end_date?: string;
  event_type?: EventType;
}

export interface CreateEventRequest {
  title: string;
  start_date: string; // YYYY-MM-DD (required)
  title_ar?: string;
  description?: string;
  event_type?: EventType;
  category_id?: string | null;
  start_time?: string | null; // HH:MM or HH:MM:SS
  end_date?: string | null;
  end_time?: string | null;
  all_day?: boolean;
  location?: string;
  color?: string;
  reminder_minutes?: number | null;
}

class CalendarService {
  /** List events for the active family. Returns [] when no family is selected. */
  async listEvents(params?: ListEventsParams): Promise<CalendarEvent[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/calendar/events/', {
        params: {family_id: familyId, ...params},
      });
      return unwrapList<CalendarEvent>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Upcoming events for the active family (next `days`, default 7 server-side). */
  async upcoming(days?: number): Promise<CalendarEvent[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/calendar/upcoming/', {
        params: {family_id: familyId, ...(days ? {days} : {})},
      });
      return unwrapList<CalendarEvent>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Events occurring today for the active family (full detail serializer). */
  async today(): Promise<CalendarEventDetail[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/calendar/today/', {
        params: {family_id: familyId},
      });
      return unwrapList<CalendarEventDetail>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Events for a given month (defaults to current month server-side). */
  async month(year?: number, monthNum?: number): Promise<CalendarEvent[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/calendar/month/', {
        params: {
          family_id: familyId,
          ...(year ? {year} : {}),
          ...(monthNum ? {month: monthNum} : {}),
        },
      });
      return unwrapList<CalendarEvent>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Create an event in the active family. Returns the full event detail. */
  async createEvent(data: CreateEventRequest): Promise<CalendarEventDetail> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const response = await apiClient.post<CalendarEventDetail>(
        '/calendar/events/create/',
        {family_id: familyId, ...data},
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Get a single event with full detail. */
  async getEvent(eventId: string): Promise<CalendarEventDetail> {
    try {
      const response = await apiClient.get<CalendarEventDetail>(
        `/calendar/events/${eventId}/`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Partially update an event. */
  async updateEvent(
    eventId: string,
    data: Partial<CreateEventRequest>,
  ): Promise<CalendarEventDetail> {
    try {
      const response = await apiClient.patch<CalendarEventDetail>(
        `/calendar/events/${eventId}/`,
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Delete an event. */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await apiClient.delete(`/calendar/events/${eventId}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** List event categories available to the active family (+ system ones). */
  async listCategories(): Promise<EventCategory[]> {
    const familyId = getCurrentFamilyId();
    try {
      const response = await apiClient.get('/calendar/categories/', {
        params: familyId ? {family_id: familyId} : undefined,
      });
      return unwrapList<EventCategory>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new CalendarService();
