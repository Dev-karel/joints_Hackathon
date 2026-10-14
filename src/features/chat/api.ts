import { supabase } from '@/lib/supabase/client';

export type Conversation = {
  conversation_id: string;
  kind: 'direct' | 'session';
  /** Nama teman (direct) atau judul sesi (session). */
  title: string | null;
  session_id: string | null;
  other_id: string | null;
  other_avatar: string | null;
  last_content: string | null;
  last_at: string | null;
  last_sender_id: string | null;
  last_sender_name: string | null;
  unread: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export async function fetchConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('my_conversations');
  if (error) throw new Error(error.message);
  return (data ?? []) as Conversation[];
}

export const MESSAGE_PAGE_SIZE = 30;

// Satu halaman pesan, terbaru dulu. `before` = created_at pesan tertua yang sudah dimuat.
export async function fetchMessages(conversationId: string, before?: string): Promise<Message[]> {
  let q = supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(MESSAGE_PAGE_SIZE);
  if (before) q = q.lt('created_at', before);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

// Panjang, rate limit, keanggotaan, dan status berteman dijaga database (constraint, trigger, RLS).
// `id` dibuat klien supaya kirim ulang tidak menggandakan pesan (unique violation = sudah terkirim).
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({ id, conversation_id: conversationId, sender_id: senderId, content: content.trim() });
  if (error) {
    if (error.code === '23505') return;
    if (error.code === '42501') throw new Error('Pesan tidak bisa dikirim. Kalian mungkin sudah tidak berteman.');
    throw new Error(error.message);
  }
}

export type MemberRead = { user_id: string; last_read_at: string };

// Kapan tiap anggota terakhir membuka percakapan (untuk "Dibaca"). RLS mengizinkan sesama anggota.
export async function fetchMemberReads(conversationId: string): Promise<MemberRead[]> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('user_id, last_read_at')
    .eq('conversation_id', conversationId);
  if (error) throw new Error(error.message);
  return (data ?? []) as MemberRead[];
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await supabase.rpc('mark_conversation_read', { p_conversation: conversationId });
}

export async function getOrCreateDirect(otherId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_direct', { p_other: otherId });
  if (error) throw new Error(error.message);
  return data as string;
}
