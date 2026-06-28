/**
 * Documents API Service
 * Maps to core/documents endpoints. Document ids are `id` (public_id UUID).
 *
 * Routes (confirmed from core/documents/urls.py + views.py + serializers.py):
 *   GET    /documents/?family_id=<id>[&folder=&file_type=&search=]  -> DocumentListSerializer[]
 *   GET    /documents/<id>/                                         -> DocumentDetailSerializer
 *   DELETE /documents/<id>/                                         (family member only)
 *   POST   /documents/upload/  (multipart, requires a `file`)       -> upload is web-only here
 *
 * Field names taken verbatim from the serializers:
 *   DocumentListSerializer: id, filename, file_type, file_size, file_size_display,
 *     mime_type, folder, folder_name, uploaded_by{public_id,full_name,avatar,gender},
 *     description, tags, is_encrypted, thumbnail, created
 *   DocumentDetailSerializer adds: file, shares[], download_url
 *
 * NOTE: There is no metadata-only create — DocumentUploadView requires a binary
 * `file` (MultiPartParser). To avoid adding a file-picker dependency, this
 * service exposes list / view / delete only. Uploading is done via the web app.
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

/** Server file_type buckets (see DocumentUploadView._get_file_type). */
export type DocumentFileType =
  | 'pdf'
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'video'
  | 'audio'
  | 'archive'
  | 'other';

/** Minimal user shape returned by UserMiniSerializer. */
export interface DocumentUploader {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

/** Document as returned by DocumentListSerializer. */
export interface DocumentItem {
  id: string;
  filename: string;
  file_type: DocumentFileType | string;
  file_size: number;
  file_size_display: string;
  mime_type: string;
  folder: string | null;
  folder_name: string | null;
  uploaded_by: DocumentUploader | null;
  description: string;
  tags: string[];
  is_encrypted: boolean;
  thumbnail: string | null;
  created: string;
}

/** Full document as returned by DocumentDetailSerializer (list fields + these). */
export interface DocumentDetail extends DocumentItem {
  /** Storage path/relative url of the underlying file. */
  file: string | null;
  /** Absolute URL built by the API for opening/downloading. */
  download_url: string | null;
  shares?: Array<{
    id: string;
    shared_with: DocumentUploader | null;
    shared_by: DocumentUploader | null;
    permission: 'view' | 'edit';
    shared_at: string;
  }>;
}

class DocumentsService {
  /**
   * List the active family's documents (newest first). Returns [] when no
   * family is selected.
   */
  async listDocuments(params?: {
    folder?: string;
    file_type?: string;
    search?: string;
  }): Promise<DocumentItem[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/documents/', {
        params: {
          family_id: familyId,
          ...(params?.folder ? {folder: params.folder} : {}),
          ...(params?.file_type ? {file_type: params.file_type} : {}),
          ...(params?.search ? {search: params.search} : {}),
        },
      });
      return unwrapList<DocumentItem>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Get a single document including its `download_url` and shares. */
  async getDocument(id: string): Promise<DocumentDetail> {
    try {
      const response = await apiClient.get<DocumentDetail>(`/documents/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Delete a document (family member only, enforced server-side). */
  async deleteDocument(id: string): Promise<void> {
    try {
      await apiClient.delete(`/documents/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Resolve an openable absolute URL for a document. The list serializer does
   * not include `download_url`, so when it is missing we fetch the detail
   * (or fall back to the /download/ endpoint) to get one.
   */
  async getDownloadUrl(id: string): Promise<string | null> {
    try {
      const detail = await this.getDocument(id);
      if (detail.download_url) {
        return detail.download_url;
      }
      const response = await apiClient.get<{download_url: string}>(
        `/documents/${id}/download/`,
      );
      return response.data?.download_url ?? null;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new DocumentsService();
