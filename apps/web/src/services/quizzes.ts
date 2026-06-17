import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type ShowResult = 'IMMEDIATE' | 'MANUAL';
export type QuestionType = 'MCQ' | 'TRUE_FALSE';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED';

export interface QuizOption {
  id: string;
  text: string;
  order: number;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuestionType;
  points: number;
  order: number;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number;
  maxAttempts: number;
  showResult: ShowResult;
  resultsPublished: boolean;
  status: QuizStatus;
  groupId: string;
  creatorId: string;
  creator: { id: string; name: string | null; username: string; avatar: string | null };
  isCreator?: boolean;
  _count: { questions: number; attempts: number };
  questions?: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  score: number | null;
  totalPoints: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  quizId: string;
  userId: string;
  user?: { id: string; name: string | null; username: string; avatar: string | null };
  _count?: { answers: number };
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  attemptId: string;
  questionId: string;
  selectedOptionId: string | null;
  question?: { id: string; text: string; type: QuestionType; points: number; order: number };
  selectedOption?: { id: string; text: string; order: number; isCorrect?: boolean };
}

export interface StartAttemptResponse {
  attempt: QuizAttempt;
  questions: QuizQuestion[];
  remainingSeconds: number;
  totalPoints: number;
}

export interface CreateQuestionPayload {
  text: string;
  type: QuestionType;
  points: number;
  order: number;
  options: { text: string; isCorrect: boolean; order: number }[];
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  timeLimit: number;
  maxAttempts: number;
  showResult: ShowResult;
  questions: CreateQuestionPayload[];
}

export interface SubmitAttemptPayload {
  attemptId: string;
  answers: { questionId: string; selectedOptionId: string }[];
}

const quizzesKey = (communityId: string, groupId: string) =>
  ['communities', communityId, 'groups', groupId, 'quizzes'] as const;

const quizKey = (communityId: string, groupId: string, quizId: string) =>
  [...quizzesKey(communityId, groupId), quizId] as const;

const myAttemptsKey = (communityId: string, groupId: string, quizId: string) =>
  [...quizKey(communityId, groupId, quizId), 'my-attempts'] as const;

const allAttemptsKey = (communityId: string, groupId: string, quizId: string) =>
  [...quizKey(communityId, groupId, quizId), 'attempts'] as const;

const attemptResultKey = (communityId: string, groupId: string, quizId: string, attemptId: string) =>
  [...quizKey(communityId, groupId, quizId), 'attempts', attemptId] as const;

export function useQuizzes(communityId: string, groupId: string) {
  return useQuery<Quiz[]>({
    queryKey: quizzesKey(communityId, groupId),
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/groups/${groupId}/quizzes`);
      return data;
    },
    enabled: !!communityId && !!groupId,
    staleTime: 15_000,
  });
}

export function useQuiz(communityId: string, groupId: string, quizId: string) {
  return useQuery<Quiz>({
    queryKey: quizKey(communityId, groupId, quizId),
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}`);
      return data;
    },
    enabled: !!communityId && !!groupId && !!quizId,
    staleTime: 10_000,
  });
}

export function useCreateQuiz(communityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, CreateQuizPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/communities/${communityId}/groups/${groupId}/quizzes`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizzesKey(communityId, groupId) });
    },
  });
}

export function useUpdateQuiz(communityId: string, groupId: string, quizId: string) {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, Partial<CreateQuizPayload>>({
    mutationFn: async (payload) => {
      const { data } = await api.patch(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(quizKey(communityId, groupId, quizId), data);
      queryClient.invalidateQueries({ queryKey: quizzesKey(communityId, groupId) });
    },
  });
}

export function useDeleteQuiz(communityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (quizId) => {
      await api.delete(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}`);
    },
    onSuccess: (_data, quizId) => {
      queryClient.removeQueries({ queryKey: quizKey(communityId, groupId, quizId) });
      queryClient.invalidateQueries({ queryKey: quizzesKey(communityId, groupId) });
    },
  });
}

export function usePublishQuiz(communityId: string, groupId: string, quizId: string) {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/publish`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(quizKey(communityId, groupId, quizId), data);
      queryClient.invalidateQueries({ queryKey: quizzesKey(communityId, groupId) });
    },
  });
}

export function useCloseQuiz(communityId: string, groupId: string, quizId: string) {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/close`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(quizKey(communityId, groupId, quizId), data);
      queryClient.invalidateQueries({ queryKey: quizzesKey(communityId, groupId) });
    },
  });
}

export function usePublishResults(communityId: string, groupId: string, quizId: string) {
  const queryClient = useQueryClient();

  return useMutation<Quiz, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/publish-results`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(quizKey(communityId, groupId, quizId), data);
      queryClient.invalidateQueries({ queryKey: allAttemptsKey(communityId, groupId, quizId) });
    },
  });
}

export function useStartAttempt(communityId: string, groupId: string, quizId: string) {
  const queryClient = useQueryClient();

  return useMutation<StartAttemptResponse, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/start`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myAttemptsKey(communityId, groupId, quizId) });
      queryClient.invalidateQueries({ queryKey: quizKey(communityId, groupId, quizId) });
    },
  });
}

export function useSubmitAttempt(
  communityId: string,
  groupId: string,
  quizId: string,
) {
  const queryClient = useQueryClient();

  return useMutation<QuizAttempt, Error, SubmitAttemptPayload>({
    mutationFn: async ({ attemptId, answers }) => {
      const { data } = await api.post(
        `/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/attempts/${attemptId}/submit`,
        { answers },
      );
      return data;
    },
    onSuccess: (_data, { attemptId }) => {
      queryClient.invalidateQueries({ queryKey: myAttemptsKey(communityId, groupId, quizId) });
      queryClient.invalidateQueries({ queryKey: allAttemptsKey(communityId, groupId, quizId) });
      queryClient.invalidateQueries({ queryKey: attemptResultKey(communityId, groupId, quizId, attemptId) });
      queryClient.invalidateQueries({ queryKey: quizKey(communityId, groupId, quizId) });
    },
  });
}

export function useMyAttempts(communityId: string, groupId: string, quizId: string) {
  return useQuery<QuizAttempt[]>({
    queryKey: myAttemptsKey(communityId, groupId, quizId),
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/my-attempts`);
      return data;
    },
    enabled: !!communityId && !!groupId && !!quizId,
    staleTime: 10_000,
  });
}

export function useAllAttempts(communityId: string, groupId: string, quizId: string) {
  return useQuery<QuizAttempt[]>({
    queryKey: allAttemptsKey(communityId, groupId, quizId),
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/attempts`);
      return data;
    },
    enabled: !!communityId && !!groupId && !!quizId,
    staleTime: 10_000,
  });
}

export function useAttemptResult(
  communityId: string,
  groupId: string,
  quizId: string,
  attemptId: string,
) {
  return useQuery<{ attempt: QuizAttempt; visible: boolean; message?: string }>({
    queryKey: attemptResultKey(communityId, groupId, quizId, attemptId),
    queryFn: async () => {
      const { data } = await api.get(
        `/communities/${communityId}/groups/${groupId}/quizzes/${quizId}/attempts/${attemptId}`,
      );
      return data;
    },
    enabled: !!communityId && !!groupId && !!quizId && !!attemptId,
    staleTime: 30_000,
  });
}
