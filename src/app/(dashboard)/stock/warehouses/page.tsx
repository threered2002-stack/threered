import { getWarehouses } from '@/modules/stock/actions/stock'
import { getActiveMembership } from '@/modules/core/actions/organizations'
import { redirect } from 'next/navigation'
import { ModuleGuard } from '@/components/layout/module-guard'
import { WarehousesClient } from './warehouses-client'

export default async function WarehousesPage() {
  const membership = await getActiveMembership()
  if (!membership) redirect('/org/new')

  const warehouses = await getWarehouses(membership.organization_id)

  return (
    <ModuleGuard module="stock">
      <WarehousesClient initialWarehouses={warehouses} />
    </ModuleGuard>
  )
}
