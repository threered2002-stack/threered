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
      customer:customers(name)
    `)
    .eq('organization_id', orgId)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching accounts receivable:', error)
    return []
  }

  return data
}
