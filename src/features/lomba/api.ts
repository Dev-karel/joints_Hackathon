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

export async function createOpening(input: NewTeamOpening): Promise<void> {
  const { error } = await supabase.from('team_openings').insert(input);
  if (error) throw new Error(error.message);
}
