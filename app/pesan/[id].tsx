import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/components/onboarding/palette';
import { INTER, Text } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuthStore } from '@/features/auth/authStore';
import type { Message } from '@/features/chat/api';
import { clockOf, dayKey, dayLabel } from '@/features/chat/format';
import { useConversations, useMarkRead, useMessages, useSendMessage } from '@/features/chat/hooks';
import { useProfiles } from '@/features/match/hooks';
import { useNow } from '@/lib/useNow';

const SUGGESTIONS = ['Halo! Apa kabar?', 'Mau belajar bareng?', 'Ketemu di kampus yuk?'];

type Row = { type: 'day'; key: string; label: string } | { type: 'msg'; key: string; msg: Message };

// Ruang obrolan (Figma: Message). Chat langsung dengan teman atau grup chat sesi belajar.
// Tanpa kartu ajakan, status "online", dan centang baca (belum ada di data).
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

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(() => messages.data ?? [], [messages.data]);
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
    const chronological = [...list].reverse();
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
  }, [list, now]);

  const onSend = async (content: string) => {
    const body = content.trim();
    if (!body || send.isPending) return;
    setError(null);
    try {
      await send.mutateAsync(body);
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pesan gagal terkirim.');
    }
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
          className="h-[40px] w-[40px] items-center justify-center rounded-full border border-slateBorder"
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
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <FlatList
          inverted
          data={rows}
          keyExtractor={(r) => r.key}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 8 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="items-center py-[40px]" style={{ transform: [{ scaleY: -1 }] }}>
              <Text className="text-[13px] text-slate500">Belum ada pesan. Mulai obrolan!</Text>
            </View>
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
            return (
              <View className={`w-full ${mine ? 'items-end' : 'items-start'}`}>
                <View
                  className={`max-w-[80%] gap-[3px] px-[12px] pb-[6px] pt-[8px] ${
                    mine
                      ? 'rounded-bl-[16px] rounded-br-[4px] rounded-tl-[16px] rounded-tr-[16px] bg-primary'
                      : 'rounded-bl-[4px] rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] bg-slate100'
                  }`}
                >
                  {isGroup && !mine ? (
                    <Text className="text-[11px] font-bold text-primary">{nameOf(m.sender_id)}</Text>
                  ) : null}
                  <Text className={`text-[14px] ${mine ? 'text-white' : 'text-slateInk'}`}>{m.content}</Text>
                  <Text className={`self-end text-[10px] ${mine ? 'text-skyBlob' : 'text-slate500'}`}>
                    {clockOf(m.created_at)}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {list.length === 0 ? (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
            >
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => void onSend(s)}
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
 maxFontSizeMultiplier={1.1}
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
              onPress={() => void onSend(text)}
              disabled={send.isPending || text.trim().length === 0}
              accessibilityRole="button"
              accessibilityLabel="Kirim"
              className={`h-[40px] w-[40px] items-center justify-center rounded-[20px] bg-primary ${
                send.isPending || text.trim().length === 0 ? 'opacity-50' : ''
              }`}
            >
              <Send size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
