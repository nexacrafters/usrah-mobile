/**
 * Forum Query Hooks
 * React Query hooks for community forum features
 */
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { forumApi, ForumPost, ForumComment, ForumCategory } from '../../services/api/forum';

const forumKeys = {
  all: ['forum'] as const,
  posts: () => [...forumKeys.all, 'posts'] as const,
  postsList: (filters?: Record<string, unknown>) => [...forumKeys.posts(), 'list', filters] as const,
  postDetail: (id: string) => [...forumKeys.posts(), 'detail', id] as const,
  comments: (postId: string) => [...forumKeys.all, 'comments', postId] as const,
  categories: () => [...forumKeys.all, 'categories'] as const,
  bookmarked: () => [...forumKeys.all, 'bookmarked'] as const,
};

/**
 * Get forum posts with pagination
 */
export function useForumPosts(filters?: {
  category?: string;
  sort?: 'trending' | 'recent';
  search?: string;
}) {
  return useInfiniteQuery({
    queryKey: forumKeys.postsList(filters),
    queryFn: ({ pageParam = 1 }) =>
      forumApi.getPosts({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Get single post
 */
export function useForumPost(id: string) {
  return useQuery({
    queryKey: forumKeys.postDetail(id),
    queryFn: () => forumApi.getPost(id),
    enabled: !!id,
  });
}

/**
 * Create post
 */
export function useCreateForumPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; content: string; category: string }) =>
      forumApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.posts() });
    },
  });
}

/**
 * Delete post
 */
export function useDeleteForumPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => forumApi.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: forumKeys.posts() });
    },
  });
}

/**
 * Toggle like
 */
export function useToggleForumLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => forumApi.toggleLike(postId),
    onMutate: async (postId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: forumKeys.posts() });
    },
    onSuccess: (result, postId) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.postDetail(postId) });
      queryClient.invalidateQueries({ queryKey: forumKeys.posts() });
    },
  });
}

/**
 * Toggle bookmark
 */
export function useToggleForumBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => forumApi.toggleBookmark(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.postDetail(postId) });
      queryClient.invalidateQueries({ queryKey: forumKeys.posts() });
      queryClient.invalidateQueries({ queryKey: forumKeys.bookmarked() });
    },
  });
}

/**
 * Get post comments
 */
export function useForumComments(postId: string) {
  return useInfiniteQuery({
    queryKey: forumKeys.comments(postId),
    queryFn: ({ pageParam = 1 }) => forumApi.getComments(postId, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!postId,
  });
}

/**
 * Add comment
 */
export function useAddForumComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      forumApi.addComment(postId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: forumKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: forumKeys.postDetail(postId) });
    },
  });
}

/**
 * Get categories
 */
export function useForumCategories() {
  return useQuery({
    queryKey: forumKeys.categories(),
    queryFn: () => forumApi.getCategories(),
  });
}

/**
 * Get bookmarked posts
 */
export function useBookmarkedPosts() {
  return useInfiniteQuery({
    queryKey: forumKeys.bookmarked(),
    queryFn: ({ pageParam = 1 }) => forumApi.getBookmarkedPosts(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Export API for direct access
 */
export { forumApi };
