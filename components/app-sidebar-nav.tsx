'use client'

import Link from 'next/link'
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
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
