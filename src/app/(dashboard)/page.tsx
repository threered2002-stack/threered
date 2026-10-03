'use client'

import { useOrg } from '@/providers/org-provider'
import { useAuth } from '@/providers/auth-provider'
import Link from 'next/link'
import {
  Package, ShoppingCart, Users, Truck, DollarSign, BarChart3,
  AlertTriangle, Plus
} from 'lucide-react'
import { MODULE_NAV } from '@/lib/constants'

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, ShoppingCart, Users, Truck, DollarSign, BarChart3,
}

import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/modules/core/actions/dashboard'
import { formatMoney } from '@/lib/utils/money'

export default function DashboardPage() {
  const { currentOrg, activeModules, isLoading } = useOrg()
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    salesTodayCents: 0,
    productsCount: 0,
    customersCount: 0,
    alertsCount: 0
  })

  useEffect(() => {
    if (currentOrg) {
      getDashboardStats(currentOrg.id).then(setStats)
    }
  }, [currentOrg])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-violet-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  // No organization yet
  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-6 shadow-lg shadow-violet-500/25">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            ¡Bienvenido a Sistema PADRE!
          </h2>
          <p className="text-neutral-400 mb-6">
            Para empezar, creá tu primera organización. Elegí una plantilla de rubro
            y configurá tu negocio en minutos.
          </p>
          <Link
            href="/org/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-5 h-5" />
            Crear Organización
          </Link>
        </div>
      </div>
    )
  }

  // Greeting
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Usuario'}
        </h1>
        <p className="text-neutral-400 mt-1">
          Panel de control de <span className="text-violet-400 font-medium">{currentOrg.name}</span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas Hoy', value: formatMoney(stats.salesTodayCents), icon: ShoppingCart, color: 'from-emerald-500 to-green-600', trend: '' },
          { label: 'Productos', value: stats.productsCount.toString(), icon: Package, color: 'from-blue-500 to-indigo-600', trend: '' },
          { label: 'Clientes', value: stats.customersCount.toString(), icon: Users, color: 'from-amber-500 to-orange-600', trend: '' },
          { label: 'Alertas Stock', value: stats.alertsCount.toString(), icon: AlertTriangle, color: 'from-red-500 to-rose-600', trend: '' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.trend && (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active Modules */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Módulos Activos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeModules
            .filter((om) => om.module)
            .map((om) => {
              const mod = om.module!
              const navConfig = MODULE_NAV[mod.slug as keyof typeof MODULE_NAV]
              const Icon = moduleIcons[mod.icon ?? 'Package'] ?? Package

              return (
                <Link
                  key={mod.id}
                  href={(navConfig as any)?.defaultPath ?? navConfig?.basePath ?? '/'}
                  className="group bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 hover:border-violet-500/30 hover:bg-neutral-900/80 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <Icon className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="font-medium text-white group-hover:text-violet-300 transition-colors">
                      {mod.name}
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-500 line-clamp-2">
                    {mod.description}
                  </p>
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  )
}
