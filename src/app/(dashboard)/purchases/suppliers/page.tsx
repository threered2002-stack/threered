import { getSuppliers } from '@/modules/purchases/actions/purchases'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleGuard } from '@/components/layout/module-guard'
import { SuppliersClient } from './suppliers-client'

export default async function SuppliersPage() {
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

  const suppliers = await getSuppliers(membership.organization_id)

  return (
    <ModuleGuard module="purchases">
      <SuppliersClient initialSuppliers={suppliers || []} />
    </ModuleGuard>
  )
}

