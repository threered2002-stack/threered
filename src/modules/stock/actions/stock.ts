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

export async function createStockMovement(orgId: string, input: {
  product_id: string;
  warehouse_id: string;
  movement_type: string;
  quantity: number;
  notes?: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Fetch unit cost from product to store in the movement
  const { data: product } = await supabase
    .from('products')
    .select('cost_price_cents')
    .eq('id', input.product_id)
    .single()

  const unit_cost_cents = product?.cost_price_cents || 0

  const { data, error } = await supabase
    .from('stock_movements')
    .insert({
      organization_id: orgId,
      product_id: input.product_id,
      warehouse_id: input.warehouse_id,
      movement_type: input.movement_type,
      quantity: input.quantity,
      unit_cost_cents,
      reference_type: 'manual',
      notes: input.notes,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating stock movement:', error)
    return { error: 'Error al registrar el movimiento de stock.' }
  }

  revalidatePath('/stock')
  revalidatePath('/stock/movements')
  return { success: true, data }
}

export async function createWarehouse(orgId: string, input: {
  name: string
  address?: string
  is_default?: boolean
}) {
  const supabase = await createClient()

  if (input.is_default) {
    // Unset other defaults first
    await supabase.from('warehouses')
      .update({ is_default: false })
      .eq('organization_id', orgId)
  }

  const { data, error } = await supabase
    .from('warehouses')
    .insert({
      organization_id: orgId,
      name: input.name,
      address: input.address,
      is_default: input.is_default || false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating warehouse:', error)
    return { error: 'Error al crear el depósito.' }
  }

  revalidatePath('/stock/warehouses')
  return { success: true, data }
}

export async function updateWarehouse(id: string, orgId: string, input: {
  name?: string
  address?: string
  is_default?: boolean
  is_active?: boolean
}) {
  const supabase = await createClient()

  if (input.is_default) {
    // Unset other defaults first
    await supabase.from('warehouses')
      .update({ is_default: false })
      .eq('organization_id', orgId)
  }

  const { data, error } = await supabase
    .from('warehouses')
    .update(input)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    console.error('Error updating warehouse:', error)
    return { error: 'Error al actualizar el depósito.' }
  }

  revalidatePath('/stock/warehouses')
  return { success: true, data }
}

export async function bulkCreateStockMovements(orgId: string, movements: {
  product_id: string;
  warehouse_id: string;
  movement_type: string;
  quantity: number;
  notes?: string;
}[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Batch insert movements
  const inserts = movements.map(m => ({
    organization_id: orgId,
    product_id: m.product_id,
    warehouse_id: m.warehouse_id,
    movement_type: m.movement_type,
    quantity: m.quantity,
    reference_type: 'manual',
    notes: m.notes,
    created_by: user.id
  }))

  const { error } = await supabase
    .from('stock_movements')
    .insert(inserts)

  if (error) {
    console.error('Error in bulk stock movements:', error)
    return { error: 'Error al registrar los movimientos de stock masivos.' }
  }

  revalidatePath('/stock')
  return { success: true, count: inserts.length }
}
