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

// Pesan terbaru dulu (maks. 200); layar membaliknya untuk daftar terbalik.
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Message[];
}

// Panjang, rate limit, dan keanggotaan dijaga database (constraint, trigger, RLS).
export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content: content.trim() });
  if (error) throw new Error(error.message);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await supabase.rpc('mark_conversation_read', { p_conversation: conversationId });
}

export async function getOrCreateDirect(otherId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_direct', { p_other: otherId });
  if (error) throw new Error(error.message);
  return data as string;
}
