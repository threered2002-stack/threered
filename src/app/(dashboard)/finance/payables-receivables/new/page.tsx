'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/modules/core/actions/organizations'
import { redirect } from 'next/navigation'
import { ManualDebtForm } from './form'

export default async function NewDebtPage() {
  const membership = await getActiveMembership()
  if (!membership) redirect('/org/new')

  const supabase = await createClient()

  // Fetch customers and suppliers
  const [{ data: customers }, { data: suppliers }] = await Promise.all([
    supabase.from('v_customer_summary').select('id, full_name').eq('organization_id', membership.organization_id).order('first_name'),
    supabase.from('suppliers').select('id, name, trade_name').eq('organization_id', membership.organization_id).order('name')
  ])

  return (
    <ManualDebtForm 
      customers={customers || []} 
      suppliers={suppliers || []} 
    />
  )
}
