'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from '@/modules/core/schemas'
import type { Organization, Membership, OrganizationModule } from '@/lib/types'

/**
 * Obtiene las organizaciones del usuario autenticado con su rol.
 */
export async function getUserOrganizations(): Promise<Membership[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('memberships')
    .select(`
      *,
      organization:organizations(*),
      role:roles(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching organizations:', error)
    return []
  }

  return data as Membership[]
}

/**
 * Obtiene una organización por slug.
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as Organization
}

/**
 * Obtiene los módulos activos de una organización.
 */
export async function getOrganizationModules(orgId: string): Promise<OrganizationModule[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_modules')
    .select(`
      *,
      module:modules(*)
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('module(sort_order)')

  if (error) {
    console.error('Error fetching modules:', error)
    return []
  }

  return data as OrganizationModule[]
}

/**
 * Crea una nueva organización con la plantilla seleccionada.
 * - Crea la organización
 * - Crea la membresía del usuario como dueño
 * - Activa los módulos de la plantilla
 * - Crea depósitos por defecto
 * - Crea caja por defecto
 * - Crea categorías financieras por defecto
 */
export async function createOrganization(input: CreateOrganizationInput) {
  const validation = createOrganizationSchema.safeParse(input)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debés iniciar sesión para crear una organización.' }
  }

  // Verificar que el slug no exista
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', input.slug)
    .single()

  if (existing) {
    return { error: 'Este slug ya está en uso. Elegí otro.' }
  }

  // Obtener la plantilla
  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', input.template_id)
    .single()

  if (!template) {
    return { error: 'Plantilla no encontrada.' }
  }

  // Crear la organización
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: input.name,
      slug: input.slug,
      template_id: input.template_id,
      settings: template.default_settings,
      created_by: user.id,
    })
    .select()
    .single()

  if (orgError || !org) {
    console.error('Error creating organization:', orgError)
    return { error: `Error al crear: ${orgError?.message || 'Desconocido'}` }
  }

  // Obtener el rol "owner"
  const { data: ownerRole } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'owner')
    .eq('is_system', true)
    .single()

  if (!ownerRole) {
    return { error: 'Error interno: rol de dueño no encontrado.' }
  }

  // Crear membresía como dueño
  const { error: memError } = await supabase.from('memberships').insert({
    user_id: user.id,
    organization_id: org.id,
    role_id: ownerRole.id,
  })

  if (memError) {
    console.error('Error creating membership:', memError)
    // Rollback manual simple
    await supabase.from('organizations').delete().eq('id', org.id)
    return { error: `Error al crear membresía: ${memError.message}` }
  }

  // Activar módulos de la plantilla
  await supabase.rpc('activate_template_modules', {
    _org_id: org.id,
    _template_id: input.template_id,
    _user_id: user.id,
  })

  // Crear depósitos por defecto
  await supabase.from('warehouses').insert([
    { organization_id: org.id, name: 'Salón', is_default: true },
    { organization_id: org.id, name: 'Depósito', is_default: false },
  ])

  // Crear caja registradora por defecto
  await supabase.from('cash_registers').insert({
    organization_id: org.id,
    name: 'Caja Principal',
  })

  // Crear cuenta financiera por defecto
  await supabase.from('finance_accounts').insert({
    organization_id: org.id,
    name: 'Caja Principal',
    account_type: 'cash',
  })

  // Crear categorías financieras por defecto
  const defaultFinanceCategories = [
    { name: 'Ventas', type: 'income', is_system: true },
    { name: 'Otros ingresos', type: 'income', is_system: true },
    { name: 'Compras de mercadería', type: 'expense', is_system: true },
    { name: 'Alquiler', type: 'expense', is_system: false },
    { name: 'Servicios (luz, agua, gas)', type: 'expense', is_system: false },
    { name: 'Sueldos', type: 'expense', is_system: false },
    { name: 'Impuestos', type: 'expense', is_system: false },
    { name: 'Otros gastos', type: 'expense', is_system: true },
  ]

  await supabase.from('finance_categories').insert(
    defaultFinanceCategories.map((cat) => ({
      ...cat,
      organization_id: org.id,
    }))
  )

  return { data: org }
}

/**
 * Actualiza una organización.
 */
export async function updateOrganization(orgId: string, input: UpdateOrganizationInput) {
  const validation = updateOrganizationSchema.safeParse(input)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organizations')
    .update(input)
    .eq('id', orgId)
    .select()
    .single()

  if (error) {
    return { error: 'Error al actualizar la organización.' }
  }

  return { data }
}

/**
 * Obtiene la membresía del usuario actual en una organización.
 */
export async function getUserMembership(orgId: string): Promise<Membership | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('memberships')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .single()

  return data as Membership | null
}

/**
 * Obtiene las plantillas disponibles.
 */
export async function getTemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_active', true)

  if (error) return []
  return data
}

/**
  * Obtiene la membresía activa actual basándose en la cookie seleccionada o primera disponible
  */
export async function getActiveMembership(): Promise<Membership | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const cookieStore = await cookies()
  const currentOrgId = cookieStore.get('padre_current_org')?.value

  if (currentOrgId) {
    const { data: membership } = await supabase
      .from('memberships')
      .select(`
        *,
        organization:organizations(*),
        role:roles(*)
      `)
      .eq('user_id', user.id)
      .eq('organization_id', currentOrgId)
      .eq('is_active', true)
      .maybeSingle()

    if (membership) return membership as Membership
  }

  // Fallback a primera membresía activa del usuario
  const { data: memberships } = await supabase
    .from('memberships')
    .select(`
      *,
      organization:organizations(*),
      role:roles(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)

  if (memberships && memberships.length > 0) {
    return memberships[0] as Membership
  }

  return null
}

