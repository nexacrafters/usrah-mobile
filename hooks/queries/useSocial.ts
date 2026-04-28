/**
 * Social Query Hooks
 * React Query hooks for social feed features
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { socialApi } from '../../services/api/social';
import { queryKeys, invalidateQueries } from '../../services/queryClient';
import { DEMO_MODE, DEMO_USER } from '../../services/demoMode';
import type { Post, PostType, ReactionType } from '../../types/models';

interface PostFilters {
  family_id: string;
  author_id?: string;
  post_type?: PostType;
  is_sisters_only?: boolean;
  limit?: number;
}

// Demo posts data
const DEMO_POSTS = [
  {
    id: '1',
    content: 'الحمد لله على نعمة العائلة. كل يوم هو فرصة جديدة للتواصل والمحبة.',
    author: { id: 'demo-user-1', full_name: 'أحمد محمد', is_verified: true, avatar: null },
    created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reactions_count: { love: 5, mashallah: 3 },
    comments_count: 2,
    media: [],
    is_sisters_only: false,
  },
  {
    id: '2',
    content: 'وصفة اليوم: كبسة دجاج بالطريقة السعودية الأصلية. لا تنسوا التوابل!',
    author: { id: '2', full_name: 'فاطمة أحمد', is_verified: false, avatar: null },
    created: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    reactions_count: { love: 8, alhamdulillah: 2 },
    comments_count: 5,
    media: [{ type: 'image', url: null }],
    is_sisters_only: false,
  },
  {
    id: '3',
    content: 'اجتماع العائلة هذا الأسبوع سيكون يوم الجمعة بعد صلاة المغرب إن شاء الله.',
    author: { id: 'demo-user-1', full_name: 'أحمد محمد', is_verified: true, avatar: null },
    created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    reactions_count: { love: 12, jazakallah: 4 },
    comments_count: 8,
    media: [],
    is_sisters_only: false,
  },
];

let demoPostsData = [...DEMO_POSTS];

/**
 * Get posts with pagination
 */
export function usePosts(familyId: string, options?: { limit?: number }) {
  const filters: PostFilters = { family_id: familyId, limit: options?.limit };
  return useInfiniteQuery({
    queryKey: queryKeys.social.post(filters),
    queryFn: async ({ pageParam = 1 }) => {
      if (DEMO_MODE) {
        const limit = options?.limit || 20;
        const posts = demoPostsData.slice(0, limit);
        return {
          results: posts,
          next: null,
          page: 1,
          count: posts.length,
        };
      }
      return socialApi.getPosts({ ...filters, page: pageParam });
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!familyId,
  });
}

/**
 * Get single post
 */
export function usePost(id: string) {
  return useQuery({
    queryKey: queryKeys.social.postDetail(id),
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoPostsData.find(p => p.id === id) || null;
      }
      return socialApi.getPost(id);
    },
    enabled: !!id,
  });
}

/**
 * Create post
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      family_id: string;
      content?: string;
      post_type?: PostType;
      is_sisters_only?: boolean;
    }) => {
      if (DEMO_MODE) {
        const newPost = {
          id: `demo-post-${Date.now()}`,
          content: data.content || '',
          author: { id: DEMO_USER.id, full_name: DEMO_USER.full_name, is_verified: true, avatar: null },
          created: new Date().toISOString(),
          reactions_count: {},
          comments_count: 0,
          media: [],
          is_sisters_only: data.is_sisters_only || false,
        };
        demoPostsData.unshift(newPost as any);
        return newPost;
      }
      return socialApi.createPost(data);
    },
    onSuccess: () => {
      invalidateQueries.social();
    },
  });
}

/**
 * Create post with media
 */
export function useCreatePostWithMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      mediaUris,
    }: {
      data: {
        family_id: string;
        content?: string;
        post_type?: PostType;
        is_sisters_only?: boolean;
      };
      mediaUris: string[];
    }) => {
      if (DEMO_MODE) {
        const newPost = {
          id: `demo-post-${Date.now()}`,
          content: data.content || '',
          author: { id: DEMO_USER.id, full_name: DEMO_USER.full_name, is_verified: true, avatar: null },
          created: new Date().toISOString(),
          reactions_count: {},
          comments_count: 0,
          media: mediaUris.map(uri => ({ type: 'image', url: uri })),
          is_sisters_only: data.is_sisters_only || false,
        };
        demoPostsData.unshift(newPost as any);
        return newPost;
      }
      return socialApi.createPostWithMedia(data, mediaUris);
    },
    onSuccess: () => {
      invalidateQueries.social();
    },
  });
}

/**
 * Update post
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (DEMO_MODE) {
        const index = demoPostsData.findIndex(p => p.id === id);
        if (index !== -1) {
          demoPostsData[index] = { ...demoPostsData[index], content };
          return demoPostsData[index];
        }
        return null;
      }
      return socialApi.updatePost(id, content);
    },
    onSuccess: (post: any) => {
      if (post) {
        queryClient.setQueryData(queryKeys.social.postDetail(post.id), post);
        invalidateQueries.social();
      }
    },
  });
}

/**
 * Delete post
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (DEMO_MODE) {
        const index = demoPostsData.findIndex(p => p.id === id);
        if (index !== -1) {
          demoPostsData.splice(index, 1);
        }
        return { success: true };
      }
      return socialApi.deletePost(id);
    },
    onSuccess: () => {
      invalidateQueries.social();
    },
  });
}

/**
 * Add reaction to post
 */
export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: ReactionType }) => {
      if (DEMO_MODE) {
        const index = demoPostsData.findIndex(p => p.id === postId);
        if (index !== -1) {
          const reactions = demoPostsData[index].reactions_count || {};
          (reactions as any)[type] = ((reactions as any)[type] || 0) + 1;
          demoPostsData[index] = { ...demoPostsData[index], reactions_count: reactions };
        }
        return { success: true };
      }
      return socialApi.addReaction(postId, type);
    },
    onSuccess: (_, { postId }) => {
      invalidateQueries.post(postId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.reactions(postId),
      });
    },
  });
}

/**
 * Remove reaction from post
 */
export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return socialApi.removeReaction(postId);
    },
    onSuccess: (_, postId) => {
      invalidateQueries.post(postId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.reactions(postId),
      });
    },
  });
}

/**
 * Toggle reaction (add/remove/change)
 */
export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: ReactionType }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return socialApi.toggleReaction(postId, type);
    },
    onSuccess: (_, { postId }) => {
      invalidateQueries.post(postId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.reactions(postId),
      });
    },
  });
}

/**
 * Get reactions for a post
 */
export function useReactions(postId: string) {
  return useQuery({
    queryKey: queryKeys.social.reactions(postId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [];
      }
      return socialApi.getReactions(postId);
    },
    enabled: !!postId,
  });
}

/**
 * Get comments for a post
 */
export function useComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.social.comments(postId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [
          { id: '1', content: 'ما شاء الله!', author: { full_name: 'فاطمة' }, created: new Date().toISOString() },
          { id: '2', content: 'بارك الله فيكم', author: { full_name: 'محمد' }, created: new Date().toISOString() },
        ];
      }
      return socialApi.getComments(postId);
    },
    enabled: !!postId,
  });
}

/**
 * Add comment to post
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      content,
      replyToId,
    }: {
      postId: string;
      content: string;
      replyToId?: string;
    }) => {
      if (DEMO_MODE) {
        return {
          id: `demo-comment-${Date.now()}`,
          content,
          author: { full_name: DEMO_USER.full_name },
          created: new Date().toISOString(),
        };
      }
      return socialApi.addComment(postId, { content, reply_to_id: replyToId });
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.comments(postId),
      });
      invalidateQueries.post(postId);
    },
  });
}

/**
 * Update comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      commentId,
      content,
    }: {
      postId: string;
      commentId: string;
      content: string;
    }) => {
      if (DEMO_MODE) {
        return { id: commentId, content };
      }
      return socialApi.updateComment(postId, commentId, content);
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.comments(postId),
      });
    },
  });
}

/**
 * Delete comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, commentId }: { postId: string; commentId: string }) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return socialApi.deleteComment(postId, commentId);
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.comments(postId),
      });
      invalidateQueries.post(postId);
    },
  });
}

/**
 * Get stories
 */
export function useStories(familyId: string) {
  return useQuery({
    queryKey: queryKeys.social.stories(familyId),
    queryFn: async () => {
      if (DEMO_MODE) {
        return [];
      }
      return socialApi.getStories(familyId);
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create story
 */
export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      mediaUri,
      content,
      isSistersOnly,
    }: {
      familyId: string;
      mediaUri: string;
      content?: string;
      isSistersOnly?: boolean;
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-story-${Date.now()}`, media_url: mediaUri, content };
      }
      return socialApi.createStory(familyId, mediaUri, content, isSistersOnly);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.stories(familyId),
      });
    },
  });
}

/**
 * View story (mark as viewed)
 */
export function useViewStory() {
  return useMutation({
    mutationFn: async (storyId: string) => {
      if (DEMO_MODE) {
        return { success: true };
      }
      return socialApi.viewStory(storyId);
    },
  });
}

/**
 * Get Sisters Circle posts
 */
export function useSistersCirclePosts(familyId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.social.sistersCircle(familyId),
    queryFn: async ({ pageParam = 1 }) => {
      if (DEMO_MODE) {
        return {
          results: [],
          next: null,
          page: 1,
          count: 0,
        };
      }
      return socialApi.getSistersCirclePosts(familyId);
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!familyId,
  });
}

/**
 * Create Sisters Circle post
 */
export function useCreateSistersCirclePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      content,
      mediaUris,
    }: {
      familyId: string;
      content: string;
      mediaUris?: string[];
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-sisters-post-${Date.now()}`, content };
      }
      return socialApi.createSistersCirclePost(familyId, content, mediaUris);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.social.sistersCircle(familyId),
      });
      invalidateQueries.social();
    },
  });
}

/**
 * Get family feed (all public posts)
 */
export function useFamilyFeed(familyId: string) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.social.posts(), 'family-feed', familyId],
    queryFn: async ({ pageParam = 1 }) => {
      if (DEMO_MODE) {
        return demoPostsData;
      }
      return socialApi.getFamilyFeed(familyId, pageParam);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
    enabled: !!familyId,
  });
}

/**
 * Get user's posts
 */
export function useUserPosts(familyId: string, userId: string) {
  return useQuery({
    queryKey: [...queryKeys.social.posts(), 'user', familyId, userId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoPostsData.filter(p => p.author.id === userId);
      }
      return socialApi.getUserPosts(familyId, userId);
    },
    enabled: !!familyId && !!userId,
  });
}

/**
 * Get media posts
 */
export function useMediaPosts(familyId: string) {
  return useQuery({
    queryKey: [...queryKeys.social.posts(), 'media', familyId],
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoPostsData.filter(p => p.media && p.media.length > 0);
      }
      return socialApi.getMediaPosts(familyId);
    },
    enabled: !!familyId,
  });
}

/**
 * Search posts
 */
export function useSearchPosts(familyId: string, query: string) {
  return useQuery({
    queryKey: [...queryKeys.social.posts(), 'search', familyId, query],
    queryFn: async () => {
      if (DEMO_MODE) {
        return demoPostsData.filter(p =>
          p.content.toLowerCase().includes(query.toLowerCase())
        );
      }
      return socialApi.searchPosts(familyId, query);
    },
    enabled: !!familyId && query.length >= 2,
  });
}

/**
 * Check Sisters Circle access
 */
export function useCanAccessSistersCircle(userGender: 'male' | 'female') {
  return socialApi.canAccessSistersCircle(userGender);
}

/**
 * Get Brothers Circle posts
 */
export function useBrothersCirclePosts(familyId: string) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.social.posts(), 'brothers-circle', familyId],
    queryFn: async ({ pageParam = 1 }) => {
      if (DEMO_MODE) {
        // Demo posts for brothers circle
        const demoBrothersPosts = [
          {
            id: 'brothers-1',
            content: 'الحمد لله، تم تأسيس شركة جديدة. نسألكم الدعاء بالتوفيق.',
            author: { id: 'demo-user-1', full_name: 'أحمد محمد', is_verified: true, avatar: null },
            created: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            reactions_count: { love: 8, mashallah: 5, barakallah: 3 },
            comments_count: 4,
            media: [],
            is_brothers_only: true,
          },
          {
            id: 'brothers-2',
            content: 'يا إخوان، من يريد الانضمام لحلقة تحفيظ القرآن يوم السبت؟',
            author: { id: 'demo-user-3', full_name: 'محمد عبدالله', is_verified: false, avatar: null },
            created: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            reactions_count: { love: 12, alhamdulillah: 6 },
            comments_count: 7,
            media: [],
            is_brothers_only: true,
          },
        ];
        return {
          results: demoBrothersPosts,
          next: null,
          page: 1,
          count: demoBrothersPosts.length,
        };
      }
      return socialApi.getBrothersCirclePosts(familyId);
    },
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!familyId,
  });
}

/**
 * Create Brothers Circle post
 */
export function useCreateBrothersCirclePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      familyId,
      content,
      mediaUris,
    }: {
      familyId: string;
      content: string;
      mediaUris?: string[];
    }) => {
      if (DEMO_MODE) {
        return { id: `demo-brothers-post-${Date.now()}`, content };
      }
      return socialApi.createBrothersCirclePost(familyId, content, mediaUris);
    },
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.social.posts(), 'brothers-circle', familyId],
      });
      invalidateQueries.social();
    },
  });
}

/**
 * Check Brothers Circle access
 */
export function useCanAccessBrothersCircle(userGender: 'male' | 'female') {
  return userGender === 'male';
}
