import { supabase } from '@/lib/supabase/client';
import {
  answerIdSchema,
  personalityScoresSchema,
  archetypeIdSchema,
  type AnswerId,
  type QuizAnswers,
} from '@/lib/validation/personalityQuiz';

/** Draf jawaban milik pengguna (tersimpan per pertanyaan, boleh diubah sebelum submit akhir). */
export async function fetchQuizDrafts(userId: string): Promise<QuizAnswers> {
  const { data, error } = await supabase
    .from('personality_answers')
    .select('question_id, answer')
    .eq('profile_id', userId);
  if (error) throw error;

  const answers: QuizAnswers = {};
  for (const row of data ?? []) {
    const parsed = answerIdSchema.safeParse(row.answer);
    if (parsed.success) answers[row.question_id] = parsed.data;
  }
  return answers;
}

/** Upsert per pertanyaan; RLS menolak setelah kuis terkunci. */
export async function saveQuizAnswer(userId: string, questionId: string, answer: AnswerId) {
  const { error } = await supabase
    .from('personality_answers')
    .upsert({ profile_id: userId, question_id: questionId, answer }, { onConflict: 'profile_id,question_id' });
  if (error) throw error;
}

/** Submit akhir: dihitung & dikunci di database (submit_personality_quiz). */
export async function submitQuiz() {
  const { data, error } = await supabase.rpc('submit_personality_quiz');
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    type: archetypeIdSchema.parse(row?.personality_type),
    scores: personalityScoresSchema.parse(row?.personality_scores),
  };
}

export function quizErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : '';
  if (/terkunci/i.test(msg)) return 'Kuis sudah dikirim dan tidak bisa diubah lagi.';
  if (/Jawab semua/i.test(msg)) return 'Jawab semua 15 pertanyaan dulu.';
  if (/network|fetch/i.test(msg)) return 'Tidak ada koneksi. Periksa internet kamu lalu coba lagi.';
  return 'Gagal menyimpan. Coba lagi.';
}
