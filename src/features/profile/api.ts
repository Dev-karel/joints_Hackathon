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

export type MyActivity = {
  sessions: { id: string; title: string; starts_at: string; status: string; place: string | null }[];
  events: { id: string; title: string; starts_at: string; status: string; place: string | null }[];
};

// Riwayat sesi belajar dan event (RSVP "going") milik pengguna, terbaru dulu.
export async function fetchMyActivity(userId: string): Promise<MyActivity> {
  const [sessions, events] = await Promise.all([
    supabase
      .from('study_session_members')
      .select('study_sessions(id, title, starts_at, status, campus_zones(name))')
      .eq('user_id', userId),
    supabase
      .from('event_rsvps')
      .select('events(id, title, starts_at, status, venues(name))')
      .eq('user_id', userId)
      .eq('status', 'going'),
  ]);
  if (sessions.error) throw new Error(sessions.error.message);
  if (events.error) throw new Error(events.error.message);

  // Relasi many-to-one datang sebagai objek, tapi tipe generik Supabase menyebutnya array.
  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
  type Zone = { name: string };
  type S = { id: string; title: string; starts_at: string; status: string; campus_zones: Zone | Zone[] | null };
  type E = { id: string; title: string; starts_at: string; status: string; venues: Zone | Zone[] | null };

  const byDateDesc = (a: { starts_at: string }, b: { starts_at: string }) => b.starts_at.localeCompare(a.starts_at);
  return {
    sessions: ((sessions.data ?? []) as unknown as { study_sessions: S | S[] | null }[])
      .map((r) => one(r.study_sessions))
      .filter((s): s is S => !!s)
      .map((s) => ({ id: s.id, title: s.title, starts_at: s.starts_at, status: s.status, place: one(s.campus_zones)?.name ?? null }))
      .sort(byDateDesc),
    events: ((events.data ?? []) as unknown as { events: E | E[] | null }[])
      .map((r) => one(r.events))
      .filter((e): e is E => !!e)
      .map((e) => ({ id: e.id, title: e.title, starts_at: e.starts_at, status: e.status, place: one(e.venues)?.name ?? null }))
      .sort(byDateDesc),
  };
}

export type PickedAvatar = { uri: string; mimeType: string; base64?: string | null };

const AVATAR_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

// Unggah foto profil ke bucket `avatars` (folder per pengguna), simpan URL-nya di profil, lalu
// hapus foto lama. Pembatasan siapa boleh menulis ada di policy storage (migration avatars).
export async function uploadAvatar(userId: string, picked: PickedAvatar): Promise<string> {
  const ext = AVATAR_EXT[picked.mimeType];
  if (!ext) throw new Error('Format foto harus JPG, PNG, atau WebP.');

  // fetch(file://).arrayBuffer() di React Native sering menghasilkan data kosong/rusak sehingga foto
  // "terunggah" tapi tidak tampil. Pakai base64 dari image picker bila ada.
  const body = picked.base64
    ? Uint8Array.from(atob(picked.base64), (c) => c.charCodeAt(0)).buffer
    : await (await fetch(picked.uri)).arrayBuffer();
  if (body.byteLength === 0) throw new Error('Foto tidak terbaca. Coba pilih foto lain.');
  if (body.byteLength > AVATAR_MAX_BYTES) throw new Error('Ukuran foto maksimal 5 MB.');

  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const up = await supabase.storage.from('avatars').upload(path, body, { contentType: picked.mimeType, upsert: false });
  if (up.error) throw new Error(up.error.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const { error } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
  if (error) {
    await supabase.storage.from('avatars').remove([path]);
    throw new Error(error.message);
  }

  // Bersihkan foto lama; gagal menghapus tidak membatalkan penggantian foto.
  try {
    const { data: files } = await supabase.storage.from('avatars').list(userId);
    const old = (files ?? []).filter((f) => `${userId}/${f.name}` !== path).map((f) => `${userId}/${f.name}`);
    if (old.length > 0) await supabase.storage.from('avatars').remove(old);
  } catch {
    // abaikan
  }
  return data.publicUrl;
}
