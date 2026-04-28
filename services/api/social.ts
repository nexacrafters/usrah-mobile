/**
 * Social Feed API Service
 * Handles posts, reactions, comments, stories, and Sisters Circle
 */
import { apiClient } from './client';
import { ENDPOINTS } from './config';
import {
  Post,
  Reaction,
  Comment,
  ReactionType,
  PostType,
  PaginatedResponse,
} from '../../types/models';

// Request interfaces
interface CreatePostRequest {
  family_id: string;
  content?: string;
  post_type?: PostType;
  is_sisters_only?: boolean;
  expires_at?: string; // For stories
}

interface CreateCommentRequest {
  content: string;
  reply_to_id?: string;
}

interface PostFilters {
  family_id: string;
  author_id?: string;
  post_type?: PostType;
  is_sisters_only?: boolean;
  page?: number;
}

/**
 * Social Feed API Service
 */
export const socialApi = {
  // ==================== Posts ====================

  /**
   * Get feed posts
   */
  async getPosts(filters: PostFilters): Promise<PaginatedResponse<Post>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return apiClient.get<PaginatedResponse<Post>>(
      `${ENDPOINTS.social.posts}?${params.toString()}`
    );
  },

  /**
   * Get a single post
   */
  async getPost(id: string): Promise<Post> {
    return apiClient.get<Post>(ENDPOINTS.social.postDetail(id));
  },

  /**
   * Create a new post
   */
  async createPost(data: CreatePostRequest): Promise<Post> {
    return apiClient.post<Post>(ENDPOINTS.social.posts, data);
  },

  /**
   * Update a post
   */
  async updatePost(id: string, content: string): Promise<Post> {
    return apiClient.patch<Post>(ENDPOINTS.social.postDetail(id), { content });
  },

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.social.postDetail(id));
  },

  /**
   * Upload media for a post
   */
  async createPostWithMedia(
    data: CreatePostRequest,
    mediaUris: string[]
  ): Promise<Post> {
    const formData = new FormData();

    // Add post data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    // Add media files
    mediaUris.forEach((uri, index) => {
      formData.append('media', {
        uri,
        type: 'image/jpeg',
        name: `media_${index}.jpg`,
      } as any);
    });

    return apiClient.uploadFile<Post>(ENDPOINTS.social.posts, formData);
  },

  // ==================== Reactions ====================

  /**
   * Add reaction to a post
   */
  async addReaction(postId: string, type: ReactionType): Promise<Reaction> {
    return apiClient.post<Reaction>(ENDPOINTS.social.reactions(postId), { type });
  },

  /**
   * Remove reaction from a post
   */
  async removeReaction(postId: string): Promise<void> {
    return apiClient.delete(ENDPOINTS.social.reactions(postId));
  },

  /**
   * Get reactions for a post
   */
  async getReactions(postId: string): Promise<Reaction[]> {
    const response = await apiClient.get<{ results: Reaction[] }>(
      ENDPOINTS.social.reactions(postId)
    );
    return response.results;
  },

  /**
   * Toggle reaction (add if not exists, remove if same type, change if different)
   */
  async toggleReaction(postId: string, type: ReactionType): Promise<void> {
    // Get post to check current reaction
    const post = await this.getPost(postId);

    if (post.user_reaction === type) {
      // Remove if same reaction
      await this.removeReaction(postId);
    } else {
      // Add/change reaction
      await this.addReaction(postId, type);
    }
  },

  // ==================== Comments ====================

  /**
   * Get comments for a post
   */
  async getComments(postId: string): Promise<Comment[]> {
    const response = await apiClient.get<{ results: Comment[] }>(
      ENDPOINTS.social.comments(postId)
    );
    return response.results;
  },

  /**
   * Add comment to a post
   */
  async addComment(postId: string, data: CreateCommentRequest): Promise<Comment> {
    return apiClient.post<Comment>(ENDPOINTS.social.comments(postId), data);
  },

  /**
   * Update a comment
   */
  async updateComment(postId: string, commentId: string, content: string): Promise<Comment> {
    return apiClient.patch<Comment>(
      `${ENDPOINTS.social.comments(postId)}${commentId}/`,
      { content }
    );
  },

  /**
   * Delete a comment
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    return apiClient.delete(`${ENDPOINTS.social.comments(postId)}${commentId}/`);
  },

  // ==================== Stories ====================

  /**
   * Get stories
   */
  async getStories(familyId: string): Promise<Post[]> {
    const response = await apiClient.get<{ results: Post[] }>(
      `${ENDPOINTS.social.stories}?family_id=${familyId}`
    );
    return response.results;
  },

  /**
   * Create a story (expires in 24 hours)
   */
  async createStory(
    familyId: string,
    mediaUri: string,
    content?: string,
    isSistersOnly: boolean = false
  ): Promise<Post> {
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    const formData = new FormData();
    formData.append('family_id', familyId);
    formData.append('post_type', 'story');
    formData.append('expires_at', expires.toISOString());
    formData.append('is_sisters_only', String(isSistersOnly));
    if (content) formData.append('content', content);

    formData.append('media', {
      uri: mediaUri,
      type: 'image/jpeg',
      name: 'story.jpg',
    } as any);

    return apiClient.uploadFile<Post>(ENDPOINTS.social.stories, formData);
  },

  /**
   * View a story (mark as viewed)
   */
  async viewStory(storyId: string): Promise<void> {
    return apiClient.post(`${ENDPOINTS.social.stories}${storyId}/view/`, {});
  },

  // ==================== Sisters Circle ====================

  /**
   * Get Sisters Circle posts (women only)
   */
  async getSistersCirclePosts(familyId: string): Promise<PaginatedResponse<Post>> {
    return apiClient.get<PaginatedResponse<Post>>(
      `${ENDPOINTS.social.sistersCircle}?family_id=${familyId}`
    );
  },

  /**
   * Create a Sisters Circle post
   */
  async createSistersCirclePost(
    familyId: string,
    content: string,
    mediaUris?: string[]
  ): Promise<Post> {
    const data: CreatePostRequest = {
      family_id: familyId,
      content,
      is_sisters_only: true,
    };

    if (mediaUris && mediaUris.length > 0) {
      return this.createPostWithMedia(data, mediaUris);
    }

    return this.createPost(data);
  },

  /**
   * Check if user can access Sisters Circle
   */
  canAccessSistersCircle(userGender: 'male' | 'female'): boolean {
    return userGender === 'female';
  },

  // ==================== Brothers Circle ====================

  /**
   * Get Brothers Circle posts (men only)
   */
  async getBrothersCirclePosts(familyId: string): Promise<PaginatedResponse<Post>> {
    return apiClient.get<PaginatedResponse<Post>>(
      `${ENDPOINTS.social.posts}?family_id=${familyId}&is_brothers_only=true`
    );
  },

  /**
   * Create a Brothers Circle post
   */
  async createBrothersCirclePost(
    familyId: string,
    content: string,
    mediaUris?: string[]
  ): Promise<Post> {
    const data: CreatePostRequest = {
      family_id: familyId,
      content,
      is_brothers_only: true,
    } as any;

    if (mediaUris && mediaUris.length > 0) {
      return this.createPostWithMedia(data, mediaUris);
    }

    return this.createPost(data);
  },

  /**
   * Check if user can access Brothers Circle
   */
  canAccessBrothersCircle(userGender: 'male' | 'female'): boolean {
    return userGender === 'male';
  },

  // ==================== Feed Helpers ====================

  /**
   * Get family feed (all public posts)
   */
  async getFamilyFeed(familyId: string, page: number = 1): Promise<Post[]> {
    const response = await this.getPosts({
      family_id: familyId,
      is_sisters_only: false,
      page,
    });
    return response.results;
  },

  /**
   * Get user's posts
   */
  async getUserPosts(familyId: string, userId: string): Promise<Post[]> {
    const response = await this.getPosts({
      family_id: familyId,
      author_id: userId,
    });
    return response.results;
  },

  /**
   * Get posts with media only
   */
  async getMediaPosts(familyId: string): Promise<Post[]> {
    const response = await this.getPosts({
      family_id: familyId,
      post_type: 'photo',
    });
    return response.results;
  },

  /**
   * Search posts
   */
  async searchPosts(familyId: string, query: string): Promise<Post[]> {
    const response = await apiClient.get<{ results: Post[] }>(
      `${ENDPOINTS.social.posts}?family_id=${familyId}&search=${encodeURIComponent(query)}`
    );
    return response.results;
  },
};
