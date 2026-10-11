import { getCashSessions } from '@/modules/sales/actions/sales'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Banknote, Play, Square, Printer } from 'lucide-react'
import { ModuleGuard } from '@/components/layout/module-guard'

export default async function CashPage() {
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

  const sessions = await getCashSessions(membership.organization_id)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  // Find if there's an open session
  const openSession = sessions.find(s => s.status === 'open')

  return (
    <ModuleGuard module="sales">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Banknote className="w-6 h-6 text-red-400" />
              Caja Diaria
            </h1>
            <p className="text-neutral-400 mt-1">Apertura, cierre y arqueo de turnos.</p>
          </div>
          <div className="flex gap-3">
            {openSession ? (
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-rose-500/20">
                <Square className="w-4 h-4 fill-current" />
                Cerrar Turno Actual
              </button>
            ) : (
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
                <Play className="w-4 h-4 fill-current" />
                Abrir Nuevo Turno
              </button>
            )}
          </div>
        </div>

        {openSession && (
          <div className="bg-gradient-to-br from-red-600/20 to-red-900/10 border border-red-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Turno Abierto</h3>
                <p className="text-neutral-400">
                  Iniciado {new Date(openSession.opened_at).toLocaleDateString('es-AR')} a las {new Date(openSession.opened_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 items-end">
              <div>
                <p className="text-sm text-red-300/70 mb-1">Monto de Apertura</p>
                <p className="text-2xl font-bold text-red-100">{formatCurrency(openSession.opening_amount_cents)}</p>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-white mt-8 mb-4">Historial de Turnos</h2>

        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Apertura</th>
                  <th className="px-6 py-4 font-medium">Cierre</th>
                  <th className="px-6 py-4 font-medium">Caja</th>
                  <th className="px-6 py-4 font-medium text-right">Inicial</th>
                  <th className="px-6 py-4 font-medium text-right">Declarado</th>
                  <th className="px-6 py-4 font-medium text-right">Diferencia</th>
                  <th className="px-6 py-4 font-medium text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {sessions.filter(s => s.status === 'closed').map((session) => (
                  <tr key={session.id} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="px-6 py-4 text-neutral-300">
                      {new Date(session.opened_at).toLocaleDateString('es-AR')} {new Date(session.opened_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {session.closed_at ? (
                        <>{new Date(session.closed_at).toLocaleDateString('es-AR')} {new Date(session.closed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {session.cash_register?.name || 'Principal'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(session.opening_amount_cents)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatCurrency(session.actual_amount_cents || 0)}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                      (session.difference_cents || 0) < 0 ? 'text-rose-400' : 
                      (session.difference_cents || 0) > 0 ? 'text-emerald-400' : 'text-neutral-400'
                    }`}>
                      {formatCurrency(session.difference_cents || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sessions.filter(s => s.status === 'closed').length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                      No hay turnos cerrados todavía.
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
