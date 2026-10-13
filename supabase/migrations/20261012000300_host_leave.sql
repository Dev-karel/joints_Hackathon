-- Host keluar dari sesi belajar (PRD §8.1). Penulisan ke session_host_exits / session_host_votes
-- hanya lewat fungsi di sini (tidak ada policy tulis untuk klien).
--
-- Aturan yang ditegakkan di database:
--   * Hanya host yang bisa memanggil host_leave_session; alasan wajib.
--   * Host sendirian (tanpa peserta lain): sesi langsung batal, tanpa voting dan tanpa batas H-24.
--   * Selain itu, host tidak bisa keluar kurang dari 24 jam sebelum sesi mulai.
--   * Host lama langsung keluar saat mengajukan (host_id jadi null, baris anggotanya dihapus).
--   * Pindahkan host: polling, suara terbanyak menang, seri → yang lebih dulu gabung. Batas 1 jam.
--   * Batalkan sesi: lolos bila setuju ≥ 80% peserta selain host (dibulatkan ke atas). Batas 1 jam.
--   * Gagal (polling tanpa suara / pembatalan kurang dari 80%): sesi jalan tanpa host. Karena
--     study_sessions_update_host dan policy materi mensyaratkan host_id = auth.uid(), sesi tanpa host
--     otomatis terkunci (tidak ada yang bisa mengubah judul, waktu, tempat, kuota, agenda, materi).

create function public.host_leave_session(
  p_session_id uuid,
  p_reason text,
  p_action public.host_exit_action
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.study_sessions;
  n integer;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_exit uuid;
begin
  select * into s from public.study_sessions where id = p_session_id for update;
  if not found then
    raise exception 'Sesi tidak ditemukan.';
  end if;
  if s.host_id is distinct from auth.uid() then
    raise exception 'Hanya host yang bisa keluar sebagai host.';
  end if;
  if s.status <> 'open' or s.ends_at <= now() then
    raise exception 'Sesi ini sudah tidak dibuka.';
  end if;

  select count(*) into n
  from public.study_session_members
  where session_id = s.id and user_id <> auth.uid();

  -- Host sendirian: batal langsung.
  if n = 0 then
    update public.study_sessions set status = 'cancelled' where id = s.id;
    insert into public.session_host_exits (session_id, host_id, reason, action, eligible_voters, result)
    values (s.id, auth.uid(), coalesce(nullif(v_reason, ''), 'Host sendirian, sesi dibatalkan.'), 'cancel', 0, 'na');
    return null;
  end if;

  if s.starts_at - now() < interval '24 hours' then
    raise exception 'Host nggak bisa keluar kurang dari 24 jam sebelum sesi mulai.';
  end if;
  if v_reason = '' then
    raise exception 'Alasan keluar wajib diisi.';
  end if;

  insert into public.session_host_exits (
    session_id, host_id, reason, action, eligible_voters, required_votes, vote_deadline, result
  )
  values (
    s.id, auth.uid(), v_reason, p_action, n,
    case when p_action = 'cancel' then ((4 * n + 4) / 5)::smallint else null end,
    now() + interval '1 hour',
    'pending'
  )
  returning id into v_exit;

  -- Host lama langsung keluar; peran host tidak pernah pindah otomatis.
  update public.study_sessions set host_id = null where id = s.id;
  delete from public.study_session_members where session_id = s.id and user_id = auth.uid();

  return v_exit;
end;
$$;

-- Menutup satu pengajuan bila sudah bisa diputuskan. Internal (dipanggil fungsi lain), bukan API klien.
create function private.resolve_host_exit(p_exit_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.session_host_exits;
  due boolean;
  total_votes integer;
  approvals integer;
  winner uuid;
begin
  select * into e from public.session_host_exits where id = p_exit_id for update;
  if not found or e.result <> 'pending' then
    return;
  end if;
  due := e.vote_deadline <= now();

  if e.action = 'cancel' then
    select count(*) filter (where v.approve is true), count(*)
      into approvals, total_votes
    from public.session_host_votes v
    join public.study_session_members m on m.session_id = e.session_id and m.user_id = v.voter_id
    where v.exit_id = e.id;

    if approvals >= e.required_votes then
      update public.study_sessions set status = 'cancelled' where id = e.session_id;
      update public.session_host_exits set result = 'passed' where id = e.id;
    elsif due or total_votes >= e.eligible_voters then
      update public.session_host_exits set result = 'failed' where id = e.id;
    end if;
    return;
  end if;

  -- Pindahkan host: polling.
  select count(*) into total_votes
  from public.session_host_votes v
  join public.study_session_members m on m.session_id = e.session_id and m.user_id = v.candidate_id
  where v.exit_id = e.id and v.candidate_id is not null;

  if due or total_votes >= e.eligible_voters then
    if total_votes = 0 then
      update public.session_host_exits set result = 'failed' where id = e.id;
      return;
    end if;
    select v.candidate_id into winner
    from public.session_host_votes v
    join public.study_session_members m on m.session_id = e.session_id and m.user_id = v.candidate_id
    where v.exit_id = e.id and v.candidate_id is not null
    group by v.candidate_id, m.joined_at
    order by count(*) desc, m.joined_at asc
    limit 1;

    update public.study_sessions set host_id = winner
    where id = e.session_id and host_id is null;
    update public.session_host_exits set result = 'passed', new_host_id = winner where id = e.id;
  end if;
end;
$$;

create function public.cast_host_vote(
  p_exit_id uuid,
  p_candidate uuid default null,
  p_approve boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.session_host_exits;
begin
  select * into e from public.session_host_exits where id = p_exit_id for update;
  if not found then
    raise exception 'Pengajuan tidak ditemukan.';
  end if;
  if not private.is_session_member(e.session_id) then
    raise exception 'Hanya peserta sesi yang bisa memilih.';
  end if;
  if e.result <> 'pending' or e.vote_deadline <= now() then
    perform private.resolve_host_exit(e.id);
    raise exception 'Waktu memilih sudah habis.';
  end if;

  if e.action = 'transfer' then
    if p_candidate is null then
      raise exception 'Pilih calon host.';
    end if;
    if not exists (
      select 1 from public.study_session_members where session_id = e.session_id and user_id = p_candidate
    ) then
      raise exception 'Calon host harus peserta sesi.';
    end if;
    insert into public.session_host_votes (exit_id, voter_id, candidate_id)
    values (e.id, auth.uid(), p_candidate)
    on conflict (exit_id, voter_id) do update set candidate_id = excluded.candidate_id, approve = null;
  else
    if p_approve is null then
      raise exception 'Pilih setuju atau tetap jalan.';
    end if;
    insert into public.session_host_votes (exit_id, voter_id, approve)
    values (e.id, auth.uid(), p_approve)
    on conflict (exit_id, voter_id) do update set approve = excluded.approve, candidate_id = null;
  end if;

  perform private.resolve_host_exit(e.id);
end;
$$;

-- Tutup semua pengajuan yang batas waktunya lewat. Aman dipanggil siapa saja (idempoten);
-- klien memanggilnya sebelum membuka detail sesi, dan pg_cron tiap menit sebagai cadangan.
create function public.resolve_due_host_exits()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select id from public.session_host_exits where result = 'pending' and vote_deadline <= now()
  loop
    perform private.resolve_host_exit(r.id);
  end loop;
end;
$$;

-- Ringkasan suara untuk layar polling/voting tanpa membuka daftar suara orang lain.
create function public.my_host_exit_state(p_exit_id uuid)
returns table (approvals integer, total_votes integer, my_candidate_id uuid, my_approve boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (count(*) filter (where v.approve is true))::integer,
    count(*)::integer,
    (array_agg(v.candidate_id) filter (where v.voter_id = auth.uid()))[1],
    (array_agg(v.approve) filter (where v.voter_id = auth.uid()))[1]
  from public.session_host_votes v
  join public.session_host_exits e on e.id = v.exit_id
  where v.exit_id = p_exit_id
    and private.is_session_member(e.session_id)
$$;

revoke execute on function public.host_leave_session(uuid, text, public.host_exit_action) from public, anon;
revoke execute on function public.cast_host_vote(uuid, uuid, boolean) from public, anon;
revoke execute on function public.resolve_due_host_exits() from public, anon;
revoke execute on function public.my_host_exit_state(uuid) from public, anon;
revoke execute on function private.resolve_host_exit(uuid) from public, anon, authenticated;
grant execute on function public.host_leave_session(uuid, text, public.host_exit_action) to authenticated;
grant execute on function public.cast_host_vote(uuid, uuid, boolean) to authenticated;
grant execute on function public.resolve_due_host_exits() to authenticated;
grant execute on function public.my_host_exit_state(uuid) to authenticated;

-- Cadangan: tutup pengajuan jatuh tempo tiap menit. Dibungkus seperti jadwal presence supaya
-- migration tetap lolos bila pg_cron belum aktif.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'resolve-due-host-exits',
    '* * * * *',
    $job$select public.resolve_due_host_exits()$job$
  );
exception when others then
  raise notice 'pg_cron tidak aktif, resolve-due-host-exits belum dijadwalkan: %', sqlerrm;
end;
$$;
