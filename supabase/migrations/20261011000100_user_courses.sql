-- AyokMatch: mata kuliah yang diambil pengguna, dipakai rekomendasi partner belajar
-- (PRD §5 #3 menghitung skor dari mata kuliah yang sama, archetype, dan minat).
-- Migration terpisah dari skema awal: tambahan ini tidak boleh digabung ke migration lama.

create table user_courses (
  user_id uuid not null references profiles (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index user_courses_course_idx on user_courses (course_id);

alter table user_courses enable row level security;
grant select, insert, update, delete on user_courses to authenticated;

-- Pengguna hanya melihat dan mengubah daftar miliknya. Rekomendasi membaca semua baris
-- lewat fungsi security definer di bawah, bukan lewat policy.
create policy user_courses_own on user_courses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Simpan seluruh pilihan sekaligus (atomik): ganti daftar lama dengan yang baru.
-- security invoker (default): RLS tetap berlaku, jadi hanya baris milik sendiri yang tersentuh.
create function public.set_my_courses(course_ids uuid[])
returns void
language sql
set search_path = ''
as $$
  delete from public.user_courses where user_id = (select auth.uid());
  insert into public.user_courses (user_id, course_id)
  select (select auth.uid()), c.id
  from public.courses c
  where c.id = any (course_ids);
$$;

revoke execute on function public.set_my_courses(uuid[]) from public, anon;
grant execute on function public.set_my_courses(uuid[]) to authenticated;

-- Rekomendasi partner belajar versi 2 (menggantikan versi di migration 4).
-- Skor 0–100: mata kuliah sama = (matkul_sama / matkul_milikku) × 60 (persentase irisan, jadi
-- orang yang mencentang semua matkul tidak otomatis menang), archetype SAMA (20, berbeda 10;
-- teman belajar dengan gaya yang mirip), jurusan sama (10), sesi yang pernah diikuti bersama
-- (maks 2 × 5). Bila kamu belum memilih mata kuliah, bagian matkul bernilai 0.
-- Keputusan produk: Belajar = archetype sama; Lomba = archetype berbeda (tim yang saling
-- melengkapi), diterapkan di fungsi rekomendasi lomba nanti. Heuristik sederhana, bukan ML. Tipe kolom hasil berubah, jadi fungsi lama di-drop dulu.
drop function if exists public.recommend_study_partners(uuid);

create function public.recommend_study_partners(p_user_id uuid default auth.uid())
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
  my_courses as (
    select count(*)::integer as n from public.user_courses where user_id = p_user_id
  ),
  course_overlap as (
    select other.user_id as other_id, count(*)::integer as n
    from public.user_courses mine
    join public.user_courses other
      on other.course_id = mine.course_id and other.user_id <> mine.user_id
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
      coalesce(round(coalesce(co.n, 0)::numeric / nullif(mc.n, 0) * 60), 0)
      + case when p.personality_type is not distinct from me.personality_type then 20 else 10 end
      + case when p.major is not null and p.major = me.major then 10 else 0 end
      + least(coalesce(so.n, 0), 2) * 5
    )::integer as score
  from public.profiles p
  cross join me
  cross join my_courses mc
  left join course_overlap co on co.other_id = p.id
  left join session_overlap so on so.other_id = p.id
  where p.id <> p_user_id and p.personality_quiz_completed_at is not null
  order by score desc, p.full_name
  limit 20
$$;

revoke execute on function public.recommend_study_partners(uuid) from public, anon;
grant execute on function public.recommend_study_partners(uuid) to authenticated;
