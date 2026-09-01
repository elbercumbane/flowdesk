import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Briefcase, CheckSquare, FileText, Sparkles } from 'lucide-react'

const iconMap: Record<string, any> = {
  customers: Users,
  deals: Briefcase,
  tasks: CheckSquare,
  invoices: FileText,
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('id, entity_type, description, created_at, actor_id')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return <div className="p-6 text-sm text-red-600">Erro a carregar actividade: {error.message}</div>
  }

  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[]
  const { data: profiles } = actorIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', actorIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email]))

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 mb-4 sm:mb-6">Activity Log</h1>

      {!logs || logs.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-10 text-center">
          <p className="text-sm text-zinc-500">Ainda não há actividade registada.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          {logs.map((log) => {
            const Icon = iconMap[log.entity_type] ?? Sparkles
            const actorName = log.actor_id ? profileMap.get(log.actor_id) : null
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3 border-b last:border-0">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF]">
                  <Icon className="h-3.5 w-3.5 text-[#4F46E5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-900">{log.description}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {actorName ? `${actorName} · ` : ''}{timeAgo(log.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
