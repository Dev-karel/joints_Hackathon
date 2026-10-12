import { supabase } from '@/lib/supabase/client';

export type Course = { id: string; code: string; name: string; credits: number };

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase.from('courses').select('id, code, name, credits').order('name');
  if (error) throw error;
  return (data ?? []) as Course[];
}

export async function fetchMyCourseIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row: { course_id: string }) => row.course_id);
}

/** Ganti seluruh pilihan sekaligus (atomik di database, RPC set_my_courses). */
export async function saveMyCourses(courseIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('set_my_courses', { course_ids: courseIds });
  if (error) throw error;
}
