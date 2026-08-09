DROP POLICY IF EXISTS "private buckets: owner or staff update" ON storage.objects;
CREATE POLICY "private buckets: owner or staff update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = ANY (ARRAY['property-images','lease-documents','pod-photos','field-images','prototype-images','document-library','tech-project-documents'])
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  bucket_id = ANY (ARRAY['property-images','lease-documents','pod-photos','field-images','prototype-images','document-library','tech-project-documents'])
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);

DROP POLICY IF EXISTS "admins delete notifications" ON public.notifications;
CREATE POLICY "admins delete notifications"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));