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
