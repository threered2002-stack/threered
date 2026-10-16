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

  // Si no se proporcionó session_id, buscar si hay una caja abierta actualmente
  let activeSessionId = input.session_id || null
  if (!activeSessionId) {
    const { data: openSession } = await supabase
      .from('cash_sessions')
      .select('id')
      .eq('organization_id', orgId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (openSession) {
      activeSessionId = openSession.id
    }
  }

  const { data, error } = await supabase.rpc('create_sale', {
    _org_id: orgId,
    _customer_id: input.customer_id || null,
    _session_id: activeSessionId,
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

          const { error: arError } = await supabase.from('accounts_receivable').insert({
            organization_id: orgId,
            customer_id: input.customer_id,
            sale_id: saleId,
            amount_cents: payment.amount_cents,
            received_cents: 0,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pending',
            notes: `Venta #${saleNumber} (Cuenta Corriente)`
          })
          if (arError) {
            console.error('Error inserting accounts_receivable:', arError)
          }
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
  revalidatePath('/sales/cash')
  revalidatePath('/sales/pos')
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

export async function getActiveCashSession(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cash_sessions')
    .select(`
      *,
      cash_register:cash_registers(name)
    `)
    .eq('organization_id', orgId)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching active cash session:', error)
    return null
  }

  return data
}

export async function openCashSession(orgId: string, openingAmountCents: number, registerId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  // Verificar si ya hay una sesión abierta
  const existing = await getActiveCashSession(orgId)
  if (existing) {
    return { success: false, error: 'Ya existe un turno de caja abierto.' }
  }

  let finalRegisterId = registerId
  if (!finalRegisterId) {
    const { data: registers } = await supabase
      .from('cash_registers')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
    finalRegisterId = registers?.[0]?.id
  }

  if (!finalRegisterId) {
    // Si no existiera una caja registradora, crearla
    const { data: newReg } = await supabase
      .from('cash_registers')
      .insert({
        organization_id: orgId,
        name: 'Caja Principal'
      })
      .select('id')
      .single()
    finalRegisterId = newReg?.id
  }

  if (!finalRegisterId) {
    return { success: false, error: 'No se encontró ni pudo crearse la caja registradora.' }
  }

  const { data, error } = await supabase
    .from('cash_sessions')
    .insert({
      organization_id: orgId,
      cash_register_id: finalRegisterId,
      opened_by: user.id,
      opening_amount_cents: openingAmountCents,
      status: 'open',
      opened_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error opening cash session:', error)
    return { success: false, error: 'Error al abrir la caja: ' + error.message }
  }

  revalidatePath('/sales/cash')
  revalidatePath('/sales/pos')
  return { success: true, data }
}

export async function closeCashSession(orgId: string, sessionId: string, actualAmountCents: number, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  // Calcular desglose real y esperado
  const breakdown = await getCashSessionBreakdown(orgId, sessionId)
  const openingAmount = breakdown.session?.opening_amount_cents || 0
  const expectedCash = openingAmount + breakdown.cash_cents
  const differenceCents = actualAmountCents - expectedCash

  const { data, error } = await supabase
    .from('cash_sessions')
    .update({
      status: 'closed',
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      expected_amount_cents: expectedCash,
      actual_amount_cents: actualAmountCents,
      difference_cents: differenceCents,
      notes: notes || null
    })
    .eq('id', sessionId)
    .eq('organization_id', orgId)
    .select()
    .single()

  if (error) {
    console.error('Error closing cash session:', error)
    return { success: false, error: 'Error al cerrar el turno: ' + error.message }
  }

  revalidatePath('/sales/cash')
  revalidatePath('/sales/pos')
  return { success: true, data }
}

export async function getCashSessionBreakdown(orgId: string, sessionId?: string) {
  const supabase = await createClient()

  let targetSession: any = null
  if (sessionId) {
    const { data } = await supabase
      .from('cash_sessions')
      .select('*, cash_register:cash_registers(name)')
      .eq('id', sessionId)
      .eq('organization_id', orgId)
      .maybeSingle()
    targetSession = data
  } else {
    targetSession = await getActiveCashSession(orgId)
  }

  // Si no hay sesión, calcular para las ventas del día de hoy como fallback
  const startTimestamp = targetSession?.opened_at || new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const endTimestamp = targetSession?.closed_at || new Date().toISOString()

  let salesQuery = supabase
    .from('sales')
    .select(`
      id,
      sale_number,
      total_cents,
      created_at,
      status,
      payments:sale_payments(*)
    `)
    .eq('organization_id', orgId)
    .neq('status', 'voided')
    .gte('created_at', startTimestamp)

  if (targetSession?.closed_at) {
    salesQuery = salesQuery.lte('created_at', endTimestamp)
  }

  // Si las ventas están asociadas a cash_session_id
  if (targetSession?.id) {
    // También buscar ventas que tengan explícitamente ese session_id o que estén en ese rango horario
    // Consultamos por cash_session_id
    const { data: sessionSales } = await supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        total_cents,
        created_at,
        status,
        payments:sale_payments(*)
      `)
      .eq('organization_id', orgId)
      .eq('cash_session_id', targetSession.id)
      .neq('status', 'voided')

    if (sessionSales && sessionSales.length > 0) {
      return calculateTotals(sessionSales, targetSession)
    }
  }

  const { data: sales, error } = await salesQuery
  if (error) {
    console.error('Error fetching session sales:', error)
  }

  return calculateTotals(sales || [], targetSession)
}

function calculateTotals(sales: any[], session: any) {
  let cashCents = 0
  let cardCents = 0
  let transferCents = 0
  let ctaCteCents = 0
  let totalSalesCents = 0

  for (const sale of sales) {
    totalSalesCents += sale.total_cents || 0
    const payments = sale.payments || []

    if (payments.length > 0) {
      for (const p of payments) {
        const isCtaCte = p.reference === 'cuenta_corriente' || p.payment_method === 'account'
        if (isCtaCte) {
          ctaCteCents += p.amount_cents || 0
        } else if (p.payment_method === 'cash') {
          cashCents += p.amount_cents || 0
        } else if (p.payment_method === 'card') {
          cardCents += p.amount_cents || 0
        } else if (p.payment_method === 'transfer') {
          transferCents += p.amount_cents || 0
        } else {
          // Si es 'other' pero no cta cte
          cashCents += p.amount_cents || 0
        }
      }
    } else {
      // Fallback si no hay payments detallados
      cashCents += sale.total_cents || 0
    }
  }

  const openingAmount = session?.opening_amount_cents || 0
  const expectedTotalCashInDrawer = openingAmount + cashCents

  return {
    session,
    sales_count: sales.length,
    total_sales_cents: totalSalesCents,
    opening_amount_cents: openingAmount,
    cash_cents: cashCents,
    card_cents: cardCents,
    transfer_cents: transferCents,
    cta_cte_cents: ctaCteCents,
    expected_cash_in_drawer: expectedTotalCashInDrawer
  }
}
