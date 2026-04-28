/**
 * Family Documents API Service
 */
import { apiClient } from './client';
import { PaginatedResponse } from './config';

// Types
export interface DocumentFolder {
  id: string;
  name: string;
  name_ar?: string;
  color: string;
  file_count: number;
  created_at: string;
}

export interface Document {
  id: string;
  folder_id?: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'other';
  size: string;
  size_bytes: number;
  url: string;
  thumbnail_url?: string;
  uploaded_by: {
    id: string;
    name: string;
  };
  created_at: string;
}

export interface StorageInfo {
  used_bytes: number;
  total_bytes: number;
  used_formatted: string;
  total_formatted: string;
}

/**
 * Documents API Service
 */
export const documentsApi = {
  /**
   * Get storage info
   */
  async getStorageInfo(): Promise<StorageInfo> {
    return apiClient.get<StorageInfo>('/documents/storage/');
  },

  /**
   * Get folders
   */
  async getFolders(): Promise<DocumentFolder[]> {
    const response = await apiClient.get<{ results: DocumentFolder[] }>('/documents/folders/');
    return response.results;
  },

  /**
   * Create folder
   */
  async createFolder(data: { name: string; color?: string }): Promise<DocumentFolder> {
    return apiClient.post<DocumentFolder>('/documents/folders/', data);
  },

  /**
   * Delete folder
   */
  async deleteFolder(id: string): Promise<void> {
    return apiClient.delete(`/documents/folders/${id}/`);
  },

  /**
   * Get documents
   */
  async getDocuments(params?: {
    folder_id?: string;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<Document>> {
    const searchParams = new URLSearchParams();
    if (params?.folder_id) searchParams.append('folder', params.folder_id);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));

    return apiClient.get<PaginatedResponse<Document>>(
      `/documents/?${searchParams.toString()}`
    );
  },

  /**
   * Get recent documents
   */
  async getRecentDocuments(limit: number = 10): Promise<Document[]> {
    const response = await apiClient.get<{ results: Document[] }>(
      `/documents/recent/?limit=${limit}`
    );
    return response.results;
  },

  /**
   * Upload document
   */
  async uploadDocument(data: {
    file: { uri: string; name: string; type: string };
    folder_id?: string;
  }): Promise<Document> {
    const formData = new FormData();
    formData.append('file', data.file as any);
    if (data.folder_id) formData.append('folder_id', data.folder_id);

    return apiClient.post<Document>('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    return apiClient.delete(`/documents/${id}/`);
  },

  /**
   * Move document to folder
   */
  async moveDocument(id: string, folderId: string | null): Promise<Document> {
    return apiClient.patch<Document>(`/documents/${id}/`, { folder_id: folderId });
  },

  /**
   * Get download URL
   */
  async getDownloadUrl(id: string): Promise<{ url: string }> {
    return apiClient.get<{ url: string }>(`/documents/${id}/download/`);
  },
};
