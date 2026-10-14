import { supabase } from '@/lib/supabase/client';
import type { SessionKind } from '@/lib/validation/studySession';

export type Partner = {
  user_id: string;
  full_name: string;
  major: string | null;
  avatar_url: string | null;
  personality_type: string | null;
  shared_courses: number;
  score: number;
};

export type SessionMember = { user_id: string; joined_at?: string };

export type StudySession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  session_kind: SessionKind;
  host_id: string | null;
  status: 'open' | 'cancelled' | 'done';
  agenda: AgendaItem[] | null;
  bring_note: string | null;
  zone_id: string;
  courses: { name: string } | null;
  campus_zones: { name: string } | null;
  study_session_members: SessionMember[];
};

export type AgendaItem = { time: string; text: string };

export type SessionMaterial = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
};

export type PublicProfile = {
  id: string;
  full_name: string;
  major: string | null;
  avatar_url: string | null;
  personality_type: string | null;
};

export type ProfileDetail = {
  id: string;
  full_name: string;
  major: string | null;
  semester: number | null;
  avatar_url: string | null;
  personality_type: string | null;
  personality_scores: Record<string, number> | null;
  bio: string | null;
  courses: { id: string; name: string }[];
  stats: {
    sessions_attended: number;
    friends_count: number;
  };
};

export type HostExit = {
  id: string;
  session_id: string;
  host_id: string;
  reason: string;
  action: 'transfer' | 'cancel';
  new_host_id: string | null;
  eligible_voters: number;
  required_votes: number | null;
  vote_deadline: string | null;
  result: 'pending' | 'passed' | 'failed' | 'na';
  created_at: string;
};

export type HostExitState = {
  approvals: number;
  total_votes: number;
  my_candidate_id: string | null;
  my_approve: boolean | null;
};

const SESSION_LIST_COLUMNS =
  'id, title, starts_at, ends_at, capacity, session_kind, host_id, status, agenda, bring_note, zone_id, courses(name), campus_zones(name), study_session_members(user_id, joined_at)';

export async function fetchPartners(): Promise<Partner[]> {
  const { data, error } = await supabase.rpc('recommend_study_partners');
  if (error) throw error;
  return (data ?? []) as Partner[];
}

export async function fetchSessions(): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(SESSION_LIST_COLUMNS)
    .eq('status', 'open')
    .gt('ends_at', new Date().toISOString())
    .order('starts_at')
    .limit(60);
  if (error) throw error;
  return (data ?? []) as unknown as StudySession[];
}

// Satu sesi (termasuk yang sudah dibatalkan), untuk layar detail.
export async function fetchSession(id: string): Promise<StudySession | null> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(SESSION_LIST_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as StudySession) ?? null;
}

// Profil publik (kolom aman dari view public_profiles) untuk nama host dan peserta.
export async function fetchProfiles(ids: string[]): Promise<PublicProfile[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, full_name, major, avatar_url, personality_type')
    .in('id', unique);
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicProfile[];
}

// Profile detail lengkap untuk view profile user lain
export async function fetchProfileDetail(userId: string): Promise<ProfileDetail | null> {
  // Fetch profile basic info
  const { data: profile, error: profileError } = await supabase
    .from('public_profiles')
    .select('id, full_name, major, semester, avatar_url, personality_type, personality_scores')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) return null;

  // Fetch courses
  const { data: courses } = await supabase
    .from('user_courses')
    .select('course_id, courses(id, name)')
    .eq('user_id', userId);

  // Relasi many-to-one dikembalikan sebagai objek, tapi tipe generik Supabase menyebutnya array.
  type CourseRef = { id: string; name: string };
  const userCourses: CourseRef[] = (
    (courses ?? []) as unknown as { courses: CourseRef | CourseRef[] | null }[]
  )
    .map((c) => (Array.isArray(c.courses) ? c.courses[0] : c.courses))
    .filter((c): c is CourseRef => !!c)
    .map((c) => ({ id: c.id, name: c.name }));

  // Fetch stats
  const { count: sessionsCount } = await supabase
    .from('study_session_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // RLS friendships hanya memperlihatkan baris milik pemanggil, jadi jumlah teman orang lain
  // dihitung lewat fungsi database (hanya angka).
  const { data: friendsCount } = await supabase.rpc('friend_count', { p_user: userId });

  return {
    ...profile,
    bio: null, // belum ada kolom bio di profiles/public_profiles
    courses: userCourses,
    stats: {
      sessions_attended: sessionsCount ?? 0,
      friends_count: (friendsCount as number | null) ?? 0,
    },
  } as ProfileDetail;
}

export async function fetchMaterials(sessionId: string): Promise<SessionMaterial[]> {
  const { data, error } = await supabase
    .from('study_session_materials')
    .select('id, file_path, file_name, mime_type, size_bytes')
    .eq('session_id', sessionId)
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as SessionMaterial[];
}

// Isi file hanya bisa dibuka anggota sesi (policy Storage). Tautan berlaku 5 menit.
export async function signedMaterialUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('session-materials')
    .createSignedUrl(path, 300);
  if (error || !data) throw new Error(error?.message ?? 'Gagal membuka file.');
  return data.signedUrl;
}

// Kuota dijaga trigger di database; pesan galatnya (mis. "Sesi sudah penuh.") sudah Bahasa Indonesia.
export async function joinSession(sessionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('study_session_members')
    .insert({ session_id: sessionId, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function leaveSession(sessionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('study_session_members')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export type NewSession = {
  host_id: string;
  course_id: string;
  zone_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  session_kind: SessionKind;
  capacity: number;
  agenda: AgendaItem[] | null;
  bring_note: string | null;
};

export async function createSession(input: NewSession): Promise<string> {
  const { data, error } = await supabase.from('study_sessions').insert(input).select('id').single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export type PickedFile = { uri: string; name: string; mimeType: string; size: number };

// Unggah materi ke bucket lalu catat metadatanya. Hanya host (policy Storage + tabel).
export async function uploadMaterial(
  sessionId: string,
  userId: string,
  file: PickedFile
): Promise<void> {
  const safeName = file.name.replace(/[^\w.\- ]+/g, '_');
  const path = `${sessionId}/${Date.now()}-${safeName}`;
  const body = await (await fetch(file.uri)).arrayBuffer();
  const up = await supabase.storage
    .from('session-materials')
    .upload(path, body, { contentType: file.mimeType, upsert: false });
  if (up.error) throw new Error(up.error.message);

  const { error } = await supabase.from('study_session_materials').insert({
    session_id: sessionId,
    uploaded_by: userId,
    file_path: path,
    file_name: file.name,
    mime_type: file.mimeType,
    size_bytes: file.size,
  });
  if (error) {
    await supabase.storage.from('session-materials').remove([path]);
    throw new Error(error.message);
  }
}

// ───────────── Host keluar (PRD §8.1); aturannya ada di fungsi database ─────────────

export async function fetchHostExits(sessionId: string): Promise<HostExit[]> {
  const { data, error } = await supabase
    .from('session_host_exits')
    .select(
      'id, session_id, host_id, reason, action, new_host_id, eligible_voters, required_votes, vote_deadline, result, created_at'
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as HostExit[];
}

export async function resolveDueHostExits(): Promise<void> {
  await supabase.rpc('resolve_due_host_exits');
}

export async function fetchHostExitState(exitId: string): Promise<HostExitState> {
  const { data, error } = await supabase.rpc('my_host_exit_state', { p_exit_id: exitId });
  if (error) throw new Error(error.message);
  const row = (data as HostExitState[] | null)?.[0];
  return row ?? { approvals: 0, total_votes: 0, my_candidate_id: null, my_approve: null };
}

export async function hostLeaveSession(
  sessionId: string,
  reason: string,
  action: 'transfer' | 'cancel'
): Promise<void> {
  const { error } = await supabase.rpc('host_leave_session', {
    p_session_id: sessionId,
    p_reason: reason,
    p_action: action,
  });
  if (error) throw new Error(error.message);
}

export async function castHostVote(
  exitId: string,
  vote: { candidateId: string } | { approve: boolean }
): Promise<void> {
  const { error } = await supabase.rpc('cast_host_vote', {
    p_exit_id: exitId,
    p_candidate: 'candidateId' in vote ? vote.candidateId : null,
    p_approve: 'approve' in vote ? vote.approve : null,
  });
  if (error) throw new Error(error.message);
}

export async function reportHost(
  reporterId: string,
  hostId: string,
  sessionId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    target_user_id: hostId,
    target_session_id: sessionId,
    reason,
    status: 'pending_review',
  });
  if (error) throw new Error(error.message);
}
