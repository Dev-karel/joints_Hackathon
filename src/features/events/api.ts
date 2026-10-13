import { supabase } from '@/lib/supabase/client';
import type { EventKind } from '@/lib/validation/event';

export type EventRsvp = { user_id: string; status: 'going' | 'cancelled' };

export type EventItem = {
  id: string;
  curator_id: string;
  event_kind: EventKind;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  cost_note: string | null;
  status: 'draft' | 'published' | 'cancelled';
  venues: { name: string; address: string; venue_type: 'public' | 'partner' } | null;
  event_rsvps: EventRsvp[];
};

export type Venue = { id: string; name: string; address: string; venue_type: 'public' | 'partner' };

export type ReconnectCandidate = {
  user_id: string;
  full_name: string;
  major: string | null;
  avatar_url: string | null;
  personality_type: string | null;
};

const EVENT_COLUMNS =
  'id, curator_id, event_kind, title, description, starts_at, ends_at, capacity, cost_note, status, venues(name, address, venue_type), event_rsvps(user_id, status)';

export const goingCount = (e: Pick<EventItem, 'event_rsvps'>) =>
  e.event_rsvps.filter((r) => r.status === 'going').length;

// Acara mendatang yang sudah terbit. RLS events_select sudah membatasi ke published.
export async function fetchUpcomingEvents(): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('status', 'published')
    .gt('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EventItem[];
}

const DAY_MS = 24 * 3_600_000;

// Acara yang baru selesai (maks 3 hari) dan diikuti pengguna: pintu masuk "Mau ketemu lagi?".
export async function fetchRecentlyAttended(userId: string): Promise<EventItem[]> {
  const now = Date.now();
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('status', 'published')
    .lte('starts_at', new Date(now).toISOString())
    .gte('starts_at', new Date(now - 4 * DAY_MS).toISOString())
    .order('starts_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as EventItem[]).filter((e) => {
    const end = new Date(e.ends_at ?? new Date(e.starts_at).getTime() + 3 * 3_600_000).getTime();
    return (
      end <= now &&
      now <= end + 3 * DAY_MS &&
      e.event_rsvps.some((r) => r.user_id === userId && r.status === 'going')
    );
  });
}

// Satu acara (termasuk yang sudah lewat), untuk layar detail dan "Mau ketemu lagi?".
export async function fetchEvent(id: string): Promise<EventItem | null> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as EventItem) ?? null;
}

// Kuota dijaga trigger enforce_event_capacity; pesan galatnya sudah Bahasa Indonesia.
export async function setRsvp(eventId: string, userId: string, going: boolean): Promise<void> {
  const { error } = await supabase
    .from('event_rsvps')
    .upsert(
      { event_id: eventId, user_id: userId, status: going ? 'going' : 'cancelled' },
      { onConflict: 'event_id,user_id' }
    );
  if (error) throw new Error(error.message);
}

export async function fetchApprovedVenues(): Promise<Venue[]> {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, address, venue_type')
    .eq('status', 'approved')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Venue[];
}

export type NewEvent = {
  curator_id: string;
  event_kind: EventKind;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  venue_id: string;
  capacity: number;
  cost_note: string | null;
};

// Hanya curator/admin dan venue approved yang lolos RLS events_insert_curator.
export async function createEvent(input: NewEvent): Promise<void> {
  const { error } = await supabase.from('events').insert({ ...input, status: 'published' });
  if (error) {
    if (error.code === '42501') throw new Error('Hanya kurator yang bisa membuat event.');
    throw new Error(error.message);
  }
}

export async function fetchReconnectCandidates(eventId: string): Promise<ReconnectCandidate[]> {
  const { data, error } = await supabase.rpc('event_reconnect_candidates', { p_event_id: eventId });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReconnectCandidate[];
}

export async function fetchMyReconnectVotes(eventId: string, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('reconnect_votes')
    .select('target_id')
    .eq('event_id', eventId)
    .eq('voter_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.target_id as string);
}

// Ganti pilihan: hapus yang dicabut, tambah yang baru. Aturan jendela 3 hari ada di database.
export async function saveReconnectVotes(
  eventId: string,
  userId: string,
  previous: string[],
  next: string[]
): Promise<void> {
  const removed = previous.filter((id) => !next.includes(id));
  const added = next.filter((id) => !previous.includes(id));
  if (removed.length > 0) {
    const { error } = await supabase
      .from('reconnect_votes')
      .delete()
      .eq('event_id', eventId)
      .eq('voter_id', userId)
      .in('target_id', removed);
    if (error) throw new Error(error.message);
  }
  if (added.length > 0) {
    const { error } = await supabase
      .from('reconnect_votes')
      .insert(added.map((target_id) => ({ event_id: eventId, voter_id: userId, target_id })));
    if (error) throw new Error(error.message);
  }
}
