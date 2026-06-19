import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export interface NoteAccessUser {
  id: string;
  name: string | null;
  username: string;
  avatar: string | null;
}

export interface NoteAccess {
  id: string;
  noteId: string;
  userId: string;
  permission: 'READ' | 'WRITE';
  user?: NoteAccessUser;
}

export interface PersonalNote {
  id: string;
  title: string | null;
  content: string;
  images: string[];
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  sharedWith?: NoteAccess[];
  user?: NoteAccessUser;
}

export interface CreateNotePayload {
  title?: string;
  content: string;
  images?: string[];
  isPublic?: boolean;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  images?: string[];
  isPublic?: boolean;
}

export interface ShareNotePayload {
  userIds: string[];
  permission: 'READ' | 'WRITE';
}

const NOTES_KEY = ['notes'];

function noteKey(id: string) {
  return ['notes', id];
}

export function useMyNotes() {
  return useQuery<PersonalNote[]>({
    queryKey: [...NOTES_KEY, 'mine'],
    queryFn: async () => {
      const { data } = await api.get('/notes/mine');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useSharedNotes() {
  return useQuery<PersonalNote[]>({
    queryKey: [...NOTES_KEY, 'shared-with-me'],
    queryFn: async () => {
      const { data } = await api.get('/notes/shared-with-me');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUserPublicNotes(userId: string | undefined) {
  return useQuery<PersonalNote[]>({
    queryKey: [...NOTES_KEY, 'user', userId],
    queryFn: async () => {
      const { data } = await api.get(`/notes/user/${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useNote(id: string | undefined) {
  return useQuery<PersonalNote>({
    queryKey: noteKey(id!),
    queryFn: async () => {
      const { data } = await api.get(`/notes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation<PersonalNote, Error, CreateNotePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/notes', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, 'mine'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation<PersonalNote, Error, { id: string; payload: UpdateNotePayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch(`/notes/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(noteKey(data.id), data);
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, 'mine'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/notes/${id}`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: noteKey(id) });
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, 'mine'] });
    },
  });
}

export function useShareNote() {
  const queryClient = useQueryClient();

  return useMutation<PersonalNote, Error, { id: string; payload: ShareNotePayload }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.post(`/notes/${id}/share`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(noteKey(data.id), data);
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, 'mine'] });
    },
  });
}

export function useUpdateNoteAccess() {
  const queryClient = useQueryClient();

  return useMutation<PersonalNote, Error, { id: string; targetUserId: string; permission: string }>({
    mutationFn: async ({ id, targetUserId, permission }) => {
      const { data } = await api.patch(`/notes/${id}/share/${targetUserId}`, { permission });
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(noteKey(data.id), data);
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, 'mine'] });
    },
  });
}

export function useRemoveNoteAccess() {
  const queryClient = useQueryClient();

  return useMutation<PersonalNote, Error, { id: string; targetUserId: string }>({
    mutationFn: async ({ id, targetUserId }) => {
      const { data } = await api.delete(`/notes/${id}/share/${targetUserId}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(noteKey(data.id), data);
      queryClient.invalidateQueries({ queryKey: [...NOTES_KEY, 'mine'] });
    },
  });
}
