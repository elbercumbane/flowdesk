import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DealsView } from './deals-view'

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, title, value, stage, customer_id, customers(name)')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-6 text-sm text-red-600">Erro a carregar deals: {error.message}</div>
  }

  return <DealsView initialDeals={deals ?? []} />
}
