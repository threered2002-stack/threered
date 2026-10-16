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
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  return data
}

export interface SupplierInput {
  name: string
  trade_name?: string
  tax_id?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  contact_name?: string
  contact_phone?: string
  notes?: string
  metadata?: {
    whatsapp?: string
    instagram?: string
    facebook?: string
    website?: string
    catalog_url?: string
    notes_log?: Array<{
      id: string
      text: string
      created_at: string
      author?: string
    }>
    [key: string]: any
  }
}

export async function createSupplier(orgId: string, input: SupplierInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  if (!input.name || !input.name.trim()) {
    return { success: false, error: 'El nombre o razón social es obligatorio' }
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      organization_id: orgId,
      name: input.name.trim(),
      trade_name: input.trade_name?.trim() || null,
      tax_id: input.tax_id?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      province: input.province?.trim() || null,
      contact_name: input.contact_name?.trim() || null,
      contact_phone: input.contact_phone?.trim() || null,
      notes: input.notes?.trim() || null,
      metadata: input.metadata || {},
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating supplier:', error)
    return { success: false, error: 'Error al registrar el proveedor: ' + error.message }
  }

  revalidatePath('/purchases/suppliers')
  revalidatePath('/purchases')
  return { success: true, data }
}

export async function updateSupplier(id: string, orgId: string, input: SupplierInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  if (!input.name || !input.name.trim()) {
    return { success: false, error: 'El nombre o razón social es obligatorio' }
  }

  const updatePayload: any = {
    name: input.name.trim(),
    trade_name: input.trade_name?.trim() || null,
    tax_id: input.tax_id?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    province: input.province?.trim() || null,
    contact_name: input.contact_name?.trim() || null,
    contact_phone: input.contact_phone?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString()
  }

  if (input.metadata !== undefined) {
    updatePayload.metadata = input.metadata
  }

  const { data, error } = await supabase
    .from('suppliers')
    .update(updatePayload)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    console.error('Error updating supplier:', error)
    return { success: false, error: 'Error al actualizar el proveedor: ' + error.message }
  }

  revalidatePath('/purchases/suppliers')
  revalidatePath('/purchases')
  return { success: true, data }
}

export async function addSupplierNoteLog(supplierId: string, orgId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  if (!text || !text.trim()) {
    return { success: false, error: 'El contenido de la nota no puede estar vacío' }
  }

  // Get current metadata
  const { data: supplier, error: fetchError } = await supabase
    .from('suppliers')
    .select('metadata')
    .eq('id', supplierId)
    .eq('organization_id', orgId)
    .single()

  if (fetchError || !supplier) {
    return { success: false, error: 'Proveedor no encontrado' }
  }

  const currentMeta = supplier.metadata || {}
  const currentNotes = Array.isArray(currentMeta.notes_log) ? currentMeta.notes_log : []

  const newNote = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    text: text.trim(),
    created_at: new Date().toISOString(),
    author: user.email || 'Usuario'
  }

  const updatedMeta = {
    ...currentMeta,
    notes_log: [newNote, ...currentNotes]
  }

  const { data, error: updateError } = await supabase
    .from('suppliers')
    .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
    .eq('id', supplierId)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (updateError) {
    return { success: false, error: 'Error al guardar la nota' }
  }

  revalidatePath('/purchases/suppliers')
  return { success: true, data }
}

export async function deleteSupplierNoteLog(supplierId: string, orgId: string, noteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: supplier, error: fetchError } = await supabase
    .from('suppliers')
    .select('metadata')
    .eq('id', supplierId)
    .eq('organization_id', orgId)
    .single()

  if (fetchError || !supplier) {
    return { success: false, error: 'Proveedor no encontrado' }
  }

  const currentMeta = supplier.metadata || {}
  const currentNotes = Array.isArray(currentMeta.notes_log) ? currentMeta.notes_log : []
  const updatedNotes = currentNotes.filter((n: any) => n.id !== noteId)

  const updatedMeta = {
    ...currentMeta,
    notes_log: updatedNotes
  }

  const { data, error: updateError } = await supabase
    .from('suppliers')
    .update({ metadata: updatedMeta, updated_at: new Date().toISOString() })
    .eq('id', supplierId)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (updateError) {
    return { success: false, error: 'Error al eliminar la nota' }
  }

  revalidatePath('/purchases/suppliers')
  return { success: true, data }
}

export async function deleteSupplier(id: string, orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { error } = await supabase
    .from('suppliers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) {
    console.error('Error deleting supplier:', error)
    return { success: false, error: 'Error al eliminar el proveedor: ' + error.message }
  }

  revalidatePath('/purchases/suppliers')
  revalidatePath('/purchases')
  return { success: true }
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

  // Generar número de orden de compra
  let orderNumber = `OC-${Date.now().toString().slice(-6)}`
  try {
    const { data: generatedNumber } = await supabase.rpc('next_purchase_order_number', { _org_id: orgId })
    if (generatedNumber) orderNumber = generatedNumber
  } catch {
    // Si la función RPC no tiene permisos, se utiliza el número autogenerado único
  }

  // 1. Create order
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      organization_id: orgId,
      order_number: orderNumber,
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
    return { error: 'Error al crear la orden de compra: ' + orderError.message }
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

  // 3. Integración con Finanzas (Cuentas por Pagar)
  if (totalCents > 0) {
    const dueDate = input.expected_date || new Date().toISOString().split('T')[0]
    const { error: apError } = await supabase.from('accounts_payable').insert({
      organization_id: orgId,
      supplier_id: input.supplier_id,
      purchase_order_id: order.id,
      amount_cents: totalCents,
      paid_cents: 0,
      due_date: dueDate,
      status: 'pending',
      notes: `Orden de Compra #${order.order_number || ''}`
    })
    if (apError) {
      console.error('Error creating accounts_payable from PO:', apError)
    }
    revalidatePath('/finance/payables-receivables')
  }

  revalidatePath('/purchases')
  return { data: order }
}
