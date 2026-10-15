import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send, Users } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import type { Message } from '@/features/chat/api';
import { clockOf, dayKey, dayLabel } from '@/features/chat/format';
import { useConversations, useMarkRead, useMemberReads, useMessages, useSendMessage } from '@/features/chat/hooks';
import { ReportSheet } from '@/features/moderation/ReportSheet';
import { useBannerStore } from '@/features/notifications/bannerStore';
import { useProfiles } from '@/features/match/hooks';
import { useNow } from '@/lib/useNow';

const SUGGESTIONS = ['Halo! Apa kabar?', 'Mau belajar bareng?', 'Ketemu di kampus yuk?'];

type Delivery = 'sending' | 'failed';
type ChatMessage = Message & { delivery?: Delivery };
type Row = { type: 'day'; key: string; label: string } | { type: 'msg'; key: string; msg: ChatMessage };

// Ruang obrolan (Figma: Message). Chat langsung dengan teman atau grup chat sesi belajar.
// Pesan terkirim langsung tampil (gagal bisa dikirim ulang), riwayat dimuat bertahap, "Dibaca" di
// chat langsung, dan pesan orang lain bisa dilaporkan lewat tekan-lama.
export default function RuangObrolanScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user.id);
  const now = useNow();

  const conversations = useConversations();
  const info = (conversations.data ?? []).find((c) => c.conversation_id === id);
  const messages = useMessages(id);
  const send = useSendMessage(id, userId);
  const markRead = useMarkRead(id);
  const setActive = useBannerStore((st) => st.setActiveConversation);

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outbox, setOutbox] = useState<ChatMessage[]>([]);
  const [reporting, setReporting] = useState<Message | null>(null);

  // Tidak perlu banner "pesan baru" untuk percakapan yang sedang dibuka.
  useEffect(() => {
    setActive(id ?? null);
    return () => setActive(null);
  }, [id, setActive]);

  const list = useMemo(() => (messages.data?.pages ?? []).flat(), [messages.data]);
  const reads = useMemberReads(id, info?.kind === 'direct');
  const otherReadAt = (reads.data ?? []).find((r) => r.user_id !== userId)?.last_read_at ?? null;
  const senderIds = useMemo(() => list.map((m) => m.sender_id), [list]);
  const profiles = useProfiles(info?.kind === 'session' ? senderIds : []);
  const nameOf = (uid: string) => profiles.data?.find((p) => p.id === uid)?.full_name.split(' ')[0] ?? '...';

  // Tandai terbaca saat dibuka dan setiap ada pesan baru dari orang lain.
  const newest = list[0]?.id;
  useEffect(() => {
    markRead();
    // markRead dibuat ulang tiap render; yang dipantau hanya pesan terbaru dan percakapannya.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, newest]);

  // Daftar terbalik: indeks 0 = paling bawah (terbaru). Pemisah tanggal disisipkan di atas
  // pesan pertama tiap hari.
  const rows = useMemo<Row[]>(() => {
    // Pesan outbox yang sudah ada di server (dari Realtime/refetch) tidak ditampilkan dua kali.
    const serverIds = new Set(list.map((m) => m.id));
    const pending = outbox.filter((m) => !serverIds.has(m.id));
    const chronological: ChatMessage[] = [...[...list].reverse(), ...pending];
    const out: Row[] = [];
    let last = '';
    for (const m of chronological) {
      const k = dayKey(m.created_at);
      if (k !== last) {
        out.push({ type: 'day', key: `day-${k}`, label: dayLabel(m.created_at, now) });
        last = k;
      }
      out.push({ type: 'msg', key: m.id, msg: m });
    }
    return out.reverse();
  }, [list, outbox, now]);

  const deliver = useCallback(
    async (item: ChatMessage) => {
      if (!userId) return;
      setOutbox((o) => o.map((m) => (m.id === item.id ? { ...m, delivery: 'sending' } : m)));
      try {
        await send.mutateAsync({ id: item.id, content: item.content });
        setOutbox((o) => o.filter((m) => m.id !== item.id));
      } catch (e) {
        setOutbox((o) => o.map((m) => (m.id === item.id ? { ...m, delivery: 'failed' } : m)));
        setError(e instanceof Error ? e.message : 'Pesan gagal terkirim.');
      }
    },
    [send, userId],
  );

  const onSend = (content: string) => {
    const body = content.trim();
    if (!body || !id || !userId) return;
    setError(null);
    const item: ChatMessage = {
      id: Crypto.randomUUID(),
      conversation_id: id,
      sender_id: userId,
      content: body,
      created_at: new Date().toISOString(),
      delivery: 'sending',
    };
    setOutbox((o) => [...o, item]);
    setText('');
    void deliver(item);
  };

  const discard = (msgId: string) => setOutbox((o) => o.filter((m) => m.id !== msgId));

  const loadOlder = () => {
    if (messages.hasNextPage && !messages.isFetchingNextPage) void messages.fetchNextPage();
  };

  if (conversations.isPending || messages.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }
  if (!info || messages.isError) {
    return (
      <SafeAreaView className="flex-1 bg-white px-[20px] pt-[16px]" edges={['top', 'bottom']}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          className="h-[48px] w-[48px] items-center justify-center rounded-full border border-slateBorder"
        >
          <ChevronLeft size={20} color={palette.slate500} />
        </Pressable>
        <View className="gap-[10px] pt-[24px]">
          <FormError message="Percakapan tidak ditemukan." size={14} />
          <PrimaryButton label="Coba lagi" variant="outline" onPress={() => void messages.refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  const isGroup = info.kind === 'session';

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-[10px] border-b border-slateBorder py-[10px] pl-[12px] pr-[16px]">
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali" hitSlop={10}>
            <ChevronLeft size={24} color={palette.slateInk} />
          </Pressable>
          <Pressable
            disabled={isGroup || !info.other_id}
            onPress={() => info.other_id && router.push({ pathname: '/profil/[id]', params: { id: info.other_id } })}
            accessibilityRole="button"
            accessibilityLabel={`Lihat profil ${info.title ?? ''}`}
            className="flex-1 flex-row items-center gap-[10px]"
          >
          <View className="h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full bg-surfaceSky">
            {isGroup ? (
              <Users size={22} color={palette.primary} />
            ) : info.other_avatar ? (
              <Image source={{ uri: info.other_avatar }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Text className="text-[18px] font-extrabold text-primary">{(info.title ?? '?').charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View className="flex-1 gap-px">
            <Text className="text-[16px] font-extrabold text-slateInk" numberOfLines={1}>
              {info.title ?? 'Percakapan'}
            </Text>
            <Text className="text-[12px] text-slate500">{isGroup ? 'Grup chat sesi' : 'Teman'}</Text>
          </View>
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <FlatList
          inverted
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 8 }}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadOlder}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            messages.isFetchingNextPage ? (
              <View className="items-center py-[8px]">
                <ActivityIndicator color={palette.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.type === 'day') {
              return (
                <View className="items-center">
                  <View className="rounded-full bg-slate100 px-[10px] py-[3px]">
                    <Text className="text-[11px] font-semibold text-slate500">{item.label}</Text>
                  </View>
                </View>
              );
            }
            const m = item.msg;
            const mine = m.sender_id === userId;
            const failed = m.delivery === 'failed';
            const sending = m.delivery === 'sending';
            // Status hanya di pesan terakhirku di chat langsung.
            const isLastMine = mine && !m.delivery && list.find((x) => x.sender_id === userId)?.id === m.id;
            const seen = !!otherReadAt && otherReadAt >= m.created_at;
            return (
              <View className={`w-full ${mine ? 'items-end' : 'items-start'}`}>
                <Pressable
                  disabled={mine && !failed}
                  onPress={failed ? () => void deliver(m) : undefined}
                  onLongPress={!mine && !m.delivery ? () => setReporting(m) : undefined}
                  delayLongPress={350}
                  accessibilityRole="button"
                  accessibilityHint={failed ? 'Ketuk untuk kirim ulang' : mine ? undefined : 'Tekan lama untuk melaporkan'}
                  className={`max-w-[80%] gap-[3px] px-[12px] pb-[6px] pt-[8px] ${
                    mine
                      ? 'rounded-bl-[16px] rounded-br-[4px] rounded-tl-[16px] rounded-tr-[16px] bg-primary'
                      : 'rounded-bl-[4px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] bg-slate100'
                  } ${sending ? 'opacity-70' : ''}`}
                >
                  {isGroup && !mine ? (
                    <Text className="text-[11px] font-bold text-primary">{nameOf(m.sender_id)}</Text>
                  ) : null}
                  <Text className={`text-[14px] ${mine ? 'text-white' : 'text-slateInk'}`}>{m.content}</Text>
                  <Text className={`self-end text-[12px] ${mine ? 'text-skyBlob' : 'text-slate500'}`}>
                    {sending ? 'Mengirim…' : failed ? 'Gagal terkirim' : clockOf(m.created_at)}
                  </Text>
                </Pressable>
                {failed ? (
                  <View className="flex-row items-center gap-[10px] pt-[2px]">
                    <Pressable onPress={() => void deliver(m)} accessibilityRole="button" hitSlop={8}>
                      <Text className="text-[11px] font-bold text-primary">Kirim ulang</Text>
                    </Pressable>
                    <Pressable onPress={() => discard(m.id)} accessibilityRole="button" hitSlop={8}>
                      <Text className="text-[11px] font-bold text-slate500">Hapus</Text>
                    </Pressable>
                  </View>
                ) : isLastMine && !isGroup ? (
                  <Text className="pt-[2px] text-[12px] text-slate500">{seen ? 'Dibaca' : 'Terkirim'}</Text>
                ) : null}
              </View>
            );
          }}
        />

        {/* Di luar FlatList inverted: ListEmptyComponent ikut terbalik di sana. */}
        {rows.length === 0 ? (
          <View
            pointerEvents="none"
            className="items-center py-[40px]"
            style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
          >
            <Text className="text-[13px] text-slate500">Belum ada pesan. Mulai obrolan!</Text>
          </View>
        ) : null}

        {list.length === 0 && outbox.length === 0 ? (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
            >
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => onSend(s)}
                  accessibilityRole="button"
                  className="rounded-full border border-skyBlob bg-white px-[12px] py-[7px]"
                >
                  <Text className="text-[12px] font-semibold text-primary">{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {error ? (
          <View className="px-[16px] pb-[6px]">
            <FormError message={error} size={12} />
          </View>
        ) : null}

        <SafeAreaView edges={['bottom']} className="border-t border-slateBorder bg-white">
          <View className="flex-row items-center gap-[10px] px-[12px] pb-[8px] pt-[10px]">
            <TextInput
 maxFontSizeMultiplier={1.3}
              value={text}
              onChangeText={setText}
              placeholder="Tulis pesan…"
              placeholderTextColor={palette.slate500}
              multiline
              maxLength={1000}
              accessibilityLabel="Tulis pesan"
              style={{ fontFamily: INTER.regular, maxHeight: 100, paddingVertical: 0 }}
              className="min-h-[44px] flex-1 rounded-[22px] border border-slateBorder px-[16px] py-[11px] text-[14px] text-slateInk"
            />
            <Pressable
              onPress={() => onSend(text)}
              disabled={text.trim().length === 0}
              accessibilityRole="button"
              accessibilityLabel="Kirim"
              className={`h-[48px] w-[48px] items-center justify-center rounded-[24px] bg-primary ${
                text.trim().length === 0 ? 'opacity-50' : ''
              }`}
            >
              <Send size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {reporting ? (
        <ReportSheet
          visible
          onClose={() => setReporting(null)}
          targetUserId={reporting.sender_id}
          targetName={isGroup ? nameOf(reporting.sender_id) : (info.title ?? 'pengguna')}
          context={reporting.content}
        />
      ) : null}
    </View>
  );
}
