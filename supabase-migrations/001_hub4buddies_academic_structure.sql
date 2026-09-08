-- Hub4Buddies flexible academic/resource structure
-- Run this in Supabase SQL Editor after the existing schema.

create extension if not exists pgcrypto;

create table if not exists public.academic_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.academic_programs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.academic_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  board_or_university text,
  curriculum_type text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(category_id, slug)
);

create table if not exists public.academic_levels (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.academic_programs(id) on delete cascade,
  name text not null,
  level_number integer,
  label text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(program_id, name)
);

create table if not exists public.academic_subjects (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.academic_levels(id) on delete cascade,
  name text not null,
  code text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(level_id, name)
);

create table if not exists public.academic_resources (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.academic_subjects(id) on delete cascade,
  resource_type text not null check (resource_type in ('notes','previous_paper','important_questions','model_paper','lab_manual','assignment','syllabus','question_bank','reference','other')),
  title text not null,
  description text,
  year integer,
  module_number integer,
  file_path text,
  external_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (file_path is not null or external_url is not null)
);

create index if not exists idx_academic_programs_category on public.academic_programs(category_id);
create index if not exists idx_academic_levels_program on public.academic_levels(program_id);
create index if not exists idx_academic_subjects_level on public.academic_subjects(level_id);
create index if not exists idx_academic_resources_subject on public.academic_resources(subject_id);
create index if not exists idx_academic_resources_type on public.academic_resources(resource_type);

alter table public.academic_categories enable row level security;
alter table public.academic_programs enable row level security;
alter table public.academic_levels enable row level security;
alter table public.academic_subjects enable row level security;
alter table public.academic_resources enable row level security;

create policy "Academic categories readable by authenticated" on public.academic_categories for select to authenticated using (true);
create policy "Admins manage academic categories" on public.academic_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Academic programs readable by authenticated" on public.academic_programs for select to authenticated using (true);
create policy "Admins manage academic programs" on public.academic_programs for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Academic levels readable by authenticated" on public.academic_levels for select to authenticated using (true);
create policy "Admins manage academic levels" on public.academic_levels for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Academic subjects readable by authenticated" on public.academic_subjects for select to authenticated using (true);
create policy "Admins manage academic subjects" on public.academic_subjects for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Academic resources readable by authenticated" on public.academic_resources for select to authenticated using (true);
create policy "Admins manage academic resources" on public.academic_resources for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.academic_categories (name, slug, description, sort_order) values
('School', 'school', '10th, SSLC, 11th and 12th / PUC resources', 10),
('Engineering', 'engineering', 'Engineering, VTU and autonomous college resources', 20),
('Management & Commerce', 'management-commerce', 'BBA, B.Com and related programs', 30),
('Computer Applications', 'computer-applications', 'BCA and computer application programs', 40),
('Pharmacy', 'pharmacy', 'B.Pharm and D.Pharm resources', 50),
('Nursing', 'nursing', 'Nursing academic resources', 60),
('Medical', 'medical', 'Medical and allied academic resources', 70)
on conflict (slug) do nothing;

-- Common program shells. Admins can add the exact board/university and institution-specific variants later.
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, '10th / SSLC', '10th-sslc', 'State / CBSE / ICSE', 10 from public.academic_categories where slug='school'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, '11th / PUC', '11th-puc', 'State / CBSE / ISC', 20 from public.academic_categories where slug='school'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, '12th / PUC', '12th-puc', 'State / CBSE / ISC', 30 from public.academic_categories where slug='school'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, 'B.Tech / B.E.', 'btech-be', 'VTU / Autonomous / Other', 10 from public.academic_categories where slug='engineering'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, 'BBA', 'bba', 'University / Autonomous', 10 from public.academic_categories where slug='management-commerce'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, 'B.Com', 'bcom', 'University / Autonomous', 20 from public.academic_categories where slug='management-commerce'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, 'BCA', 'bca', 'University / Autonomous', 10 from public.academic_categories where slug='computer-applications'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, 'B.Pharm', 'bpharm', 'PCI / University', 10 from public.academic_categories where slug='pharmacy'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, 'D.Pharm', 'dpharm', 'PCI / University', 20 from public.academic_categories where slug='pharmacy'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, 'B.Sc Nursing', 'bsc-nursing', 'INC / University', 10 from public.academic_categories where slug='nursing'
on conflict (category_id, slug) do nothing;
insert into public.academic_programs (category_id, name, slug, board_or_university, sort_order)
select id, 'MBBS', 'mbbs', 'NMC / University', 10 from public.academic_categories where slug='medical'
on conflict (category_id, slug) do nothing;

-- Helpful default levels for the seeded programs.
insert into public.academic_levels (program_id, name, level_number, label, sort_order)
select p.id, 'Class 10', 10, '10th / SSLC', 10 from public.academic_programs p where p.slug='10th-sslc'
on conflict (program_id, name) do nothing;
insert into public.academic_levels (program_id, name, level_number, label, sort_order)
select p.id, '1st Year', 1, 'Year 1', 10 from public.academic_programs p where p.slug in ('11th-puc','12th-puc','bpharm','dpharm','bsc-nursing','mbbs')
on conflict (program_id, name) do nothing;

comment on table public.academic_categories is 'Top-level education areas used by Hub4Buddies.';
comment on table public.academic_programs is 'Course/program plus board or university context.';
comment on table public.academic_levels is 'Class, year, semester or other study level.';
comment on table public.academic_subjects is 'Subjects within a study level.';
comment on table public.academic_resources is 'Notes, papers and other student resources.';
