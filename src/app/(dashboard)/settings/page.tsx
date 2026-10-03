'use client'

import { useEffect, useState } from 'react'
import { useOrg } from '@/providers/org-provider'
import { getOrganizationModules, toggleModule } from '@/modules/core/actions/settings'
import { Settings, Box, Check, X, Loader2 } from 'lucide-react'

// Icon map to render nice icons based on slug
const ICONS: Record<string, any> = {
  stock: '📦',
  sales: '🛒',
  customers: '👥',
  purchases: '🚚',
  finance: '💰',
  reports: '📊',
  employees: '👨‍💼',
  vehicles: '🚗',
  logistics: '🗺️',
  chat: '💬',
  ecommerce: '🌐'
}

export default function SettingsPage() {
  const { currentOrg, refreshModules } = useOrg()
  const [modules, setModules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrg) {
      loadModules()
    }
  }, [currentOrg])

  async function loadModules() {
    setIsLoading(true)
    const data = await getOrganizationModules(currentOrg!.id)
    setModules(data)
    setIsLoading(false)
  }

  const handleToggle = async (mod: any) => {
    if (!currentOrg) return
    setIsSaving(mod.id)
    
    const res = await toggleModule(currentOrg.id, mod.id, mod.is_active, mod.org_module_id)
    
    if (!res.error) {
      // Optimistic update
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_active: !m.is_active } : m))
      // Refresh global context so sidebar updates instantly
      await refreshModules()
    } else {
      alert(res.error)
    }
    
    setIsSaving(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <p className="text-neutral-500 text-sm">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-violet-400" />
          Configuración
        </h1>
        <p className="text-neutral-400 mt-1">
          Administrá los módulos y funcionalidades de <strong>{currentOrg?.name}</strong>.
        </p>
      </div>

      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800/80">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-violet-400" />
            Módulos del Sistema
          </h2>
          <p className="text-sm text-neutral-500 mt-1">Activa o desactiva las secciones según las necesidades de tu empresa.</p>
        </div>

        <div className="divide-y divide-neutral-800/60">
          {modules.map((mod) => (
            <div key={mod.id} className="p-6 flex items-center justify-between hover:bg-neutral-800/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${mod.is_active ? 'bg-violet-500/10' : 'bg-neutral-800/50 grayscale opacity-50'}`}>
                  {ICONS[mod.slug] || '⚙️'}
                </div>
                <div>
                  <h3 className={`font-medium text-base transition-colors ${mod.is_active ? 'text-white' : 'text-neutral-400'}`}>
                    {mod.name}
                  </h3>
                  <p className="text-sm text-neutral-500 max-w-md mt-0.5">
                    {mod.description || 'Módulo del sistema de gestión.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                disabled={isSaving === mod.id}
                onClick={() => handleToggle(mod)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
                  mod.is_active ? 'bg-violet-600' : 'bg-neutral-700'
                } ${isSaving === mod.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    mod.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
