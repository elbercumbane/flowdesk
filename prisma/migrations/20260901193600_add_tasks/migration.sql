-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'done');

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "organization_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "customer_id" TEXT,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "due_date" TIMESTAMP(3),
    "assignee_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view org tasks"
ON public.tasks FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "members can insert org tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "members can update org tasks"
ON public.tasks FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

CREATE POLICY "owners and managers can delete tasks"
ON public.tasks FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships
    WHERE user_id = auth.uid()::text AND role IN ('owner', 'manager')
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.tasks TO service_role;
