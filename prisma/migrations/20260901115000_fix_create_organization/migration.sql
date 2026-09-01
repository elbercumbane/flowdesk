CREATE OR REPLACE FUNCTION public.create_organization(org_name text, org_slug text)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  uid_text text;
  new_org public.organizations;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  uid_text := uid::text;

  INSERT INTO public.profiles (id, full_name)
  SELECT u.id::text, NULLIF(u.raw_user_meta_data->>'full_name', '')
  FROM auth.users u
  WHERE u.id = uid
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid_text) THEN
    RAISE EXCEPTION 'Profile not found for current user';
  END IF;

  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING * INTO new_org;

  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (new_org.id, uid_text, 'owner');

  RETURN new_org;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_organization(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(text, text) TO service_role;

DROP POLICY IF EXISTS "users can view own memberships" ON public.memberships;
CREATE POLICY "users can view own memberships"
ON public.memberships
FOR SELECT
USING (user_id = (auth.uid())::text);
