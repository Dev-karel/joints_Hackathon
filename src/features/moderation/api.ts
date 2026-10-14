import { REPORT_REASONS, reportInputSchema, type ReportInput } from '@/lib/validation/report';
import { supabase } from '@/lib/supabase/client';

// Laporan masuk dengan status pending_review (dipaksa RLS); admin yang meninjau. Tidak ada
// auto-ban dari satu laporan.
export async function submitReport(reporterId: string, input: ReportInput): Promise<void> {
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Laporan tidak valid.');
  const { targetUserId, targetEventId, reason, note, context } = parsed.data;
  if (targetUserId && targetUserId === reporterId)
    throw new Error('Kamu tidak bisa melaporkan dirimu sendiri.');

  const label = REPORT_REASONS.find((r) => r.id === reason)?.label ?? reason;
  const text = [label, note ? `Catatan: ${note}` : null, context ? `Pesan: "${context}"` : null]
    .filter(Boolean)
    .join(' | ');

  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    target_user_id: targetUserId ?? null,
    target_event_id: targetEventId ?? null,
    reason: text,
    status: 'pending_review',
  });
  if (error) throw new Error(error.message);
}

// ───────────────────────── Admin (RPC; tiap fungsi mengecek role admin di database) ─────────────────────────

export type ReportStatus = 'pending_review' | 'valid' | 'dismissed';

export type AdminReport = {
  id: string;
  created_at: string;
  status: ReportStatus;
  reason: string;
  reporter_name: string | null;
  target_user_id: string | null;
  target_user_name: string | null;
  target_user_banned: boolean;
  target_event_id: string | null;
  target_event_title: string | null;
  target_session_id: string | null;
  target_session_title: string | null;
};

export async function fetchAdminReports(status: ReportStatus): Promise<AdminReport[]> {
  const { data, error } = await supabase.rpc('admin_list_reports', { p_status: status });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminReport[];
}

export async function reviewReport(reportId: string, valid: boolean, ban: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_review_report', {
    p_report_id: reportId,
    p_valid: valid,
    p_ban: ban,
  });
  if (error) throw new Error(error.message);
}

export async function setBanned(userId: string, banned: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_banned', { p_user_id: userId, p_banned: banned });
  if (error) throw new Error(error.message);
}

/** Mengembalikan nama pemilik akun yang role-nya diubah. */
export async function setRoleByEmail(
  email: string,
  role: 'student' | 'curator' | 'admin'
): Promise<string> {
  const { data, error } = await supabase.rpc('admin_set_role', { p_email: email, p_role: role });
  if (error) throw new Error(error.message);
  return data as string;
}
