'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProductsForPOS(orgId: string) {
  const supabase = await createClient()

  // We should query v_current_stock to get stock info, but for simplicity we can just query products
  const { data, error } = await supabase
    .from('v_current_stock')
    .select('*')
    .eq('organization_id', orgId)
    .eq('product_active', true)
    .order('product_name', { ascending: true })

  if (error) {
    console.error('Error fetching products for POS:', error)
    return []
  }

  return data
}

export async function createSale(orgId: string, input: {
  customer_id?: string
  session_id?: string
  seller_id: string
  warehouse_id: string
  discount_cents: number
  discount_percent: number
  notes?: string
  items: any[]
  payments: any[]
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('create_sale', {
    _org_id: orgId,
    _customer_id: input.customer_id || null,
    _session_id: input.session_id || null,
    _seller_id: input.seller_id,
    _warehouse_id: input.warehouse_id,
    _discount_cents: input.discount_cents,
    _discount_percent: input.discount_percent,
    _notes: input.notes || null,
    _items: input.items,
    _payments: input.payments
  })

  if (error) {
    console.error('Error creating sale:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/sales')
  revalidatePath('/stock')
  revalidatePath('/customers')
  
  return { success: true, data }
}

export async function getSales(orgId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      customer:customers(first_name, last_name, full_name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching sales:', error)
    return []
  }

  return data
}

export async function getCashSessions(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cash_sessions')
    .select(`
      *,
      cash_register:cash_registers(name)
    `)
    .eq('organization_id', orgId)
    .order('opened_at', { ascending: false })

  if (error) {
    console.error('Error fetching cash sessions:', error)
    return []
  }

  return data
}
