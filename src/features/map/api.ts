import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase/client';

export type Zone = {
  id: string;
  name: string;
  parent_zone_id: string | null;
  level: 'building' | 'room';
  map_x: number | null;
  map_y: number | null;
  map_w: number | null;
  map_h: number | null;
};

export type PresenceMember = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  personality_type: string | null;
};

export type ZonePresence = {
  zone_id: string;
  online_count: number;
  /** Kosong bila zona hanya berisi 1 orang (identitas disembunyikan di database). */
  members: PresenceMember[];
};

export type ResolveStatus = 'in_zone' | 'outside' | 'left' | 'hidden' | 'throttled';
export type ResolveResult = { status: ResolveStatus; zone_id?: string; zone_name?: string };

export async function fetchZones(): Promise<Zone[]> {
  const { data, error } = await supabase
    .from('campus_zones')
    .select('id, name, parent_zone_id, level, map_x, map_y, map_w, map_h')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Zone[];
}

/** Hanya terisi bila pemanggil sendiri tampil di peta (visibilitas timbal balik, di database). */
export async function fetchZonePresence(): Promise<ZonePresence[]> {
  const { data, error } = await supabase.rpc('get_zone_presence');
  if (error) throw error;
  return (data ?? []) as ZonePresence[];
}

export async function setShowOnMap(userId: string, value: boolean) {
  const { error } = await supabase.from('profiles').update({ show_on_map: value }).eq('id', userId);
  if (error) throw error;
}

// 429 "throttled" adalah respons normal (rate limit), bukan kegagalan.
async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return data as T;
  if (error instanceof FunctionsHttpError) {
    const payload = await (error.context as Response).json().catch(() => null);
    if (payload && typeof payload === 'object') {
      if ((payload as { status?: string }).status === 'throttled') return payload as T;
      const message = (payload as { error?: string }).error;
      if (message) throw new Error(message);
    }
  }
  throw error;
}

// BSSID dikirim hanya ke Edge Function; tidak disimpan, tidak di-log.
export const resolveZone = (bssid: string) => invoke<ResolveResult>('resolve-zone', { bssid });
export const leaveZone = () => invoke<ResolveResult>('resolve-zone', { leave: true });

export const registerAccessPoint = (input: { bssid: string; zoneId: string; label?: string }) =>
  invoke<{ status: 'registered' }>('register-access-point', {
    bssid: input.bssid,
    zone_id: input.zoneId,
    label: input.label,
  });
