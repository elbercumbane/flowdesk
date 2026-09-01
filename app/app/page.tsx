import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { Users, Briefcase, FileWarning, DollarSign } from 'lucide-react'

export default async function AppDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: customersCount },
    { data: openDeals },
    { data: overdueInvoices },
    { data: paidInvoices },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('id').not('stage', 'in', '(won,lost)'),
    supabase.from('invoices').select('id, due_date, status').eq('status', 'overdue'),
    supabase
      .from('invoices')
      .select('id, issue_date, status, invoice_items(quantity, unit_price)')
      .eq('status', 'paid'),
  ])

  const totalRevenue = (paidInvoices ?? []).reduce((sum, inv: any) => {
    const invTotal = (inv.invoice_items as any[]).reduce(
      (s, it) => s + Number(it.quantity) * Number(it.unit_price),
      0
    )
    return sum + invTotal
  }, 0)

  // agrupa receita paga por mês, últimos 6 meses
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('pt-PT', { month: 'short' }) }
  })

  const revenueByMonth = months.map(({ key, label }) => {
    const total = (paidInvoices ?? []).reduce((sum, inv: any) => {
      const d = new Date(inv.issue_date)
      const invKey = `${d.getFullYear()}-${d.getMonth()}`
      if (invKey !== key) return sum
      const invTotal = (inv.invoice_items as any[]).reduce(
        (s, it) => s + Number(it.quantity) * Number(it.unit_price),
        0
      )
      return sum + invTotal
    }, 0)
    return { month: label, revenue: total }
  })

  const kpis = [
    { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: 'Open deals', value: (openDeals ?? []).length, icon: Briefcase },
    { label: 'Overdue invoices', value: (overdueInvoices ?? []).length, icon: FileWarning, alert: (overdueInvoices ?? []).length > 0 },
    { label: 'Customers', value: customersCount ?? 0, icon: Users },
  ]

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 mb-4 sm:mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border bg-white p-3 sm:p-4">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1.5">
              <kpi.icon className="h-3.5 w-3.5" />
              <span className="text-xs">{kpi.label}</span>
            </div>
            <p className={`text-lg sm:text-xl font-semibold ${kpi.alert ? 'text-red-600' : 'text-zinc-900'}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-4 sm:p-6">
        <p className="text-sm font-medium text-zinc-700 mb-4">Receita paga — últimos 6 meses</p>
        <RevenueChart data={revenueByMonth} />
      </div>
    </div>
  )
}
