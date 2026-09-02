'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { AppSidebarNav } from './app-sidebar-nav'
import { DemoBanner } from './demo-banner'
import { logout } from '@/app/login/logout'

export function AppShell({
  userEmail,
  isDemo,
  orgName,
  children,
}: {
  userEmail: string
  isDemo?: boolean
  orgName?: string
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const renderSidebar = () => (
    <>
      <div className="flex items-center gap-2 px-2 py-3">
        <div className="h-5 w-5 rounded-md bg-gradient-to-br from-[#818CF8] to-[#6366F1] shadow-sm shadow-indigo-300/50" />
        <span className="text-sm font-medium">FlowDesk</span>
      </div>
      <AppSidebarNav onNavigate={() => setMobileOpen(false)} />
      <div className="mt-auto border-t pt-3 px-2 space-y-2">
        <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
        {isDemo ? (
          <div className="flex flex-col gap-1">
            <a href="/demo/exit?to=login" className="text-xs font-medium text-[#4F46E5] hover:underline">
              Sign in to your account
            </a>
            <a href="/demo/exit?to=signup" className="text-xs font-medium text-[#4F46E5] hover:underline">
              Create a new account
            </a>
            <a href="/demo/exit?to=org" className="text-xs font-medium text-[#4F46E5] hover:underline">
              Create an organization
            </a>
          </div>
        ) : (
          <form action={logout}>
            <button type="submit" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
              Sign out
            </button>
          </form>
        )}
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col border-r bg-white p-3">
        {renderSidebar()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 z-10 h-full w-64 flex flex-col bg-white p-3 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="self-end p-1 text-zinc-500"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebar()}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 border-b bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-zinc-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-gradient-to-br from-[#818CF8] to-[#6366F1]" />
            <span className="text-sm font-medium">FlowDesk</span>
          </div>
        </header>

        {isDemo && <DemoBanner orgName={orgName || 'Demo'} />}

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
