import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createSession, fetchPartners, fetchSessions, joinSession, leaveSession } from './api';

export const usePartners = () =>
  useQuery({ queryKey: ['study-partners'], queryFn: fetchPartners, staleTime: 60_000 });

export const useSessions = () =>
  useQuery({ queryKey: ['study-sessions'], queryFn: fetchSessions, refetchInterval: 30_000 });

function useSessionMutation<T>(fn: (v: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['study-sessions'] }),
  });
}

export const useJoinSession = (userId: string | undefined) =>
  useSessionMutation((sessionId: string) => joinSession(sessionId, userId!));

export const useLeaveSession = (userId: string | undefined) =>
  useSessionMutation((sessionId: string) => leaveSession(sessionId, userId!));

export const useCreateSession = () => useSessionMutation(createSession);
