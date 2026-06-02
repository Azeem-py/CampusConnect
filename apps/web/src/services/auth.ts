import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

interface SignUpData {
  name: string;
  username: string;
  email: string;
  phone: string;
  department: string;
  school: string;
  interests: string;
  hobby: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
  banner?: string;
}

export interface ConnectionUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  school: string | null;
  department: string | null;
  major: string | null;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  department: string | null;
  school: string | null;
  interests: string | null;
  hobby: string | null;
  role: string;
  avatar: string | null;
  banner: string | null;
  reputationScore: number;
  bio: string | null;
  major: string | null;
  graduationYear: number | null;
  createdAt: string;
  following?: ConnectionUser[];
  followers?: ConnectionUser[];
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  profilePrivacy: 'PUBLIC' | 'CAMPUS_ONLY' | 'PRIVATE';
  showReputation: boolean;
  isDeactivated: boolean;
}

const CURRENT_USER_KEY = ['currentUser'];

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signUpData: SignUpData) => {
      const { data } = await api.post('/auth/signup', signUpData);
      return data.user as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_KEY, user);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data } = await api.post('/auth/login', { email, password });
      return data.user as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(CURRENT_USER_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_KEY, null);
    },
  });
}

export interface UpdateProfileData {
  name?: string;
  username?: string;
  bio?: string | null;
  phone?: string | null;
  department?: string | null;
  school?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  interests?: string | null;
  hobby?: string | null;
  avatar?: string | null;
  banner?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateProfileData>({
    mutationFn: async (payload) => {
      const { data } = await api.patch('/users/me', payload);
      return data as User;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(CURRENT_USER_KEY, updatedUser);
    },
  });
}

export interface UpdatePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

export function useUpdatePassword() {
  return useMutation<{ message: string }, Error, UpdatePasswordPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.patch('/users/me/password', payload);
      return data;
    },
  });
}

export interface UpdateEmailPayload {
  email?: string;
  currentPassword?: string;
}

export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateEmailPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.patch('/users/me/email', payload);
      return data as User;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(CURRENT_USER_KEY, updatedUser);
    },
  });
}

export interface UpdatePreferencesPayload {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyDigest?: boolean;
  profilePrivacy?: 'PUBLIC' | 'CAMPUS_ONLY' | 'PRIVATE';
  showReputation?: boolean;
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdatePreferencesPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.patch('/users/me/preferences', payload);
      return data as User;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(CURRENT_USER_KEY, updatedUser);
    },
  });
}

export function useDeactivateAccount() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post('/users/me/deactivate');
      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData(CURRENT_USER_KEY, null);
    },
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: async (followingId) => {
      const { data } = await api.post(`/users/${followingId}/follow`);
      return data as User;
    },
    onSuccess: (updatedUser, _followingId) => {
      queryClient.setQueryData(CURRENT_USER_KEY, updatedUser);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: async (followingId) => {
      const { data } = await api.post(`/users/${followingId}/unfollow`);
      return data as User;
    },
    onSuccess: (updatedUser, _followingId) => {
      queryClient.setQueryData(CURRENT_USER_KEY, updatedUser);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useUserProfile(userId: string | undefined) {
  return useQuery<User>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const { data } = await api.get(`/users/${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export interface SuggestedScholar {
  id: string;
  name: string;
  username: string;
  title: string;
  avatar?: string;
}

export function useSuggestedScholars() {
  return useQuery<SuggestedScholar[]>({
    queryKey: ['suggestedScholars'],
    queryFn: async () => {
      const { data } = await api.get('/users/suggested');
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export interface SearchedScholar {
  id: string;
  name: string | null;
  username: string;
  avatar: string | null;
  department: string | null;
  major: string | null;
}

export function useSearchScholars(query: string, enabled = true) {
  return useQuery<SearchedScholar[]>({
    queryKey: ['users', 'search', query],
    queryFn: async () => {
      const { data } = await api.get('/users/search', { params: { q: query } });
      return data;
    },
    enabled: !!query.trim() && enabled,
    staleTime: 60_000,
  });
}

