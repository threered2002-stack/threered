'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ManualDebtForm } from './form'

export default async function NewDebtPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) redirect('/org/new')

  // Fetch customers and suppliers
  const [{ data: customers }, { data: suppliers }] = await Promise.all([
    supabase.from('customers').select('id, name').eq('organization_id', membership.organization_id).order('name'),
    supabase.from('suppliers').select('id, name, trade_name').eq('organization_id', membership.organization_id).order('name')
  ])

  return (
    <ManualDebtForm 
      customers={customers || []} 
      suppliers={suppliers || []} 
    />
  )
}
