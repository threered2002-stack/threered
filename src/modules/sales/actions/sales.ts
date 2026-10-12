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

  const saleId = data

  // Consultar número de venta generado
  const { data: saleRecord } = await supabase
    .from('sales')
    .select('sale_number')
    .eq('id', saleId)
    .single()
  const saleNumber = saleRecord?.sale_number || ''

  // Integración con Finanzas
  try {
    const [{ data: financeAccs }, { data: salesCat }] = await Promise.all([
      supabase.from('finance_accounts').select('*').eq('organization_id', orgId).eq('is_active', true),
      supabase.from('finance_categories').select('*').eq('organization_id', orgId).eq('type', 'income').limit(1).maybeSingle()
    ])

    let cashAcc = financeAccs?.find(a => a.account_type === 'cash') || financeAccs?.[0]
    let bankAcc = financeAccs?.find(a => a.account_type === 'bank' || a.account_type === 'digital_wallet') || cashAcc
    const todayStr = new Date().toISOString().split('T')[0]

    for (const payment of input.payments) {
      const isCtaCte = payment.reference === 'cuenta_corriente' || payment.payment_method === 'account'

      if (isCtaCte) {
        if (input.customer_id) {
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 30)

          await supabase.from('accounts_receivable').insert({
            organization_id: orgId,
            customer_id: input.customer_id,
            sale_id: saleId,
            amount_cents: payment.amount_cents,
            received_cents: 0,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pending',
            notes: `Venta #${saleNumber} (Cuenta Corriente)`,
            created_by: input.seller_id
          })
        }
      } else {
        const targetAcc = (payment.payment_method === 'card' || payment.payment_method === 'transfer')
          ? bankAcc
          : cashAcc

        if (targetAcc && payment.amount_cents > 0) {
          const methodLabel = payment.payment_method === 'cash' ? 'Efectivo'
            : payment.payment_method === 'card' ? 'Tarjeta'
            : payment.payment_method === 'transfer' ? 'Transferencia'
            : 'Cobro'

          await supabase.from('finance_transactions').insert({
            organization_id: orgId,
            account_id: targetAcc.id,
            category_id: salesCat?.id,
            type: 'income',
            amount_cents: payment.amount_cents,
            description: `Venta #${saleNumber} (${methodLabel})`,
            reference_type: 'sale',
            reference_id: saleId,
            transaction_date: todayStr,
            created_by: input.seller_id
          })
        }
      }
    }
  } catch (finErr) {
    console.error('Error sincronizando con Finanzas:', finErr)
  }

  revalidatePath('/sales')
  revalidatePath('/stock')
  revalidatePath('/customers')
  revalidatePath('/finance')
  revalidatePath('/finance/transactions')
  revalidatePath('/finance/accounts')
  revalidatePath('/finance/payables-receivables')
  revalidatePath('/reports')
  
  return { success: true, data }
}

export async function getSales(orgId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      customer:customers(first_name, last_name)
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
