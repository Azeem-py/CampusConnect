import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  PaginatedUsers,
  AdminUserDetail,
  UpdateUserByAdminDto,
  AdminInstitution,
  PaginatedPosts,
  BannedWord,
  CreateBannedWordDto,
  AdminAnalyticsOverview,
  UserAnalytics,
  PostAnalytics,
  EngagementAnalytics,
} from '@campus-connect/types';

// ─────────────── USERS ───────────────

export function useAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) {
  return useQuery<PaginatedUsers>({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/users', { params });
      return data;
    },
    staleTime: 10_000,
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery<AdminUserDetail>({
    queryKey: ['admin', 'users', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; data: UpdateUserByAdminDto }>({
    mutationFn: async ({ id, data }) => {
      const { data: res } = await api.patch(`/admin/users/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useDisableAdminUser() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/admin/users/${id}/disable`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useFlagAdminUser() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; reason?: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post(`/admin/users/${id}/flag`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/admin/users/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// ─────────────── INSTITUTIONS ───────────────

export function useAdminInstitutions(type?: string) {
  return useQuery<AdminInstitution[]>({
    queryKey: ['admin', 'institutions', type],
    queryFn: async () => {
      const params = type ? { type } : {};
      const { data } = await api.get('/admin/institutions', { params });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAdminInstitution(id: string | undefined) {
  return useQuery<AdminInstitution>({
    queryKey: ['admin', 'institutions', id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/institutions/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { name: string; type: string; state?: string; acronym?: string }>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/admin/institutions', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'institutions'] });
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; data: Partial<{ name: string; type: string; state?: string; acronym?: string }> }>({
    mutationFn: async ({ id, data }) => {
      const { data: res } = await api.patch(`/admin/institutions/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'institutions'] });
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
}

export function useDeleteInstitution() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/admin/institutions/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'institutions'] });
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { institutionId: string; name: string }>({
    mutationFn: async ({ institutionId, name }) => {
      const { data } = await api.post(`/admin/institutions/${institutionId}/departments`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'institutions'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; name: string }>({
    mutationFn: async ({ id, name }) => {
      const { data } = await api.patch(`/admin/departments/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'institutions'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/admin/departments/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'institutions'] });
    },
  });
}

// ─────────────── POSTS & COMMENTS ───────────────

export function useAdminPosts(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery<PaginatedPosts>({
    queryKey: ['admin', 'posts', params],
    queryFn: async () => {
      const { data } = await api.get('/admin/posts', { params });
      return data;
    },
    staleTime: 10_000,
  });
}

export function useDeleteAdminPost() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/admin/posts/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useFlagAdminPost() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; reason?: string }>({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post(`/admin/posts/${id}/flag`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
    },
  });
}

export function useUnflagAdminPost() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/admin/posts/${id}/unflag`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeleteAdminComment() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/admin/comments/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
  });
}

// ─────────────── BANNED WORDS ───────────────

export function useBannedWords() {
  return useQuery<BannedWord[]>({
    queryKey: ['admin', 'banned-words'],
    queryFn: async () => {
      const { data } = await api.get('/admin/banned-words');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useCreateBannedWord() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, CreateBannedWordDto>({
    mutationFn: async (dto) => {
      const { data } = await api.post('/admin/banned-words', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banned-words'] });
    },
  });
}

export function useUpdateBannedWord() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { id: string; data: CreateBannedWordDto }>({
    mutationFn: async ({ id, data }) => {
      const { data: res } = await api.patch(`/admin/banned-words/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banned-words'] });
    },
  });
}

export function useDeleteBannedWord() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/admin/banned-words/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banned-words'] });
    },
  });
}

// ─────────────── ANALYTICS ───────────────

export function useAdminAnalyticsOverview() {
  return useQuery<AdminAnalyticsOverview>({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/overview');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAdminUserAnalytics(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery<UserAnalytics>({
    queryKey: ['admin', 'analytics', 'users', period],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/users', { params: { period } });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAdminPostAnalytics(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery<PostAnalytics>({
    queryKey: ['admin', 'analytics', 'posts', period],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/posts', { params: { period } });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAdminEngagementAnalytics(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery<EngagementAnalytics>({
    queryKey: ['admin', 'analytics', 'engagement', period],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/engagement', { params: { period } });
      return data;
    },
    staleTime: 30_000,
  });
}
