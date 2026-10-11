'use client'

import { useOrg } from '@/providers/org-provider'
import type { ModuleSlug } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ModuleGuardProps {
  module: ModuleSlug
  children: React.ReactNode
}

/**
 * Componente que protege las rutas de módulos.
 * Si el módulo no está activo para la organización, redirige al dashboard.
 */
export function ModuleGuard({ module, children }: ModuleGuardProps) {
  const { isModuleActive, isLoading, currentOrg } = useOrg()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && currentOrg && !isModuleActive(module)) {
      router.push('/')
    }
  }, [isLoading, currentOrg, module, isModuleActive, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-red-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm text-neutral-500">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Sin organización</h3>
          <p className="text-sm text-neutral-400">
            Creá o seleccioná una organización para continuar.
          </p>
        </div>
      </div>
    )
  }

  if (!isModuleActive(module)) {
    return null
  }

  return <>{children}</>
}
