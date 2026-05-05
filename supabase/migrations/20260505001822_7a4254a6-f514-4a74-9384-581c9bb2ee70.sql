
-- Roles enum + table
create type public.app_role as enum ('admin', 'staff', 'client');
create type public.project_type as enum ('tech', 'real_estate', 'logistics', 'agritech', 'other');
create type public.project_status as enum ('planning', 'active', 'on_hold', 'completed', 'cancelled');
create type public.task_status as enum ('todo', 'in_progress', 'done');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  org_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  type project_type not null default 'tech',
  name text not null,
  description text,
  status project_status not null default 'planning',
  owner_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'todo',
  assignee_id uuid references auth.users(id) on delete set null,
  due_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  file_path text not null,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  division text,
  message text not null,
  created_at timestamptz not null default now()
);

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- helper: get user org
create or replace function public.user_org(_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = _user_id
$$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();
create trigger tasks_updated before update on public.tasks for each row execute function public.set_updated_at();

-- handle new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'client');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.contact_submissions enable row level security;

-- organizations
create policy "members read own org" on public.organizations for select
  using (id = public.user_org(auth.uid()) or public.has_role(auth.uid(), 'admin'));
create policy "admins manage orgs" on public.organizations for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- profiles
create policy "users read own profile" on public.profiles for select
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin') or org_id = public.user_org(auth.uid()));
create policy "users update own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "admins manage profiles" on public.profiles for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- user_roles
create policy "users read own roles" on public.user_roles for select
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "admins manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- projects
create policy "org members read projects" on public.projects for select
  using (org_id = public.user_org(auth.uid()) or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));
create policy "staff and admins write projects" on public.projects for all
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- tasks
create policy "read tasks of accessible projects" on public.tasks for select
  using (exists (select 1 from public.projects p where p.id = project_id
    and (p.org_id = public.user_org(auth.uid()) or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))));
create policy "staff and admins manage tasks" on public.tasks for all
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- documents
create policy "read docs of accessible projects" on public.documents for select
  using (exists (select 1 from public.projects p where p.id = project_id
    and (p.org_id = public.user_org(auth.uid()) or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'))));
create policy "authed users upload docs" on public.documents for insert
  with check (uploaded_by = auth.uid());
create policy "staff and admins delete docs" on public.documents for delete
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff'));

-- contact submissions: anyone (incl anon) can insert; only admins read
create policy "anyone can submit contact" on public.contact_submissions for insert
  with check (true);
create policy "admins read contact" on public.contact_submissions for select
  using (public.has_role(auth.uid(), 'admin'));

-- storage bucket for documents
insert into storage.buckets (id, name, public) values ('project-documents', 'project-documents', false)
  on conflict (id) do nothing;

create policy "auth users read project docs" on storage.objects for select
  using (bucket_id = 'project-documents' and auth.uid() is not null);
create policy "auth users upload project docs" on storage.objects for insert
  with check (bucket_id = 'project-documents' and auth.uid() is not null);
create policy "staff admin delete project docs" on storage.objects for delete
  using (bucket_id = 'project-documents' and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'staff')));
