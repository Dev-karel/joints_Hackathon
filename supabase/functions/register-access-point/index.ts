// Edge Function register-access-point (PRD §7.3, ARCHITECTURE §4.5).
// Admin mendaftarkan BSSID access point (BUKAN BSSID pengguna biasa) ke sebuah zona.
//
// Request : POST { bssid: string, zone_id: string(uuid), label?: string } + Authorization: Bearer <JWT admin>
// Respons : { status: 'registered', bssid, zone_id }
//
// Deploy: Dashboard -> Edge Functions -> Deploy a new function (nama: register-access-point),
// atau `supabase functions deploy register-access-point`.
import { createClient } from 'npm:@supabase/supabase-js@2';

// Pola sama dengan src/lib/validation/wifi.ts (jaga agar tetap identik).
const BSSID_RE = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/;
const PLACEHOLDER_BSSID = '02:00:00:00:00:00';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);

  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Cek role admin di database (bukan dari klaim yang bisa diubah pengguna).
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') return json({ error: 'Forbidden' }, 403);

  let body: { bssid?: unknown; zone_id?: unknown; label?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }

  const bssid = typeof body.bssid === 'string' ? body.bssid.trim().toLowerCase() : '';
  if (!BSSID_RE.test(bssid) || bssid === PLACEHOLDER_BSSID) {
    return json({ error: 'BSSID tidak valid. Pastikan izin lokasi dan layanan lokasi aktif.' }, 400);
  }
  const zoneId = typeof body.zone_id === 'string' ? body.zone_id : '';
  if (!UUID_RE.test(zoneId)) return json({ error: 'Zona tidak valid' }, 400);
  const label =
    typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : null;

  const { data: zone } = await db.from('campus_zones').select('id').eq('id', zoneId).maybeSingle();
  if (!zone) return json({ error: 'Zona tidak ditemukan' }, 404);

  // BSSID yang sudah terdaftar dipindahkan ke zona baru (satu BSSID = satu zona).
  const { error } = await db.from('wifi_access_points').upsert({
    bssid,
    zone_id: zoneId,
    label,
    registered_by: userData.user.id,
  });
  if (error) return json({ error: 'Gagal menyimpan' }, 500);

  return json({ status: 'registered', bssid, zone_id: zoneId });
});
