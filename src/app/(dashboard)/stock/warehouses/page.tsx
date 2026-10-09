import { getWarehouses } from '@/modules/stock/actions/stock'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleGuard } from '@/components/layout/module-guard'
import { WarehousesClient } from './warehouses-client'

export default async function WarehousesPage() {
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

  const warehouses = await getWarehouses(membership.organization_id)

  return (
    <ModuleGuard module="stock">
      <WarehousesClient initialWarehouses={warehouses} />
    </ModuleGuard>
  )
}
