import { getProductsForPOS } from '@/modules/sales/actions/sales'
import { getCustomers } from '@/modules/customers/actions/customers'
import { getWarehouses } from '@/modules/stock/actions/stock'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleGuard } from '@/components/layout/module-guard'
import { POSClient } from './pos-client'

export default async function POSPage() {
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
        userId={user.id}
        orgId={membership.organization_id}
      />
    </ModuleGuard>
  )
}
