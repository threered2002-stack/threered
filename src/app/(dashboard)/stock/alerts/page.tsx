import { getStockAlerts } from '@/modules/stock/actions/stock'
import { getActiveMembership } from '@/modules/core/actions/organizations'
import { redirect } from 'next/navigation'
import { AlertTriangle, Download, ArrowRight, PackageOpen } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'
import Link from 'next/link'

export default async function StockAlertsPage() {
  const membership = await getActiveMembership()
  if (!membership) redirect('/org/new')

  const alerts = await getStockAlerts(membership.organization_id)

  return (
    <ModuleGuard module="stock">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              Alertas de Stock
            </h1>
            <p className="text-neutral-400 mt-1">Productos por debajo del stock mínimo o agotados.</p>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-medium rounded-xl border border-neutral-800 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Producto</th>
                  <th className="px-6 py-4 font-medium">Depósito</th>
                  <th className="px-6 py-4 font-medium text-right">Stock Actual</th>
                  <th className="px-6 py-4 font-medium text-right">Mínimo Ideal</th>
                  <th className="px-6 py-4 font-medium text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {alerts.map((alert) => (
                  <tr key={`${alert.product_id}-${alert.warehouse_id}`} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="px-6 py-4">
                      {alert.stock_status === 'sin_stock' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <PackageOpen className="w-3.5 h-3.5" />
                          Sin Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Stock Bajo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{alert.product_name}</p>
                      {alert.sku && <p className="text-xs text-neutral-500 mt-0.5">SKU: {alert.sku}</p>}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {alert.warehouse_name}
                    </td>
                    <td className={`px-6 py-4 font-bold text-right ${alert.current_stock <= 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {alert.current_stock}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-400">
                      {alert.min_stock}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        href={`/purchases/new?product=${alert.product_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 rounded-lg transition-colors"
                      >
                        Comprar
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-neutral-500">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                          <PackageOpen className="w-6 h-6 text-emerald-400" />
                        </div>
                        <p className="text-lg font-medium text-white mb-1">¡Todo en orden!</p>
                        <p className="text-sm">Tu inventario está sano. No hay productos con stock crítico.</p>
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
