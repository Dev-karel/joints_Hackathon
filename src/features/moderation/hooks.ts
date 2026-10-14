import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchAdminReports,
  reviewReport,
  setBanned,
  setRoleByEmail,
  type ReportStatus,
} from './api';

const reportsKey = (status: ReportStatus) => ['admin-reports', status] as const;

export const useAdminReports = (status: ReportStatus) =>
  useQuery({ queryKey: reportsKey(status), queryFn: () => fetchAdminReports(status) });

export function useReviewReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { reportId: string; valid: boolean; ban: boolean }) =>
      reviewReport(v.reportId, v.valid, v.ban),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });
}

export function useSetBanned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { userId: string; banned: boolean }) => setBanned(v.userId, v.banned),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });
}

export const useSetRole = () =>
  useMutation({
    mutationFn: (v: { email: string; role: 'student' | 'curator' | 'admin' }) =>
      setRoleByEmail(v.email, v.role),
  });
