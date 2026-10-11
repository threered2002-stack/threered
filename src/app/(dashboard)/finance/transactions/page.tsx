import { getTransactions } from '@/modules/finance/actions/finance'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftRight, Plus, Download } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'

export default async function TransactionsPage() {
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

  // Traer 100 movimientos para el historial
  const transactions = await getTransactions(membership.organization_id, 100)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  return (
    <ModuleGuard module="finance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-red-400" />
              Transacciones
            </h1>
            <p className="text-neutral-400 mt-1">Historial completo de ingresos y egresos.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 font-medium rounded-xl border border-neutral-800 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <Link
              href="/finance/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </Link>
          </div>
        </div>

        {/* Filters placeholder */}
        <div className="flex gap-2 pb-2 overflow-x-auto">
          <button className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium whitespace-nowrap">
            Todos
          </button>
          <button className="px-4 py-1.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-300 text-sm font-medium whitespace-nowrap">
            Ingresos
          </button>
          <button className="px-4 py-1.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-300 text-sm font-medium whitespace-nowrap">
            Egresos
          </button>
          <button className="px-4 py-1.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-300 text-sm font-medium whitespace-nowrap">
            Este Mes
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                  <th className="px-6 py-4 font-medium">Descripción</th>
                  <th className="px-6 py-4 font-medium">Categoría</th>
                  <th className="px-6 py-4 font-medium">Cuenta</th>
                  <th className="px-6 py-4 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="px-6 py-4 text-neutral-300 whitespace-nowrap">
                      {new Date(tx.transaction_date).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      })}
                      <span className="text-neutral-500 ml-2">
                        {new Date(tx.created_at).toLocaleTimeString('es-AR', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{tx.description || 'Movimiento sin descripción'}</p>
                      {tx.reference_type && (
                        <p className="text-xs text-neutral-500 mt-0.5">Ref: {tx.reference_type} #{tx.reference_id?.split('-')[0]}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 text-xs border border-neutral-700/50">
                        {tx.category?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-400">
                      {tx.account?.name}
                    </td>
                    <td className={`px-6 py-4 font-semibold text-right whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount_cents)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                      Aún no hay movimientos registrados.
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
