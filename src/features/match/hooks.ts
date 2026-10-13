import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  castHostVote,
  createSession,
  fetchHostExits,
  fetchHostExitState,
  fetchMaterials,
  fetchPartners,
  fetchProfiles,
  fetchSession,
  fetchSessions,
  hostLeaveSession,
  joinSession,
  leaveSession,
  reportHost,
  resolveDueHostExits,
  uploadMaterial,
  type PickedFile,
} from './api';
import { cancelSessionReminder, scheduleSessionReminder } from './reminders';

export const sessionsKey = ['study-sessions'] as const;
export const sessionKey = (id: string | undefined) => ['study-session', id] as const;

export const usePartners = () =>
  useQuery({ queryKey: ['study-partners'], queryFn: fetchPartners, staleTime: 60_000 });

export const useSessions = () =>
  useQuery({ queryKey: sessionsKey, queryFn: fetchSessions, refetchInterval: 30_000 });

// Detail sesi: tutup dulu pengajuan host yang jatuh tempo supaya yang tampil selalu terbaru.
export const useSession = (id: string | undefined) =>
  useQuery({
    queryKey: sessionKey(id),
    enabled: !!id,
    refetchInterval: 15_000,
    queryFn: async () => {
      await resolveDueHostExits();
      return fetchSession(id!);
    },
  });

export const useProfiles = (ids: string[]) => {
  const key = [...new Set(ids)].sort();
  return useQuery({
    queryKey: ['profiles', key],
    enabled: key.length > 0,
    queryFn: () => fetchProfiles(key),
    staleTime: 5 * 60_000,
  });
};

export const useMaterials = (sessionId: string | undefined) =>
  useQuery({
    queryKey: ['session-materials', sessionId],
    enabled: !!sessionId,
    queryFn: () => fetchMaterials(sessionId!),
  });

export const useHostExits = (sessionId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: ['host-exits', sessionId],
    enabled: !!sessionId && enabled,
    refetchInterval: 15_000,
    queryFn: () => fetchHostExits(sessionId!),
  });

export const useHostExitState = (exitId: string | undefined) =>
  useQuery({
    queryKey: ['host-exit-state', exitId],
    enabled: !!exitId,
    refetchInterval: 15_000,
    queryFn: () => fetchHostExitState(exitId!),
  });

function useInvalidateSession() {
  const queryClient = useQueryClient();
  return (sessionId?: string) => {
    void queryClient.invalidateQueries({ queryKey: sessionsKey });
    if (sessionId) {
      void queryClient.invalidateQueries({ queryKey: sessionKey(sessionId) });
      void queryClient.invalidateQueries({ queryKey: ['host-exits', sessionId] });
      void queryClient.invalidateQueries({ queryKey: ['host-exit-state'] });
      void queryClient.invalidateQueries({ queryKey: ['session-materials', sessionId] });
    }
  };
}

export function useJoinSession(userId: string | undefined) {
  const invalidate = useInvalidateSession();
  return useMutation({
    mutationFn: async ({ sessionId, startsAt, title }: { sessionId: string; startsAt: string; title: string }) => {
      await joinSession(sessionId, userId!);
      // Pengingat lokal 1 jam sebelum mulai (PRD §8); gagal izin tidak membatalkan gabung.
      await scheduleSessionReminder(sessionId, title, startsAt);
    },
    onSettled: (_d, _e, v) => invalidate(v.sessionId),
  });
}

export function useLeaveSession(userId: string | undefined) {
  const invalidate = useInvalidateSession();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await leaveSession(sessionId, userId!);
      await cancelSessionReminder(sessionId);
    },
    onSettled: (_d, _e, sessionId) => invalidate(sessionId),
  });
}

export const useCreateSession = () => {
  const invalidate = useInvalidateSession();
  return useMutation({ mutationFn: createSession, onSettled: () => invalidate() });
};

export function useUploadMaterials(userId: string | undefined) {
  const invalidate = useInvalidateSession();
  return useMutation({
    mutationFn: async ({ sessionId, files }: { sessionId: string; files: PickedFile[] }) => {
      for (const file of files) await uploadMaterial(sessionId, userId!, file);
    },
    onSettled: (_d, _e, v) => invalidate(v.sessionId),
  });
}

export function useHostLeave() {
  const invalidate = useInvalidateSession();
  return useMutation({
    mutationFn: (v: { sessionId: string; reason: string; action: 'transfer' | 'cancel' }) =>
      hostLeaveSession(v.sessionId, v.reason, v.action),
    onSettled: (_d, _e, v) => invalidate(v.sessionId),
  });
}

export function useCastHostVote(sessionId: string | undefined) {
  const invalidate = useInvalidateSession();
  return useMutation({
    mutationFn: (v: { exitId: string; vote: { candidateId: string } | { approve: boolean } }) =>
      castHostVote(v.exitId, v.vote),
    onSettled: () => invalidate(sessionId),
  });
}

export const useReportHost = () =>
  useMutation({
    mutationFn: (v: { reporterId: string; hostId: string; sessionId: string; reason: string }) =>
      reportHost(v.reporterId, v.hostId, v.sessionId, v.reason),
  });
