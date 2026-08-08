DROP POLICY IF EXISTS "read division-mate profiles" ON public.profiles;
DROP POLICY IF EXISTS "users read own profile" ON public.profiles;

CREATE POLICY "users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'staff')
);

-- Explicit, ownership-scoped policies for every private bucket.
DROP POLICY IF EXISTS "private buckets: owner or staff read" ON storage.objects;
CREATE POLICY "private buckets: owner or staff read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('property-images','lease-documents','pod-photos','field-images','prototype-images','document-library','tech-project-documents')
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "private buckets: authenticated upload" ON storage.objects;
CREATE POLICY "private buckets: authenticated upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('property-images','lease-documents','pod-photos','field-images','prototype-images','document-library','tech-project-documents')
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "private buckets: owner or staff update" ON storage.objects;
CREATE POLICY "private buckets: owner or staff update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('property-images','lease-documents','pod-photos','field-images','prototype-images','document-library','tech-project-documents')
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'))
)
WITH CHECK (
  bucket_id IN ('property-images','lease-documents','pod-photos','field-images','prototype-images','document-library','tech-project-documents')
);

DROP POLICY IF EXISTS "private buckets: owner or staff delete" ON storage.objects;
CREATE POLICY "private buckets: owner or staff delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('property-images','lease-documents','pod-photos','field-images','prototype-images','document-library','tech-project-documents')
  AND (owner = auth.uid() OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'))
);