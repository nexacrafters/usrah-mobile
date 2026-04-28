/**
 * Calendar Query Hooks
 * React Query hooks for calendar events
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../../services/api/calendar';
import { queryKeys, invalidateQueries } from '../../services/queryClient';
import { DEMO_MODE, DEMO_EVENTS } from '../../services/demoMode';
import type { CalendarEvent } from '../../types/models';

// Mutable demo events
let demoEventsData = [...DEMO_EVENTS];

/**
 * Get events for a month
 */
export function useMonthEvents(familyId: string, year: number, month: number) {
  return useQuery({
    queryKey: [...queryKeys.calendar.all, 'month', familyId, year, month],
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoEventsData.filter(e => {
          const eventDate = new Date(e.start);
          return eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month;
        });
      }
      return calendarApi.getEventsForMonth(familyId, year, month);
    },
    enabled: !!familyId,
  });
}

/**
 * Get events for a specific date
 */
export function useDateEvents(familyId: string, date: Date) {
  const dateStr = date.toISOString().split('T')[0];

  return useQuery({
    queryKey: [...queryKeys.calendar.all, 'date', familyId, dateStr],
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoEventsData.filter(e => {
          const eventDate = e.start.split('T')[0];
          return eventDate === dateStr;
        });
      }
      return calendarApi.getEventsForDate(familyId, date);
    },
    enabled: !!familyId,
  });
}

/**
 * Get single event
 */
export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.calendar.detail(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoEventsData.find(e => e.id === id) || null;
      }
      return calendarApi.getEvent(id);
    },
    enabled: !!id,
  });
}

/**
 * Get upcoming events
 */
export function useUpcomingEvents(familyId: string, days: number = 7) {
  return useQuery({
    queryKey: [...queryKeys.calendar.all, 'upcoming', familyId, days],
    queryFn: async () => {
      if (DEMO_MODE) {
        const today = new Date();
        const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        return demoEventsData.filter(e => {
          const eventDate = new Date(e.start);
          return eventDate >= today && eventDate <= futureDate;
        });
      }
      return calendarApi.getUpcomingEvents(familyId, days);
    },
    enabled: !!familyId,
  });
}

/**
 * Get today's events
 */
export function useTodaysEvents(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.calendar.all, 'today', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        const today = new Date().toISOString().split('T')[0];
        return demoEventsData.filter(e => e.start.split('T')[0] === today);
      }
      return calendarApi.getTodaysEvents(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Create event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
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
    }) => {
      if (DEMO_MODE) {
        const newEvent = {
          id: `demo-event-${Date.now()}`,
          title: data.title,
          start: data.start_date,
          end: data.end_date || data.start_date,
          color: data.color || '#4CAF50',
          all_day: data.all_day || false,
          description: data.description,
          location: data.location,
        };
        demoEventsData.push(newEvent as any);
        return newEvent;
      }
      return calendarApi.createEvent(data);
    },
    onSuccess: () => {
      invalidateQueries.calendar();
    },
  });
}

/**
 * Update event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CalendarEvent> }) => {
      if (DEMO_MODE) {
        const index = demoEventsData.findIndex(e => e.id === id);
        if (index !== -1) {
          demoEventsData[index] = { ...demoEventsData[index], ...data } as any;
          return demoEventsData[index];
        }
        return null;
      }
      return calendarApi.updateEvent(id, data);
    },
    onSuccess: (event: any) => {
      if (event) {
        queryClient.setQueryData(queryKeys.calendar.detail(event.id), event);
        invalidateQueries.calendar();
      }
    },
  });
}

/**
 * Delete event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        const index = demoEventsData.findIndex(e => e.id === id);
        if (index !== -1) {
          demoEventsData.splice(index, 1);
        }
        return { success: true };
      }
      return calendarApi.deleteEvent(id);
    },
    onSuccess: () => {
      invalidateQueries.calendar();
    },
  });
}
