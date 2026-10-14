import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelJoinRequest,
  createOpening,
  fetchOpeningDetail,
  fetchOpenings,
  leaveTeam,
  respondToJoinRequest,
  sendJoinRequest,
} from './api';

export const openingsKey = ['team-openings'] as const;
export const openingKey = (id: string | undefined) => ['team-opening', id] as const;

export const useOpenings = () =>
  useQuery({ queryKey: openingsKey, queryFn: fetchOpenings, refetchInterval: 60_000 });

export const useOpeningDetail = (id: string | undefined) =>
  useQuery({
    queryKey: openingKey(id),
    enabled: !!id,
    queryFn: () => fetchOpeningDetail(id!),
    refetchInterval: 30_000,
  });

function useInvalidateOpening() {
  const queryClient = useQueryClient();
  return (openingId?: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: openingsKey }),
      openingId ? queryClient.invalidateQueries({ queryKey: openingKey(openingId) }) : Promise.resolve(),
    ]);
}

export function useCreateOpening() {
  const invalidate = useInvalidateOpening();
  return useMutation({
    mutationFn: createOpening,
    onSuccess: () => invalidate(),
  });
}

export function useSendJoinRequest() {
  const invalidate = useInvalidateOpening();
  return useMutation({
    mutationFn: sendJoinRequest,
    onSuccess: (_, v) => invalidate(v.opening_id),
  });
}

export function useCancelJoinRequest(openingId: string | undefined) {
  const invalidate = useInvalidateOpening();
  return useMutation({
    mutationFn: (userId: string) => cancelJoinRequest(openingId!, userId),
    onSuccess: () => invalidate(openingId),
  });
}

export function useRespondToJoinRequest(openingId: string | undefined) {
  const invalidate = useInvalidateOpening();
  return useMutation({
    mutationFn: (v: { userId: string; accept: boolean }) => respondToJoinRequest(openingId!, v.userId, v.accept),
    onSuccess: () => invalidate(openingId),
  });
}

/** Anggota keluar sendiri, atau host mengeluarkan anggota. */
export function useLeaveTeam(openingId: string | undefined) {
  const invalidate = useInvalidateOpening();
  return useMutation({
    mutationFn: (userId: string) => leaveTeam(openingId!, userId),
    onSuccess: () => invalidate(openingId),
  });
}
