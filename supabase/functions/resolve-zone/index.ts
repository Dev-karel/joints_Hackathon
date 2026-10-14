// Edge Function resolve-zone (PRD §7.4–7.5, ARCHITECTURE §4.4).
// Menerima BSSID Wi-Fi yang sedang tersambung, memetakannya ke zona, lalu menulis presence.
//
// PRIVASI (wajib): BSSID pengguna TIDAK disimpan dan TIDAK di-log. Jangan menambahkan
// console.log atau menyimpan body request di fungsi ini.
//
// Request : POST { bssid?: string, leave?: boolean }  + header Authorization: Bearer <JWT pengguna>
// Respons : { status: 'in_zone' | 'outside' | 'left' | 'hidden' | 'throttled', zone_id?, zone_name? }
//
// Deploy: Dashboard -> Edge Functions -> Deploy a new function (nama: resolve-zone), atau
//   supabase functions deploy resolve-zone
// SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY tersedia otomatis di runtime.
import { createClient } from 'npm:@supabase/supabase-js@2';

const PRESENCE_TTL_MINUTES = 15;
const MIN_INTERVAL_SECONDS = 20; // rate limit per pengguna (ARCHITECTURE §6)
// Pola sama dengan src/lib/validation/wifi.ts (jaga agar tetap identik).
const BSSID_RE = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/;
const PLACEHOLDER_BSSID = '02:00:00:00:00:00'; // nilai Android bila izin/lokasi tidak aktif

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;

  // Identitas pengguna dari JWT-nya sendiri (bukan dari body).
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401);
  const userId = userData.user.id;

  // Service role hanya di sisi server (secret fungsi), tidak pernah ada di aplikasi.
  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let body: { bssid?: unknown; leave?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }

  const leave = async () => {
    await db.from('presence').delete().eq('user_id', userId);
  };

  if (body.leave === true) {
    await leave();
    return json({ status: 'left' });
  }

  // Opt-in dicek di server juga, bukan hanya di UI.
  const { data: profile } = await db
    .from('profiles')
    .select('show_on_map, banned_at')
    .eq('id', userId)
    .maybeSingle();
  // Akun yang diblokir admin tidak pernah tampil di peta.
  if (!profile?.show_on_map || profile.banned_at) {
    await leave();
    return json({ status: 'hidden' });
  }

  const bssid = typeof body.bssid === 'string' ? body.bssid.trim().toLowerCase() : '';
  if (!BSSID_RE.test(bssid) || bssid === PLACEHOLDER_BSSID) {
    // Tidak ada Wi-Fi / izin ditolak / nilai samaran: pengguna tidak tampil.
    await leave();
    return json({ status: 'outside' });
  }

  // Rate limit: tolak bila presence terakhir diperbarui < 20 detik lalu.
  const { data: existing } = await db
    .from('presence')
    .select('updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing && Date.now() - new Date(existing.updated_at).getTime() < MIN_INTERVAL_SECONDS * 1000) {
    return json({ status: 'throttled' }, 429);
  }

  const { data: ap } = await db
    .from('wifi_access_points')
    .select('zone_id, campus_zones(name)')
    .eq('bssid', bssid)
    .maybeSingle();

  if (!ap) {
    await leave();
    return json({ status: 'outside' });
  }

  const now = new Date();
  const { error } = await db.from('presence').upsert({
    user_id: userId,
    zone_id: ap.zone_id,
    updated_at: now.toISOString(),
    expires_at: new Date(now.getTime() + PRESENCE_TTL_MINUTES * 60_000).toISOString(),
  });
  if (error) return json({ error: 'Gagal menyimpan' }, 500);

  const zone = ap.campus_zones as { name?: string } | { name?: string }[] | null;
  const zoneName = Array.isArray(zone) ? zone[0]?.name : zone?.name;
  return json({ status: 'in_zone', zone_id: ap.zone_id, zone_name: zoneName });
});
