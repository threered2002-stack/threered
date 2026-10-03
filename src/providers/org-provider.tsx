'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, Membership, OrganizationModule, ModuleSlug } from '@/lib/types'

interface OrgContextType {
  /** Todas las organizaciones del usuario */
  organizations: Membership[]
  /** Organización actualmente seleccionada */
  currentOrg: Organization | null
  /** Membresía del usuario en la org actual */
  currentMembership: Membership | null
  /** Módulos activos de la org actual */
  activeModules: OrganizationModule[]
  /** Verifica si un módulo está activo */
  isModuleActive: (slug: ModuleSlug) => boolean
  /** Cambia la organización activa */
  setCurrentOrgId: (orgId: string) => void
  /** Refresca los módulos activos desde la base de datos */
  refreshModules: () => Promise<void>
  /** Estado de carga */
  isLoading: boolean
}

const OrgContext = createContext<OrgContextType>({
  organizations: [],
  currentOrg: null,
  currentMembership: null,
  activeModules: [],
  isModuleActive: () => false,
  setCurrentOrgId: () => {},
  refreshModules: async () => {},
  isLoading: true,
})

const ORG_STORAGE_KEY = 'padre_current_org'

export function OrgProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Membership[]>([])
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [activeModules, setActiveModules] = useState<OrganizationModule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Cargar organizaciones
  useEffect(() => {
    const loadOrganizations = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from('memberships')
        .select(`
          *,
          organization:organizations(*),
          role:roles(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (data && data.length > 0) {
        setOrganizations(data as Membership[])

        // Restaurar org del localStorage o usar la primera
        const savedOrgId = typeof window !== 'undefined'
          ? localStorage.getItem(ORG_STORAGE_KEY)
          : null
        const orgExists = savedOrgId && data.some((m: Membership) => m.organization_id === savedOrgId)
        const defaultOrgId = orgExists ? savedOrgId : data[0].organization_id

        setCurrentOrgId(defaultOrgId)
      }

      setIsLoading(false)
    }

    loadOrganizations()
  }, [supabase])

  const refreshModules = useCallback(async () => {
    if (!currentOrgId) return
    const { data } = await supabase
      .from('organization_modules')
      .select(`
        *,
        module:modules(*)
      `)
      .eq('organization_id', currentOrgId)
      .eq('is_active', true)

    if (data) {
      setActiveModules(data as OrganizationModule[])
    }
  }, [currentOrgId, supabase])

  // Cargar módulos cuando cambia la org
  useEffect(() => {
    // Guardar en localStorage
    if (currentOrgId && typeof window !== 'undefined') {
      localStorage.setItem(ORG_STORAGE_KEY, currentOrgId)
    }

    refreshModules()
  }, [currentOrgId, refreshModules])

  const currentMembership = organizations.find(
    (m) => m.organization_id === currentOrgId
  ) ?? null

  const currentOrg = currentMembership?.organization ?? null

  const isModuleActive = useCallback(
    (slug: ModuleSlug) =>
      activeModules.some(
        (om) => om.module?.slug === slug && om.is_active
      ),
    [activeModules]
  )

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        currentMembership,
        activeModules,
        isModuleActive,
        setCurrentOrgId,
        refreshModules,
        isLoading,
      }}
    >
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const context = useContext(OrgContext)
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider')
  }
  return context
}
