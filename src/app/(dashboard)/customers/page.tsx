import { getCustomers } from '@/modules/customers/actions/customers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Plus, Search, Filter, Mail, Phone, ShoppingCart } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'
import { CustomerRow } from './customer-row'

export default async function CustomersPage() {
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

  const customers = await getCustomers(membership.organization_id)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  return (
    <ModuleGuard module="customers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-red-400" />
              Clientes
            </h1>
            <p className="text-neutral-400 mt-1">Directorio y ficha de clientes.</p>
          </div>
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20 w-fit"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o DNI..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all placeholder:text-neutral-600"
            />
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-medium rounded-xl border border-neutral-800 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Table */}
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Contacto</th>
                  <th className="px-6 py-4 font-medium text-center">Compras</th>
                  <th className="px-6 py-4 font-medium text-right">Total Gastado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {customers.map((c) => (
                  <CustomerRow key={c.id} customer={c} />
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-neutral-500">
                        <Users className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-white mb-1">No hay clientes</p>
                        <p className="text-sm">Agregá tu primer cliente para empezar a registrar ventas a su nombre.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModuleGuard>
  )
}
