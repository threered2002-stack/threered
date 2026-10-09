'use client'

import { useOrg } from '@/providers/org-provider'
import { useAuth } from '@/providers/auth-provider'
import Link from 'next/link'
import {
  Package, ShoppingCart, Users, Truck, DollarSign, BarChart3,
  AlertTriangle, Plus, ArrowUpRight, Activity, ArrowRight
} from 'lucide-react'
import { MODULE_NAV } from '@/lib/constants'
import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/modules/core/actions/dashboard'
import { formatMoney } from '@/lib/utils/money'

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Package, ShoppingCart, Users, Truck, DollarSign, BarChart3,
}

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

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-center max-w-md bg-neutral-900/50 border border-neutral-800 p-10 rounded-[2rem]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 mb-6">
            <Plus className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            ¡Bienvenido a PADRE!
          </h2>
          <p className="text-neutral-400 mb-8">
            Para empezar, creá tu primera organización y configurá tu negocio en minutos.
          </p>
          <Link
            href="/org/new"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full transition-all"
          >
            <Plus className="w-5 h-5" />
            Crear Organización
          </Link>
        </div>
      </div>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex flex-col justify-end pb-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {greeting}, <span className="text-violet-400">{profile?.full_name?.split(' ')[0] ?? 'Usuario'}</span>
        </h1>
        <p className="text-neutral-400 mt-1">
          Resumen general de <strong>{currentOrg.name}</strong>
        </p>
      </div>

      {/* Main Stats Bento */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* Sales Card - Show if Sales is active */}
        {activeModules.some(m => m.module?.slug === 'sales') && (
          <div className="flex-[2] bg-neutral-900/40 border border-neutral-800/80 rounded-[2rem] p-6 flex flex-col justify-between group hover:border-neutral-700 transition-colors">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                <ArrowUpRight className="w-4 h-4" /> Hoy
              </span>
            </div>
            <div>
              <p className="text-neutral-400 font-medium mb-1">Total Facturado</p>
              <h3 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                {formatMoney(stats.salesTodayCents)}
              </h3>
            </div>
          </div>
        )}

        {/* Products Card - Show if Stock is active */}
        {activeModules.some(m => m.module?.slug === 'stock') && (
          <div className="flex-1 bg-neutral-900/40 border border-neutral-800/80 rounded-[2rem] p-6 flex flex-col justify-between group hover:border-neutral-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-3xl font-bold text-white">{stats.productsCount}</h4>
              <p className="text-neutral-400 text-sm font-medium mt-1">Productos Activos</p>
            </div>
          </div>
        )}

        {/* Customers Card - Show if Customers is active */}
        {activeModules.some(m => m.module?.slug === 'customers') && (
          <div className="flex-1 bg-neutral-900/40 border border-neutral-800/80 rounded-[2rem] p-6 flex flex-col justify-between group hover:border-neutral-700 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-3xl font-bold text-white">{stats.customersCount}</h4>
              <p className="text-neutral-400 text-sm font-medium mt-1">Clientes Registrados</p>
            </div>
          </div>
        )}

      </div>

      {/* Modules Bento */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Accesos Rápidos
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                  className="group bg-neutral-900/50 hover:bg-neutral-800 rounded-2xl p-4 border border-neutral-800/50 hover:border-neutral-700 transition-all duration-300 flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-violet-500/20 transition-all">
                    <Icon className="w-6 h-6 text-neutral-400 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <h3 className="font-medium text-neutral-300 group-hover:text-white mb-1 text-sm">
                    {mod.name}
                  </h3>
                </Link>
              )
            })}
        </div>
      </div>

    </div>
  )
}
