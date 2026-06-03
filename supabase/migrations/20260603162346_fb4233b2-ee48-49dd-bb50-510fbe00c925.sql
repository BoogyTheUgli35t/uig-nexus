-- 1) Documents INSERT: require project belongs to user's org (or staff/admin)
DROP POLICY IF EXISTS "authed users upload docs" ON public.documents;
CREATE POLICY "authed users upload docs"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = documents.project_id
      AND (
        p.org_id = private.user_org(auth.uid())
        OR private.has_role(auth.uid(), 'admin'::app_role)
        OR private.has_role(auth.uid(), 'staff'::app_role)
      )
  )
);

-- 2) portal_audit_log INSERT: restrict to authenticated users inserting their own events
DROP POLICY IF EXISTS "users insert own audit events" ON public.portal_audit_log;
CREATE POLICY "users insert own audit events"
ON public.portal_audit_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3) Storage objects: scope reads/uploads to the org that owns the project
DROP POLICY IF EXISTS "auth users read project docs" ON storage.objects;
CREATE POLICY "auth users read project docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = ((storage.foldername(name))[1])::uuid
      AND (
        p.org_id = private.user_org(auth.uid())
        OR private.has_role(auth.uid(), 'admin'::app_role)
        OR private.has_role(auth.uid(), 'staff'::app_role)
      )
  )
);

DROP POLICY IF EXISTS "auth users upload project docs" ON storage.objects;
CREATE POLICY "auth users upload project docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-documents'
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = ((storage.foldername(name))[1])::uuid
      AND (
        p.org_id = private.user_org(auth.uid())
        OR private.has_role(auth.uid(), 'admin'::app_role)
        OR private.has_role(auth.uid(), 'staff'::app_role)
      )
  )
);