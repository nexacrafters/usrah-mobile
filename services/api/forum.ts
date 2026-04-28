/**
 * Community Forum API Service
 */
import { apiClient } from './client';
import { PaginatedResponse } from './config';

// Types
export interface ForumPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  category: 'family' | 'parenting' | 'recipes' | 'islamic' | 'general';
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  created_at: string;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  content: string;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  color: string;
  post_count: number;
}

/**
 * Forum API Service
 */
export const forumApi = {
  /**
   * Get forum posts with pagination
   */
  async getPosts(params?: {
    category?: string;
    sort?: 'trending' | 'recent';
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<ForumPost>> {
    const searchParams = new URLSearchParams();
    if (params?.category && params.category !== 'all') {
      searchParams.append('category', params.category);
    }
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));

    return apiClient.get<PaginatedResponse<ForumPost>>(
      `/forum/posts/?${searchParams.toString()}`
    );
  },

  /**
   * Get single post
   */
  async getPost(id: string): Promise<ForumPost> {
    return apiClient.get<ForumPost>(`/forum/posts/${id}/`);
  },

  /**
   * Create post
   */
  async createPost(data: {
    title: string;
    content: string;
    category: string;
  }): Promise<ForumPost> {
    return apiClient.post<ForumPost>('/forum/posts/', data);
  },

  /**
   * Delete post
   */
  async deletePost(id: string): Promise<void> {
    return apiClient.delete(`/forum/posts/${id}/`);
  },

  /**
   * Like/unlike post
   */
  async toggleLike(postId: string): Promise<{ is_liked: boolean; likes_count: number }> {
    return apiClient.post(`/forum/posts/${postId}/like/`);
  },

  /**
   * Bookmark/unbookmark post
   */
  async toggleBookmark(postId: string): Promise<{ is_bookmarked: boolean }> {
    return apiClient.post(`/forum/posts/${postId}/bookmark/`);
  },

  /**
   * Get post comments
   */
  async getComments(postId: string, page: number = 1): Promise<PaginatedResponse<ForumComment>> {
    return apiClient.get<PaginatedResponse<ForumComment>>(
      `/forum/posts/${postId}/comments/?page=${page}`
    );
  },

  /**
   * Add comment
   */
  async addComment(postId: string, content: string): Promise<ForumComment> {
    return apiClient.post<ForumComment>(`/forum/posts/${postId}/comments/`, { content });
  },

  /**
   * Get categories
   */
  async getCategories(): Promise<ForumCategory[]> {
    const response = await apiClient.get<{ results: ForumCategory[] }>('/forum/categories/');
    return response.results;
  },

  /**
   * Get bookmarked posts
   */
  async getBookmarkedPosts(page: number = 1): Promise<PaginatedResponse<ForumPost>> {
    return apiClient.get<PaginatedResponse<ForumPost>>(`/forum/posts/bookmarked/?page=${page}`);
  },
};
