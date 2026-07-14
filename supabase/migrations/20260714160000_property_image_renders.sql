-- Marks property images that are AI-generated illustrative renders (not real photos),
-- so the public listing pages can label them honestly. Real photos uploaded via the
-- portal default to false; the Cloudinary batch (scripts/update-listing-images.sql)
-- sets true on the rows it swaps.

ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS is_render boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.property_images.is_render IS
  'True when the image is an AI-generated illustrative render rather than a photograph of the actual property.';
