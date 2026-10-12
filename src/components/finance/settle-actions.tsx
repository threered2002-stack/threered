'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react'
import { recordReceivablePayment, recordPayablePayment } from '@/modules/finance/actions/finance'
import { useToast } from '@/providers/toast-provider'

export function SettleReceivableButton({
  orgId,
  receivableId,
  status
}: {
  orgId: string
  receivableId: string
  status: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Cobrado
      </span>
    )
  }

  const handleSettle = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await recordReceivablePayment(orgId, receivableId)
      if (res.success) {
        setShowModal(false)
        toast.success('Cobro asentado exitosamente y registrado en caja diaria.', 'Cobro registrado')
        router.refresh()
      } else {
        setError(res.error || 'Error al registrar el cobro')
        toast.error(res.error || 'Error al registrar el cobro', 'Error')
      }
    } catch {
      setError('Error inesperado al cobrar')
      toast.error('Error inesperado al procesar el cobro', 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null)
          setShowModal(true)
        }}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
      >
        <ArrowDownLeft className="w-3.5 h-3.5" />
        Cobrar
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">¿Registrar cobro?</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Se registrará el cobro total de esta cuenta por cobrar y se asentará automáticamente el ingreso en la caja diaria.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSettle}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Confirmar Cobro'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function SettlePayableButton({
  orgId,
  payableId,
  status
}: {
  orgId: string
  payableId: string
  status: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Pagado
      </span>
    )
  }

  const handleSettle = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await recordPayablePayment(orgId, payableId)
      if (res.success) {
        setShowModal(false)
        toast.success('Pago asentado exitosamente y registrado en caja diaria.', 'Pago registrado')
        router.refresh()
      } else {
        setError(res.error || 'Error al registrar el pago')
        toast.error(res.error || 'Error al registrar el pago', 'Error')
      }
    } catch {
      setError('Error inesperado al pagar')
      toast.error('Error inesperado al procesar el pago', 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => {
          setError(null)
          setShowModal(true)
        }}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
        Pagar
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">¿Registrar pago?</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Se registrará el pago total a este proveedor y se asentará automáticamente el egreso de dinero en la caja diaria.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSettle}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Confirmar Pago'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
