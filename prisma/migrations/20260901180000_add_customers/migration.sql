-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view org customers"
ON public.customers FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "members can insert org customers"
ON public.customers FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "members can update org customers"
ON public.customers FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "owners and managers can delete customers"
ON public.customers FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()::text AND role IN ('owner', 'manager')
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;
GRANT ALL ON TABLE public.customers TO service_role;
