/**
 * Notes API Service
 * Maps to core/notes endpoints. Note ids are `id` (public_id UUID).
 *
 * Routes (confirmed from core/notes/urls.py + views.py + serializers.py):
 *   GET    /notes/?family_id=<id>[&tag=&search=&pinned=]  -> NoteListSerializer[]
 *          (family_id => family SHARED notes only; omit => personal notes)
 *   POST   /notes/create/   {family_id, title, content, is_shared, ...}  -> NoteDetailSerializer
 *   GET    /notes/<id>/                                   -> NoteDetailSerializer
 *   PUT/PATCH /notes/<id>/  (author only)                 -> NoteUpdateSerializer fields
 *   DELETE /notes/<id>/     (author only)
 *
 * Field names taken verbatim from the serializers:
 *   NoteListSerializer: id, family, author{public_id,full_name,avatar,gender},
 *     title, content_preview, is_shared, is_pinned, color, tags, is_encrypted,
 *     checklist_items_count, checklist_completed_count, created, updated
 *   NoteDetailSerializer adds: content, content_encrypted, checklists[]
 *   NoteCreateSerializer (write): family_id, title, content, content_encrypted,
 *     is_shared, is_pinned, color, tags, is_encrypted, checklists
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

/** Minimal user shape returned by UserMiniSerializer. */
export interface NoteAuthor {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

/** Note as returned by NoteListSerializer. */
export interface Note {
  id: string;
  family: string | null;
  author: NoteAuthor | null;
  title: string;
  content_preview: string;
  is_shared: boolean;
  is_pinned: boolean;
  color: string;
  tags: string[];
  is_encrypted: boolean;
  checklist_items_count?: number;
  checklist_completed_count?: number;
  created: string;
  updated: string;
}

/** Full note as returned by NoteDetailSerializer (list fields + these). */
export interface NoteDetail extends Note {
  content: string;
  content_encrypted?: string | null;
  checklists?: Array<{
    id: string;
    item: string;
    is_checked: boolean;
    order: number;
    created: string;
  }>;
}

/** Payload accepted by NoteCreateSerializer (family_id is injected by us). */
export interface CreateNoteRequest {
  title: string;
  content?: string;
  is_shared?: boolean;
  is_pinned?: boolean;
  color?: string;
  tags?: string[];
  is_encrypted?: boolean;
}

/** Payload accepted by NoteUpdateSerializer. */
export type UpdateNoteRequest = Partial<{
  title: string;
  content: string;
  is_shared: boolean;
  is_pinned: boolean;
  color: string;
  tags: string[];
  is_encrypted: boolean;
}>;

const NO_FAMILY_MESSAGE = 'Please create or select a family first.';

class NotesService {
  /**
   * List the active family's SHARED notes. Passing family_id makes the API
   * return only shared family notes. Returns [] when no family is selected.
   */
  async listNotes(params?: {
    tag?: string;
    search?: string;
    pinned?: boolean;
  }): Promise<Note[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/notes/', {
        params: {
          family_id: familyId,
          ...(params?.tag ? {tag: params.tag} : {}),
          ...(params?.search ? {search: params.search} : {}),
          ...(params?.pinned !== undefined
            ? {pinned: params.pinned ? 'true' : 'false'}
            : {}),
        },
      });
      return unwrapList<Note>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a note. Defaults to a SHARED family note so it appears in the
   * family list. The server attributes it to the current user as author.
   */
  async createNote(data: CreateNoteRequest): Promise<NoteDetail> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error(NO_FAMILY_MESSAGE);
    }
    try {
      const response = await apiClient.post<NoteDetail>('/notes/create/', {
        family_id: familyId,
        is_shared: true,
        content: '',
        ...data,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Get a single note with its full content + checklists. */
  async getNote(id: string): Promise<NoteDetail> {
    try {
      const response = await apiClient.get<NoteDetail>(`/notes/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Partially update a note (author only, enforced server-side). */
  async updateNote(id: string, data: UpdateNoteRequest): Promise<NoteDetail> {
    try {
      const response = await apiClient.patch<NoteDetail>(`/notes/${id}/`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Delete a note (author only, enforced server-side). */
  async deleteNote(id: string): Promise<void> {
    try {
      await apiClient.delete(`/notes/${id}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new NotesService();
