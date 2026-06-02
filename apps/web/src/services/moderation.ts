import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { Report, CreateReportDto, ResolveReportDto } from '@campus-connect/types';

export function useCreateReport() {
  return useMutation<Report, Error, CreateReportDto>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/moderation/reports', payload);
      return data;
    },
  });
}

export function useReports(status?: string, reason?: string, page = 1, limit = 20) {
  return useQuery<{ reports: Report[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: ['moderation', 'reports', { status, reason, page, limit }],
    queryFn: async () => {
      const { data } = await api.get('/moderation/reports', {
        params: { status, reason, page, limit },
      });
      return data;
    },
    staleTime: 10_000,
  });
}

export function useReportMetrics() {
  return useQuery<{ pending: number; resolved: number; dismissed: number; activeInfractions: number }>({
    queryKey: ['moderation', 'metrics'],
    queryFn: async () => {
      const { data } = await api.get('/moderation/metrics');
      return data;
    },
    refetchInterval: 15_000, // auto-refresh metrics every 15s
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { id: string; payload: ResolveReportDto }>({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.patch(`/moderation/reports/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
