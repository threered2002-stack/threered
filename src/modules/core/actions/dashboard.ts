'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardStats(orgId: string) {
  const supabase = await createClient()

  // 1. Sales today
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  
  const { data: salesToday } = await supabase
    .from('sales')
    .select('total_cents')
    .eq('organization_id', orgId)
    .gte('created_at', startOfDay.toISOString())

  const totalSalesCents = salesToday?.reduce((acc, sale) => acc + sale.total_cents, 0) || 0

  // 2. Products count
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  // 3. Customers count
  const { count: customersCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  // 4. Stock alerts count
  const { count: alertsCount } = await supabase
    .from('v_current_stock')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('stock_status', ['bajo', 'sin_stock'])

  return {
    salesTodayCents: totalSalesCents,
    productsCount: productsCount || 0,
    customersCount: customersCount || 0,
    alertsCount: alertsCount || 0
  }
}
