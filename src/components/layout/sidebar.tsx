'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrg } from '@/providers/org-provider'
import { useAuth } from '@/providers/auth-provider'
import { MODULE_NAV } from '@/lib/constants'
import { logout } from '@/modules/core/actions/auth'
import { getInitials } from '@/lib/utils/format'
import type { ModuleSlug } from '@/lib/types'
import {
  Package, ShoppingCart, Users, Truck, DollarSign, BarChart3,
  LayoutDashboard, Settings, LogOut, ChevronDown, Building2,
  Plus, ArrowLeftRight, Warehouse, AlertTriangle, Monitor,
  History, Banknote, UserPlus, ClipboardList, CreditCard,
  FileText, TrendingUp, PieChart, Archive, Wallet, ArrowRightLeft,
  MapPin
} from 'lucide-react'
import { useState } from 'react'

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, ShoppingCart, Users, Truck, DollarSign, BarChart3,
  LayoutDashboard, Settings, Plus, ArrowLeftRight, Warehouse,
  AlertTriangle, Monitor, History, Banknote, UserPlus, ClipboardList,
  Building2, CreditCard, FileText, TrendingUp, PieChart, Archive,
  Wallet, ArrowRightLeft, MapPin,
}

function IconComponent({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name]
  if (!Icon) return null
  return <Icon className={className} />
}

export function Sidebar() {
  const pathname = usePathname()
  const { currentOrg, currentMembership, activeModules, organizations, setCurrentOrgId } = useOrg()
  const { profile } = useAuth()
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  // Build navigation from active modules
  const navigation = activeModules
    .filter((om) => om.module && MODULE_NAV[om.module.slug as keyof typeof MODULE_NAV])
    .map((om) => {
      const slug = om.module!.slug as keyof typeof MODULE_NAV
      return {
        slug,
        ...MODULE_NAV[slug],
      }
    })

  const toggleModule = (slug: string) => {
    setExpandedModules((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const isActive = (path: string) => pathname === path
  const isModuleActive = (basePath: string) => pathname.startsWith(basePath)

  return (
    <aside className="flex flex-col w-64 bg-neutral-900/50 border-r border-neutral-800 h-screen sticky top-0">
      {/* Organization Switcher */}
      <div className="p-4 border-b border-neutral-800">
        <div className="relative">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-800/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentOrg ? getInitials(currentOrg.name) : '?'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentOrg?.name ?? 'Sin organización'}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {currentMembership?.role?.display_name}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
          </button>

          {/* Dropdown */}
          {orgDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOrgDropdownOpen(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
                {organizations.map((mem) => (
                  <button
                    key={mem.organization_id}
                    onClick={() => {
                      setCurrentOrgId(mem.organization_id)
                      setOrgDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-neutral-700/50 transition-colors ${
                      mem.organization_id === currentOrg?.id ? 'bg-violet-500/10' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {mem.organization ? getInitials(mem.organization.name) : '?'}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {mem.organization?.name}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {mem.role?.display_name}
                      </p>
                    </div>
                  </button>
                ))}
                <Link
                  href="/org/new"
                  className="flex items-center gap-3 p-3 text-violet-400 hover:bg-neutral-700/50 transition-colors border-t border-neutral-700"
                  onClick={() => setOrgDropdownOpen(false)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Nueva Organización</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Dashboard */}
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            isActive('/')
              ? 'bg-violet-500/10 text-violet-400'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <LayoutDashboard className="w-4.5 h-4.5" />
          Dashboard
        </Link>

        {/* Module Navigation */}
        <div className="pt-2">
          <p className="px-3 py-1.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider">
            Módulos
          </p>
        </div>

        {navigation.map((mod) => {
          const isExpanded = expandedModules.includes(mod.slug) || isModuleActive(mod.basePath)

          return (
            <div key={mod.slug}>
              <button
                onClick={() => toggleModule(mod.slug)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isModuleActive(mod.basePath)
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <IconComponent name={mod.icon} className="w-4.5 h-4.5" />
                <span className="flex-1 text-left">{mod.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExpanded && (
                <div className="ml-4 pl-3 border-l border-neutral-800 space-y-0.5 mt-0.5">
                  {mod.items.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        isActive(item.path)
                          ? 'bg-violet-500/10 text-violet-400'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30'
                      }`}
                    >
                      <IconComponent name={item.icon} className="w-3.5 h-3.5" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User Profile / Footer */}
      <div className="p-3 border-t border-neutral-800">
        <Link
          href="/org/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>

        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile ? getInitials(profile.full_name) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.full_name}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
