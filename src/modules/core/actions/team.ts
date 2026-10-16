'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Membership, Role, OrganizationInvitation, Profile } from '@/lib/types'

export interface TeamMember extends Membership {
  profile?: Profile
}

/**
 * Obtiene los miembros del equipo de una organización junto con sus perfiles y roles.
 */
export async function getOrganizationTeam(organizationId: string): Promise<TeamMember[]> {
  const supabase = await createClient()

  // 1. Obtener membresías activas con roles
  const { data: memberships, error } = await supabase
    .from('memberships')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error || !memberships) {
    console.error('Error fetching team memberships:', error)
    return []
  }

  // 2. Obtener perfiles de los usuarios
  const userIds = memberships.map((m) => m.user_id)
  if (userIds.length === 0) return []

  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (profError) {
    console.error('Error fetching profiles for team:', profError)
  }

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

  return memberships.map((m) => ({
    ...m,
    profile: profileMap.get(m.user_id) || {
      id: m.user_id,
      full_name: 'Usuario sin nombre',
      email: null,
      avatar_url: null,
      phone: null,
      created_at: m.created_at,
      updated_at: m.updated_at,
    },
  })) as TeamMember[]
}

/**
 * Obtiene los roles disponibles para asignar en la organización.
 */
export async function getOrganizationRoles(organizationId?: string): Promise<Role[]> {
  const supabase = await createClient()

  let query = supabase.from('roles').select('*')

  if (organizationId) {
    query = query.or(`is_system.eq.true,organization_id.eq.${organizationId}`)
  } else {
    query = query.eq('is_system', true)
  }

  const { data, error } = await query.order('name', { ascending: true })

  if (error || !data) {
    console.error('Error fetching roles:', error)
    return []
  }

  return data as Role[]
}

/**
 * Actualiza el rol de un miembro de la organización.
 */
export async function updateMemberRole(membershipId: string, roleId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('memberships')
    .update({ role_id: roleId, updated_at: new Date().toISOString() })
    .eq('id', membershipId)
    .select()

  if (error) {
    console.error('Error updating member role:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true, data }
}

/**
 * Da de baja o elimina a un miembro del equipo.
 */
export async function removeTeamMember(membershipId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('memberships')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', membershipId)

  if (error) {
    console.error('Error removing team member:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Obtiene las invitaciones pendientes de una organización.
 */
export async function getOrganizationInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('organization_invitations')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error || !data) {
    // Si la tabla aún no existe o da error retornamos array vacío limpiamente
    return []
  }

  return data as OrganizationInvitation[]
}

/**
 * Crea una invitación para unirse a la organización por email y rol.
 */
export async function createOrganizationInvitation(
  organizationId: string,
  email: string,
  roleId: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  const normalizedEmail = email.trim().toLowerCase()

  // 1. Verificar si ya existe un perfil con ese correo y si ya es miembro
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingProfile) {
    const { data: existingMember } = await supabase
      .from('memberships')
      .select('id, is_active')
      .eq('organization_id', organizationId)
      .eq('user_id', existingProfile.id)
      .maybeSingle()

    if (existingMember && existingMember.is_active) {
      return { success: false, error: 'Este usuario ya es miembro activo del equipo.' }
    }
  }

  // 2. Insertar invitación
  const { data, error } = await supabase
    .from('organization_invitations')
    .insert({
      organization_id: organizationId,
      email: normalizedEmail,
      role_id: roleId,
      invited_by: user.id,
      status: 'pending',
    })
    .select(`
      *,
      role:roles(*)
    `)
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una invitación pendiente para este correo.' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true, data }
}

/**
 * Cancela una invitación pendiente.
 */
export async function cancelOrganizationInvitation(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('organization_invitations')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('id', invitationId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}
