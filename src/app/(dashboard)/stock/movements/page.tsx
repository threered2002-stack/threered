import { getStockMovements } from '@/modules/stock/actions/stock'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftRight, Download, Filter, Search } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'
import { MOVEMENT_TYPES } from '@/lib/constants'

export default async function StockMovementsPage() {
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

  const movements = await getStockMovements(membership.organization_id)

  const getMovementStyle = (type: keyof typeof MOVEMENT_TYPES | string) => {
    const config = MOVEMENT_TYPES[type as keyof typeof MOVEMENT_TYPES]
    if (!config) return { label: type, color: 'text-neutral-400 bg-neutral-800', sign: '' }
    
    switch (config.color) {
      case 'emerald': return { label: config.label, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', sign: config.sign }
      case 'red': return { label: config.label, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', sign: config.sign }
      case 'amber': return { label: config.label, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', sign: config.sign }
      case 'blue': return { label: config.label, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', sign: config.sign }
      default: return { label: config.label, color: 'text-neutral-300 bg-neutral-800 border-neutral-700', sign: config.sign }
    }
  }

  return (
    <ModuleGuard module="stock">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-violet-400" />
              Movimientos de Stock
            </h1>
            <p className="text-neutral-400 mt-1">Historial de entradas, salidas y transferencias.</p>
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
              placeholder="Buscar por producto, SKU o depósito..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600"
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
                  <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                  <th className="px-6 py-4 font-medium">Producto</th>
                  <th className="px-6 py-4 font-medium">Depósito</th>
                  <th className="px-6 py-4 font-medium">Tipo de Mov.</th>
                  <th className="px-6 py-4 font-medium text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {movements.map((mov) => {
                  const style = getMovementStyle(mov.movement_type)
                  return (
                    <tr key={mov.id} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="px-6 py-4 text-neutral-300 whitespace-nowrap">
                        {new Date(mov.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                        <span className="text-neutral-500 ml-2">
                          {new Date(mov.created_at).toLocaleTimeString('es-AR', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{mov.product?.name || 'Producto Desconocido'}</p>
                        {mov.product?.sku && (
                          <p className="text-xs text-neutral-500 mt-0.5">SKU: {mov.product.sku}</p>
                        )}
                        {mov.notes && (
                          <p className="text-xs text-neutral-400 mt-1 italic">"{mov.notes}"</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-300">
                        {mov.warehouse?.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${style.color}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-bold text-right whitespace-nowrap ${Number(mov.quantity) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {Number(mov.quantity) > 0 ? '+' : ''}{mov.quantity}
                      </td>
                    </tr>
                  )
                })}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      No se registraron movimientos de stock todavía.
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
