import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { 
  createOpening, 
  fetchOpenings, 
  fetchOpeningDetail, 
  sendJoinRequest, 
  respondToJoinRequest,
  removeMember
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
  return (openingId?: string) => {
    void queryClient.invalidateQueries({ queryKey: openingsKey });
    if (openingId) {
      void queryClient.invalidateQueries({ queryKey: openingKey(openingId) });
    }
  };
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
    onSuccess: (_, variables) => invalidate(variables.opening_id),
  });
}

export function useRespondToJoinRequest(openingId: string | undefined) {
  const invalidate = useInvalidateOpening();
  return useMutation({
    mutationFn: (data: { requestId: string; status: 'accepted' | 'rejected' }) =>
      respondToJoinRequest(data.requestId, data.status),
    onSuccess: () => invalidate(openingId),
  });
}

export function useRemoveMember(openingId: string | undefined) {
  const invalidate = useInvalidateOpening();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => invalidate(openingId),
  });
}
