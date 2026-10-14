import { REPORT_REASONS, reportInputSchema, type ReportInput } from '@/lib/validation/report';
import { supabase } from '@/lib/supabase/client';

// Laporan masuk dengan status pending_review (dipaksa RLS); admin yang meninjau. Tidak ada
// auto-ban dari satu laporan.
export async function submitReport(reporterId: string, input: ReportInput): Promise<void> {
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Laporan tidak valid.');
  const { targetUserId, reason, note, context } = parsed.data;
  if (targetUserId === reporterId) throw new Error('Kamu tidak bisa melaporkan dirimu sendiri.');

  const label = REPORT_REASONS.find((r) => r.id === reason)?.label ?? reason;
  const text = [label, note ? `Catatan: ${note}` : null, context ? `Pesan: "${context}"` : null]
    .filter(Boolean)
    .join(' | ');

  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: reporterId, target_user_id: targetUserId, reason: text, status: 'pending_review' });
  if (error) throw new Error(error.message);
}
