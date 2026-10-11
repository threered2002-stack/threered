import { getPurchaseOrders } from '@/modules/purchases/actions/purchases'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ClipboardList, Plus, Search, Filter, Calendar } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'
import { PO_STATUSES } from '@/lib/constants'

export default async function PurchasesPage() {
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

  const purchaseOrders = await getPurchaseOrders(membership.organization_id)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  const getStatusStyle = (status: string) => {
    const config = PO_STATUSES[status as keyof typeof PO_STATUSES]
    if (!config) return 'text-neutral-400 bg-neutral-800'
    
    switch (config.color) {
      case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'red': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      case 'amber': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'blue': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      case 'slate': return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
      default: return 'text-neutral-300 bg-neutral-800 border-neutral-700'
    }
  }

  return (
    <ModuleGuard module="purchases">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-red-400" />
              Órdenes de Compra
            </h1>
            <p className="text-neutral-400 mt-1">Gestioná los pedidos a tus proveedores y su recepción.</p>
          </div>
          <Link
            href="/purchases/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20 w-fit"
          >
            <Plus className="w-4 h-4" />
            Nueva Orden
          </Link>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por n° de orden o proveedor..."
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
                  <th className="px-6 py-4 font-medium">N° Orden</th>
                  <th className="px-6 py-4 font-medium">Proveedor</th>
                  <th className="px-6 py-4 font-medium">Fecha Esperada</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium text-right">Total Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-neutral-800/20 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-white">
                      {po.order_number}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {po.supplier?.trade_name || po.supplier?.name || 'Proveedor Desconocido'}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {po.expected_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          {new Date(po.expected_date).toLocaleDateString('es-AR')}
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic">No definida</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusStyle(po.status)}`}>
                        {PO_STATUSES[po.status as keyof typeof PO_STATUSES]?.label || po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {formatCurrency(po.total_cents)}
                    </td>
                  </tr>
                ))}
                {purchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-neutral-500">
                        <ClipboardList className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-white mb-1">No hay órdenes de compra</p>
                        <p className="text-sm">Tus pedidos de reposición aparecerán acá.</p>
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
