import { getSuppliers } from '@/modules/purchases/actions/purchases'
import { getActiveMembership } from '@/modules/core/actions/organizations'
import { redirect } from 'next/navigation'
import { ModuleGuard } from '@/components/layout/module-guard'
import { SuppliersClient } from './suppliers-client'

export default async function SuppliersPage() {
  const membership = await getActiveMembership()
  if (!membership) redirect('/org/new')

  const suppliers = await getSuppliers(membership.organization_id)

  return (
    <ModuleGuard module="purchases">
      <SuppliersClient initialSuppliers={suppliers || []} />
    </ModuleGuard>
  )
}

