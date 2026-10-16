'use client'

import { useEffect, useState } from 'react'
import { useOrg } from '@/providers/org-provider'
import { getOrganizationModules, toggleModule, updateOrganizationSettings } from '@/modules/core/actions/settings'
import { Settings, Box, Loader2, Building2, Bell, Palette, Save, Users } from 'lucide-react'
import { TeamSettings } from '@/components/settings/team-settings'

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

type TabType = 'modules' | 'team' | 'profile' | 'alerts' | 'appearance'

export default function SettingsPage() {
  const { currentOrg, currentMembership, refreshModules } = useOrg()
  const [activeTab, setActiveTab] = useState<TabType>('modules')

  // Modules State
  const [modules, setModules] = useState<any[]>([])

  // Form States
  const [profileForm, setProfileForm] = useState({ tax_id: '', address: '', phone: '' })
  const [alertsForm, setAlertsForm] = useState({ global_min_stock: 5, daily_report_email: true })
  const [appearanceForm, setAppearanceForm] = useState({ theme: 'dark', primary_color: 'violet' })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrg) {
      loadData()
    }
  }, [currentOrg])

  async function loadData() {
    setIsLoading(true)
    const [mods] = await Promise.all([
      getOrganizationModules(currentOrg!.id)
    ])
    setModules(mods)

    const settings = currentOrg?.settings as Record<string, any> || {}
    if (settings.profile) setProfileForm(settings.profile)
    if (settings.alerts) setAlertsForm(settings.alerts)
    if (settings.appearance) setAppearanceForm(settings.appearance)

    setIsLoading(false)
  }

  const handleToggleModule = async (mod: any) => {
    if (!currentOrg) return
    setIsSaving(mod.id)

    const res = await toggleModule(currentOrg.id, mod.id, mod.is_active, mod.org_module_id)

    if (!res.error) {
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_active: !m.is_active } : m))
      await refreshModules()
    } else {
      alert(res.error)
    }

    setIsSaving(null)
  }

  const handleSaveSettings = async (section: string, payload: any) => {
    if (!currentOrg) return
    setIsSaving(section)

    const res = await updateOrganizationSettings(currentOrg.id, { [section]: payload })
    if (res.error) alert(res.error)

    setIsSaving(null)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
        <p className="text-neutral-500 text-sm">Cargando configuración...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'modules', label: 'Módulos', icon: Box },
    { id: 'team', label: 'Equipo y Roles', icon: Users },
    { id: 'profile', label: 'Perfil Empresa', icon: Building2 },
    { id: 'alerts', label: 'Alertas', icon: Bell },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-red-400" />
          Configuración
        </h1>
        <p className="text-neutral-400 mt-1">
          Administrá los módulos, apariencia y configuración global de <strong>{currentOrg?.name}</strong>.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-neutral-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Modules */}
      {activeTab === 'modules' && (
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden animate-in fade-in">
          <div className="p-6 border-b border-neutral-800/80">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-red-400" />
              Módulos del Sistema
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Activa o desactiva las secciones según las necesidades de tu empresa.</p>
          </div>
          <div className="divide-y divide-neutral-800/60">
            {modules.map((mod) => (
              <div key={mod.id} className="p-6 flex items-center justify-between hover:bg-neutral-800/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${mod.is_active ? 'bg-red-500/10' : 'bg-neutral-800/50 grayscale opacity-50'}`}>
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
                <button
                  disabled={isSaving === mod.id}
                  onClick={() => handleToggleModule(mod)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-900 ${mod.is_active ? 'bg-red-600' : 'bg-neutral-700'
                    } ${isSaving === mod.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${mod.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Team & Roles */}
      {activeTab === 'team' && currentOrg && (
        <div className="animate-in fade-in">
          <TeamSettings
            organizationId={currentOrg.id}
            currentUserId={currentMembership?.user_id}
          />
        </div>
      )}

      {/* Tab Content: Profile */}
      {activeTab === 'profile' && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSaveSettings('profile', profileForm); }}
          className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden animate-in fade-in"
        >
          <div className="p-6 border-b border-neutral-800/80">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-400" />
              Perfil de la Empresa
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Estos datos aparecerán en los reportes y facturas.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">CUIT / RUT / Identificación</label>
                <input
                  type="text"
                  value={profileForm.tax_id}
                  onChange={e => setProfileForm(p => ({ ...p, tax_id: e.target.value }))}
                  className="w-full px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 transition-all"
                  placeholder="Ej: 30-12345678-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Teléfono Comercial</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 transition-all"
                  placeholder="Ej: +54 9 11 1234-5678"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Dirección Fiscal / Ubicación</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 transition-all"
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-800/80">
              <button
                type="submit"
                disabled={isSaving === 'profile'}
                className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/20"
              >
                {isSaving === 'profile' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Perfil
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab Content: Alerts */}
      {activeTab === 'alerts' && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSaveSettings('alerts', alertsForm); }}
          className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden animate-in fade-in"
        >
          <div className="p-6 border-b border-neutral-800/80">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-400" />
              Alertas y Notificaciones
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Configurá umbrales globales y correos automáticos.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Umbral Global de Stock Mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={alertsForm.global_min_stock}
                  onChange={e => setAlertsForm(a => ({ ...a, global_min_stock: parseInt(e.target.value) || 0 }))}
                  className="w-full sm:w-1/3 px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 transition-all"
                />
                <p className="text-xs text-neutral-500 mt-2">Avisar cuando cualquier producto caiga por debajo de esta cantidad.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-800/30 rounded-xl border border-neutral-800/50">
                <div>
                  <h4 className="text-sm font-medium text-white">Reporte Diario por Email</h4>
                  <p className="text-xs text-neutral-500 mt-1">Recibir un resumen de ventas y stock al cierre del día.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertsForm(a => ({ ...a, daily_report_email: !a.daily_report_email }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${alertsForm.daily_report_email ? 'bg-red-600' : 'bg-neutral-700'
                    }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alertsForm.daily_report_email ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-800/80">
              <button
                type="submit"
                disabled={isSaving === 'alerts'}
                className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/20"
              >
                {isSaving === 'alerts' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Alertas
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab Content: Appearance */}
      {activeTab === 'appearance' && (
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden animate-in fade-in">
          <div className="p-6 border-b border-neutral-800/80">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-red-400" />
              Apariencia
            </h2>
            <p className="text-sm text-neutral-500 mt-1">Ajustá la interfaz del sistema a tu preferencia visual.</p>
          </div>
          <div className="p-6 space-y-8">

            {/* Theme Toggle */}
            <div className="relative">
              {isSaving === 'appearance' && (
                <div className="absolute top-0 right-0">
                  <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                </div>
              )}
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Tema de Interfaz</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const payload = { ...appearanceForm, theme: 'dark' };
                    setAppearanceForm(payload);
                    handleSaveSettings('appearance', payload);
                  }}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${appearanceForm.theme === 'dark' ? 'border-red-500 bg-red-500/5' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                    }`}
                >
                  <div className="w-full h-20 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col p-2 gap-2">
                    <div className="w-1/3 h-2 bg-neutral-800 rounded-full"></div>
                    <div className="flex gap-2 h-full">
                      <div className="w-1/4 h-full bg-neutral-900 rounded"></div>
                      <div className="w-3/4 h-full bg-neutral-900 rounded"></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-white">Oscuro (Dark)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const payload = { ...appearanceForm, theme: 'light' };
                    setAppearanceForm(payload);
                    handleSaveSettings('appearance', payload);
                  }}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${appearanceForm.theme === 'light' ? 'border-red-500 bg-red-500/5' : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700'
                    }`}
                >
                  <div className="w-full h-20 rounded-lg bg-white border border-neutral-200 flex flex-col p-2 gap-2">
                    <div className="w-1/3 h-2 bg-neutral-200 rounded-full"></div>
                    <div className="flex gap-2 h-full">
                      <div className="w-1/4 h-full bg-neutral-100 rounded"></div>
                      <div className="w-3/4 h-full bg-neutral-100 rounded"></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-white">Claro (Light)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
