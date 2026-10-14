import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileKey } from '@/features/auth/useProfile';

import { fetchMyActivity, fetchMyStats, uploadAvatar, type PickedAvatar } from './api';

export const useMyStats = (userId: string | undefined) =>
  useQuery({
    queryKey: ['my-stats', userId],
    enabled: !!userId,
    queryFn: () => fetchMyStats(userId!),
    staleTime: 60_000,
  });

export const useMyActivity = (userId: string | undefined) =>
  useQuery({
    queryKey: ['my-activity', userId],
    enabled: !!userId,
    queryFn: () => fetchMyActivity(userId!),
  });

export function useUploadAvatar(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (picked: PickedAvatar) => uploadAvatar(userId!, picked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}
