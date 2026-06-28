/**
 * Social API Service
 * Family feed (Circles) — posts, reactions, comments.
 * Maps to core/social endpoints. Post/Comment ids are `id` (public_id hex UUID).
 *
 * Routes (confirmed from core/social/urls.py + views.py + serializers.py):
 *   GET    /social/posts/?family_id=<id>                 -> PostListSerializer[] (paginated)
 *   POST   /social/posts/create/  {family_id, content, ...} (multipart) -> PostCreateSerializer
 *   GET    /social/posts/<id>/                           -> PostDetailSerializer (+ comments)
 *   DELETE /social/posts/<id>/                           (soft delete)
 *   POST   /social/posts/<id>/reactions/  {type}         -> ReactionSerializer | {message} (toggle)
 *   GET    /social/posts/<id>/comments/                  -> CommentSerializer[] (top-level, paginated)
 *   POST   /social/posts/<id>/comments/  {content, reply_to_id?} -> CommentSerializer
 *   GET    /social/stories/?family_id=<id>               -> StorySerializer[]
 *
 * Confirmed serializer field names:
 *   Post:    id, family, author{public_id,full_name,avatar,gender}, content, post_type,
 *            is_sisters_only, is_brothers_only, is_anonymous, is_pinned, expires_at,
 *            views_count, media[], reactions_summary{type:count}, comments_count,
 *            user_reaction (string|null), is_saved, created, updated
 *            (detail adds: comments[])
 *   Comment: id, author{...}, content, reply_to, replies_count, is_active, created, updated
 *   Reaction:id, user{...}, type, created   (types: love, mashallah, subhanallah,
 *            alhamdulillah, barakallah, haha)
 */

import apiClient, {handleApiError, unwrapList} from './client';
import {getCurrentFamilyId} from '../../store/authStore';

/** Islamic reaction types accepted by the API. */
export type ReactionType =
  | 'love'
  | 'mashallah'
  | 'subhanallah'
  | 'alhamdulillah'
  | 'barakallah'
  | 'haha';

export type PostType = 'text' | 'photo' | 'video' | 'story' | 'voice';

/** Minimal user shape returned by UserMiniSerializer. */
export interface SocialUser {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

export interface PostMedia {
  id: string;
  file: string;
  media_type: 'image' | 'video' | 'voice';
  thumbnail?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  file_size?: number | null;
  order: number;
  created: string;
}

export interface Comment {
  id: string;
  author: SocialUser;
  content: string;
  reply_to?: string | null;
  replies_count: number;
  is_active: boolean;
  created: string;
  updated: string;
}

export interface Post {
  id: string;
  family: string;
  author: SocialUser;
  content: string;
  post_type: PostType;
  is_sisters_only: boolean;
  is_brothers_only: boolean;
  is_anonymous: boolean;
  is_pinned: boolean;
  expires_at?: string | null;
  views_count: number;
  media: PostMedia[];
  /** Map of reaction type -> count, e.g. {love: 3, mashallah: 1}. */
  reactions_summary: Partial<Record<ReactionType, number>>;
  comments_count: number;
  /** The current user's reaction type, or null if none. */
  user_reaction: ReactionType | null;
  is_saved: boolean;
  created: string;
  updated: string;
}

/** Post detail includes the first page of top-level comments. */
export interface PostDetail extends Post {
  comments: Comment[];
}

export interface CreatePostRequest {
  content: string;
  post_type?: PostType;
  is_sisters_only?: boolean;
  is_brothers_only?: boolean;
  is_anonymous?: boolean;
  expires_at?: string | null;
}

class SocialService {
  /** List feed posts for the active family. Returns [] when no family is selected. */
  async listPosts(): Promise<Post[]> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      return [];
    }
    try {
      const response = await apiClient.get('/social/posts/', {
        params: {family_id: familyId},
      });
      return unwrapList<Post>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a post in the active family.
   * The create endpoint uses MultiPartParser server-side, so we send FormData.
   */
  async createPost(data: CreatePostRequest): Promise<Post> {
    const familyId = getCurrentFamilyId();
    if (!familyId) {
      throw new Error('No family selected');
    }
    try {
      const form = new FormData();
      form.append('family_id', familyId);
      form.append('content', data.content);
      form.append('post_type', data.post_type ?? 'text');
      if (data.is_sisters_only) form.append('is_sisters_only', 'true');
      if (data.is_brothers_only) form.append('is_brothers_only', 'true');
      if (data.is_anonymous) form.append('is_anonymous', 'true');
      if (data.expires_at) form.append('expires_at', data.expires_at);

      const response = await apiClient.post<Post>('/social/posts/create/', form, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Get a single post with its top-level comments. */
  async getPost(postId: string): Promise<PostDetail> {
    try {
      const response = await apiClient.get<PostDetail>(`/social/posts/${postId}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Delete (soft) a post. */
  async deletePost(postId: string): Promise<{message?: string}> {
    try {
      const response = await apiClient.delete(`/social/posts/${postId}/`);
      return response.data ?? {};
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Add / toggle a reaction on a post.
   * Server toggles: same type again removes it, a different type replaces it.
   * Returns the reaction (created/updated) or {message} when removed.
   */
  async addReaction(
    postId: string,
    type: ReactionType,
  ): Promise<{id?: string; user?: SocialUser; type?: ReactionType; message?: string}> {
    try {
      const response = await apiClient.post(`/social/posts/${postId}/reactions/`, {
        type,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** List top-level comments for a post. */
  async listComments(postId: string): Promise<Comment[]> {
    try {
      const response = await apiClient.get(`/social/posts/${postId}/comments/`);
      return unwrapList<Comment>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Add a comment (optionally a reply) to a post. */
  async addComment(
    postId: string,
    content: string,
    replyToId?: string | null,
  ): Promise<Comment> {
    try {
      const payload: {content: string; reply_to_id?: string} = {content};
      if (replyToId) {
        payload.reply_to_id = replyToId;
      }
      const response = await apiClient.post<Comment>(
        `/social/posts/${postId}/comments/`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new SocialService();
