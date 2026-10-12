'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, ShoppingCart, ChevronDown, AlignLeft, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { deleteCustomer } from '@/modules/customers/actions/customers'
import { useOrg } from '@/providers/org-provider'
import { useToast } from '@/providers/toast-provider'

interface CustomerRowProps {
  customer: any
}

export function CustomerRow({ customer: c }: CustomerRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const { currentOrg } = useOrg()
  const { toast } = useToast()
  const [isDeleting, startTransition] = useTransition()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleOpenDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteError(null)
    setShowConfirmDelete(true)
  }

  const handleConfirmDelete = () => {
    if (!currentOrg) return
    startTransition(async () => {
      const { error } = await deleteCustomer(c.id, currentOrg.id)
      if (error) {
        setDeleteError(error)
        toast.error(error, 'Error al eliminar cliente')
      } else {
        setShowConfirmDelete(false)
        toast.success(`El cliente "${c.full_name}" fue dado de baja correctamente.`, 'Cliente eliminado')
        router.refresh()
      }
    })
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  return (
    <>
      <tr 
        onClick={() => setIsExpanded(!isExpanded)}
        className="hover:bg-neutral-800/20 transition-colors cursor-pointer group"
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-sm group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors">
              {c.first_name.charAt(0)}{c.last_name ? c.last_name.charAt(0) : ''}
            </div>
            <div>
              <p className="text-white font-medium">{c.full_name}</p>
              {c.document_number && (
                <p className="text-xs text-neutral-500 mt-0.5 uppercase">
                  {c.document_type || 'DOC'}: {c.document_number}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 space-y-1.5">
          {c.email ? (
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <Mail className="w-3.5 h-3.5" />
              {c.email}
            </div>
          ) : null}
          {c.phone ? (
            <div className="flex items-center gap-2 text-neutral-400 text-xs">
              <Phone className="w-3.5 h-3.5" />
              {c.phone}
            </div>
          ) : null}
          {!c.email && !c.phone && <span className="text-neutral-600 text-xs">-</span>}
        </td>
        <td className="px-6 py-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/50 rounded-lg text-neutral-300">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="font-medium">{c.total_purchases}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-4">
            <div>
              <p className="font-semibold text-white">{formatCurrency(c.total_spent_cents)}</p>
              {c.last_purchase_at && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  Última: {new Date(c.last_purchase_at).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/customers/${c.id}/edit`)
                }}
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Editar cliente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                onClick={handleOpenDelete}
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Eliminar cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </td>
      </tr>
      
      {isExpanded && (
        <tr className="bg-neutral-900/60 border-t border-neutral-800/50">
          <td colSpan={4} className="px-6 py-4">
            <div className="flex items-start gap-3 text-sm">
              <AlignLeft className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-neutral-300 mb-1">Notas Internas:</p>
                <p className="text-neutral-400 whitespace-pre-wrap">
                  {c.notes ? c.notes : <span className="italic text-neutral-600">No hay notas guardadas para este cliente.</span>}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}

      {showConfirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation()
            if (!isDeleting) setShowConfirmDelete(false)
          }}
        >
          <div
            className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">¿Eliminar cliente?</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  ¿Estás seguro de que deseas eliminar a{' '}
                  <strong className="text-white font-semibold">{c.full_name}</strong>?
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Esta acción dará de baja al cliente del sistema.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
