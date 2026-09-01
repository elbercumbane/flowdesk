CREATE TABLE public.activity_logs (
    id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL,
    actor_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);

ALTER TABLE public.activity_logs
  ADD CONSTRAINT activity_logs_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view org activity"
ON public.activity_logs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()::text
  )
);

REVOKE ALL ON TABLE public.activity_logs FROM PUBLIC;
GRANT SELECT ON TABLE public.activity_logs TO authenticated;
GRANT ALL ON TABLE public.activity_logs TO service_role;

CREATE OR REPLACE FUNCTION public.log_activity_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_description text;
BEGIN
  v_description := CASE TG_TABLE_NAME
    WHEN 'customers' THEN 'Cliente criado: ' || NEW.name
    WHEN 'deals' THEN 'Deal criado: ' || NEW.title
    WHEN 'tasks' THEN 'Tarefa criada: ' || NEW.title
    WHEN 'invoices' THEN 'Factura criada: ' || NEW.number
    ELSE TG_TABLE_NAME || ' criado'
  END;

  INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, description)
  VALUES (NEW.organization_id, auth.uid()::text, 'created', TG_TABLE_NAME, NEW.id, v_description);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_customer_insert AFTER INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.log_activity_on_insert();
CREATE TRIGGER trg_log_deal_insert AFTER INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.log_activity_on_insert();
CREATE TRIGGER trg_log_task_insert AFTER INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_activity_on_insert();
CREATE TRIGGER trg_log_invoice_insert AFTER INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_activity_on_insert();

CREATE OR REPLACE FUNCTION public.log_deal_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, description)
    VALUES (
      NEW.organization_id,
      auth.uid()::text,
      'stage_changed',
      'deals',
      NEW.id,
      'Deal "' || NEW.title || '" passou para ' || NEW.stage
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_deal_stage_change AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.log_deal_stage_change();

CREATE OR REPLACE FUNCTION public.log_invoice_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, description)
    VALUES (
      NEW.organization_id,
      auth.uid()::text,
      'status_changed',
      'invoices',
      NEW.id,
      'Factura "' || NEW.number || '" passou para ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_invoice_status_change AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_invoice_status_change();

CREATE OR REPLACE FUNCTION public.log_task_done_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done' THEN
    INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, description)
    VALUES (
      NEW.organization_id,
      auth.uid()::text,
      'completed',
      'tasks',
      NEW.id,
      'Tarefa concluída: ' || NEW.title
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_task_done_change AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_done_change();
