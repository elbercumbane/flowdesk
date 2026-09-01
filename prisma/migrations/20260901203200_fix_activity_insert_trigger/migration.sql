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
    WHEN 'customers' THEN 'Cliente criado: ' || COALESCE(v_row->>'name', '')
    WHEN 'deals' THEN 'Deal criado: ' || COALESCE(v_row->>'title', '')
    WHEN 'tasks' THEN 'Tarefa criada: ' || COALESCE(v_row->>'title', '')
    WHEN 'invoices' THEN 'Factura criada: ' || COALESCE(v_row->>'number', '')
    ELSE TG_TABLE_NAME || ' criado'
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

ALTER TABLE public.activity_logs
  ALTER COLUMN created_at TYPE TIMESTAMPTZ
  USING created_at AT TIME ZONE 'UTC';
