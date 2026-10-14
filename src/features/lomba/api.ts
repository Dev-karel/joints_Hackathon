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

export type TeamOpeningDetail = TeamOpening & {
  host: { full_name: string; major: string | null; personality_type: string | null };
  join_requests: TeamJoinRequest[];
  team_members: TeamMember[];
};

export type TeamJoinRequest = {
  id: string;
  opening_id: string;
  requester_id: string;
  role_applied: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester: { full_name: string; major: string | null; personality_type: string | null };
};

export type TeamMember = {
  id: string;
  opening_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user: { full_name: string; major: string | null; personality_type: string | null };
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

// Lowongan yang masih dibuka dan belum lewat batas pendaftaran (PRD §8: hilang setelah deadline
// atau tim penuh). Dibaca semua pengguna login (RLS team_openings_select).
export async function fetchOpenings(): Promise<TeamOpening[]> {
  const { data, error } = await supabase
    .from('team_openings')
    .select(
      'id, host_id, competition_name, category, registration_deadline, team_size, current_members, roles_needed, guidebook_url, description, status'
    )
    .eq('status', 'open')
    .gt('registration_deadline', new Date().toISOString())
    .order('registration_deadline')
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamOpening[];
}

// Detail lowongan dengan host info, requests, dan members
export async function fetchOpeningDetail(id: string): Promise<TeamOpeningDetail | null> {
  const { data, error } = await supabase
    .from('team_openings')
    .select(`
      id, host_id, competition_name, category, registration_deadline, team_size, current_members, 
      roles_needed, guidebook_url, description, status,
      host:public_profiles!host_id(full_name, major, personality_type),
      join_requests:team_join_requests(
        id, opening_id, requester_id, role_applied, message, status, created_at,
        requester:public_profiles!requester_id(full_name, major, personality_type)
      ),
      team_members(
        id, opening_id, user_id, role, joined_at,
        user:public_profiles!user_id(full_name, major, personality_type)
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as TeamOpeningDetail | null;
}

// Kirim permintaan bergabung
export async function sendJoinRequest(data: {
  opening_id: string;
  requester_id: string;
  role_applied: string;
  message?: string;
}): Promise<void> {
  const { error } = await supabase.from('team_join_requests').insert({
    opening_id: data.opening_id,
    requester_id: data.requester_id,
    role_applied: data.role_applied,
    message: data.message || null,
    status: 'pending',
  });
  if (error) throw new Error(error.message);
}

// Terima/tolak permintaan (hanya host)
export async function respondToJoinRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('team_join_requests')
    .update({ status })
    .eq('id', requestId);
  if (error) throw new Error(error.message);
}

// Kick member dari tim (hanya host)
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId);
  if (error) throw new Error(error.message);
}

export async function createOpening(input: NewTeamOpening): Promise<void> {
  const { error } = await supabase.from('team_openings').insert(input);
  if (error) throw new Error(error.message);
}
