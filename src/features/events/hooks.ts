import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { friendshipsKey } from '@/features/friends/hooks';

import {
  createEvent,
  fetchApprovedVenues,
  fetchEvent,
  fetchMyReconnectVotes,
  fetchReconnectCandidates,
  fetchRecentlyAttended,
  fetchUpcomingEvents,
  saveReconnectVotes,
  setRsvp,
  type EventItem,
} from './api';
import { cancelEventReminders, scheduleEventReminders } from './reminders';

export const eventsKey = ['events'] as const;
export const eventKey = (id: string | undefined) => ['event', id] as const;

export const useUpcomingEvents = () =>
  useQuery({ queryKey: eventsKey, queryFn: fetchUpcomingEvents, refetchInterval: 60_000 });

export const useRecentlyAttended = (userId: string | undefined) =>
  useQuery({
    queryKey: ['events-recent', userId],
    enabled: !!userId,
    queryFn: () => fetchRecentlyAttended(userId!),
    staleTime: 60_000,
  });

export const useEvent = (id: string | undefined) =>
  useQuery({ queryKey: eventKey(id), enabled: !!id, queryFn: () => fetchEvent(id!) });

export const useApprovedVenues = () =>
  useQuery({ queryKey: ['venues'], queryFn: fetchApprovedVenues, staleTime: 10 * 60_000 });

export function useRsvp(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ event, going }: { event: EventItem; going: boolean }) => {
      await setRsvp(event.id, userId!, going);
      // Pengingat lokal (H-1 dan 3 jam sebelum acara); gagal izin tidak membatalkan RSVP.
      if (going) await scheduleEventReminders(event);
      else await cancelEventReminders(event.id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: eventsKey });
      void queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsKey }),
  });
}

export const useReconnectCandidates = (eventId: string | undefined) =>
  useQuery({
    queryKey: ['reconnect-candidates', eventId],
    enabled: !!eventId,
    queryFn: () => fetchReconnectCandidates(eventId!),
  });

export const useMyReconnectVotes = (eventId: string | undefined, userId: string | undefined) =>
  useQuery({
    queryKey: ['reconnect-votes', eventId, userId],
    enabled: !!eventId && !!userId,
    queryFn: () => fetchMyReconnectVotes(eventId!, userId!),
  });

export function useSaveReconnectVotes(eventId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ previous, next }: { previous: string[]; next: string[] }) =>
      saveReconnectVotes(eventId!, userId!, previous, next),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['reconnect-votes', eventId, userId] });
      // Saling pilih membuat pertemanan di server.
      void queryClient.invalidateQueries({ queryKey: friendshipsKey(userId) });
    },
  });
}
