import type { EventKind } from '@/lib/validation/event';
import { EVENT_KINDS } from '@/lib/validation/event';

const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const pad = (n: number) => String(n).padStart(2, '0');

/** 19.00 (format jam Figma memakai titik). */
export const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
};

/** Kam, 19.00 */
export const formatDayTime = (iso: string) => {
  const d = new Date(iso);
  return `${DAYS_SHORT[d.getDay()]}, ${formatTime(iso)}`;
};

/** Sab, 17 Okt · 04.00 */
export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} · ${formatTime(iso)}`;
};

/** Kamis, 1 Okt · 19.00–21.00 */
export const formatRange = (startIso: string, endIso: string | null) => {
  const d = new Date(startIso);
  const head = `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} · ${formatTime(startIso)}`;
  return endIso ? `${head}–${formatTime(endIso)}` : head;
};

/** Jum, 2 Okt */
export const formatDateShort = (d: Date) =>
  `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;

export const kindLabel = (kind: EventKind) => EVENT_KINDS[kind];

export const isFree = (costNote: string | null) => !costNote || /gratis/i.test(costNote);

/** Biaya hanya catatan: tidak ada pembayaran di aplikasi (CLAUDE.md). */
export const costLabel = (costNote: string | null) => {
  if (isFree(costNote)) return 'Gratis';
  const note = costNote!.trim();
  return /bayar/i.test(note) ? note : `${note}, bayar di tempat`;
};
