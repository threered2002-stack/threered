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
  const [isCollapsed, setIsCollapsed] = useState(false)

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
    <aside className={`flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 m-4 rounded-[3rem] h-[calc(100vh-2rem)] sticky top-4 shadow-2xl shadow-black/50 overflow-visible transition-all duration-300 z-50 ${isCollapsed ? 'w-[88px]' : 'w-64'}`}>
      {/* Organization Switcher */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-2xl hover:bg-white/5 transition-colors`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/80 to-purple-600/80 backdrop-blur-md flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-violet-500/20 border border-white/20">
              {currentOrg ? getInitials(currentOrg.name) : '?'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {currentOrg?.name ?? 'Sin organización'}
                  </p>
                  <p className="text-xs text-neutral-400 truncate">
                    {currentMembership?.role?.display_name}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
              </>
            )}
          </button>

          {/* Dropdown */}
          {orgDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOrgDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 w-64 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {organizations.map((mem) => (
                  <button
                    key={mem.organization_id}
                    onClick={() => {
                      setCurrentOrgId(mem.organization_id)
                      setOrgDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors ${
                      mem.organization_id === currentOrg?.id ? 'bg-white/10' : ''
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
                  className="flex items-center gap-3 p-3 text-violet-400 hover:bg-white/5 transition-colors border-t border-white/10"
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
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
        {/* Dashboard */}
        <Link
          href="/"
          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl text-sm font-medium transition-all ${
            isActive('/')
              ? 'bg-white/15 text-white shadow-lg border border-white/10 backdrop-blur-md'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        {/* Module Navigation */}
        <div className={`pt-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <p className="px-3 py-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            {isCollapsed ? '...' : 'Módulos'}
          </p>
        </div>

        {navigation.map((mod) => {
          const isExpanded = expandedModules.includes(mod.slug) || isModuleActive(mod.basePath)

          return (
            <div key={mod.slug} className="mb-1">
              <div
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full rounded-2xl text-sm font-medium transition-all group ${
                  isModuleActive(mod.basePath)
                    ? 'text-white bg-white/10 backdrop-blur-md border border-white/5'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Link
                  href={(mod as any).defaultPath || mod.basePath}
                  className={`flex flex-1 items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3`}
                  onClick={() => {
                    if (!expandedModules.includes(mod.slug) && !isCollapsed) {
                      setExpandedModules(prev => [...prev, mod.slug])
                    }
                  }}
                  title={isCollapsed ? mod.label : undefined}
                >
                  <IconComponent name={mod.icon} className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="text-left">{mod.label}</span>}
                </Link>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleModule(mod.slug)}
                    className="p-3 mr-1 rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {isExpanded && !isCollapsed && (
                <div className="ml-5 pl-4 border-l border-white/10 space-y-1 mt-2 mb-4">
                  {mod.items.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                        isActive(item.path)
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <IconComponent name={item.icon} className="w-4 h-4 shrink-0" />
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
      <div className="p-3 border-t border-white/5">
        <Link
          href="/settings"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-xl text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-all`}
          title={isCollapsed ? 'Configuración' : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Configuración</span>}
        </Link>

        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2 py-3' : 'gap-3 px-3 py-2 mt-1'}`}>
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile ? getInitials(profile.full_name) : '?'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name}
              </p>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Toggle Collapse */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-1 w-full flex items-center justify-center p-2 rounded-xl text-neutral-500 hover:bg-white/5 hover:text-white transition-all"
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <ArrowRightLeft className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </aside>
  )
}
