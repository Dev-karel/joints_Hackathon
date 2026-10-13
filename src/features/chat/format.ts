const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad = (n: number) => String(n).padStart(2, '0');
const DAY_MS = 24 * 3_600_000;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** 09.40 */
export const clockOf = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
};

/** Hari ini → jam, kemarin → "Kemarin", dalam seminggu → hari, selebihnya tanggal. */
export function listTime(iso: string, now: number) {
  const d = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date(now)) - startOfDay(d)) / DAY_MS);
  if (diffDays <= 0) return clockOf(iso);
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return DAYS_SHORT[d.getDay()];
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Pemisah tanggal di ruang obrolan: Hari ini / Kemarin / 3 Okt. */
export function dayLabel(iso: string, now: number) {
  const d = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date(now)) - startOfDay(d)) / DAY_MS);
  if (diffDays <= 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
