-- Accept by invitation id (TEXT). Invitee is not a member yet, so SECURITY DEFINER stays.
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invitation public.invitations;
  v_user_email text;
  v_org public.organizations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE id = p_token AND status = 'pending';

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou já utilizado';
  END IF;

  IF v_invitation.email != v_user_email THEN
    RAISE EXCEPTION 'Este convite foi enviado para outro email';
  END IF;

  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (v_invitation.organization_id, auth.uid()::text, v_invitation.role)
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  UPDATE public.invitations SET status = 'accepted' WHERE id = v_invitation.id;

  SELECT * INTO v_org FROM public.organizations WHERE id = v_invitation.organization_id;
  RETURN v_org;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO service_role;

-- Invitee can read their pending invite (needed for /invite/[token])
CREATE POLICY "invitees can view their pending invitation"
ON public.invitations FOR SELECT
USING (
  status = 'pending' AND email = (auth.jwt() ->> 'email')
);

-- Invitee can read the org name on the invite page (not a member yet)
CREATE POLICY "invitees can view invited organization"
ON public.organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM public.invitations
    WHERE status = 'pending' AND email = (auth.jwt() ->> 'email')
  )
);

-- Team list: members can see other memberships in the same org.
-- Helper is SECURITY DEFINER to avoid RLS recursion on memberships.
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text;
$$;

REVOKE ALL ON FUNCTION public.user_org_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_org_ids() TO authenticated;

DROP POLICY IF EXISTS "users can view own memberships" ON public.memberships;
CREATE POLICY "users can view org memberships"
ON public.memberships FOR SELECT
USING (organization_id IN (SELECT public.user_org_ids()));
