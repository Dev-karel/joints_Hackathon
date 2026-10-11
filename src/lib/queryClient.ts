import { QueryClient } from '@tanstack/react-query';

// Satu instance untuk seluruh app; di-clear saat logout supaya data pengguna lama tidak bocor.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});
