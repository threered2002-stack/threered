'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getWarehouses(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching warehouses:', error)
    return []
  }

  return data
}

export async function getStockMovements(orgId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      *,
      product:products(name, sku),
      warehouse:warehouses(name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching stock movements:', error)
    return []
  }

  return data
}

export async function getStockAlerts(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_current_stock')
    .select('*')
    .eq('organization_id', orgId)
    .in('stock_status', ['bajo', 'sin_stock'])
    .order('current_stock', { ascending: true })

  if (error) {
    console.error('Error fetching stock alerts:', error)
    return []
  }

  return data
}

export async function getCurrentStock(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_current_stock')
    .select('*')
    .eq('organization_id', orgId)
    .order('product_name', { ascending: true })

  if (error) {
    console.error('Error fetching current stock:', error)
    return []
  }

  return data
}
