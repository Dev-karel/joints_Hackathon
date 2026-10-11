-- AyokMatch: skema awal (tabel, enum, FK, index).
-- Sumber: docs/schema.dbml (ERD) dan docs/ARCHITECTURE.md §5.
-- RLS, trigger, dan fungsi ada di migration berikutnya (jangan digabung di sini).
-- Tidak ada kolom BSSID/IP/koordinat pengguna di skema ini (PRD §7).

-- ───────────────────────── Enum ─────────────────────────

create type user_role as enum ('student', 'curator', 'admin');

create type archetype as enum (
  'wildheart', 'heartkeeper', 'mindsmith', 'groundbreaker', 'kindled_flame', 'sagekeeper'
);

create type zone_level as enum ('building', 'room');
create type session_kind as enum ('belajar_kelompok', 'tutor_sebaya', 'diskusi');
create type session_status as enum ('open', 'cancelled', 'done');
create type host_exit_action as enum ('transfer', 'cancel');
create type host_exit_result as enum ('pending', 'passed', 'failed', 'na');
create type opening_status as enum ('open', 'full', 'closed');
create type join_request_status as enum ('requested', 'accepted', 'rejected');
create type venue_type as enum ('public', 'partner');
create type venue_status as enum ('pending', 'approved');
create type event_kind as enum ('monthly', 'hobby', 'partner', 'small_table');
create type event_status as enum ('draft', 'published', 'cancelled');
create type rsvp_status as enum ('going', 'cancelled');
create type friendship_status as enum ('pending', 'accepted', 'blocked');
create type report_status as enum ('pending_review', 'valid', 'dismissed');

-- ───────────────────────── Identitas & profil ─────────────────────────

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  campus_email text not null unique,
  major text,
  semester smallint,
  role user_role not null default 'student',
  avatar_url text,
  ktm_url text,
  show_on_map boolean not null default false,
  personality_type archetype,
  personality_scores jsonb,
  personality_quiz_completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  device_id_hash text not null,
  verified_at timestamptz not null default now(),
  last_seen_at timestamptz,
  unique (user_id, device_id_hash)
);

create table personality_answers (
  profile_id uuid not null references profiles (id) on delete cascade,
  question_id text not null check (question_id ~ '^q([1-9]|1[0-5])$'),
  answer char(1) not null check (answer in ('A', 'B')),
  updated_at timestamptz not null default now(),
  primary key (profile_id, question_id)
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

-- ───────────────────────── Zona & Match Map ─────────────────────────

create table campus_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_zone_id uuid references campus_zones (id) on delete set null,
  level zone_level not null,
  map_x numeric,
  map_y numeric,
  map_w numeric,
  map_h numeric
);

create table wifi_access_points (
  bssid text primary key check (bssid = lower(bssid)),
  zone_id uuid not null references campus_zones (id),
  label text,
  registered_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table presence (
  user_id uuid primary key references profiles (id) on delete cascade,
  zone_id uuid not null references campus_zones (id) on delete cascade,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- ───────────────────────── Match › Belajar ─────────────────────────

create table study_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references profiles (id) on delete set null,
  course_id uuid not null references courses (id),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  zone_id uuid not null references campus_zones (id),
  session_kind session_kind not null,
  capacity smallint not null check (capacity >= 2),
  agenda jsonb,
  bring_note text,
  status session_status not null default 'open',
  created_at timestamptz not null default now()
);

create table study_session_members (
  session_id uuid not null references study_sessions (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table study_session_materials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references study_sessions (id) on delete cascade,
  uploaded_by uuid not null references profiles (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now()
);

create table session_host_exits (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references study_sessions (id) on delete cascade,
  host_id uuid not null references profiles (id) on delete cascade,
  reason text not null check (length(btrim(reason)) > 0),
  action host_exit_action not null,
  new_host_id uuid references profiles (id) on delete set null,
  eligible_voters smallint not null,
  required_votes smallint,
  vote_deadline timestamptz,
  result host_exit_result not null default 'pending',
  created_at timestamptz not null default now()
);

create table session_host_votes (
  exit_id uuid not null references session_host_exits (id) on delete cascade,
  voter_id uuid not null references profiles (id) on delete cascade,
  candidate_id uuid references profiles (id) on delete set null,
  approve boolean,
  created_at timestamptz not null default now(),
  primary key (exit_id, voter_id)
);

-- ───────────────────────── Match › Lomba ─────────────────────────

create table team_openings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles (id) on delete cascade,
  competition_name text not null,
  category text not null,
  registration_deadline timestamptz not null,
  team_size smallint not null check (team_size >= 2),
  current_members smallint not null default 1,
  roles_needed text[] not null,
  guidebook_url text,
  description text,
  status opening_status not null default 'open',
  created_at timestamptz not null default now()
);

create table team_join_requests (
  opening_id uuid not null references team_openings (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  message text,
  status join_request_status not null default 'requested',
  created_at timestamptz not null default now(),
  primary key (opening_id, user_id)
);

-- ───────────────────────── Event (luar kampus) ─────────────────────────

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  venue_type venue_type not null,
  status venue_status not null default 'pending'
);

create table events (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references profiles (id) on delete cascade,
  event_kind event_kind not null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue_id uuid not null references venues (id),
  capacity smallint not null check (capacity >= 1),
  cost_note text,
  status event_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table event_rsvps (
  event_id uuid not null references events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  status rsvp_status not null default 'going',
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table event_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  group_no smallint not null,
  unique (event_id, group_no)
);

create table event_group_members (
  group_id uuid not null references event_groups (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (group_id, user_id)
);

create table reconnect_votes (
  event_id uuid not null references events (id) on delete cascade,
  voter_id uuid not null references profiles (id) on delete cascade,
  target_id uuid not null references profiles (id) on delete cascade,
  primary key (event_id, voter_id, target_id),
  check (voter_id <> target_id)
);

-- ───────────────────────── Sosial & moderasi ─────────────────────────

create table friendships (
  requester_id uuid not null references profiles (id) on delete cascade,
  addressee_id uuid not null references profiles (id) on delete cascade,
  status friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table conversation_members (
  conversation_id uuid not null references conversations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles (id) on delete set null,
  target_user_id uuid references profiles (id) on delete set null,
  target_event_id uuid references events (id) on delete set null,
  target_session_id uuid references study_sessions (id) on delete set null,
  reason text not null,
  evidence_url text,
  status report_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  check (num_nonnulls(target_user_id, target_event_id, target_session_id) >= 1)
);

-- ───────────────────────── Index tambahan ─────────────────────────
-- Primary key/unique sudah membuat index sendiri; ini untuk jalur baca yang sering.

create index presence_zone_idx on presence (zone_id);
create index presence_expires_idx on presence (expires_at);
create index study_sessions_starts_idx on study_sessions (starts_at);
create index study_sessions_zone_idx on study_sessions (zone_id);
create index study_session_members_user_idx on study_session_members (user_id);
create index events_starts_idx on events (starts_at) where status = 'published';
create index event_rsvps_user_idx on event_rsvps (user_id);
create index team_openings_deadline_idx on team_openings (registration_deadline);
create index messages_conversation_idx on messages (conversation_id, created_at);
create index reports_status_idx on reports (status);
create index wifi_access_points_zone_idx on wifi_access_points (zone_id);

-- Satu hubungan pertemanan per pasangan, apa pun arah permintaannya ((A,B) dan (B,A) dianggap sama).
create unique index friendships_pair_idx
  on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

-- Index untuk FK/kolom yang dipakai policy RLS (Postgres tidak membuatnya otomatis).
create index study_sessions_host_idx on study_sessions (host_id);
create index study_sessions_course_idx on study_sessions (course_id);
create index study_session_materials_session_idx on study_session_materials (session_id);
create index session_host_exits_session_idx on session_host_exits (session_id);
create index team_openings_host_idx on team_openings (host_id);
create index team_join_requests_user_idx on team_join_requests (user_id);
create index events_curator_idx on events (curator_id);
create index events_venue_idx on events (venue_id);
create index event_group_members_user_idx on event_group_members (user_id);
create index reconnect_votes_voter_idx on reconnect_votes (voter_id);
create index friendships_addressee_idx on friendships (addressee_id);
create index conversation_members_user_idx on conversation_members (user_id);
create index reports_reporter_idx on reports (reporter_id);
