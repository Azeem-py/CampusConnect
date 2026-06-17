import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface Institution {
  id: string;
  name: string;
  type: 'UNIVERSITY' | 'POLYTECHNIC' | 'COLLEGE_OF_EDUCATION' | 'COLLEGE_OF_HEALTH';
  state: string | null;
  acronym: string | null;
}

export interface Department {
  id: string;
  name: string;
  institutionId: string;
}

export function useInstitutions(type?: string) {
  return useQuery<Institution[]>({
    queryKey: ['institutions', type],
    queryFn: async () => {
      const params = type ? { type } : {};
      const { data } = await api.get('/institutions', { params });
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useInstitution(id: string | undefined) {
  return useQuery<Institution & { departments: Department[] }>({
    queryKey: ['institution', id],
    queryFn: async () => {
      const { data } = await api.get(`/institutions/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}

export function useDepartments(institutionId: string | undefined) {
  return useQuery<Department[]>({
    queryKey: ['departments', institutionId],
    queryFn: async () => {
      const { data } = await api.get(`/institutions/${institutionId}/departments`);
      return data;
    },
    enabled: !!institutionId,
    staleTime: 1000 * 60 * 30,
  });
}
