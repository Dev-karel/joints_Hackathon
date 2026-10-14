-- Match Map v2 (PRD §15.3, layar Peta Figma): get_zone_presence ikut mengembalikan jurusan dan
-- mata kuliah yang SAMA dengan pemanggil, untuk chip "X cocok denganmu" dan filter matkul/jurusan.
-- Aturan privasi tidak berubah: hanya untuk pemanggil yang sendiri tampil (visibilitas timbal
-- balik), dan daftar anggota tetap kosong bila zona hanya berisi 1 orang. Mata kuliah orang lain
-- yang TIDAK kamu ambil tidak pernah dibuka (hanya irisan dengan milikmu, sama seperti
-- recommend_study_partners yang sudah membuka jumlah matkul sama).
-- Tipe hasil tidak berubah (members tetap jsonb), jadi cukup create or replace.
create or replace function public.get_zone_presence()
returns table (zone_id uuid, online_count integer, members jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select 1
    from public.presence p
    join public.profiles pr on pr.id = p.user_id
    where p.user_id = auth.uid() and p.expires_at > now() and pr.show_on_map
  ),
  visible as (
    select
      p.zone_id, pr.id, pr.full_name, pr.avatar_url, pr.personality_type, pr.major,
      coalesce(
        (
          select jsonb_agg(theirs.course_id)
          from public.user_courses theirs
          join public.user_courses mine
            on mine.course_id = theirs.course_id and mine.user_id = auth.uid()
          where theirs.user_id = pr.id
        ),
        '[]'::jsonb
      ) as shared_course_ids
    from public.presence p
    join public.profiles pr on pr.id = p.user_id
    where p.expires_at > now() and pr.show_on_map and exists (select 1 from me)
  )
  select
    v.zone_id,
    count(*)::integer,
    case
      when count(*) >= 2 then jsonb_agg(
        jsonb_build_object(
          'id', v.id,
          'full_name', v.full_name,
          'avatar_url', v.avatar_url,
          'personality_type', v.personality_type,
          'major', v.major,
          'shared_course_ids', v.shared_course_ids
        ) order by v.full_name
      )
      else '[]'::jsonb
    end
  from visible v
  group by v.zone_id
$$;

revoke execute on function public.get_zone_presence() from public, anon;
grant execute on function public.get_zone_presence() to authenticated;
