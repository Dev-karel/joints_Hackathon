import { supabase } from '@/lib/supabase/client';

export type FriendRow = {
  other_id: string;
  full_name: string;
  major: string | null;
  avatar_url: string | null;
  personality_type: string | null;
  status: 'pending' | 'accepted';
  /** true bila pemanggil adalah penerima permintaan. */
  incoming: boolean;
  created_at: string;
  /** Kapan permintaan diterima (null bila masih pending). */
  accepted_at: string | null;
};

export type StudentResult = {
  id: string;
  full_name: string;
  major: string | null;
  semester: number | null;
  avatar_url: string | null;
  personality_type: string | null;
};

export async function fetchFriendships(): Promise<FriendRow[]> {
  const { data, error } = await supabase.rpc('my_friendships');
  if (error) throw new Error(error.message);
  return (data ?? []) as FriendRow[];
}

// Cari mahasiswa lewat view public_profiles (kolom publik saja). Karakter pola LIKE di input
// dibuang supaya "%" atau "_" tidak jadi wildcard.
export async function searchStudents(query: string, selfId: string): Promise<StudentResult[]> {
  const term = query.replace(/[%_\\,()]/g, ' ').trim();
  if (term.length < 2) return [];
  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, full_name, major, semester, avatar_url, personality_type')
    .ilike('full_name', `%${term}%`)
    .neq('id', selfId)
    .order('full_name')
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as StudentResult[];
}

// Pesan galat dari trigger/RLS (mis. batas permintaan) sudah Bahasa Indonesia; pelanggaran
// unique pasangan (sudah pernah minta / sudah berteman) diterjemahkan di sini.
export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' });
  if (error) {
    if (error.code === '23505') throw new Error('Kamu sudah mengirim atau menerima permintaan dari orang ini.');
    throw new Error(error.message);
  }
}

export async function acceptFriendRequest(requesterId: string, selfId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('addressee_id', selfId);
  if (error) throw new Error(error.message);
}

// Dipakai untuk menolak permintaan masuk, membatalkan permintaan terkirim, dan menghapus teman.
export async function removeFriendship(selfId: string, otherId: string): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(requester_id.eq.${selfId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${selfId})`
    );
  if (error) throw new Error(error.message);
}
