import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  acceptFriendRequest,
  fetchFriendships,
  removeFriendship,
  searchStudents,
  sendFriendRequest,
} from './api';

export const friendshipsKey = (userId: string | undefined) => ['friendships', userId] as const;

export function useFriendships(userId: string | undefined) {
  return useQuery({
    queryKey: friendshipsKey(userId),
    enabled: !!userId,
    queryFn: fetchFriendships,
    staleTime: 30_000,
  });
}

export function useStudentSearch(query: string, userId: string | undefined) {
  const term = query.trim();
  return useQuery({
    queryKey: ['student-search', term],
    enabled: !!userId && term.length >= 2,
    queryFn: () => searchStudents(term, userId!),
    staleTime: 30_000,
  });
}

function useFriendMutation<T>(userId: string | undefined, fn: (v: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: friendshipsKey(userId) }),
  });
}

export const useSendFriendRequest = (userId: string | undefined) =>
  useFriendMutation(userId, (addresseeId: string) => sendFriendRequest(userId!, addresseeId));

export const useAcceptFriendRequest = (userId: string | undefined) =>
  useFriendMutation(userId, (requesterId: string) => acceptFriendRequest(requesterId, userId!));

export const useRemoveFriendship = (userId: string | undefined) =>
  useFriendMutation(userId, (otherId: string) => removeFriendship(userId!, otherId));
