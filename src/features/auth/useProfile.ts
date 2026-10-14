import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

export type ProfileRow = {
  id: string;
  full_name: string;
  major: string | null;
  semester: number | null;
  avatar_url: string | null;
  role: 'student' | 'curator' | 'admin';
  show_on_map: boolean;
  personality_type: string | null;
  personality_scores: Record<string, number> | null;
  personality_quiz_completed_at: string | null;
  /** Diisi admin saat akun diblokir (moderasi). undefined bila migration moderasi belum jalan. */
  banned_at?: string | null;
};

export const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<ProfileRow> => {
      const { data, error } = await supabase
        .from('profiles')
        // '*' (bukan daftar kolom) supaya profil tetap termuat walau migration terbaru belum dijalankan.
        .select('*')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
  });
}
