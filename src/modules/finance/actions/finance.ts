'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAccounts(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('finance_accounts')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching accounts:', error)
    return []
  }

  return data
}

export async function getCategories(orgId: string, type?: 'income' | 'expense') {
  const supabase = await createClient()

  let query = supabase
    .from('finance_categories')
    .select('*')
    .eq('organization_id', orgId)
    .order('name')

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}

export async function getTransactions(orgId: string, limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('finance_transactions')
    .select(`
      *,
      account:finance_accounts(name),
      category:finance_categories(name)
    `)
    .eq('organization_id', orgId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  return data
}

export async function getFinanceSummary(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('v_finance_summary')
    .select('*')
    .eq('organization_id', orgId)

  if (error) {
    console.error('Error fetching finance summary:', error)
    return []
  }

  return data
}

export async function createTransaction(orgId: string, input: {
  account_id: string;
  category_id?: string;
  type: 'income' | 'expense';
  amount_cents: number;
  description: string;
  transaction_date: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      ...input,
      organization_id: orgId,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating transaction:', error)
    return { error: 'Error al registrar el movimiento financiero.' }
  }

  revalidatePath('/finance')
  return { data }
}

export async function createAccount(orgId: string, input: {
  name: string;
  account_type: 'cash' | 'bank' | 'digital_wallet';
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data, error } = await supabase
    .from('finance_accounts')
    .insert({
      ...input,
      organization_id: orgId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating account:', error)
    return { error: 'Error al crear la cuenta.' }
  }

  revalidatePath('/finance/accounts')
  revalidatePath('/finance')
  return { data }
}

export async function getAccountsPayable(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('accounts_payable')
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .eq('organization_id', orgId)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching accounts payable:', error)
    return []
  }

  return data
}

export async function getAccountsReceivable(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('accounts_receivable')
    .select(`
      *,
      customer:customers(first_name, last_name)
    `)
    .eq('organization_id', orgId)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching accounts receivable:', error)
    return []
  }

  return data
}

export async function createAccountPayable(orgId: string, input: {
  supplier_id: string;
  amount_cents: number;
  due_date: string;
  notes?: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data, error } = await supabase
    .from('accounts_payable')
    .insert({
      organization_id: orgId,
      supplier_id: input.supplier_id,
      amount_cents: input.amount_cents,
      paid_cents: 0,
      due_date: input.due_date,
      status: 'pending',
      notes: input.notes,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating AP:', error)
    return { error: 'Error al registrar la cuenta por pagar' }
  }

  revalidatePath('/finance/payables-receivables')
  return { data }
}

export async function createAccountReceivable(orgId: string, input: {
  customer_id: string;
  amount_cents: number;
  due_date: string;
  notes?: string;
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data, error } = await supabase
    .from('accounts_receivable')
    .insert({
      organization_id: orgId,
      customer_id: input.customer_id,
      amount_cents: input.amount_cents,
      received_cents: 0,
      due_date: input.due_date,
      status: 'pending',
      notes: input.notes,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating AR:', error)
    return { error: 'Error al registrar la cuenta por cobrar' }
  }

  revalidatePath('/finance/payables-receivables')
  return { data }
}

export async function syncFinanceData(orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  try {
    // 1. Ensure default accounts exist
    const { data: accounts } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)

    let defaultCashAccount = accounts?.find(a => a.account_type === 'cash')
    let defaultBankAccount = accounts?.find(a => a.account_type === 'bank' || a.account_type === 'digital_wallet')

    if (!defaultCashAccount) {
      const { data: newCash } = await supabase
        .from('finance_accounts')
        .insert({
          organization_id: orgId,
          name: 'Caja Principal',
          account_type: 'cash',
          balance_cents: 0
        })
        .select()
        .single()
      defaultCashAccount = newCash
    }

    if (!defaultBankAccount) {
      const { data: newBank } = await supabase
        .from('finance_accounts')
        .insert({
          organization_id: orgId,
          name: 'Banco / Transferencias',
          account_type: 'bank',
          balance_cents: 0
        })
        .select()
        .single()
      defaultBankAccount = newBank
    }

    const fallbackAccount = defaultCashAccount || defaultBankAccount

    // 2. Ensure default categories exist
    const { data: categories } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('organization_id', orgId)

    let salesCategory = categories?.find(c => c.type === 'income' && (c.name.toLowerCase().includes('venta') || c.is_system))
    let purchasesCategory = categories?.find(c => c.type === 'expense' && (c.name.toLowerCase().includes('compra') || c.is_system))

    if (!salesCategory) {
      const { data: newCat } = await supabase
        .from('finance_categories')
        .insert({
          organization_id: orgId,
          name: 'Ventas',
          type: 'income',
          is_system: true
        })
        .select()
        .single()
      salesCategory = newCat
    }

    if (!purchasesCategory) {
      const { data: newCat } = await supabase
        .from('finance_categories')
        .insert({
          organization_id: orgId,
          name: 'Compras de mercadería',
          type: 'expense',
          is_system: true
        })
        .select()
        .single()
      purchasesCategory = newCat
    }

    // 3. Find all sales in this org (not voided)
    const { data: sales } = await supabase
      .from('sales')
      .select('id, sale_number, customer_id, total_cents, created_at, status, seller_id')
      .eq('organization_id', orgId)
      .neq('status', 'voided')

    // 4. Find all existing transactions with reference_type = 'sale'
    const { data: existingSaleTx } = await supabase
      .from('finance_transactions')
      .select('reference_id')
      .eq('organization_id', orgId)
      .eq('reference_type', 'sale')

    const existingSaleTxIds = new Set(existingSaleTx?.map(t => t.reference_id) || [])

    // 5. For each unsynced sale, register payments and transactions
    if (sales && sales.length > 0) {
      for (const sale of sales) {
        if (existingSaleTxIds.has(sale.id)) continue

        const { data: payments } = await supabase
          .from('sale_payments')
          .select('*')
          .eq('sale_id', sale.id)

        const txDate = sale.created_at ? sale.created_at.split('T')[0] : new Date().toISOString().split('T')[0]

        if (payments && payments.length > 0) {
          for (const payment of payments) {
            const isCtaCte = payment.reference === 'cuenta_corriente' || payment.payment_method === 'account'
            if (isCtaCte) {
              const { data: existingAr } = await supabase
                .from('accounts_receivable')
                .select('id')
                .eq('organization_id', orgId)
                .eq('sale_id', sale.id)
                .maybeSingle()

              if (!existingAr && sale.customer_id) {
                const dueDate = new Date(sale.created_at || Date.now())
                dueDate.setDate(dueDate.getDate() + 30)

                await supabase.from('accounts_receivable').insert({
                  organization_id: orgId,
                  customer_id: sale.customer_id,
                  sale_id: sale.id,
                  amount_cents: payment.amount_cents,
                  received_cents: 0,
                  due_date: dueDate.toISOString().split('T')[0],
                  status: 'pending',
                  notes: `Venta #${sale.sale_number} (Cuenta Corriente)`,
                  created_by: user.id
                })
              }
            } else {
              const targetAccount = (payment.payment_method === 'card' || payment.payment_method === 'transfer')
                ? (defaultBankAccount || defaultCashAccount)
                : (defaultCashAccount || defaultBankAccount)

              if (targetAccount) {
                const methodLabel = payment.payment_method === 'cash' ? 'Efectivo'
                  : payment.payment_method === 'card' ? 'Tarjeta'
                  : payment.payment_method === 'transfer' ? 'Transferencia'
                  : 'Cobro'

                await supabase.from('finance_transactions').insert({
                  organization_id: orgId,
                  account_id: targetAccount.id,
                  category_id: salesCategory?.id,
                  type: 'income',
                  amount_cents: payment.amount_cents,
                  description: `Venta #${sale.sale_number} (${methodLabel})`,
                  reference_type: 'sale',
                  reference_id: sale.id,
                  transaction_date: txDate,
                  created_by: user.id
                })
              }
            }
          }
        } else if (sale.total_cents > 0 && fallbackAccount) {
          await supabase.from('finance_transactions').insert({
            organization_id: orgId,
            account_id: fallbackAccount.id,
            category_id: salesCategory?.id,
            type: 'income',
            amount_cents: sale.total_cents,
            description: `Venta #${sale.sale_number}`,
            reference_type: 'sale',
            reference_id: sale.id,
            transaction_date: txDate,
            created_by: user.id
          })
        }
      }
    }

    // 6. Sync Purchase Orders with Accounts Payable
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled')

    if (purchaseOrders && purchaseOrders.length > 0) {
      const { data: existingAps } = await supabase
        .from('accounts_payable')
        .select('purchase_order_id')
        .eq('organization_id', orgId)
        .not('purchase_order_id', 'is', null)

      const existingApPoIds = new Set(existingAps?.map(ap => ap.purchase_order_id) || [])

      for (const po of purchaseOrders) {
        if (!existingApPoIds.has(po.id) && po.total_cents > 0) {
          const dueDate = po.expected_date || po.created_at.split('T')[0]
          await supabase.from('accounts_payable').insert({
            organization_id: orgId,
            supplier_id: po.supplier_id,
            purchase_order_id: po.id,
            amount_cents: po.total_cents,
            paid_cents: 0,
            due_date: dueDate,
            status: 'pending',
            notes: `Orden de Compra #${po.order_number || ''}`,
            created_by: user.id
          })
        }
      }
    }

    // 7. Reconcile account balances based on transactions
    const { data: allActiveAccounts } = await supabase
      .from('finance_accounts')
      .select('id')
      .eq('organization_id', orgId)

    if (allActiveAccounts) {
      for (const acc of allActiveAccounts) {
        const { data: txList } = await supabase
          .from('finance_transactions')
          .select('type, amount_cents')
          .eq('account_id', acc.id)

        const calculatedBalance = (txList || []).reduce((sum, tx) => {
          return tx.type === 'income' ? sum + tx.amount_cents : sum - tx.amount_cents
        }, 0)

        await supabase
          .from('finance_accounts')
          .update({ balance_cents: calculatedBalance })
          .eq('id', acc.id)
      }
    }

    revalidatePath('/finance')
    revalidatePath('/finance/transactions')
    revalidatePath('/finance/accounts')
    revalidatePath('/finance/payables-receivables')
    revalidatePath('/reports')

    return { success: true }
  } catch (err: any) {
    console.error('Error in syncFinanceData:', err)
    return { success: false, error: err?.message || 'Error al sincronizar datos' }
  }
}

export async function recordReceivablePayment(orgId: string, receivableId: string, accountId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: ar } = await supabase
    .from('accounts_receivable')
    .select('*, customer:customers(first_name, last_name)')
    .eq('id', receivableId)
    .single()

  if (!ar) return { success: false, error: 'Cuenta por cobrar no encontrada' }

  let targetAccountId = accountId
  if (!targetAccountId) {
    const { data: acc } = await supabase
      .from('finance_accounts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .limit(1)
      .single()
    targetAccountId = acc?.id
  }

  const { data: cat } = await supabase
    .from('finance_categories')
    .select('id')
    .eq('organization_id', orgId)
    .eq('type', 'income')
    .limit(1)
    .single()

  const pendingAmount = ar.amount_cents - (ar.received_cents || 0)
  if (pendingAmount <= 0) return { success: false, error: 'Esta cuenta ya está cobrada en su totalidad' }

  // 1. Update receivable
  await supabase
    .from('accounts_receivable')
    .update({
      received_cents: ar.amount_cents,
      status: 'paid'
    })
    .eq('id', receivableId)

  // 2. Insert income transaction
  const customerName = ar.customer 
    ? `${ar.customer.first_name} ${ar.customer.last_name || ''}`.trim()
    : 'Cliente'

  if (targetAccountId) {
    await supabase.from('finance_transactions').insert({
      organization_id: orgId,
      account_id: targetAccountId,
      category_id: cat?.id,
      type: 'income',
      amount_cents: pendingAmount,
      description: `Cobro de cuenta por cobrar: ${customerName}`,
      reference_type: 'accounts_receivable',
      reference_id: receivableId,
      transaction_date: new Date().toISOString().split('T')[0],
      created_by: user.id
    })
  }

  revalidatePath('/finance')
  revalidatePath('/finance/payables-receivables')
  revalidatePath('/finance/transactions')
  return { success: true }
}

export async function recordPayablePayment(orgId: string, payableId: string, accountId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: ap } = await supabase
    .from('accounts_payable')
    .select('*, supplier:suppliers(name)')
    .eq('id', payableId)
    .single()

  if (!ap) return { success: false, error: 'Cuenta por pagar no encontrada' }

  let targetAccountId = accountId
  if (!targetAccountId) {
    const { data: acc } = await supabase
      .from('finance_accounts')
      .select('id')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .limit(1)
      .single()
    targetAccountId = acc?.id
  }

  const { data: cat } = await supabase
    .from('finance_categories')
    .select('id')
    .eq('organization_id', orgId)
    .eq('type', 'expense')
    .limit(1)
    .single()

  const pendingAmount = ap.amount_cents - (ap.paid_cents || 0)
  if (pendingAmount <= 0) return { success: false, error: 'Esta cuenta ya está pagada en su totalidad' }

  // 1. Update payable
  await supabase
    .from('accounts_payable')
    .update({
      paid_cents: ap.amount_cents,
      status: 'paid'
    })
    .eq('id', payableId)

  // 2. Insert expense transaction
  const supplierName = ap.supplier?.name || 'Proveedor'

  if (targetAccountId) {
    await supabase.from('finance_transactions').insert({
      organization_id: orgId,
      account_id: targetAccountId,
      category_id: cat?.id,
      type: 'expense',
      amount_cents: pendingAmount,
      description: `Pago de cuenta por pagar: ${supplierName}`,
      reference_type: 'accounts_payable',
      reference_id: payableId,
      transaction_date: new Date().toISOString().split('T')[0],
      created_by: user.id
    })
  }

  revalidatePath('/finance')
  revalidatePath('/finance/payables-receivables')
  revalidatePath('/finance/transactions')
  return { success: true }
}

