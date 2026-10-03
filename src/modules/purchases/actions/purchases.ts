'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPurchaseOrders(orgId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      supplier:suppliers(name, trade_name),
      warehouse:warehouses(name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching purchase orders:', error)
    return []
  }

  return data
}

export async function getSuppliers(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  return data
}

export async function createPurchaseOrder(orgId: string, input: {
  supplier_id: string;
  warehouse_id: string;
  expected_date?: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_cost_cents: number;
  }[];
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const totalCents = input.items.reduce((acc, item) => acc + (item.quantity * item.unit_cost_cents), 0)

  // 1. Create order
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      organization_id: orgId,
      supplier_id: input.supplier_id,
      warehouse_id: input.warehouse_id,
      status: 'draft',
      expected_date: input.expected_date,
      total_cents: totalCents,
      notes: input.notes,
      created_by: user.id
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating PO:', orderError)
    return { error: 'Error al crear la orden de compra' }
  }

  // 2. Insert items
  const orderItems = input.items.map(item => ({
    purchase_order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost_cents: item.unit_cost_cents,
    subtotal_cents: item.quantity * item.unit_cost_cents
  }))

  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Error inserting PO items:', itemsError)
    return { error: 'Error al agregar los productos a la orden' }
  }

  revalidatePath('/purchases')
  return { data: order }
}
