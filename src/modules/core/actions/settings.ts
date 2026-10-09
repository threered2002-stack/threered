'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getOrganizationModules(orgId: string) {
  const supabase = await createClient()

  // First get all available modules
  const { data: allModules } = await supabase.from('modules').select('*').order('name')
  
  // Get org modules
  const { data: orgModules } = await supabase
    .from('organization_modules')
    .select('*')
    .eq('organization_id', orgId)

  if (!allModules) return []

  return allModules.map(module => {
    const orgModule = orgModules?.find(om => om.module_id === module.id)
    return {
      ...module,
      is_active: orgModule ? orgModule.is_active : false,
      org_module_id: orgModule?.id
    }
  })
}

export async function toggleModule(orgId: string, moduleId: string, currentlyActive: boolean, orgModuleId?: string) {
  const supabase = await createClient()
  
  if (orgModuleId) {
    const { error } = await supabase
      .from('organization_modules')
      .update({ is_active: !currentlyActive })
      .eq('id', orgModuleId)
      
    if (error) {
      console.error('Error updating module:', error)
      return { error: 'No se pudo actualizar el módulo' }
    }
  } else {
    // Need to create it
    const { error } = await supabase
      .from('organization_modules')
      .insert({
        organization_id: orgId,
        module_id: moduleId,
        is_active: true
      })

    if (error) {
      console.error('Error creating module:', error)
      return { error: 'No se pudo activar el módulo' }
    }
  }

  revalidatePath('/settings')
  // We should also revalidate layout to update sidebar, but next.js revalidatePath('/') might be needed
  revalidatePath('/', 'layout')
  
  return { success: true }
}

export async function updateOrganizationSettings(orgId: string, payload: any) {
  const supabase = await createClient()

  // First fetch the existing settings to merge them
  const { data: org, error: fetchError } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single()

  if (fetchError) {
    console.error('Error fetching org settings:', fetchError)
    return { error: 'No se pudo obtener la configuración' }
  }

  const newSettings = { ...org.settings, ...payload }

  const { error } = await supabase
    .from('organizations')
    .update({ settings: newSettings })
    .eq('id', orgId)

  if (error) {
    console.error('Error updating settings:', error)
    return { error: 'Error al guardar la configuración' }
  }

  revalidatePath('/settings')
  return { success: true, settings: newSettings }
}
