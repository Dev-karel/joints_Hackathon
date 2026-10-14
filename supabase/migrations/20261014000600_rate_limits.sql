-- Rate limit (PRD §10): lapor, buat sesi, buat lowongan lomba, buat event. Pesan chat dan
-- permintaan teman sudah dibatasi di migration masing-masing.
-- Satu fungsi trigger dipakai ulang: argumen = kolom pemilik, jumlah maksimum, jendela waktu.
-- Hanya membatasi klien (authenticated); SQL Editor / service role (mis. seed-demo.sql) lolos.
-- SENGAJA bukan security definer: current_user harus role pemanggil, bukan pemilik fungsi.
create function public.enforce_insert_rate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_col text := tg_argv[0];
  max_rows integer := tg_argv[1]::integer;
  win interval := tg_argv[2]::interval;
  owner uuid := (to_jsonb(new) ->> owner_col)::uuid;
  n integer;
begin
  if current_user not in ('authenticated', 'anon') or owner is null then
    return new;
  end if;
  -- Kunci per pemilik + tabel supaya dua insert bersamaan tidak lolos berdua.
  perform pg_advisory_xact_lock(hashtext(tg_table_name || owner::text));
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - $2',
    tg_table_schema, tg_table_name, owner_col
  ) into n using owner, win;
  if n >= max_rows then
    raise exception 'Terlalu sering. Coba lagi beberapa saat lagi.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger reports_rate_limit
  before insert on reports
  for each row execute function public.enforce_insert_rate('reporter_id', '5', '1 hour');

create trigger study_sessions_rate_limit
  before insert on study_sessions
  for each row execute function public.enforce_insert_rate('host_id', '5', '1 hour');

create trigger team_openings_rate_limit
  before insert on team_openings
  for each row execute function public.enforce_insert_rate('host_id', '5', '1 hour');

create trigger events_rate_limit
  before insert on events
  for each row execute function public.enforce_insert_rate('curator_id', '10', '1 hour');
