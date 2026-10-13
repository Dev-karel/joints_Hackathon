import { supabase } from '@/lib/supabase/client';

export type MyStats = { sessions: number; events: number };

// Hitungan saja (head: true), tanpa menarik baris. RLS membatasi ke baris yang boleh dibaca.
export async function fetchMyStats(userId: string): Promise<MyStats> {
  const [sessions, events] = await Promise.all([
    supabase
      .from('study_session_members')
      .select('session_id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('event_rsvps')
      .select('event_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'going'),
  ]);
  if (sessions.error) throw new Error(sessions.error.message);
  if (events.error) throw new Error(events.error.message);
  return { sessions: sessions.count ?? 0, events: events.count ?? 0 };
}
