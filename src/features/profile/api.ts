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

export type PickedAvatar = { uri: string; mimeType: string };

const AVATAR_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

// Unggah foto profil ke bucket `avatars` (folder per pengguna), simpan URL-nya di profil, lalu
// hapus foto lama. Pembatasan siapa boleh menulis ada di policy storage (migration avatars).
export async function uploadAvatar(userId: string, picked: PickedAvatar): Promise<string> {
  const ext = AVATAR_EXT[picked.mimeType];
  if (!ext) throw new Error('Format foto harus JPG, PNG, atau WebP.');

  const body = await (await fetch(picked.uri)).arrayBuffer();
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
