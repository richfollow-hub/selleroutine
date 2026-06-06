-- ========================================================
-- Selleroutine Comprehensive Database & Storage Schema
-- ========================================================

-- Drop existing tables to prevent "relation already exists" errors on reset
drop table if exists public.feedbacks cascade;
drop table if exists public.mission_logs cascade;
drop table if exists public.missions cascade;
drop table if exists public.challenge_members cascade;
drop table if exists public.challenges cascade;
drop table if exists public.product_ideas cascade;
drop table if exists public.keyword_notes cascade;
drop table if exists public.profiles cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table (Extends Supabase Auth users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null,
    name text not null,
    role text not null default 'participant' check (role in ('participant', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- 2. CHALLENGES Table
create table public.challenges (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    start_date date not null,
    end_date date not null,
    status text not null default 'scheduled' check (status in ('scheduled', 'active', 'ended')),
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on challenges
alter table public.challenges enable row level security;

-- 3. CHALLENGE_MEMBERS Table
create table public.challenge_members (
    id uuid default gen_random_uuid() primary key,
    challenge_id uuid references public.challenges(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text not null default 'participant' check (role in ('participant', 'admin')),
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (challenge_id, user_id)
);

-- Enable RLS on challenge_members
alter table public.challenge_members enable row level security;

-- 4. MISSIONS Table
create table public.missions (
    id uuid default gen_random_uuid() primary key,
    challenge_id uuid references public.challenges(id) on delete cascade not null,
    title text not null,
    description text,
    sort_order integer default 0 not null,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on missions
alter table public.missions enable row level security;

-- 5. MISSION_LOGS Table
create table public.mission_logs (
    id uuid default gen_random_uuid() primary key,
    challenge_id uuid references public.challenges(id) on delete cascade not null,
    mission_id uuid references public.missions(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    log_date date not null,
    is_completed boolean default false not null,
    note text,
    proof_link text,
    image_url text,
    reflection text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (mission_id, user_id, log_date)
);

-- Enable RLS on mission_logs
alter table public.mission_logs enable row level security;

-- 6. FEEDBACKS Table
create table public.feedbacks (
    id uuid default gen_random_uuid() primary key,
    mission_log_id uuid references public.mission_logs(id) on delete cascade not null,
    participant_id uuid references public.profiles(id) on delete cascade not null,
    admin_id uuid references public.profiles(id) on delete cascade not null,
    comment text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on feedbacks
alter table public.feedbacks enable row level security;

-- 7. PRODUCT_IDEAS Table
create table public.product_ideas (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    supplier_link text,
    estimated_margin numeric default 30 not null,
    memo text,
    status text not null default 'pending' check (status in ('pending', 'sourced', 'dropped')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on product_ideas
alter table public.product_ideas enable row level security;

-- 8. KEYWORD_NOTES Table
create table public.keyword_notes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    main_keyword text not null,
    longtail_keywords text,
    competitor_keywords text,
    memo text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on keyword_notes
alter table public.keyword_notes enable row level security;


-- ========================================================
-- Database Performance Indexes
-- ========================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_challenges_status on public.challenges(status);
create index if not exists idx_challenge_members_user on public.challenge_members(user_id);
create index if not exists idx_challenge_members_challenge on public.challenge_members(challenge_id);
create index if not exists idx_missions_challenge on public.missions(challenge_id);
create index if not exists idx_mission_logs_user_date on public.mission_logs(user_id, log_date);
create index if not exists idx_mission_logs_challenge on public.mission_logs(challenge_id);
create index if not exists idx_feedbacks_log on public.feedbacks(mission_log_id);
create index if not exists idx_feedbacks_participant on public.feedbacks(participant_id);
create index if not exists idx_product_ideas_user on public.product_ideas(user_id);
create index if not exists idx_keyword_notes_user on public.keyword_notes(user_id);


-- ========================================================
-- Trigger Functions
-- ========================================================

-- 1. Automatic updated_at sync function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_challenges_updated_at before update on public.challenges
    for each row execute procedure public.update_updated_at_column();

create trigger update_mission_logs_updated_at before update on public.mission_logs
    for each row execute procedure public.update_updated_at_column();

create trigger update_feedbacks_updated_at before update on public.feedbacks
    for each row execute procedure public.update_updated_at_column();

-- 2. Auth User Creation Signup trigger
create or replace function public.handle_new_user()
returns trigger
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '신규 챌린저'),
    'participant' -- Always force 'participant' at trigger level for security
  );
  return new;
end;
$$ language plpgsql;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ========================================================
-- Row Level Security (RLS) Policies (Database)
-- ========================================================

-- PROFILES policies
create policy "Authenticated users can view profiles"
on public.profiles for select
using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

-- CHALLENGES policies
create policy "Authenticated users can view challenges"
on public.challenges for select
using (auth.role() = 'authenticated');

create policy "Admins can insert challenges"
on public.challenges for insert
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can update challenges"
on public.challenges for update
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- CHALLENGE_MEMBERS policies
create policy "Authenticated users can view challenge membership"
on public.challenge_members for select
using (auth.role() = 'authenticated');

create policy "Admins can manage challenge membership"
on public.challenge_members for all
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- MISSIONS policies
create policy "Authenticated users can view missions"
on public.missions for select
using (auth.role() = 'authenticated');

create policy "Admins can manage missions"
on public.missions for all
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- MISSION_LOGS policies
create policy "Users can view their own logs, Admins can view all"
on public.mission_logs for select
using (
  auth.uid() = user_id or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Users can insert their own logs"
on public.mission_logs for insert
with check (auth.uid() = user_id);

create policy "Users can update their own logs"
on public.mission_logs for update
using (auth.uid() = user_id);

-- FEEDBACKS policies
create policy "Users can view feedbacks on their own logs, Admins can view all"
on public.feedbacks for select
using (
  auth.uid() = participant_id or
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can insert feedbacks"
on public.feedbacks for insert
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can update feedbacks"
on public.feedbacks for update
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "Admins can delete feedbacks"
on public.feedbacks for delete
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- PRODUCT_IDEAS policies
create policy "Users can manage their own product ideas"
on public.product_ideas for all
using (auth.uid() = user_id);

-- KEYWORD_NOTES policies
create policy "Users can manage their own keyword notes"
on public.keyword_notes for all
using (auth.uid() = user_id);


-- ========================================================
-- Supabase Storage Configuration (proof-images Bucket)
-- ========================================================

-- Create the bucket if not exists
insert into storage.buckets (id, name, public)
values ('proof-images', 'proof-images', false)
on conflict (id) do nothing;

-- ========================================================
-- [중요] Supabase Storage RLS 설정 안내
-- ========================================================
-- `storage.objects` 테이블은 시스템 소유(`supabase_admin`)이므로 SQL 에디터에서 직접 ALTER RLS 실행 시
-- "must be owner of table objects" 권한 에러가 발생합니다.
--
-- 따라서 아래의 Storage 보안 정책은 Supabase 웹 콘솔의 [Storage] -> [Policies] 메뉴에서 
-- 'proof-images' 버킷에 대해 직접 등록하시는 것을 권장합니다.

/*
-- 1) SELECT 정책 (본인 이미지 및 해당 챌린지를 만든 운영자만 조회)
-- Policy Name: Allow owners and admins to select proof images
-- Target: SELECT
-- Using expression:
  bucket_id = 'proof-images' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    (
      exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      ) AND
      exists (
        select 1 from public.challenges c
        where c.id::text = (storage.foldername(name))[2]
          and c.created_by = auth.uid()
      )
    )
  )

-- 2) INSERT 정책 (본인 경로에만 업로드 가능)
-- Policy Name: Allow users to upload their own proof images
-- Target: INSERT
-- With check expression:
  bucket_id = 'proof-images' AND
  auth.uid()::text = (storage.foldername(name))[1]

-- 3) DELETE 정책 (본인 이미지 삭제)
-- Policy Name: Allow users to delete their own proof images
-- Target: DELETE
-- Using expression:
  bucket_id = 'proof-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
*/
