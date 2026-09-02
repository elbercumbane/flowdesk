CREATE OR REPLACE FUNCTION public.log_activity_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_description text;
  v_row jsonb := to_jsonb(NEW);
BEGIN
  v_description := CASE TG_TABLE_NAME
    WHEN 'customers' THEN 'Customer created: ' || COALESCE(v_row->>'name', '')
    WHEN 'deals' THEN 'Deal created: ' || COALESCE(v_row->>'title', '')
    WHEN 'tasks' THEN 'Task created: ' || COALESCE(v_row->>'title', '')
    WHEN 'invoices' THEN 'Invoice created: ' || COALESCE(v_row->>'number', '')
    ELSE TG_TABLE_NAME || ' created'
  END;

  INSERT INTO public.activity_logs (organization_id, actor_id, action, entity_type, entity_id, description)
  VALUES (
    v_row->>'organization_id',
    auth.uid()::text,
    'created',
    TG_TABLE_NAME,
    v_row->>'id',
    v_description
  );

  RETURN NEW;
END;
$$;

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
      'Deal "' || NEW.title || '" moved to ' || NEW.stage
    );
  END IF;
  RETURN NEW;
END;
$$;

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
      'Invoice "' || NEW.number || '" marked as ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

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
      'Task completed: ' || NEW.title
    );
  END IF;
  RETURN NEW;
END;
$$;

UPDATE public.activity_logs SET description = replace(description, 'Cliente criado: ', 'Customer created: ') WHERE description LIKE 'Cliente criado:%';
UPDATE public.activity_logs SET description = replace(description, 'Deal criado: ', 'Deal created: ') WHERE description LIKE 'Deal criado:%';
UPDATE public.activity_logs SET description = replace(description, 'Tarefa criada: ', 'Task created: ') WHERE description LIKE 'Tarefa criada:%';
UPDATE public.activity_logs SET description = replace(description, 'Factura criada: ', 'Invoice created: ') WHERE description LIKE 'Factura criada:%';
UPDATE public.activity_logs SET description = replace(description, 'Tarefa concluída: ', 'Task completed: ') WHERE description LIKE 'Tarefa concluída:%';
UPDATE public.activity_logs SET description = replace(description, '" passou para ', '" moved to ') WHERE description LIKE '%passou para%';
UPDATE public.activity_logs SET description = replace(description, 'Factura "', 'Invoice "') WHERE description LIKE 'Factura "%';

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
    RAISE EXCEPTION 'Invitation is invalid or has already been used';
  END IF;

  IF v_invitation.email != v_user_email THEN
    RAISE EXCEPTION 'This invitation was sent to a different email';
  END IF;

  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (v_invitation.organization_id, auth.uid()::text, v_invitation.role)
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  UPDATE public.invitations SET status = 'accepted' WHERE id = v_invitation.id;

  SELECT * INTO v_org FROM public.organizations WHERE id = v_invitation.organization_id;
  RETURN v_org;
END;
$$;
