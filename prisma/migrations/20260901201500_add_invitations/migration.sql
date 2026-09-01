-- Profile email (copy from auth.users; client cannot read auth.users)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked');

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'member',
    "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "invited_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigger: persist email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id::text,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Backfill existing profiles (auth.users.id is uuid; profiles.id is text)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id::text AND p.email IS NULL;

-- RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners and managers can view invitations"
ON public.invitations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()::text AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "owners and managers can create invitations"
ON public.invitations FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()::text AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "owners and managers can revoke invitations"
ON public.invitations FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()::text AND role IN ('owner', 'manager')
  )
);

GRANT SELECT, INSERT, DELETE ON TABLE public.invitations TO authenticated;
GRANT ALL ON TABLE public.invitations TO service_role;

-- Accept invitation (SECURITY DEFINER: invitee is not a member yet)
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
  WHERE token = p_token AND status = 'pending';

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
