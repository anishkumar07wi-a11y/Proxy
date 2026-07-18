-- ==========================================
-- PROXY - DATABASE SCHEMA & SECURITIES
-- ==========================================

-- Clean-up existing triggers/functions if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();

-- 1. ADMINS TABLE
-- Email-based admin registry
create table if not exists public.admins (
        id uuid primary key default gen_random_uuid(),
    email text unique not null,

    created_at timestamptz default now()
);

-- Enable RLS on admins
alter table public.admins enable row level security;

-- 2. PROFILES TABLE
-- Profile info synchronized from auth.users + user-specified metadata
create table if not exists public.profiles (
    id uuid primary key references auth.users on delete cascade,
    full_name text,
    email text unique,
    avatar_url text,
    college text,
    branch text,
    semester integer,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Admin helper function for policies
create or replace function public.is_admin()
returns boolean as $$
begin
    return exists (
        select 1 from public.admins 
        where email = auth.jwt() ->> 'email'
    );
end;
$$ language plpgsql security definer;

-- 3. COLLEGES TABLE
create table if not exists public.colleges (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.colleges enable row level security;

-- 4. BRANCHES TABLE
create table if not exists public.branches (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    code text not null,
    college_id uuid references public.colleges(id) on delete cascade not null,
    created_at timestamptz default now(),
    constraint unique_college_branch_code unique(college_id, code)
);

-- Enable RLS
alter table public.branches enable row level security;

-- 5. SEMESTERS TABLE
create table if not exists public.semesters (
    id uuid primary key default gen_random_uuid(),
    number integer not null check (number >= 1 and number <= 8),
    branch_id uuid references public.branches(id) on delete cascade not null,
    created_at timestamptz default now(),
    constraint unique_branch_semester unique(branch_id, number)
);

-- Enable RLS
alter table public.semesters enable row level security;

-- 6. SUBJECTS TABLE
create table if not exists public.subjects (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    code text not null,
    semester_id uuid references public.semesters(id) on delete cascade not null,
    created_at timestamptz default now(),
    constraint unique_semester_subject unique(semester_id, code)
);

-- Enable RLS
alter table public.subjects enable row level security;

-- 7. NOTES TABLE
create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    module_number integer not null check (module_number >= 1 and module_number <= 5),
    file_path text not null, -- Supabase Storage file reference path
    subject_id uuid references public.subjects(id) on delete cascade not null,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.notes enable row level security;

-- 8. PREVIOUS YEAR PAPERS TABLE
create table if not exists public.previous_papers (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    year integer not null,
    file_path text not null, -- Supabase Storage file reference path
    subject_id uuid references public.subjects(id) on delete cascade not null,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.previous_papers enable row level security;

-- 9. LEARNING PATHS TABLE
create table if not exists public.learning_paths (
    id uuid primary key default gen_random_uuid(),
    topic text not null,
    description text not null,
    official_doc text,
    github_link text,
    youtube_link text,
    project_ideas text, -- Plain text markdown
    difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
    estimated_time text not null,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.learning_paths enable row level security;

-- 10. COMMUNITY SHOWCASE TABLE
create table if not exists public.community_showcase (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    description text not null,
    github_link text,
    linkedin_link text,
    portfolio_link text,
    achievements text,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.community_showcase enable row level security;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- ADMINS Policies
create policy "Admins are read-only for authenticated" on public.admins
    for select to authenticated using (true);

create policy "Admins can be modified only by service role or self-insert" on public.admins
    for all to service_role using (true) with check (true);

-- PROFILES Policies
create policy "Profiles are viewable by anyone authenticated" on public.profiles
    for select to authenticated using (true);

create policy "Users can update their own profile" on public.profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Admins can manage all profiles" on public.profiles
    for all to authenticated using (public.is_admin());

-- COLLEGES, BRANCHES, SEMESTERS, SUBJECTS Policies (Read-only for all authenticated, full write for admins)
create policy "Colleges are read-only for authenticated" on public.colleges
    for select to authenticated using (true);
create policy "Admins can manage colleges" on public.colleges
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Branches are read-only for authenticated" on public.branches
    for select to authenticated using (true);
create policy "Admins can manage branches" on public.branches
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Semesters are read-only for authenticated" on public.semesters
    for select to authenticated using (true);
create policy "Admins can manage semesters" on public.semesters
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Subjects are read-only for authenticated" on public.subjects
    for select to authenticated using (true);
create policy "Admins can manage subjects" on public.subjects
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- NOTES, PREVIOUS PAPERS, LEARNING PATHS Policies
create policy "Notes are read-only for authenticated" on public.notes
    for select to authenticated using (true);
create policy "Admins can manage notes" on public.notes
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Papers are read-only for authenticated" on public.previous_papers
    for select to authenticated using (true);
create policy "Admins can manage papers" on public.previous_papers
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Learning paths are read-only for authenticated" on public.learning_paths
    for select to authenticated using (true);
create policy "Admins can manage learning paths" on public.learning_paths
    for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- COMMUNITY SHOWCASE Policies
create policy "Showcase list read-only for approved or owners" on public.community_showcase
    for select to authenticated using (
        status = 'approved' or auth.uid() = student_id or public.is_admin()
    );

create policy "Students can submit showcase entries" on public.community_showcase
    for insert to authenticated with check (
        auth.uid() = student_id and status = 'pending'
    );

create policy "Students can update their pending showcase entry" on public.community_showcase
    for update to authenticated using (
        auth.uid() = student_id and status = 'pending'
    ) with check (
        auth.uid() = student_id and status = 'pending'
    );

create policy "Admins can manage all showcase entries" on public.community_showcase
    for all to authenticated using (public.is_admin());


-- ==========================================
-- AUTOMATIC PROFILE SYNCHRONIZATION TRIGGER
-- ==========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, email, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        new.email,
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
    )
    on conflict (id) do update
    set
        full_name = excluded.full_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url;
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();


-- ==========================================
-- SEED DATA (MANDATORY COLLEGES)
-- ==========================================

insert into public.colleges (name) values
    ('SMVITM'),
    ('MIT Manipal'),
    ('MITE'),
    ('RV College of Engineering'),
    ('Dayananda Sagar College of Engineering'),
    ('Dr. Ambedkar Institute of Technology'),
    ('KS School of Engineering and Management'),
    ('NIE Mysuru'),
    ('Rajarajeshwari College of Engineering'),
    ('ACS College of Engineering')
on conflict (name) do nothing;


-- ==========================================
-- INDEXES FOR FASTER PERFORMANCE
-- ==========================================

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_branches_college on public.branches(college_id);
create index if not exists idx_semesters_branch on public.semesters(branch_id);
create index if not exists idx_subjects_semester on public.subjects(semester_id);
create index if not exists idx_notes_subject on public.notes(subject_id);
create index if not exists idx_papers_subject on public.previous_papers(subject_id);
create index if not exists idx_showcase_student on public.community_showcase(student_id);
create index if not exists idx_showcase_status on public.community_showcase(status);
