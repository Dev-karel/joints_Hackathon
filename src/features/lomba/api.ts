import { supabase } from '@/lib/supabase/client';

export type TeamOpening = {
  id: string;
  host_id: string;
  competition_name: string;
  category: string;
  registration_deadline: string;
  team_size: number;
  current_members: number;
  roles_needed: string[];
  guidebook_url: string | null;
  description: string | null;
  status: 'open' | 'full' | 'closed';
};

export type NewTeamOpening = {
  host_id: string;
  competition_name: string;
  category: string;
  registration_deadline: string;
  team_size: number;
  current_members: number;
  roles_needed: string[];
  guidebook_url: string | null;
  description: string | null;
};

export type PersonRef = {
  id: string;
  full_name: string;
  major: string | null;
  avatar_url: string | null;
  personality_type: string | null;
};

export type JoinRequest = {
  user_id: string;
  role_applied: string | null;
  message: string | null;
  status: 'requested' | 'accepted' | 'rejected';
  created_at: string;
  person: PersonRef | null;
};

export type RosterMember = PersonRef & { role_applied: string | null; joined_at: string };

export type TeamOpeningDetail = {
  opening: TeamOpening;
  host: PersonRef | null;
  /** Host: semua permintaan. Pengguna lain: hanya permintaan miliknya (RLS). */
  requests: JoinRequest[];
  roster: RosterMember[];
};

const OPENING_COLUMNS =
  'id, host_id, competition_name, category, registration_deadline, team_size, current_members, roles_needed, guidebook_url, description, status';

// Lowongan yang masih dibuka dan belum lewat batas pendaftaran (PRD §8: hilang setelah deadline
// atau tim penuh). Dibaca semua pengguna login (RLS team_openings_select).
export async function fetchOpenings(): Promise<TeamOpening[]> {
  const { data, error } = await supabase
    .from('team_openings')
    .select(OPENING_COLUMNS)
    .eq('status', 'open')
    .gt('registration_deadline', new Date().toISOString())
    .order('registration_deadline')
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamOpening[];
}

// Detail lowongan: lowongan, host, permintaan (dibatasi RLS), dan anggota tim yang sudah diterima.
export async function fetchOpeningDetail(id: string): Promise<TeamOpeningDetail | null> {
  const { data: opening, error } = await supabase
    .from('team_openings')
    .select(OPENING_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!opening) return null;

  const [requestsRes, rosterRes] = await Promise.all([
    supabase
      .from('team_join_requests')
      .select('user_id, role_applied, message, status, created_at')
      .eq('opening_id', id)
      .order('created_at'),
    supabase.rpc('team_roster', { p_opening: id }),
  ]);
  if (requestsRes.error) throw new Error(requestsRes.error.message);
  if (rosterRes.error) throw new Error(rosterRes.error.message);

  const requestRows = (requestsRes.data ?? []) as Omit<JoinRequest, 'person'>[];
  const ids = [...new Set([(opening as TeamOpening).host_id, ...requestRows.map((r) => r.user_id)])];
  const { data: people, error: peopleError } = await supabase
    .from('public_profiles')
    .select('id, full_name, major, avatar_url, personality_type')
    .in('id', ids);
  if (peopleError) throw new Error(peopleError.message);
  const byId = new Map(((people ?? []) as PersonRef[]).map((p) => [p.id, p]));

  return {
    opening: opening as TeamOpening,
    host: byId.get((opening as TeamOpening).host_id) ?? null,
    requests: requestRows.map((r) => ({ ...r, person: byId.get(r.user_id) ?? null })),
    roster: ((rosterRes.data ?? []) as (Omit<RosterMember, 'id'> & { user_id: string })[]).map((m) => ({
      id: m.user_id,
      full_name: m.full_name,
      major: m.major,
      avatar_url: m.avatar_url,
      personality_type: m.personality_type,
      role_applied: m.role_applied,
      joined_at: m.joined_at,
    })),
  };
}

// Batas lamaran (lowongan tutup/penuh, melamar timnya sendiri) dijaga trigger di database.
export async function sendJoinRequest(input: {
  opening_id: string;
  user_id: string;
  role_applied: string;
  message?: string;
}): Promise<void> {
  const { error } = await supabase.from('team_join_requests').insert({
    opening_id: input.opening_id,
    user_id: input.user_id,
    role_applied: input.role_applied,
    message: input.message?.trim() || null,
    status: 'requested',
  });
  if (error) {
    if (error.code === '23505') throw new Error('Kamu sudah pernah mengajukan diri ke tim ini.');
    throw new Error(error.message);
  }
}

// Batalkan lamaran sendiri yang belum ditanggapi.
export async function cancelJoinRequest(openingId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('team_join_requests')
    .delete()
    .eq('opening_id', openingId)
    .eq('user_id', userId)
    .eq('status', 'requested');
  if (error) throw new Error(error.message);
}

// Hanya host; kuota dikunci di database (RPC respond_team_request).
export async function respondToJoinRequest(openingId: string, userId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_team_request', {
    p_opening: openingId,
    p_user: userId,
    p_accept: accept,
  });
  if (error) throw new Error(error.message);
}

// Anggota keluar sendiri, atau host mengeluarkan anggota.
export async function leaveTeam(openingId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_team', { p_opening: openingId, p_user: userId });
  if (error) throw new Error(error.message);
}

export async function createOpening(input: NewTeamOpening): Promise<void> {
  const { error } = await supabase.from('team_openings').insert(input);
  if (error) throw new Error(error.message);
}
