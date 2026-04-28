/**
 * Village Network Query Hooks
 * React Query hooks for village features
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { villageApi, Neighbor, Announcement, SharedItem, VillageHelper } from '../../services/api/village';

const villageKeys = {
  all: ['village'] as const,
  neighbors: () => [...villageKeys.all, 'neighbors'] as const,
  announcements: () => [...villageKeys.all, 'announcements'] as const,
  items: () => [...villageKeys.all, 'items'] as const,
  helpers: () => [...villageKeys.all, 'helpers'] as const,
};

/**
 * Get neighbors
 */
export function useNeighbors(limit: number = 20) {
  return useQuery({
    queryKey: [...villageKeys.neighbors(), limit],
    queryFn: () => villageApi.getNeighbors(limit),
  });
}

/**
 * Connect with neighbor
 */
export function useConnectWithNeighbor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (familyId: string) => villageApi.connectWithNeighbor(familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: villageKeys.neighbors() });
    },
  });
}

/**
 * Get announcements with pagination
 */
export function useAnnouncements() {
  return useInfiniteQuery({
    queryKey: villageKeys.announcements(),
    queryFn: ({ pageParam = 1 }) => villageApi.getAnnouncements(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Create announcement
 */
export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      category: 'general' | 'event' | 'help' | 'alert';
      expires_at?: string;
    }) => villageApi.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: villageKeys.announcements() });
    },
  });
}

/**
 * Delete announcement
 */
export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => villageApi.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: villageKeys.announcements() });
    },
  });
}

/**
 * Get shared items with pagination
 */
export function useSharedItems(category?: string) {
  return useInfiniteQuery({
    queryKey: [...villageKeys.items(), category],
    queryFn: ({ pageParam = 1 }) => villageApi.getSharedItems(category, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Create shared item
 */
export function useCreateSharedItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      category: 'tool' | 'book' | 'food' | 'clothing' | 'other';
      image_url?: string;
    }) => villageApi.createSharedItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: villageKeys.items() });
    },
  });
}

/**
 * Request to borrow item
 */
export function useRequestItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, message }: { itemId: string; message?: string }) =>
      villageApi.requestItem(itemId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: villageKeys.items() });
    },
  });
}

/**
 * Update item status
 */
export function useUpdateItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      status,
    }: {
      itemId: string;
      status: 'available' | 'borrowed' | 'unavailable';
    }) => villageApi.updateItemStatus(itemId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: villageKeys.items() });
    },
  });
}

/**
 * Delete shared item
 */
export function useDeleteSharedItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => villageApi.deleteSharedItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: villageKeys.items() });
    },
  });
}

/**
 * Get village helpers
 */
export function useVillageHelpers() {
  return useQuery({
    queryKey: villageKeys.helpers(),
    queryFn: () => villageApi.getVillageHelpers(),
  });
}

/**
 * Send emergency alert to neighbors
 */
export function useSendAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: 'medical' | 'fire' | 'security' | 'baby' | 'car' | 'utility';
      message: string;
    }) => villageApi.sendAlert(data.type, data.message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: villageKeys.announcements() });
    },
  });
}

/**
 * Export API for direct access
 */
export { villageApi };
