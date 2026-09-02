import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Building2 } from 'lucide-react'
import { DeleteCustomerButton } from './delete-button'

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  lead: 'bg-amber-50 text-amber-700',
  inactive: 'bg-zinc-100 text-zinc-500',
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !customer) notFound()

  // sabe se o utilizador actual é owner/manager, para mostrar ou não o botão de apagar
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', customer.organization_id)
    .single()

  const canDelete = membership?.role === 'owner' || membership?.role === 'manager'

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <Link href="/app/customers" className="group mb-4 flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Voltar a Customers
      </Link>

      <div className="fd-reveal rounded-xl border bg-white p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">{customer.name}</h1>
            {customer.company && (
              <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                {customer.company}
              </p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[customer.status] ?? statusStyles.active}`}>
            {customer.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-700">{customer.email || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-700">{customer.phone || '—'}</span>
          </div>
        </div>

        {customer.notes && (
          <div className="border-t pt-4 mt-4">
            <p className="text-xs font-medium text-zinc-500 mb-1">Notas</p>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}

        {canDelete && (
          <div className="border-t pt-4 mt-4 flex justify-end">
            <DeleteCustomerButton customerId={customer.id} />
          </div>
        )}
      </div>
    </div>
  )
}
