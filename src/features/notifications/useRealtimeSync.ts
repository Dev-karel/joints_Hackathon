import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { Conversation } from '@/features/chat/api';
import { conversationsKey, memberReadsKey, messagesKey } from '@/features/chat/hooks';
import { friendshipsKey } from '@/features/friends/hooks';
import { supabase } from '@/lib/supabase/client';

import { useBannerStore } from './bannerStore';

type MessageRow = { id: string; conversation_id: string; sender_id: string; content: string };

// Satu langganan Realtime untuk seluruh aplikasi (selama sudah masuk):
//  - pesan baru  -> segarkan daftar percakapan, hitungan belum dibaca, dan banner "pesan baru"
//  - pertemanan  -> segarkan permintaan masuk / permintaan yang diterima
// Realtime mengikuti RLS, jadi hanya pesan dan pertemanan milik pengguna ini yang sampai.
// Polling di hook masing-masing tetap jadi cadangan bila koneksi putus.
export function useRealtimeSync(userId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId) return;

    const channel = supabase
      .channel(`app-sync-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as MessageRow;
        void queryClient.invalidateQueries({ queryKey: messagesKey(msg.conversation_id) });
        void queryClient.invalidateQueries({ queryKey: memberReadsKey(msg.conversation_id) });
        void queryClient
          .refetchQueries({ queryKey: conversationsKey })
          .then(() => {
            if (msg.sender_id === userId) return;
            const { activeConversationId, show } = useBannerStore.getState();
            if (activeConversationId === msg.conversation_id) return;
            const conv = queryClient
              .getQueryData<Conversation[]>(conversationsKey)
              ?.find((c) => c.conversation_id === msg.conversation_id);
            const sender = conv?.last_sender_name?.split(' ')[0];
            show({
              conversationId: msg.conversation_id,
              title: conv?.title ?? 'Pesan baru',
              body: conv?.kind === 'session' && sender ? `${sender}: ${msg.content}` : msg.content,
            });
          })
          .catch(() => undefined);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        void queryClient.invalidateQueries({ queryKey: friendshipsKey(userId) });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, userId, queryClient]);
}
