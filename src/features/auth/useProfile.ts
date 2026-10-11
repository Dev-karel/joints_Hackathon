import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

export type ProfileRow = {
  id: string;
  full_name: string;
  role: 'student' | 'curator' | 'admin';
  show_on_map: boolean;
  personality_type: string | null;
  personality_scores: Record<string, number> | null;
  personality_quiz_completed_at: string | null;
};

export const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<ProfileRow> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, role, show_on_map, personality_type, personality_scores, personality_quiz_completed_at'
        )
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
  });
}
