CREATE OR REPLACE FUNCTION public.create_invoice_with_items(
  p_customer_id text,
  p_deal_id text,
  p_number text,
  p_due_date date,
  p_notes text,
  p_items jsonb
)
RETURNS public.invoices
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id text;
  new_invoice public.invoices;
  item jsonb;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.memberships
  WHERE user_id = auth.uid()::text
  LIMIT 1;

  INSERT INTO public.invoices (organization_id, customer_id, deal_id, number, due_date, notes)
  VALUES (v_org_id, p_customer_id, NULLIF(p_deal_id, ''), p_number, p_due_date, NULLIF(p_notes, ''))
  RETURNING * INTO new_invoice;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price)
    VALUES (
      new_invoice.id,
      item->>'description',
      (item->>'quantity')::numeric,
      (item->>'unitPrice')::numeric
    );
  END LOOP;

  RETURN new_invoice;
END;
$$;

REVOKE ALL ON FUNCTION public.create_invoice_with_items(text, text, text, date, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_invoice_with_items(text, text, text, date, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invoice_with_items(text, text, text, date, text, jsonb) TO service_role;
