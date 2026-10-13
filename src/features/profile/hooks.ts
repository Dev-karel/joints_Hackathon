import { useQuery } from '@tanstack/react-query';

import { fetchMyStats } from './api';

export const useMyStats = (userId: string | undefined) =>
  useQuery({
    queryKey: ['my-stats', userId],
    enabled: !!userId,
    queryFn: () => fetchMyStats(userId!),
    staleTime: 60_000,
  });
