'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  FileText,
  History,
  UserPlus,
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/customers', label: 'Customers', icon: Users },
  { href: '/app/deals', label: 'Deals', icon: Briefcase },
  { href: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/app/invoices', label: 'Invoices', icon: FileText },
  { href: '/app/activity', label: 'Activity', icon: History },
  { href: '/app/team', label: 'Team', icon: UserPlus },
  { href: '/app/settings', label: 'Settings', icon: Settings },
]

export function AppSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="mt-4 flex flex-col gap-0.5">
      {navItems.map((item) => {
        const isActive = item.href === '/app'
          ? pathname === '/app'
          : pathname.startsWith(item.href)

        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 ${
              isActive
                ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                : 'text-zinc-600 hover:translate-x-0.5 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <span
              className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#4F46E5] transition-all duration-300 ${
                isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
              }`}
            />
            <item.icon
              className={`h-4 w-4 transition-transform duration-200 ${
                isActive ? '' : 'group-hover:scale-110'
              }`}
            />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
