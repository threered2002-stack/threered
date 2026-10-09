'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCustomers(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_customer_summary')
    .select('*')
    .eq('organization_id', orgId)
    .order('first_name', { ascending: true })

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  // Fetch notes separately and merge because the view doesn't have it
  const { data: notesData } = await supabase
    .from('customers')
    .select('id, notes')
    .eq('organization_id', orgId)

  const mergedData = data.map(c => {
    const customerRecord = notesData?.find(n => n.id === c.id)
    return {
      ...c,
      notes: customerRecord?.notes || null
    }
  })

  return mergedData
}

export async function createCustomer(orgId: string, input: {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  document_type?: string;
  document_number?: string;
  address?: string;
  city?: string;
  notes?: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Clean empty strings to null or undefined
  const cleanedInput = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...cleanedInput,
      organization_id: orgId,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    return { error: 'Error al crear el cliente.' }
  }

  revalidatePath('/customers')
  return { data }
}

export async function getCustomerById(id: string, orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('Error fetching customer by id:', error)
    return null
  }

  return data
}

export async function updateCustomer(id: string, orgId: string, input: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Clean empty strings to null or undefined
  const cleanedInput = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { data, error } = await supabase
    .from('customers')
    .update({ ...cleanedInput })
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer:', error)
    return { error: 'Error al actualizar el cliente.' }
  }

  revalidatePath('/customers')
  return { data }
}

export async function deleteCustomer(id: string, orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Error deleting customer:', error)
    return { error: 'Error al eliminar el cliente. Verifica que no tenga operaciones asociadas.' }
  }

  revalidatePath('/customers')
  return { success: true }
}

