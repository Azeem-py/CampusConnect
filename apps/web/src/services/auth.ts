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

interface User {
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
  following?: { id: string }[];
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

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: async (followingId) => {
      const { data } = await api.post(`/users/${followingId}/follow`);
      return data as User;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(CURRENT_USER_KEY, updatedUser);
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
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(CURRENT_USER_KEY, updatedUser);
    },
  });
}

