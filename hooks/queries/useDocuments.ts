/**
 * Documents Query Hooks
 * React Query hooks for family documents features
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { documentsApi, Document, DocumentFolder, StorageInfo } from '../../services/api/documents';

const documentsKeys = {
  all: ['documents'] as const,
  storage: () => [...documentsKeys.all, 'storage'] as const,
  folders: () => [...documentsKeys.all, 'folders'] as const,
  list: (filters?: Record<string, unknown>) => [...documentsKeys.all, 'list', filters] as const,
  recent: () => [...documentsKeys.all, 'recent'] as const,
  detail: (id: string) => [...documentsKeys.all, 'detail', id] as const,
};

/**
 * Get storage info
 */
export function useStorageInfo() {
  return useQuery({
    queryKey: documentsKeys.storage(),
    queryFn: () => documentsApi.getStorageInfo(),
  });
}

/**
 * Get folders
 */
export function useDocumentFolders() {
  return useQuery({
    queryKey: documentsKeys.folders(),
    queryFn: () => documentsApi.getFolders(),
  });
}

/**
 * Create folder
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      documentsApi.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.folders() });
    },
  });
}

/**
 * Delete folder
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.folders() });
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
    },
  });
}

/**
 * Get documents with pagination
 */
export function useDocuments(filters?: {
  folder_id?: string;
  search?: string;
}) {
  return useInfiniteQuery({
    queryKey: documentsKeys.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      documentsApi.getDocuments({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Get recent documents
 */
export function useRecentDocuments(limit: number = 10) {
  return useQuery({
    queryKey: documentsKeys.recent(),
    queryFn: () => documentsApi.getRecentDocuments(limit),
  });
}

/**
 * Upload document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      file: { uri: string; name: string; type: string };
      folder_id?: string;
    }) => documentsApi.uploadDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
      queryClient.invalidateQueries({ queryKey: documentsKeys.storage() });
    },
  });
}

/**
 * Delete document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
      queryClient.invalidateQueries({ queryKey: documentsKeys.storage() });
    },
  });
}

/**
 * Move document
 */
export function useMoveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      documentsApi.moveDocument(id, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsKeys.all });
      queryClient.invalidateQueries({ queryKey: documentsKeys.folders() });
    },
  });
}

/**
 * Get download URL
 */
export function useDocumentDownload() {
  return useMutation({
    mutationFn: (id: string) => documentsApi.getDownloadUrl(id),
  });
}

/**
 * Export API for direct access
 */
export { documentsApi };
