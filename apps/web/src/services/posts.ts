import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export interface EventData {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

export interface PollData {
  question: string;
  options: string[];
}

export interface CreatePostPayload {
  content: string;
  title?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  courseCode?: string;
  event?: EventData | null;
  poll?: PollData | null;
}

export interface UpdatePostPayload {
  title?: string;
  content?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  courseCode?: string;
  event?: EventData | null;
  poll?: PollData | null;
}

export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  reputationScore: number;
}

export interface PollOptionWithCount {
  id: string;
  text: string;
  _count: { votes: number };
}

export interface PostEvent {
  id: string;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
}

export interface PostPoll {
  id: string;
  question: string;
  options: PollOptionWithCount[];
}

export interface Post {
  id: string;
  title: string | null;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  courseCode: string | null;
  authorId: string;
  author: PostAuthor;
  event: PostEvent | null;
  poll: PostPoll | null;
  votes?: { userId: string; value: number }[];
  bookmarks?: { userId: string }[];
  originalPostId?: string | null;
  originalPost?: Post | null;
  _count: { votes: number; comments: number; reposts: number };
  createdAt: string;
  updatedAt: string;
}

export interface PostWithComments extends Post {
  comments: Comment[];
}

export interface CommentVote {
  id: string;
  value: number;
  userId: string;
  commentId: string;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: { id: string; name: string; username: string; avatar: string | null };
  createdAt: string;
  parentId?: string | null;
  replies?: Comment[];
  votes?: CommentVote[];
}

export interface PaginatedResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string | null;
  description: string | null;
  postId: string;
  post: {
    id: string;
    title: string | null;
    courseCode: string | null;
    author: { id: string; name: string; username: string; avatar: string | null };
  };
}

const POSTS_KEY = ['posts'];
const DRAFTS_KEY = ['posts', 'drafts'];
const EVENTS_KEY = ['events'];
const postKey = (id: string) => ['posts', id];

export function usePosts(page = 1, limit = 20, followingOf?: string, search?: string) {
  return useQuery<PaginatedResponse>({
    queryKey: [...POSTS_KEY, { page, limit, followingOf, search }],
    queryFn: async () => {
      const { data } = await api.get('/posts', { params: { page, limit, followingOf, search } });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUserPosts(userId: string | undefined, page = 1, limit = 20, votedBy?: string) {
  return useQuery<PaginatedResponse>({
    queryKey: [...POSTS_KEY, 'user', userId, 'voted', votedBy, { page, limit }],
    queryFn: async () => {
      const { data } = await api.get('/posts', { params: { page, limit, authorId: userId, votedBy } });
      return data;
    },
    enabled: !!userId || !!votedBy,
    staleTime: 30_000,
  });
}

export function usePost(id: string, enabled = true) {
  return useQuery<PostWithComments>({
    queryKey: postKey(id),
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`);
      return data;
    },
    enabled: !!id && enabled,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation<Comment, Error, { postId: string; content: string; parentId?: string }>({
    mutationFn: async ({ postId, content, parentId }) => {
      const { data } = await api.post(`/posts/${postId}/comments`, { content, parentId });
      return data;
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKey(postId) });
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

export function useVoteSocial() {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; value: number },
    Error,
    { postId?: string; commentId?: string; value: 1 | -1 | 0 }
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post('/social/vote', payload);
      return data;
    },
    onSuccess: (_data, { postId }) => {
      if (postId) {
        queryClient.invalidateQueries({ queryKey: postKey(postId) });
      }
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { postId: string; commentId: string }>({
    mutationFn: async ({ postId, commentId }) => {
      await api.delete(`/posts/${postId}/comments/${commentId}`);
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKey(postId) });
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

export function useDrafts() {
  return useQuery<Post[]>({
    queryKey: DRAFTS_KEY,
    queryFn: async () => {
      const { data } = await api.get('/posts/drafts');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, CreatePostPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/posts', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFTS_KEY });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, { id: string; payload: UpdatePostPayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch(`/posts/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(postKey(data.id), data);
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFTS_KEY });
    },
  });
}

export function usePublishPost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/posts/${id}/publish`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(postKey(data.id), data);
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFTS_KEY });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/posts/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: postKey(id) });
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
      queryClient.invalidateQueries({ queryKey: DRAFTS_KEY });
    },
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();

  return useMutation<
    { voted: boolean; pollOptionId: string | null },
    Error,
    { pollId: string; pollOptionId: string }
  >({
    mutationFn: async ({ pollId, pollOptionId }) => {
      const { data } = await api.post(`/polls/${pollId}/vote`, { pollOptionId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

export function useUpcomingEvents(limit = 10) {
  return useQuery<UpcomingEvent[]>({
    queryKey: [...EVENTS_KEY, { limit }],
    queryFn: async () => {
      const { data } = await api.get('/events', { params: { limit } });
      return data;
    },
    staleTime: 60_000,
  });
}

export interface TrendingTopic {
  category: string;
  label: string;
  posts: string;
}

export function useTrendingTopics() {
  return useQuery<TrendingTopic[]>({
    queryKey: ['social', 'trending'],
    queryFn: async () => {
      const { data } = await api.get('/social/trending');
      return data;
    },
    staleTime: 120_000,
  });
}

export function useRepostPost() {
  const queryClient = useQueryClient();

  return useMutation<{ reposted: boolean; post: Post | null }, Error, string>({
    mutationFn: async (postId) => {
      const { data } = await api.post(`/posts/${postId}/repost`);
      return data;
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: postKey(postId) });
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

export function useQuotePost() {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, { postId: string; content: string }>({
    mutationFn: async ({ postId, content }) => {
      const { data } = await api.post(`/posts/${postId}/quote`, { content });
      return data;
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKey(postId) });
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation<{ bookmarked: boolean }, Error, string>({
    mutationFn: async (postId) => {
      const { data } = await api.post(`/posts/${postId}/bookmark`);
      return data;
    },
    onSuccess: (_data, postId) => {
      queryClient.invalidateQueries({ queryKey: postKey(postId) });
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}

export function useBookmarkedPosts(page = 1, limit = 20) {
  return useQuery<PaginatedResponse>({
    queryKey: [...POSTS_KEY, 'bookmarked', { page, limit }],
    queryFn: async () => {
      const { data } = await api.get('/posts/bookmarked', { params: { page, limit } });
      return data;
    },
    staleTime: 30_000,
  });
}
