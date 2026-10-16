import { getSales } from '@/modules/sales/actions/sales'
import { getActiveMembership } from '@/modules/core/actions/organizations'
import { redirect } from 'next/navigation'
import { History, Download, Filter, Search, Receipt } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'
import { SALE_STATUSES } from '@/lib/constants/index'

export default async function SalesHistoryPage() {
  const membership = await getActiveMembership()
  if (!membership) redirect('/org/new')

  const sales = await getSales(membership.organization_id)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  const getStatusStyle = (status: string) => {
    const config = SALE_STATUSES[status as keyof typeof SALE_STATUSES]
    if (!config) return 'text-neutral-400 bg-neutral-800'
    
    switch (config.color) {
      case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'red': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      case 'slate': return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
      default: return 'text-neutral-300 bg-neutral-800 border-neutral-700'
    }
  }

  return (
    <ModuleGuard module="sales">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <History className="w-6 h-6 text-red-400" />
              Historial de Ventas
            </h1>
            <p className="text-neutral-400 mt-1">Registro completo de tickets y facturación.</p>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-medium rounded-xl border border-neutral-800 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por n° de ticket, cliente o vendedor..."
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
                  <th className="px-6 py-4 font-medium">Ticket</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-800/20 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-neutral-500" />
                        <span className="font-medium text-white">{sale.sale_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">
                        {sale.customer ? `${sale.customer.first_name} ${sale.customer.last_name || ''}`.trim() : 'Consumidor Final'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 whitespace-nowrap">
                      {new Date(sale.created_at).toLocaleDateString('es-AR')}
                      <span className="text-neutral-500 ml-2">
                        {new Date(sale.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusStyle(sale.status)}`}>
                        {SALE_STATUSES[sale.status as keyof typeof SALE_STATUSES]?.label || sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-right text-white">
                      {formatCurrency(sale.total_cents)}
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-neutral-500">
                        <History className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium text-white mb-1">No hay ventas registradas</p>
                        <p className="text-sm">Tus ventas confirmadas en el Punto de Venta aparecerán acá.</p>
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
