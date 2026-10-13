import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase/client';

import {
  fetchConversations,
  fetchMessages,
  getOrCreateDirect,
  markConversationRead,
  sendMessage,
} from './api';

export const conversationsKey = ['conversations'] as const;
export const messagesKey = (id: string | undefined) => ['messages', id] as const;

export const useConversations = () =>
  useQuery({ queryKey: conversationsKey, queryFn: fetchConversations, refetchInterval: 15_000 });

/** Jumlah pesan belum dibaca di semua percakapan (titik di ikon Pesan). */
export function useUnreadTotal() {
  const { data } = useConversations();
  return (data ?? []).reduce((sum, c) => sum + c.unread, 0);
}

// Pesan satu percakapan. Realtime memicu muat ulang saat ada pesan baru; polling 10 detik
// sebagai cadangan bila koneksi Realtime putus. RLS tetap membatasi ke anggota percakapan.
export function useMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) });
          void queryClient.invalidateQueries({ queryKey: conversationsKey });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: messagesKey(conversationId),
    enabled: !!conversationId,
    queryFn: () => fetchMessages(conversationId!),
    refetchInterval: 10_000,
  });
}

export function useSendMessage(conversationId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationId!, userId!, content),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: messagesKey(conversationId) });
      void queryClient.invalidateQueries({ queryKey: conversationsKey });
    },
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
