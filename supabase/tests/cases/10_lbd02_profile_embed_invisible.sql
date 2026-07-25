-- TEST: LBD-02 -- one user cannot read another user's profile (breaks gallery attribution)
--
-- src/lib/gallery.js embeds profiles(full_name, avatar_url) for gallery rows
-- owned by other users. PostgREST subjects resource embeds to the embedded
-- table's RLS, so if a user cannot SELECT another user's profile row, the embed
-- resolves to NULL and ProteinCard falls back to 'Anonymous Scientist'.
--
-- This case tests the underlying row visibility, which is what determines the
-- embed result.

SELECT t.act_as_admin();

-- Two enrolled students in the same active cohort.
INSERT INTO public.cohorts (name, access_code, start_date, is_active, max_students)
VALUES ('Test Cohort', 'LBD-TEST-0001', current_date, true, 50);

DO $$
DECLARE
  v_author uuid;
  v_viewer uuid;
  v_cohort bigint;
  v_visible integer;
BEGIN
  v_cohort := (SELECT id FROM public.cohorts WHERE access_code = 'LBD-TEST-0001');
  v_author := auth.test_create_user('author@example.com', 'Ada Author');
  v_viewer := auth.test_create_user('viewer@example.com', 'Bob Viewer');

  UPDATE public.profiles SET cohort_id = v_cohort WHERE id IN (v_author, v_viewer);

  -- The author publishes a public design.
  INSERT INTO public.protein_gallery (user_id, title, description, tags, is_public)
  VALUES (v_author, 'Test Design', 'desc', ARRAY['tag'], true);

  -- Sanity: the trigger created a profile with a name for the author.
  PERFORM t.assert_eq(
    (SELECT full_name FROM public.profiles WHERE id = v_author),
    'Ada Author'::text,
    'author profile should exist with a full_name'
  );

  -- Now act as the viewer.
  EXECUTE format('SET LOCAL request.jwt.claim.sub = %L', v_viewer::text);
  EXECUTE 'SET LOCAL ROLE authenticated';

  -- The viewer CAN see the public gallery row...
  PERFORM t.assert_eq(
    (SELECT count(*)::integer FROM public.protein_gallery WHERE user_id = v_author),
    1,
    'viewer should see the public gallery row'
  );

  -- ...but CANNOT see the author's profile, so the embed yields NULL.
  SELECT count(*)::integer INTO v_visible
  FROM public.profiles WHERE id = v_author;

  PERFORM t.assert_eq(
    v_visible, 0,
    'LBD-02 CONFIRMED: viewer cannot read author profile, so gallery '
    || 'attribution resolves to NULL'
  );

  -- The equivalent of the PostgREST embed: a LEFT JOIN yields a NULL name.
  PERFORM t.assert(
    (SELECT p.full_name
       FROM public.protein_gallery g
       LEFT JOIN public.profiles p ON p.id = g.user_id
      WHERE g.user_id = v_author) IS NULL,
    'embedded profile name must be NULL for another user''s design'
  );
END $$;
