/**
 * Halaqat (Study Circles) Query Hooks
 * React Query hooks for halaqat features
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { halaqatApi, Halaqa, HalaqaCategory, HalaqaSession, HalaqaEnrollment } from '../../services/api/halaqat';

const halaqatKeys = {
  all: ['halaqat'] as const,
  lists: () => [...halaqatKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...halaqatKeys.lists(), filters] as const,
  detail: (id: string) => [...halaqatKeys.all, 'detail', id] as const,
  sessions: (halaqaId: string) => [...halaqatKeys.all, 'sessions', halaqaId] as const,
  upcomingSessions: () => [...halaqatKeys.all, 'upcoming-sessions'] as const,
  myEnrollments: () => [...halaqatKeys.all, 'my-enrollments'] as const,
  students: (halaqaId: string) => [...halaqatKeys.all, 'students', halaqaId] as const,
  reviews: (halaqaId: string) => [...halaqatKeys.all, 'reviews', halaqaId] as const,
};

/**
 * Get halaqat list with pagination
 */
export function useHalaqat(filters?: {
  category?: HalaqaCategory;
  level?: 'beginner' | 'intermediate' | 'advanced';
  language?: 'arabic' | 'english' | 'both';
  is_online?: boolean;
  status?: 'active' | 'upcoming';
}) {
  return useInfiniteQuery({
    queryKey: halaqatKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      halaqatApi.getHalaqat({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Get single halaqa
 */
export function useHalaqa(id: string) {
  return useQuery({
    queryKey: halaqatKeys.detail(id),
    queryFn: () => halaqatApi.getHalaqa(id),
    enabled: !!id,
  });
}

/**
 * Create halaqa (for teachers)
 */
export function useCreateHalaqa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: halaqatApi.createHalaqa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: halaqatKeys.lists() });
    },
  });
}

/**
 * Update halaqa
 */
export function useUpdateHalaqa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Parameters<typeof halaqatApi.createHalaqa>[0]> }) =>
      halaqatApi.updateHalaqa(id, data),
    onSuccess: (halaqa) => {
      queryClient.setQueryData(halaqatKeys.detail(halaqa.id), halaqa);
      queryClient.invalidateQueries({ queryKey: halaqatKeys.lists() });
    },
  });
}

/**
 * Delete halaqa
 */
export function useDeleteHalaqa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => halaqatApi.deleteHalaqa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: halaqatKeys.lists() });
    },
  });
}

/**
 * Enroll in halaqa
 */
export function useEnrollInHalaqa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (halaqaId: string) => halaqatApi.enroll(halaqaId),
    onSuccess: (_, halaqaId) => {
      queryClient.invalidateQueries({ queryKey: halaqatKeys.detail(halaqaId) });
      queryClient.invalidateQueries({ queryKey: halaqatKeys.myEnrollments() });
      queryClient.invalidateQueries({ queryKey: halaqatKeys.lists() });
    },
  });
}

/**
 * Unenroll from halaqa
 */
export function useUnenrollFromHalaqa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (halaqaId: string) => halaqatApi.unenroll(halaqaId),
    onSuccess: (_, halaqaId) => {
      queryClient.invalidateQueries({ queryKey: halaqatKeys.detail(halaqaId) });
      queryClient.invalidateQueries({ queryKey: halaqatKeys.myEnrollments() });
      queryClient.invalidateQueries({ queryKey: halaqatKeys.lists() });
    },
  });
}

/**
 * Get my enrollments
 */
export function useMyEnrollments() {
  return useQuery({
    queryKey: halaqatKeys.myEnrollments(),
    queryFn: () => halaqatApi.getMyEnrollments(),
  });
}

/**
 * Get enrolled students (for teachers)
 */
export function useEnrolledStudents(halaqaId: string) {
  return useQuery({
    queryKey: halaqatKeys.students(halaqaId),
    queryFn: () => halaqatApi.getEnrolledStudents(halaqaId),
    enabled: !!halaqaId,
  });
}

/**
 * Get halaqa sessions
 */
export function useHalaqaSessions(halaqaId: string) {
  return useQuery({
    queryKey: halaqatKeys.sessions(halaqaId),
    queryFn: () => halaqatApi.getSessions(halaqaId),
    enabled: !!halaqaId,
  });
}

/**
 * Get upcoming sessions
 */
export function useUpcomingSessions() {
  return useQuery({
    queryKey: halaqatKeys.upcomingSessions(),
    queryFn: () => halaqatApi.getUpcomingSessions(),
  });
}

/**
 * Mark attendance
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => halaqatApi.markAttendance(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: halaqatKeys.upcomingSessions() });
    },
  });
}

/**
 * Get halaqa reviews
 */
export function useHalaqaReviews(halaqaId: string) {
  return useQuery({
    queryKey: halaqatKeys.reviews(halaqaId),
    queryFn: () => halaqatApi.getReviews(halaqaId),
    enabled: !!halaqaId,
  });
}

/**
 * Add review
 */
export function useAddHalaqaReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      halaqaId,
      rating,
      comment,
    }: {
      halaqaId: string;
      rating: number;
      comment?: string;
    }) => halaqatApi.addReview(halaqaId, rating, comment),
    onSuccess: (_, { halaqaId }) => {
      queryClient.invalidateQueries({ queryKey: halaqatKeys.reviews(halaqaId) });
      queryClient.invalidateQueries({ queryKey: halaqatKeys.detail(halaqaId) });
    },
  });
}

/**
 * Export helper functions
 */
export { halaqatApi };
