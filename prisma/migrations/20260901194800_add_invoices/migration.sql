-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'paid', 'overdue');

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoices_organization_id_number_key" ON "invoices"("organization_id", "number");

CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view org invoices"
ON public.invoices FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "members can insert org invoices"
ON public.invoices FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "members can update org invoices"
ON public.invoices FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "owners and managers can delete invoices"
ON public.invoices FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()::text AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "members can view org invoice items"
ON public.invoice_items FOR SELECT
USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
    )
  )
);

CREATE POLICY "members can insert org invoice items"
ON public.invoice_items FOR INSERT
WITH CHECK (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
    )
  )
);

CREATE POLICY "members can update org invoice items"
ON public.invoice_items FOR UPDATE
USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
    )
  )
);

CREATE POLICY "members can delete org invoice items"
ON public.invoice_items FOR DELETE
USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
    )
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invoices TO authenticated;
GRANT ALL ON TABLE public.invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invoice_items TO authenticated;
GRANT ALL ON TABLE public.invoice_items TO service_role;
