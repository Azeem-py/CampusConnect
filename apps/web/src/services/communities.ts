import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export type CommunityJoinType = 'OPEN' | 'REQUEST' | 'INVITE_ONLY';
export type CommunityMemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
export type GroupMemberRole = 'MODERATOR' | 'MEMBER';

export interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  banner: string | null;
  joinType: CommunityJoinType;
  isListed: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  institutionId: string | null;
  membership: CommunityMemberRole | null;
  owner: { id: string; name: string | null; username: string; avatar: string | null };
  institution: { id: string; name: string; acronym: string | null } | null;
  _count: { members: number; groups: number; posts: number };
}

export interface CommunityMember {
  id: string;
  role: CommunityMemberRole;
  joinedAt: string;
  user: { id: string; name: string | null; username: string; avatar: string | null };
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  banner: string | null;
  createdAt: string;
  updatedAt: string;
  communityId: string;
  membership: GroupMemberRole | null;
  _count: { members: number };
}

export interface GroupMember {
  id: string;
  role: GroupMemberRole;
  joinedAt: string;
  user: { id: string; name: string | null; username: string; avatar: string | null };
}

export interface JoinRequest {
  id: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; username: string; avatar: string | null };
}

export interface PaginatedMembers {
  members: CommunityMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedGroups {
  groups: CommunityGroup[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const COMMUNITIES_KEY = ['communities'];
const MY_COMMUNITIES_KEY = ['communities', 'mine'];
const communityKey = (id: string) => ['communities', id];
const membersKey = (id: string) => ['communities', id, 'members'];
const requestsKey = (id: string) => ['communities', id, 'requests'];
const groupsKey = (communityId: string) => ['communities', communityId, 'groups'];
const groupKey = (communityId: string, groupId: string) => ['communities', communityId, 'groups', groupId];

export function useCommunities(institutionId?: string, search?: string, page = 1, limit = 20) {
  return useQuery<{ communities: Community[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: [...COMMUNITIES_KEY, { institutionId, search, page, limit }],
    queryFn: async () => {
      const { data } = await api.get('/communities', { params: { institutionId, search, page, limit } });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useMyCommunities() {
  return useQuery<Community[]>({
    queryKey: MY_COMMUNITIES_KEY,
    queryFn: async () => {
      const { data } = await api.get('/communities/mine');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCommunity(id: string) {
  return useQuery<Community>({
    queryKey: communityKey(id),
    queryFn: async () => {
      const { data } = await api.get(`/communities/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();

  return useMutation<Community, Error, {
    name: string;
    description?: string;
    avatar?: string;
    banner?: string;
    joinType?: CommunityJoinType;
    isListed?: boolean;
    institutionId?: string;
  }>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/communities', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_KEY });
      queryClient.invalidateQueries({ queryKey: MY_COMMUNITIES_KEY });
    },
  });
}

export function useUpdateCommunity(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Community, Error, {
    name?: string;
    description?: string;
    avatar?: string;
    banner?: string;
    joinType?: CommunityJoinType;
    isListed?: boolean;
    institutionId?: string;
  }>({
    mutationFn: async (payload) => {
      const { data } = await api.patch(`/communities/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(communityKey(id), data);
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_KEY });
    },
  });
}

export function useDeleteCommunity() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/communities/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: communityKey(id) });
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_KEY });
      queryClient.invalidateQueries({ queryKey: MY_COMMUNITIES_KEY });
    },
  });
}

export function useTransferOwnership(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Community, Error, { targetUserId: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/communities/${id}/transfer`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(communityKey(id), data);
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_KEY });
    },
  });
}

export function useCommunityMembers(id: string, role?: CommunityMemberRole, page = 1, limit = 30) {
  return useQuery<PaginatedMembers>({
    queryKey: [...membersKey(id), { role, page, limit }],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${id}/members`, { params: { role, page, limit } });
      return data;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useAddMember(id: string) {
  const queryClient = useQueryClient();

  return useMutation<CommunityMember, Error, { userId: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/communities/${id}/members`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(id) });
      queryClient.invalidateQueries({ queryKey: communityKey(id) });
    },
  });
}

export function useUpdateMemberRole(id: string) {
  const queryClient = useQueryClient();

  return useMutation<CommunityMember, Error, { memberId: string; role: CommunityMemberRole }>({
    mutationFn: async ({ memberId, role }) => {
      const { data } = await api.patch(`/communities/${id}/members/${memberId}`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(id) });
      queryClient.invalidateQueries({ queryKey: communityKey(id) });
    },
  });
}

export function useRemoveMember(id: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (memberId) => {
      await api.delete(`/communities/${id}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(id) });
      queryClient.invalidateQueries({ queryKey: communityKey(id) });
    },
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();

  return useMutation<{ joined: boolean; requiresApproval: boolean; member?: CommunityMember }, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/communities/${id}/join`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: communityKey(id) });
      queryClient.invalidateQueries({ queryKey: MY_COMMUNITIES_KEY });
    },
  });
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.post(`/communities/${id}/leave`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: communityKey(id) });
      queryClient.invalidateQueries({ queryKey: MY_COMMUNITIES_KEY });
      queryClient.invalidateQueries({ queryKey: COMMUNITIES_KEY });
    },
  });
}

export function useJoinRequests(id: string) {
  return useQuery<JoinRequest[]>({
    queryKey: requestsKey(id),
    queryFn: async () => {
      const { data } = await api.get(`/communities/${id}/requests`);
      return data;
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useHandleJoinRequest(id: string) {
  const queryClient = useQueryClient();

  return useMutation<{ approved: boolean }, Error, { requestId: string; status: 'APPROVED' | 'DECLINED' }>({
    mutationFn: async ({ requestId, status }) => {
      const { data } = await api.patch(`/communities/${id}/requests/${requestId}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestsKey(id) });
      queryClient.invalidateQueries({ queryKey: membersKey(id) });
      queryClient.invalidateQueries({ queryKey: communityKey(id) });
    },
  });
}

export function useCommunityGroups(communityId: string) {
  return useQuery<CommunityGroup[]>({
    queryKey: groupsKey(communityId),
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/groups`);
      return data;
    },
    enabled: !!communityId,
    staleTime: 30_000,
  });
}

export function useCommunityGroup(communityId: string, groupId: string) {
  return useQuery<CommunityGroup>({
    queryKey: groupKey(communityId, groupId),
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/groups/${groupId}`);
      return data;
    },
    enabled: !!communityId && !!groupId,
    staleTime: 15_000,
  });
}

export function useCreateGroup(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation<CommunityGroup, Error, { name: string; description?: string; avatar?: string; banner?: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/communities/${communityId}/groups`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKey(communityId) });
    },
  });
}

export function useUpdateGroup(communityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<CommunityGroup, Error, { name?: string; description?: string; avatar?: string; banner?: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.patch(`/communities/${communityId}/groups/${groupId}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(groupKey(communityId, groupId), data);
      queryClient.invalidateQueries({ queryKey: groupsKey(communityId) });
    },
  });
}

export function useDeleteGroup(communityId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (groupId) => {
      await api.delete(`/communities/${communityId}/groups/${groupId}`);
    },
    onSuccess: (_data, groupId) => {
      queryClient.removeQueries({ queryKey: groupKey(communityId, groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKey(communityId) });
    },
  });
}

export function useGroupMembers(communityId: string, groupId: string, role?: GroupMemberRole, page = 1, limit = 30) {
  return useQuery<{ members: GroupMember[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: [...groupsKey(communityId), groupId, 'members', { role, page, limit }],
    queryFn: async () => {
      const { data } = await api.get(`/communities/${communityId}/groups/${groupId}/members`, { params: { role, page, limit } });
      return data;
    },
    enabled: !!communityId && !!groupId,
    staleTime: 15_000,
  });
}

export function useAddGroupMember(communityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<GroupMember, Error, { userId: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post(`/communities/${communityId}/groups/${groupId}/members`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...groupsKey(communityId), groupId, 'members'] });
    },
  });
}

export function useUpdateGroupMemberRole(communityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<GroupMember, Error, { memberId: string; role: GroupMemberRole }>({
    mutationFn: async ({ memberId, role }) => {
      const { data } = await api.patch(`/communities/${communityId}/groups/${groupId}/members/${memberId}`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...groupsKey(communityId), groupId, 'members'] });
    },
  });
}

export function useRemoveGroupMember(communityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (memberId) => {
      await api.delete(`/communities/${communityId}/groups/${groupId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...groupsKey(communityId), groupId, 'members'] });
    },
  });
}

export function useJoinGroup(communityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<GroupMember, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(`/communities/${communityId}/groups/${groupId}/join`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKey(communityId) });
      queryClient.invalidateQueries({ queryKey: [...groupsKey(communityId), groupId, 'members'] });
    },
  });
}

export function useLeaveGroup(communityId: string, groupId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post(`/communities/${communityId}/groups/${groupId}/leave`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKey(communityId) });
      queryClient.invalidateQueries({ queryKey: [...groupsKey(communityId), groupId, 'members'] });
    },
  });
}
