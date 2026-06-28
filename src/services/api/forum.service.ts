/**
 * Forum API Service
 * Maps to core/forum endpoints. All ids are `public_id` UUID strings (the API
 * exposes `public_id` as `id` via AbstractSerializer).
 *
 * Routes (confirmed from core/forum/urls.py + views.py + serializers.py):
 *   GET    /forum/categories/                          -> ForumCategory[]
 *   GET    /forum/posts/?category=<id>&search=&tag=    -> ForumPost[] (paginated or array)
 *   POST   /forum/posts/create/  {category,title,content,is_anonymous?,tags?} -> ForumPostDetail
 *   GET    /forum/posts/<id>/                          -> ForumPostDetail (with comments)
 *   POST   /forum/posts/<id>/like/                     -> {liked: bool, likes_count: number}
 *   GET    /forum/posts/<id>/comments/                 -> ForumComment[]
 *   POST   /forum/posts/<id>/comments/  {content, reply_to?, is_anonymous?} -> ForumComment
 */

import apiClient, {handleApiError, unwrapList} from './client';

/** Nested author shape (UserMiniSerializer). */
export interface ForumAuthor {
  public_id: string;
  full_name: string;
  avatar?: string | null;
  gender?: 'male' | 'female';
}

/** Either a real author or the anonymous placeholder. */
export interface DisplayAuthor {
  full_name: string;
  avatar?: string | null;
}

export interface ForumCategory {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  icon?: string | null;
  color?: string | null;
  order?: number;
  is_active?: boolean;
  is_sisters_only?: boolean;
  is_brothers_only?: boolean;
  posts_count?: number;
  created?: string;
}

export interface ForumPost {
  id: string;
  category: string;
  category_name?: string;
  author?: ForumAuthor | null;
  display_author?: DisplayAuthor;
  title: string;
  content: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  is_active?: boolean;
  is_anonymous?: boolean;
  views_count?: number;
  comments_count?: number;
  likes_count?: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  tags?: string[];
  created?: string;
  updated?: string;
}

export interface ForumComment {
  id: string;
  author?: ForumAuthor | null;
  display_author?: DisplayAuthor;
  content: string;
  reply_to?: string | null;
  is_active?: boolean;
  is_anonymous?: boolean;
  replies_count?: number;
  created?: string;
}

export interface ForumPostDetail extends ForumPost {
  comments?: ForumComment[];
}

export interface ListPostsParams {
  category?: string;
  search?: string;
  tag?: string;
}

export interface CreatePostRequest {
  category: string;
  title: string;
  content: string;
  is_anonymous?: boolean;
  tags?: string[];
}

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

class ForumService {
  /** List forum posts, optionally filtered by category / search / tag. */
  async listPosts(params?: ListPostsParams): Promise<ForumPost[]> {
    try {
      const response = await apiClient.get('/forum/posts/', {params});
      return unwrapList<ForumPost>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Create a new forum post. */
  async createPost(data: CreatePostRequest): Promise<ForumPostDetail> {
    try {
      const response = await apiClient.post<ForumPostDetail>(
        '/forum/posts/create/',
        data,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Full post detail including comments. */
  async getPost(id: string): Promise<ForumPostDetail> {
    try {
      const response = await apiClient.get<ForumPostDetail>(
        `/forum/posts/${id}/`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** List top-level comments for a post. */
  async listComments(postId: string): Promise<ForumComment[]> {
    try {
      const response = await apiClient.get(
        `/forum/posts/${postId}/comments/`,
      );
      return unwrapList<ForumComment>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Add a comment to a post. */
  async addComment(
    postId: string,
    content: string,
    options?: {reply_to?: string | null; is_anonymous?: boolean},
  ): Promise<ForumComment> {
    try {
      const response = await apiClient.post<ForumComment>(
        `/forum/posts/${postId}/comments/`,
        {content, ...options},
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Toggle like/unlike on a post. Returns the new liked state + count. */
  async likePost(id: string): Promise<LikeResponse> {
    try {
      const response = await apiClient.post<LikeResponse>(
        `/forum/posts/${id}/like/`,
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** List forum categories (gender-filtered server-side). */
  async listCategories(): Promise<ForumCategory[]> {
    try {
      const response = await apiClient.get('/forum/categories/');
      return unwrapList<ForumCategory>(response.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

/** Resolve the best display name for a post/comment author. */
export const authorName = (
  item: {display_author?: DisplayAuthor; author?: ForumAuthor | null},
): string =>
  item.display_author?.full_name ?? item.author?.full_name ?? '';

/** Resolve the best avatar uri for a post/comment author. */
export const authorAvatar = (
  item: {display_author?: DisplayAuthor; author?: ForumAuthor | null},
): string | undefined =>
  item.display_author?.avatar ?? item.author?.avatar ?? undefined;

export default new ForumService();
