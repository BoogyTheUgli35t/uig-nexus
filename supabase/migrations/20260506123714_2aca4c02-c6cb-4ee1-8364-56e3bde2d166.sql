
-- Audit log
create table public.portal_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_portal_audit_log_created_at on public.portal_audit_log (created_at desc);
create index idx_portal_audit_log_user_id on public.portal_audit_log (user_id);
create index idx_portal_audit_log_event_type on public.portal_audit_log (event_type);

alter table public.portal_audit_log enable row level security;

create policy "users insert own audit events"
  on public.portal_audit_log for insert
  with check (user_id = auth.uid() or user_id is null);

create policy "admins read audit log"
  on public.portal_audit_log for select
  using (public.has_role(auth.uid(), 'admin'));

-- Access requests
create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text not null,
  requested_role text not null default 'client',
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_access_requests_status on public.access_requests (status);

alter table public.access_requests enable row level security;

create policy "anyone can submit access requests"
  on public.access_requests for insert
  with check (true);

create policy "users read own access requests"
  on public.access_requests for select
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "admins manage access requests"
  on public.access_requests for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "admins delete access requests"
  on public.access_requests for delete
  using (public.has_role(auth.uid(), 'admin'));

create trigger access_requests_updated_at
  before update on public.access_requests
  for each row execute function public.set_updated_at();
