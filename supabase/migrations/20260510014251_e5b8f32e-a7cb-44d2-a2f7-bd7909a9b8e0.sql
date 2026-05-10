alter policy "anyone can submit contact" on public.contact_submissions
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 3
    and position('@' in email) > 1
    and length(trim(message)) > 0
  );

alter policy "anyone can submit access requests" on public.access_requests
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 3
    and position('@' in email) > 1
    and requested_role in ('admin', 'staff', 'client')
    and coalesce(status, 'pending') = 'pending'
  );