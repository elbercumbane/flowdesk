-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('lead', 'qualified', 'proposal', 'won', 'lost');

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stage" "DealStage" NOT NULL DEFAULT 'lead',
    "owner_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deals" ADD CONSTRAINT "deals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view org deals"
ON public.deals FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "members can insert org deals"
ON public.deals FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "members can update org deals"
ON public.deals FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "owners and managers can delete deals"
ON public.deals FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()::text AND role IN ('owner', 'manager')
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.deals TO authenticated;
GRANT ALL ON TABLE public.deals TO service_role;
