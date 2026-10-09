'use client'

import { useState } from 'react'
import { ArrowLeft, Save, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createAccountPayable, createAccountReceivable } from '@/modules/finance/actions/finance'
import { useOrg } from '@/providers/org-provider'

export function ManualDebtForm({ customers, suppliers }: { customers: any[], suppliers: any[] }) {
  const router = useRouter()
  const { currentOrg } = useOrg()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [type, setType] = useState<'receivable' | 'payable'>('receivable')
  const [entityId, setEntityId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg || !entityId || !amount || !dueDate) return

    setIsSubmitting(true)
    
    const amountCents = Math.round(parseFloat(amount) * 100)

    let res;
    if (type === 'receivable') {
      res = await createAccountReceivable(currentOrg.id, {
        customer_id: entityId,
        amount_cents: amountCents,
        due_date: dueDate,
        notes
      })
    } else {
      res = await createAccountPayable(currentOrg.id, {
        supplier_id: entityId,
        amount_cents: amountCents,
        due_date: dueDate,
        notes
      })
    }

    setIsSubmitting(false)

    if (res.error) {
      alert(res.error)
    } else {
      router.push('/finance/payables-receivables')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-4">
        <Link 
          href="/finance/payables-receivables"
          className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Registrar Deuda Manual
          </h1>
          <p className="text-neutral-400 mt-1">Ingresá saldos a favor o deudas pendientes históricas.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-neutral-800/80">
          
          {/* Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-400 mb-3">Tipo de Registro</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setType('receivable'); setEntityId(''); }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  type === 'receivable' 
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-6 h-6" />
                <span className="font-medium">Por Cobrar (A favor)</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setType('payable'); setEntityId(''); }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  type === 'payable' 
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400' 
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-6 h-6" />
                <span className="font-medium">Por Pagar (Deuda)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                {type === 'receivable' ? 'Cliente' : 'Proveedor'}
              </label>
              <select 
                required
                value={entityId}
                onChange={e => setEntityId(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white appearance-none focus:ring-2 focus:ring-violet-500/40 transition-all"
              >
                <option value="">Seleccionar {type === 'receivable' ? 'cliente' : 'proveedor'}...</option>
                {type === 'receivable' 
                  ? customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)
                  : suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.trade_name ? `(${s.trade_name})` : ''}</option>)
                }
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Monto ($)</label>
              <input 
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Fecha de Vencimiento</label>
              <input 
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-neutral-400 mb-2">Notas (Opcional)</label>
              <input 
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej: Saldo inicial, Compra pendiente de carga..."
                className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-neutral-900/20 flex justify-end gap-3">
          <Link
            href="/finance/payables-receivables"
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg ${
              type === 'receivable' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
            }`}
          >
            {isSubmitting ? 'Guardando...' : (
              <>
                <Save className="w-4 h-4" />
                Registrar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
