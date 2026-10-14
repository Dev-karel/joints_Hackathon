import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchConversations,
  fetchMemberReads,
  fetchMessages,
  getOrCreateDirect,
  markConversationRead,
  MESSAGE_PAGE_SIZE,
  sendMessage,
} from './api';

export const conversationsKey = ['conversations'] as const;
export const messagesKey = (id: string | undefined) => ['messages', id] as const;
export const memberReadsKey = (id: string | undefined) => ['member-reads', id] as const;

// Realtime (useRealtimeSync) memicu muat ulang saat ada pesan; polling jadi cadangan
// bila koneksi Realtime putus.
export const useConversations = () =>
  useQuery({ queryKey: conversationsKey, queryFn: fetchConversations, refetchInterval: 15_000 });

/** Jumlah pesan belum dibaca di semua percakapan (titik di ikon Pesan). */
export function useUnreadTotal() {
  const { data } = useConversations();
  return (data ?? []).reduce((sum, c) => sum + c.unread, 0);
}

// Pesan satu percakapan, dimuat bertahap (terbaru dulu); halaman lama dimuat saat menggulir ke atas.
export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: messagesKey(conversationId),
    enabled: !!conversationId,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchMessages(conversationId!, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.length >= MESSAGE_PAGE_SIZE ? lastPage[lastPage.length - 1]?.created_at : undefined,
    refetchInterval: 10_000,
  });
}

/** Penanda baca anggota percakapan (indikator "Dibaca" di chat langsung). */
export const useMemberReads = (conversationId: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: memberReadsKey(conversationId),
    enabled: !!conversationId && enabled,
    queryFn: () => fetchMemberReads(conversationId!),
    refetchInterval: 10_000,
  });

export function useSendMessage(conversationId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; content: string }) => sendMessage(conversationId!, userId!, v.content, v.id),
    // Dikembalikan agar mutateAsync baru selesai setelah daftar pesan segar (tanpa kedipan ganda).
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) }),
        queryClient.invalidateQueries({ queryKey: conversationsKey }),
      ]),
  });
}

export function useMarkRead(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (!conversationId) return;
    void markConversationRead(conversationId).then(() =>
      queryClient.invalidateQueries({ queryKey: conversationsKey })
    );
  };
}

export const useStartDirect = () =>
  useMutation({ mutationFn: (otherId: string) => getOrCreateDirect(otherId) });
