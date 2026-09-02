import { createClient } from '@/lib/supabase/server'
import { Users, Briefcase, CheckSquare, FileText, Sparkles } from 'lucide-react'

const iconMap: Record<string, any> = {
  customers: Users,
  deals: Briefcase,
  tasks: CheckSquare,
  invoices: FileText,
}

function localizeActivity(description: string) {
  return description
    .replace(/^Cliente criado:\s*/, 'Customer created: ')
    .replace(/^Deal criado:\s*/, 'Deal created: ')
    .replace(/^Tarefa criada:\s*/, 'Task created: ')
    .replace(/^Factura criada:\s*/, 'Invoice created: ')
    .replace(/^Tarefa concluída:\s*/, 'Task completed: ')
    .replace(/^Factura "/, 'Invoice "')
    .replace(/" passou para /, '" moved to ')
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('id, entity_type, description, created_at, actor_id')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return <div className="p-6 text-sm text-red-600">Failed to load activity: {error.message}</div>
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
        <div className="fd-reveal rounded-xl border border-dashed bg-white p-10 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 animate-bob">
            <Sparkles className="h-8 w-8 text-zinc-300" />
          </span>
          <p className="text-sm text-zinc-500">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="fd-stagger rounded-xl border bg-white overflow-hidden">
          {logs.map((log) => {
            const Icon = iconMap[log.entity_type] ?? Sparkles
            const actorName = log.actor_id ? profileMap.get(log.actor_id) : null
            return (
              <div key={log.id} className="group flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-zinc-50/70">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-3.5 w-3.5 text-[#4F46E5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-900">{localizeActivity(log.description)}</p>
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
