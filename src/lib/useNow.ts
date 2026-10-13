import { useEffect, useState } from 'react';

/** Waktu sekarang (ms) yang diperbarui berkala, supaya render tetap murni (tanpa Date.now() langsung). */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
