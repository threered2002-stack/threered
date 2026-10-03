import { getAccountsPayable, getAccountsReceivable } from '@/modules/finance/actions/finance'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'

export default async function PayablesReceivablesPage() {
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

  const [payables, receivables] = await Promise.all([
    getAccountsPayable(membership.organization_id),
    getAccountsReceivable(membership.organization_id)
  ])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'partial': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'overdue': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      default: return 'bg-neutral-800 text-neutral-300 border-neutral-700'
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'paid': return 'Pagado'
      case 'partial': return 'Parcial'
      case 'overdue': return 'Vencido'
      default: return 'Pendiente'
    }
  }

  return (
    <ModuleGuard module="finance">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-400" />
            Por Pagar y Cobrar
          </h1>
          <p className="text-neutral-400 mt-1">Gestión de deudas a proveedores y créditos de clientes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Cuentas por Cobrar (Receivables) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5" />
                Por Cobrar (A favor)
              </h2>
            </div>
            
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Vencimiento</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {receivables.map((ar) => (
                      <tr key={ar.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-white font-medium">{ar.customer?.name || 'Cliente sin nombre'}</p>
                          {ar.notes && <p className="text-xs text-neutral-500 mt-0.5">{ar.notes}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-neutral-300">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(ar.due_date).toLocaleDateString('es-AR')}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${getStatusColor(ar.status)}`}>
                            {getStatusText(ar.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-white">{formatCurrency(ar.amount_cents)}</p>
                          {ar.received_cents > 0 && (
                            <p className="text-xs text-emerald-400 mt-0.5">Cobrado: {formatCurrency(ar.received_cents)}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                    {receivables.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-neutral-500">
                          No tenés cuentas por cobrar pendientes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cuentas por Pagar (Payables) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-rose-400 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5" />
                Por Pagar (Deudas)
              </h2>
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Proveedor</th>
                      <th className="px-4 py-3 font-medium">Vencimiento</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {payables.map((ap) => (
                      <tr key={ap.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-white font-medium">{ap.supplier?.name || 'Proveedor sin nombre'}</p>
                          {ap.notes && <p className="text-xs text-neutral-500 mt-0.5">{ap.notes}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-neutral-300">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(ap.due_date).toLocaleDateString('es-AR')}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${getStatusColor(ap.status)}`}>
                            {getStatusText(ap.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-white">{formatCurrency(ap.amount_cents)}</p>
                          {ap.paid_cents > 0 && (
                            <p className="text-xs text-emerald-400 mt-0.5">Pagado: {formatCurrency(ap.paid_cents)}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payables.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-neutral-500">
                          No tenés cuentas por pagar pendientes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ModuleGuard>
  )
}
