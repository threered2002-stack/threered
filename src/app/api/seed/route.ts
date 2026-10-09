import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // 1. Check Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get Organization ID
  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  const orgId = membership.organization_id

  // 3. Seed Products (Vinoteca)
  const products = [
    { name: 'Vino Tinto Malbec', description: 'Vino tinto reserva 750ml', sale_price_cents: 850000, cost_price_cents: 450000, sku: 'VIN-MAL-001', organization_id: orgId, created_by: user.id },
    { name: 'Vino Blanco Sauvignon Blanc', description: 'Vino blanco joven 750ml', sale_price_cents: 650000, cost_price_cents: 350000, sku: 'VIN-BLA-001', organization_id: orgId, created_by: user.id },
    { name: 'Champagne Extra Brut', description: 'Espumante 750ml', sale_price_cents: 1250000, cost_price_cents: 700000, sku: 'CHM-EXT-001', organization_id: orgId, created_by: user.id },
    { name: 'Cerveza Artesanal IPA', description: 'Lata 473ml', sale_price_cents: 180000, cost_price_cents: 90000, sku: 'CER-IPA-001', organization_id: orgId, created_by: user.id },
    { name: 'Whisky 12 Años', description: 'Botella 750ml', sale_price_cents: 4500000, cost_price_cents: 2500000, sku: 'WHI-12Y-001', organization_id: orgId, created_by: user.id },
    { name: 'Gin Premium', description: 'Botella 700ml', sale_price_cents: 2800000, cost_price_cents: 1500000, sku: 'GIN-PRM-001', organization_id: orgId, created_by: user.id },
    { name: 'Vodka Clásico', description: 'Botella 1L', sale_price_cents: 1500000, cost_price_cents: 800000, sku: 'VOD-CLA-001', organization_id: orgId, created_by: user.id },
    { name: 'Fernet 750ml', description: 'Aperitivo clásico', sale_price_cents: 1200000, cost_price_cents: 700000, sku: 'FER-750-001', organization_id: orgId, created_by: user.id },
    { name: 'Vino Rosado Dulce', description: 'Vino rosado 750ml', sale_price_cents: 600000, cost_price_cents: 350000, sku: 'VIN-ROS-001', organization_id: orgId, created_by: user.id },
    { name: 'Licor de Café', description: 'Licor dulce 700ml', sale_price_cents: 2200000, cost_price_cents: 1100000, sku: 'LIC-CAF-001', organization_id: orgId, created_by: user.id },
  ]

  // 4. Seed Suppliers
  const suppliers = [
    { name: 'Bodega Catena Zapata', trade_name: 'Catena', organization_id: orgId, created_by: user.id },
    { name: 'Bodegas Chandon S.A.', trade_name: 'Chandon', organization_id: orgId, created_by: user.id },
    { name: 'Cervecería y Maltería Quilmes', trade_name: 'Quilmes', organization_id: orgId, created_by: user.id },
    { name: 'Pernod Ricard Argentina', trade_name: 'Pernod', organization_id: orgId, created_by: user.id },
    { name: 'Fratelli Branca Destilerías', trade_name: 'Branca', organization_id: orgId, created_by: user.id },
  ]

  // 5. Seed Customers
  const customers = [
    { first_name: 'Juan', last_name: 'Pérez', email: 'juan.perez@email.com', phone: '1122334455', organization_id: orgId, created_by: user.id },
    { first_name: 'María', last_name: 'Gómez', email: 'maria.gomez@email.com', phone: '1199887766', organization_id: orgId, created_by: user.id },
    { first_name: 'Carlos', last_name: 'Rodríguez', email: 'carlos.r@email.com', phone: '1155443322', organization_id: orgId, created_by: user.id },
    { first_name: 'Laura', last_name: 'Fernández', email: 'laura.f@email.com', phone: '1177665544', organization_id: orgId, created_by: user.id },
    { first_name: 'Diego', last_name: 'López', email: 'diego.lopez@email.com', phone: '1133221100', organization_id: orgId, created_by: user.id },
  ]

  // Execute inserts sequentially to avoid overloading the DB
  const { error: productsError } = await supabase.from('products').insert(products)
  if (productsError) console.error('Products error', productsError)

  const { error: suppliersError } = await supabase.from('suppliers').insert(suppliers)
  if (suppliersError) console.error('Suppliers error', suppliersError)

  const { error: customersError } = await supabase.from('customers').insert(customers)
  if (customersError) console.error('Customers error', customersError)

  return NextResponse.json({
    success: true,
    message: 'Base de datos poblada con éxito!',
    errors: {
      products: productsError,
      suppliers: suppliersError,
      customers: customersError
    }
  })
}
