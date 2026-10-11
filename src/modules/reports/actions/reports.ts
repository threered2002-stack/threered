'use server'

import { createClient } from '@/lib/supabase/server'

export async function getGeneralReport(orgId: string) {
  const supabase = await createClient()

  // Para el dashboard general, podemos traer un resumen de la vista financiera 
  // y sumarizar datos de productos y clientes.
  const [financeRes, customersRes, productsRes] = await Promise.all([
    supabase.from('v_finance_summary').select('*').eq('organization_id', orgId),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).is('deleted_at', null)
  ])

  const totalIncome = financeRes.data?.reduce((acc, curr) => acc + curr.month_income_cents, 0) || 0
  const totalExpense = financeRes.data?.reduce((acc, curr) => acc + curr.month_expense_cents, 0) || 0

  return {
    finance: {
      monthlyIncomeCents: totalIncome,
      monthlyExpenseCents: totalExpense,
      monthlyProfitCents: totalIncome - totalExpense
    },
    customers: {
      total: customersRes.count || 0
    },
    products: {
      total: productsRes.count || 0
    }
  }
}

export async function getSalesChartData(orgId: string, days: number = 30) {
  const supabase = await createClient()

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('sales')
    .select('created_at, total_cents')
    .eq('organization_id', orgId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (error) {
    console.error('Error fetching sales chart data:', error)
    return []
  }

  // Aggregate by day
  const dailyData: Record<string, number> = {}
  
  // Initialize all days with 0
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    dailyData[dateStr] = 0
  }

  data.forEach((sale) => {
    const dateStr = sale.created_at.split('T')[0]
    if (dailyData[dateStr] !== undefined) {
      dailyData[dateStr] += (sale.total_cents / 100) // Convert to ARS
    }
  })

  return Object.entries(dailyData)
    .map(([date, total]) => ({
      date: new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      ventas: total
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function getTopCategoriesData(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sale_items')
    .select(`
      quantity,
      product:products (
        category:categories (name)
      ),
      sale:sales!inner(organization_id)
    `)
    .eq('sale.organization_id', orgId)

  if (error) {
    console.error('Error fetching top categories:', error)
    return []
  }

  const categoryTotals: Record<string, number> = {}

  data.forEach((item: any) => {
    const catName = item.product?.category?.name || 'Sin Categoría'
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = 0
    }
    categoryTotals[catName] += item.quantity
  })

  return Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5
}

export async function getTopProducts(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sale_items')
    .select(`
      quantity,
      subtotal_cents,
      product:products (name, cost_price_cents),
      sale:sales!inner(organization_id)
    `)
    .eq('sale.organization_id', orgId)

  if (error) {
    console.error('Error fetching top products:', error)
    return { byQty: [], byProfit: [] }
  }

  const productStats: Record<string, { qty: number, revenue: number, profit: number }> = {}

  data.forEach((item: any) => {
    const pName = item.product?.name || 'Desconocido'
    const revenue = item.subtotal_cents / 100
    const cost = ((item.product?.cost_price_cents || 0) * item.quantity) / 100
    const profit = revenue - cost

    if (!productStats[pName]) {
      productStats[pName] = { qty: 0, revenue: 0, profit: 0 }
    }
    productStats[pName].qty += item.quantity
    productStats[pName].revenue += revenue
    productStats[pName].profit += profit
  })

  const arr = Object.entries(productStats).map(([name, stats]) => ({
    name,
    ...stats
  }))

  return {
    byQty: [...arr].sort((a, b) => b.qty - a.qty).slice(0, 5),
    byProfit: [...arr].sort((a, b) => b.profit - a.profit).slice(0, 5),
  }
}

export async function getTopCustomers(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sales')
    .select(`
      total_cents,
      customer_id,
      customer:customers (id, first_name, last_name)
    `)
    .eq('organization_id', orgId)
    .neq('status', 'voided')

  if (error) {
    console.error('Error fetching top customers from sales:', error)
    
    // Fallback: try v_customer_summary view
    const { data: viewData, error: viewError } = await supabase
      .from('v_customer_summary')
      .select('id, full_name, first_name, last_name, total_purchases, total_spent_cents')
      .eq('organization_id', orgId)
      .gt('total_purchases', 0)
      .order('total_spent_cents', { ascending: false })
      .limit(5)

    if (viewError) {
      console.error('Error fetching top customers from view:', viewError)
      return []
    }

    return (viewData || []).map((c: any) => ({
      name: c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Cliente',
      count: Number(c.total_purchases) || 0,
      total: (Number(c.total_spent_cents) || 0) / 100
    }))
  }

  const customerTotals: Record<string, { count: number, total: number }> = {}

  data.forEach((sale: any) => {
    let cName = 'Consumidor Final'
    if (sale.customer) {
      const fullName = [sale.customer.first_name, sale.customer.last_name]
        .filter(Boolean)
        .join(' ')
        .trim()
      if (fullName) cName = fullName
    }
    const total = (sale.total_cents || 0) / 100

    if (!customerTotals[cName]) {
      customerTotals[cName] = { count: 0, total: 0 }
    }
    customerTotals[cName].count += 1
    customerTotals[cName].total += total
  })

  // If there are registered customers among sales, show them in order
  const result = Object.entries(customerTotals)
    .map(([name, stats]) => ({
      name,
      ...stats
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return result
}

