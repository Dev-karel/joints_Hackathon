-- Study Match (PRD §5 #3, METHODOLOGY §15): SKS per mata kuliah, maksimal 5 mata kuliah per
-- pengguna, dan rekomendasi partner berbobot SKS. Migration terpisah dari skema lama.

alter table courses add column credits smallint not null default 3 check (credits between 1 and 6);

-- Nilai SKS contoh; ganti dengan SKS kurikulum sebenarnya saat daftar mata kuliah asli dimasukkan.
update courses set credits = 4 where code in ('CONTOH-ALGO', 'CONTOH-DS', 'CONTOH-DB', 'CONTOH-OOP');
update courses set credits = 2 where code = 'CONTOH-ENG';

-- Pengguna yang sudah menyimpan lebih dari 5: simpan 5 yang paling awal dipilih, buang sisanya.
delete from user_courses uc
using (
  select user_id, course_id,
         row_number() over (partition by user_id order by created_at, course_id) as rn
  from user_courses
) r
where r.user_id = uc.user_id and r.course_id = uc.course_id and r.rn > 5;

-- Batas 5 ditegakkan di database. Kunci per pengguna mencegah dua simpan bersamaan lolos berdua.
create function public.enforce_max_user_courses()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text));
  if (select count(*) from public.user_courses where user_id = new.user_id) >= 5 then
    raise exception 'Maksimal 5 mata kuliah.';
  end if;
  return new;
end;
$$;

create trigger enforce_max_user_courses_trg
  before insert on user_courses
  for each row execute function public.enforce_max_user_courses();

-- Rekomendasi partner belajar versi 3: bagian mata kuliah berbobot SKS.
-- poin_matkul = round(Σ SKS matkul yang sama / Σ SKS semua matkul milikku × 60).
-- Komponen lain tidak berubah (archetype 20/10, jurusan 10, sesi bersama maks 10).
-- Tipe hasil sama dengan versi 2, jadi cukup create or replace.
create or replace function public.recommend_study_partners(p_user_id uuid default auth.uid())
returns table (
  user_id uuid,
  full_name text,
  major text,
  avatar_url text,
  personality_type archetype,
  shared_courses integer,
  score integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select id, major, personality_type
    from public.profiles
    where id = p_user_id and p_user_id = auth.uid()
  ),
  my_credits as (
    select coalesce(sum(c.credits), 0)::integer as n
    from public.user_courses uc
    join public.courses c on c.id = uc.course_id
    where uc.user_id = p_user_id
  ),
  course_overlap as (
    select other.user_id as other_id, count(*)::integer as n, sum(c.credits)::integer as credits
    from public.user_courses mine
    join public.user_courses other
      on other.course_id = mine.course_id and other.user_id <> mine.user_id
    join public.courses c on c.id = mine.course_id
    where mine.user_id = p_user_id
    group by other.user_id
  ),
  session_overlap as (
    select m2.user_id as other_id, count(*)::integer as n
    from public.study_session_members m1
    join public.study_session_members m2
      on m2.session_id = m1.session_id and m2.user_id <> m1.user_id
    where m1.user_id = p_user_id
    group by m2.user_id
  )
  select
    p.id, p.full_name, p.major, p.avatar_url, p.personality_type,
    coalesce(co.n, 0),
    (
      coalesce(round(coalesce(co.credits, 0)::numeric / nullif(mc.n, 0) * 60), 0)
      + case when p.personality_type is not distinct from me.personality_type then 20 else 10 end
      + case when p.major is not null and p.major = me.major then 10 else 0 end
      + least(coalesce(so.n, 0), 2) * 5
    )::integer as score
  from public.profiles p
  cross join me
  cross join my_credits mc
  left join course_overlap co on co.other_id = p.id
  left join session_overlap so on so.other_id = p.id
  where p.id <> p_user_id and p.personality_quiz_completed_at is not null
  order by score desc, p.full_name
  limit 20
$$;

revoke execute on function public.recommend_study_partners(uuid) from public, anon;
grant execute on function public.recommend_study_partners(uuid) to authenticated;
