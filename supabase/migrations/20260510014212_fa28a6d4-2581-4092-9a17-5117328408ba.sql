create schema if not exists private;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function private.user_org(_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = _user_id
$$;

grant usage on schema private to authenticated, anon;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, anon;
grant execute on function private.user_org(uuid) to authenticated, anon;

revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, public;
revoke execute on function public.user_org(uuid) from anon, authenticated, public;

alter policy "members read own org" on public.organizations
  using (id = private.user_org(auth.uid()) or private.has_role(auth.uid(), 'admin'));

alter policy "admins manage orgs" on public.organizations
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

alter policy "users read own profile" on public.profiles
  using (id = auth.uid() or private.has_role(auth.uid(), 'admin') or org_id = private.user_org(auth.uid()));

alter policy "admins manage profiles" on public.profiles
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

alter policy "users read own roles" on public.user_roles
  using (user_id = auth.uid() or private.has_role(auth.uid(), 'admin'));

alter policy "admins manage roles" on public.user_roles
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

alter policy "org members read projects" on public.projects
  using (org_id = private.user_org(auth.uid()) or private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'staff'));

alter policy "staff and admins write projects" on public.projects
  using (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'staff'))
  with check (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'staff'));

alter policy "read tasks of accessible projects" on public.tasks
  using (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and (
          p.org_id = private.user_org(auth.uid())
          or private.has_role(auth.uid(), 'admin')
          or private.has_role(auth.uid(), 'staff')
        )
    )
  );

alter policy "staff and admins manage tasks" on public.tasks
  using (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'staff'))
  with check (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'staff'));

alter policy "read docs of accessible projects" on public.documents
  using (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and (
          p.org_id = private.user_org(auth.uid())
          or private.has_role(auth.uid(), 'admin')
          or private.has_role(auth.uid(), 'staff')
        )
    )
  );

alter policy "staff and admins delete docs" on public.documents
  using (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'staff'));

alter policy "admins read contact" on public.contact_submissions
  using (private.has_role(auth.uid(), 'admin'));

alter policy "admins read audit log" on public.portal_audit_log
  using (private.has_role(auth.uid(), 'admin'));

alter policy "users read own access requests" on public.access_requests
  using (user_id = auth.uid() or private.has_role(auth.uid(), 'admin'));

alter policy "admins manage access requests" on public.access_requests
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

alter policy "admins delete access requests" on public.access_requests
  using (private.has_role(auth.uid(), 'admin'));

alter policy "staff admin delete project docs" on storage.objects
  using (bucket_id = 'project-documents' and (private.has_role(auth.uid(), 'admin') or private.has_role(auth.uid(), 'staff')));