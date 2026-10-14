-- Match › Lomba: permintaan bergabung ke tim (PRD §8).
-- Skema awal hanya punya team_join_requests (opening_id, user_id, message, status). Migration ini:
--   * menambah role_applied (peran yang dilamar),
--   * menjaga di database: pembuat tidak melamar timnya sendiri, lowongan tutup/penuh tidak
--     menerima lamaran,
--   * respond_team_request: host menerima/menolak, kuota dikunci di baris lowongan (tim tidak
--     bisa kelebihan anggota walau dua permintaan diterima bersamaan),
--   * leave_team: anggota keluar sendiri atau host mengeluarkan anggota,
--   * team_roster: daftar anggota tim yang sudah diterima, terbaca semua pengguna login
--     (hanya kolom publik profil).

alter table team_join_requests
  add column role_applied text check (role_applied is null or char_length(role_applied) <= 30);

-- ───────────────────────── Penjaga lamaran ─────────────────────────

create function public.guard_team_request_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.team_openings%rowtype;
begin
  select * into o from public.team_openings where id = new.opening_id;
  if not found then
    raise exception 'Lowongan tidak ditemukan.';
  end if;
  if o.host_id = new.user_id then
    raise exception 'Kamu pembuat lowongan ini.';
  end if;
  if o.status <> 'open' or o.registration_deadline <= now() then
    raise exception 'Pendaftaran lowongan ini sudah ditutup.';
  end if;
  if o.current_members >= o.team_size then
    raise exception 'Tim sudah penuh.';
  end if;
  return new;
end;
$$;

create trigger team_join_requests_guard_insert
  before insert on team_join_requests
  for each row execute function public.guard_team_request_insert();

-- ───────────────────────── Host menanggapi permintaan ─────────────────────────

create function public.respond_team_request(p_opening uuid, p_user uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.team_openings%rowtype;
  r public.team_join_requests%rowtype;
begin
  select * into o from public.team_openings where id = p_opening for update;
  if not found or o.host_id is distinct from auth.uid() then
    raise exception 'Hanya pembuat lowongan yang bisa menanggapi permintaan.';
  end if;

  select * into r from public.team_join_requests
  where opening_id = p_opening and user_id = p_user for update;
  if not found or r.status <> 'requested' then
    raise exception 'Permintaan tidak ditemukan atau sudah ditanggapi.';
  end if;

  if p_accept then
    if o.current_members >= o.team_size then
      raise exception 'Tim sudah penuh.';
    end if;
    update public.team_join_requests set status = 'accepted'
    where opening_id = p_opening and user_id = p_user;
    update public.team_openings
    set current_members = current_members + 1,
        status = case when current_members + 1 >= team_size then 'full'::public.opening_status else status end
    where id = p_opening;
  else
    update public.team_join_requests set status = 'rejected'
    where opening_id = p_opening and user_id = p_user;
  end if;
end;
$$;

-- ───────────────────────── Keluar / dikeluarkan dari tim ─────────────────────────

create function public.leave_team(p_opening uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.team_openings%rowtype;
begin
  select * into o from public.team_openings where id = p_opening for update;
  if not found then
    raise exception 'Lowongan tidak ditemukan.';
  end if;
  if auth.uid() is distinct from p_user and auth.uid() is distinct from o.host_id then
    raise exception 'Kamu tidak berhak mengeluarkan anggota ini.';
  end if;

  delete from public.team_join_requests
  where opening_id = p_opening and user_id = p_user and status = 'accepted';
  if not found then
    raise exception 'Dia bukan anggota tim ini.';
  end if;

  update public.team_openings
  set current_members = greatest(1, current_members - 1),
      status = case
        when status = 'full' and registration_deadline > now() then 'open'::public.opening_status
        else status
      end
  where id = p_opening;
end;
$$;

-- ───────────────────────── Daftar anggota tim ─────────────────────────

create function public.team_roster(p_opening uuid)
returns table (
  user_id uuid,
  full_name text,
  major text,
  avatar_url text,
  personality_type text,
  role_applied text,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.major, p.avatar_url, p.personality_type::text, r.role_applied, r.created_at
  from public.team_join_requests r
  join public.profiles p on p.id = r.user_id
  where r.opening_id = p_opening and r.status = 'accepted'
  order by r.created_at
$$;

revoke execute on function public.respond_team_request(uuid, uuid, boolean) from public, anon;
revoke execute on function public.leave_team(uuid, uuid) from public, anon;
revoke execute on function public.team_roster(uuid) from public, anon;
grant execute on function public.respond_team_request(uuid, uuid, boolean) to authenticated;
grant execute on function public.leave_team(uuid, uuid) to authenticated;
grant execute on function public.team_roster(uuid) to authenticated;
