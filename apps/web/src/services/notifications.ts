import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export interface NotificationActor {
  id: string;
  name: string | null;
  username: string;
  avatar: string | null;
}

export interface NotificationItem {
  id: string;
  type: 'MENTION' | 'LIKE' | 'LIKE_COMMENT' | 'COMMENT' | 'REPLY' | 'REPOST' | 'FOLLOW' | 'SYSTEM';
  actorId: string | null;
  actor: NotificationActor | null;
  postId: string | null;
  commentId: string | null;
  metadata: Record<string, unknown> | null;
  unread: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationPreference {
  type: NotificationItem['type'];
  inApp: boolean;
  push: boolean;
}

const NOTIFICATIONS_KEY = ['notifications'];
const UNREAD_KEY = ['notifications', 'unread-count'];
const PREFS_KEY = ['notifications', 'preferences'];

export function useNotifications(
  page = 1,
  limit = 20,
  filters?: { type?: string; unread?: boolean },
) {
  return useQuery<PaginatedNotifications>({
    queryKey: [...NOTIFICATIONS_KEY, { page, limit, ...filters }],
    queryFn: async () => {
      const { data } = await api.get('/notifications', {
        params: { page, limit, type: filters?.type, unread: filters?.unread },
      });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: UNREAD_KEY,
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation<NotificationItem, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/notifications/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery<NotificationPreference[]>({
    queryKey: PREFS_KEY,
    queryFn: async () => {
      const { data } = await api.get('/notifications/preferences');
      return data;
    },
    staleTime: 300_000,
  });
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, NotificationPreference>({
    mutationFn: async (pref) => {
      const { data } = await api.patch('/notifications/preferences', pref);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFS_KEY });
    },
  });
}

export function useBulkUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, NotificationPreference[]>({
    mutationFn: async (preferences) => {
      const { data } = await api.patch('/notifications/preferences/bulk', { preferences });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFS_KEY });
    },
  });
}

export function useVapidPublicKey() {
  return useQuery<{ publicKey: string }>({
    queryKey: ['vapid-public-key'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/vapid-public-key');
      return data;
    },
    staleTime: Infinity,
  });
}

export interface SubscribePushPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function usePushSubscribe() {
  return useMutation<{ subscribed: boolean }, Error, SubscribePushPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/notifications/push-subscribe', payload);
      return data;
    },
  });
}

export function usePushUnsubscribe() {
  return useMutation<{ subscribed: boolean }, Error, string>({
    mutationFn: async (endpoint) => {
      const { data } = await api.delete('/notifications/push-subscribe', {
        params: { endpoint },
      });
      return data;
    },
  });
}
