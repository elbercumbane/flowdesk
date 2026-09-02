'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, Trash2, CheckSquare } from 'lucide-react'
import { updateTaskStatus, deleteTask } from './actions'

type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
  deal_id: string | null
  customer_id: string | null
  deals: { title: string } | { title: string }[] | null
  customers: { name: string } | { name: string }[] | null
}

function relName(rel: { title?: string; name?: string } | any[] | null, key: 'title' | 'name') {
  if (!rel) return null
  const obj = Array.isArray(rel) ? rel[0] : rel
  return obj?.[key] ?? null
}

const statusLabels: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export function TasksView({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [, startTransition] = useTransition()

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter]
  )

  function toggleDone(task: Task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))
    startTransition(() => updateTaskStatus(task.id, newStatus))
    if (newStatus === 'done') toast.success('Task completed')
  }

  function changeStatus(taskId: string, status: string) {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)))
    startTransition(() => updateTaskStatus(taskId, status))
  }

  function remove(taskId: string) {
    setTasks(tasks.filter((t) => t.id !== taskId))
    startTransition(() => deleteTask(taskId))
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3 flex-wrap">
        <h1 className="text-lg sm:text-xl font-semibold text-zinc-900">Tasks</h1>
        <Link
          href="/app/tasks/new"
          className="flex items-center gap-1.5 rounded-md bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#4F46E5] active:scale-[0.97] transition hover:shadow-lg hover:shadow-indigo-500/25"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
        </Link>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
              filter === f
                ? 'border-[#EEF2FF] bg-[#EEF2FF] text-[#4F46E5]'
                : 'bg-white text-zinc-500 hover:border-indigo-200 hover:text-zinc-800'
            }`}
          >
            {f === 'all' ? 'All' : statusLabels[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="fd-reveal rounded-xl border border-dashed bg-white p-10 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 animate-bob">
            <CheckSquare className="h-8 w-8 text-zinc-300" />
          </span>
          <p className="text-sm text-zinc-500">No tasks here.</p>
        </div>
      ) : (
        <div className="fd-stagger flex flex-col gap-2">
          {filtered.map((task) => {
            const dealTitle = relName(task.deals, 'title')
            const customerNameStr = relName(task.customers, 'name')
            const isOverdue =
              task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

            return (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border bg-white p-3 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
              >
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => toggleDone(task)}
                  className="h-4 w-4 shrink-0 accent-[#6366F1]"
                />

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-zinc-500">
                    {dealTitle && <span>{dealTitle}</span>}
                    {customerNameStr && <span>· {customerNameStr}</span>}
                    {task.due_date && (
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        · {new Date(task.due_date).toLocaleDateString('en-US')}
                      </span>
                    )}
                  </div>
                </div>

                <select
                  value={task.status}
                  onChange={(e) => changeStatus(task.id, e.target.value)}
                  className="hidden sm:block shrink-0 rounded-md border px-2 py-1 text-xs text-zinc-600 bg-zinc-50"
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>

                <button
                  onClick={() => remove(task.id)}
                  className="shrink-0 text-zinc-300 hover:text-red-600"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
