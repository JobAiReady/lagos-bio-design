-- Gallery likes table
CREATE TABLE IF NOT EXISTS public.gallery_likes (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  design_id bigint NOT NULL REFERENCES public.protein_gallery(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, design_id)
);

ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own likes
DROP POLICY IF EXISTS "Users can insert own likes" ON public.gallery_likes;
CREATE POLICY "Users can insert own likes" ON public.gallery_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.gallery_likes;
CREATE POLICY "Users can delete own likes" ON public.gallery_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view likes (for counting)
DROP POLICY IF EXISTS "Anyone can view likes" ON public.gallery_likes;
CREATE POLICY "Anyone can view likes" ON public.gallery_likes
  FOR SELECT USING (true);

-- Add featured column to protein_gallery
ALTER TABLE public.protein_gallery
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;
