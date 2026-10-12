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

export type StudySession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  session_kind: SessionKind;
  host_id: string | null;
  courses: { name: string } | null;
  campus_zones: { name: string } | null;
  study_session_members: { user_id: string }[];
};

export async function fetchPartners(): Promise<Partner[]> {
  const { data, error } = await supabase.rpc('recommend_study_partners');
  if (error) throw error;
  return (data ?? []) as Partner[];
}

export async function fetchSessions(): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(
      'id, title, starts_at, ends_at, capacity, session_kind, host_id, courses(name), campus_zones(name), study_session_members(user_id)'
    )
    .eq('status', 'open')
    .gt('ends_at', new Date().toISOString())
    .order('starts_at')
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as StudySession[];
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
};

export async function createSession(input: NewSession): Promise<void> {
  const { error } = await supabase.from('study_sessions').insert(input);
  if (error) throw new Error(error.message);
}
