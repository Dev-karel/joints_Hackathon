import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createOpening, fetchOpenings } from './api';

export const openingsKey = ['team-openings'] as const;

export const useOpenings = () =>
  useQuery({ queryKey: openingsKey, queryFn: fetchOpenings, refetchInterval: 60_000 });

export function useCreateOpening() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOpening,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: openingsKey }),
  });
}
