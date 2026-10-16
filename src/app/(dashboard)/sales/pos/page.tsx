import { getProductsForPOS } from '@/modules/sales/actions/sales'
import { getCustomers } from '@/modules/customers/actions/customers'
import { getWarehouses } from '@/modules/stock/actions/stock'
import { getActiveMembership } from '@/modules/core/actions/organizations'
import { redirect } from 'next/navigation'
import { ModuleGuard } from '@/components/layout/module-guard'
import { POSClient } from './pos-client'

export default async function POSPage() {
  const membership = await getActiveMembership()
  if (!membership) redirect('/org/new')

  // Fetch all necessary data for POS
  const [products, customers, warehouses] = await Promise.all([
    getProductsForPOS(membership.organization_id),
    getCustomers(membership.organization_id),
    getWarehouses(membership.organization_id)
  ])

  return (
    <ModuleGuard module="sales">
      {/* We don't use the standard page container because POS needs maximum screen space */}
      <POSClient 
        products={products || []} 
        customers={customers || []} 
        warehouses={warehouses || []}
        userId={membership.user_id}
        orgId={membership.organization_id}
      />
    </ModuleGuard>
  )
}
