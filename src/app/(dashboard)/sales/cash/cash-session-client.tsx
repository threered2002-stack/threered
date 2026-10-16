'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Banknote, 
  Play, 
  Square, 
  ArrowRight, 
  CreditCard, 
  FileText, 
  DollarSign, 
  Wallet, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Plus, 
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react'
import { openCashSession, closeCashSession } from '@/modules/sales/actions/sales'
import { useToast } from '@/providers/toast-provider'

interface CashSessionClientProps {
  orgId: string
  openSession: any | null
  sessions: any[]
  currentBreakdown: {
    sales_count: number
    total_sales_cents: number
    opening_amount_cents: number
    cash_cents: number
    card_cents: number
    transfer_cents: number
    cta_cte_cents: number
    expected_cash_in_drawer: number
  }
}

export function CashSessionClient({
  orgId,
  openSession,
  sessions,
  currentBreakdown
}: CashSessionClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Modal states
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Open session form
  const [openingAmount, setOpeningAmount] = useState('')

  // Close session form
  const [countedCash, setCountedCash] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  const handleOpenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    const parsedOpening = Math.round((parseFloat(openingAmount.replace(',', '.')) || 0) * 100)
    if (parsedOpening < 0) {
      setFormError('El monto inicial no puede ser negativo')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await openCashSession(orgId, parsedOpening)
      if (res.success) {
        toast.success('Turno de caja iniciado correctamente', 'Caja Abierta')
        setIsOpenModalOpen(false)
        setOpeningAmount('')
        router.refresh()
      } else {
        setFormError(res.error || 'Error al abrir la caja')
      }
    } catch {
      setFormError('Error inesperado al abrir la caja')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!openSession) return

    setIsSubmitting(true)
    setFormError(null)

    const parsedCounted = Math.round((parseFloat(countedCash.replace(',', '.')) || 0) * 100)
    if (parsedCounted < 0) {
      setFormError('El monto recontado no puede ser negativo')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await closeCashSession(orgId, openSession.id, parsedCounted, closingNotes)
      if (res.success) {
        toast.success('Turno de caja cerrado y arqueo registrado', 'Caja Cerrada')
        setIsCloseModalOpen(false)
        setCountedCash('')
        setClosingNotes('')
        router.refresh()
      } else {
        setFormError(res.error || 'Error al cerrar la caja')
      }
    } catch {
      setFormError('Error inesperado al cerrar la caja')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pre-llenar conteo con lo esperado al abrir modal de cierre
  const handleOpenCloseModal = () => {
    setCountedCash((currentBreakdown.expected_cash_in_drawer / 100).toFixed(2))
    setClosingNotes('')
    setFormError(null)
    setIsCloseModalOpen(true)
  }

  const countedCents = Math.round((parseFloat(countedCash.replace(',', '.')) || 0) * 100)
  const differenceCents = countedCents - currentBreakdown.expected_cash_in_drawer

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Banknote className="w-6 h-6 text-red-400" />
            Caja Diaria & Arqueo
          </h1>
          <p className="text-neutral-400 mt-1">
            Control de efectivo en mano, transferencias bancarias y créditos de cuenta corriente.
          </p>
        </div>

        <div className="flex gap-3">
          {openSession ? (
            <button
              onClick={handleOpenCloseModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              Cerrar Turno & Arqueo
            </button>
          ) : (
            <button
              onClick={() => {
                setOpeningAmount('0')
                setFormError(null)
                setIsOpenModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Abrir Turno de Caja
            </button>
          )}
        </div>
      </div>

      {/* Main Status & Breakdown Card */}
      {openSession ? (
        <div className="space-y-6">
          {/* Active Session Banner */}
          <div className="bg-gradient-to-br from-neutral-900/90 to-neutral-900/40 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <div className="w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping shadow-[0_0_12px_rgba(52,211,153,0.8)]"></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      Turno Abierto
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {openSession.cash_register?.name || 'Caja Principal'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Iniciado el {new Date(openSession.opened_at).toLocaleDateString('es-AR')} a las {new Date(openSession.opened_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-neutral-950/60 border border-neutral-800/80 px-5 py-3 rounded-xl">
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Fondo Inicial</p>
                  <p className="text-lg font-bold text-neutral-200">{formatCurrency(openSession.opening_amount_cents)}</p>
                </div>
                <div className="w-px h-8 bg-neutral-800"></div>
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Ventas del Turno</p>
                  <p className="text-lg font-bold text-white">{currentBreakdown.sales_count} ops</p>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown by Payment Method Grid */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-3">
              Desglose de Fondos en Caja Diaria
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Efectivo en Mano (Total esperado) */}
              <div className="p-5 bg-neutral-900/60 border border-emerald-500/30 rounded-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Efectivo Físico</span>
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(currentBreakdown.expected_cash_in_drawer)}
                </p>
                <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                  <span>Inicial: {formatCurrency(currentBreakdown.opening_amount_cents)}</span>
                  <span className="text-emerald-400 font-medium">+{formatCurrency(currentBreakdown.cash_cents)} vtas</span>
                </div>
              </div>

              {/* Transferencias Bancarias */}
              <div className="p-5 bg-neutral-900/60 border border-red-500/30 rounded-2xl relative overflow-hidden group hover:border-red-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Transferencias</span>
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(currentBreakdown.transfer_cents)}
                </p>
                <p className="text-xs text-neutral-400 mt-2.5 pt-2 border-t border-neutral-800/80">
                  En cuentas bancarias / digitales
                </p>
              </div>

              {/* Tarjetas Débito/Crédito */}
              <div className="p-5 bg-neutral-900/60 border border-blue-500/30 rounded-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Tarjetas</span>
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(currentBreakdown.card_cents)}
                </p>
                <p className="text-xs text-neutral-400 mt-2.5 pt-2 border-t border-neutral-800/80">
                  Débito / Crédito POS
                </p>
              </div>

              {/* Cuenta Corriente (A cobrar) */}
              <div className="p-5 bg-neutral-900/60 border border-amber-500/30 rounded-2xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Cta. Corriente</span>
                  <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(currentBreakdown.cta_cte_cents)}
                </p>
                <p className="text-xs text-amber-400/80 mt-2.5 pt-2 border-t border-neutral-800/80 font-medium">
                  Deuda asentada en Por Cobrar
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Open Session Card */
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-8 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
              <Banknote className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No hay ningún turno de caja abierto</h3>
            <p className="text-xs text-neutral-400">
              Abrí un turno para registrar el fondo inicial en efectivo y llevar el control exacto de ingresos por efectivo, transferencias y cuenta corriente.
            </p>
            <button
              onClick={() => {
                setOpeningAmount('0')
                setFormError(null)
                setIsOpenModalOpen(true)
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Abrir Turno Ahora
            </button>
          </div>
        </div>
      )}

      {/* History of Closed Sessions */}
      <div className="space-y-3 pt-4">
        <h2 className="text-lg font-semibold text-white">Historial de Turnos y Arqueos</h2>

        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-900/80 text-neutral-400 border-b border-neutral-800 text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Apertura</th>
                  <th className="px-6 py-4 font-semibold">Cierre</th>
                  <th className="px-6 py-4 font-semibold">Caja</th>
                  <th className="px-6 py-4 font-semibold text-right">Fondo Inicial</th>
                  <th className="px-6 py-4 font-semibold text-right">Efectivo Esperado</th>
                  <th className="px-6 py-4 font-semibold text-right">Efectivo Recontado</th>
                  <th className="px-6 py-4 font-semibold text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50 text-xs">
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
                    <td className="px-6 py-4 text-white font-medium">
                      {session.cash_register?.name || 'Caja Principal'}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-400">
                      {formatCurrency(session.opening_amount_cents)}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-200">
                      {session.expected_amount_cents !== null ? formatCurrency(session.expected_amount_cents) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-white">
                      {formatCurrency(session.actual_amount_cents || 0)}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                      (session.difference_cents || 0) < 0 ? 'text-rose-400' : 
                      (session.difference_cents || 0) > 0 ? 'text-emerald-400' : 'text-neutral-400'
                    }`}>
                      {formatCurrency(session.difference_cents || 0)}
                    </td>
                  </tr>
                ))}
                {sessions.filter(s => s.status === 'closed').length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                      No hay turnos cerrados en el historial todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Apertura de Turno */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Abrir Turno de Caja</h3>
                  <p className="text-[11px] text-neutral-400">Ingresá el cambio inicial en la gaveta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Monto de Apertura en Efectivo ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-neutral-800/80 border border-neutral-700 rounded-xl text-white text-base font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  Corresponde al dinero físico con el que arranca la caja (cambio / sencillo).
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmar Apertura
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cierre de Turno y Arqueo */}
      {isCloseModalOpen && openSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Square className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cerrar Turno & Arqueo</h3>
                  <p className="text-[11px] text-neutral-400">Verificá los fondos acumulados durante el turno</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {formError}
                </div>
              )}

              {/* Resumen del turno */}
              <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-2.5">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Fondo Inicial:</span>
                  <span className="font-semibold text-neutral-200">{formatCurrency(openSession.opening_amount_cents)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Ventas en Efectivo:</span>
                  <span className="font-semibold text-emerald-400">+{formatCurrency(currentBreakdown.cash_cents)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Transferencias Registradas:</span>
                  <span className="font-semibold text-red-400">{formatCurrency(currentBreakdown.transfer_cents)}</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Ventas en Cuenta Corriente:</span>
                  <span className="font-semibold text-amber-400">{formatCurrency(currentBreakdown.cta_cte_cents)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between text-sm">
                  <span className="font-bold text-white">Efectivo Físico Esperado:</span>
                  <span className="font-bold text-emerald-400 text-base">
                    {formatCurrency(currentBreakdown.expected_cash_in_drawer)}
                  </span>
                </div>
              </div>

              {/* Campo para efectivo recontado */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Efectivo Físico Recontado en Mano ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-neutral-800/80 border border-neutral-700 rounded-xl text-white text-base font-bold focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Diferencia en vivo */}
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                differenceCents === 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : differenceCents > 0
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-1.5 font-medium">
                  {differenceCents === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>
                    {differenceCents === 0 ? 'Caja balanceada exactamente' : differenceCents > 0 ? 'Sobrante de caja' : 'Faltante de caja'}
                  </span>
                </div>
                <span className="font-bold text-sm">
                  {differenceCents > 0 ? `+${formatCurrency(differenceCents)}` : formatCurrency(differenceCents)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Observaciones / Notas del Turno (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: 'Se dejó $2000 en monedas para el turno tarde...'"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full p-2.5 bg-neutral-800/60 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Cerrando turno...
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Confirmar Cierre de Caja
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
