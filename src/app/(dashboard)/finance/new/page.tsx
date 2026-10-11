'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrg } from '@/providers/org-provider'
import { ModuleGuard } from '@/components/layout/module-guard'
import { createTransaction, getAccounts, getCategories } from '@/modules/finance/actions/finance'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, DollarSign, Tag, FileText, CalendarDays, Landmark } from 'lucide-react'

export default function NewTransactionPage() {
  return (
    <ModuleGuard module="finance">
      <NewTransactionContent />
    </ModuleGuard>
  )
}

function NewTransactionContent() {
  const { currentOrg } = useOrg()
  const router = useRouter()

  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    type: 'income', // 'income' o 'expense'
    amount: '',
    account_id: '',
    category_id: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
  })

  useEffect(() => {
    if (currentOrg) {
      getAccounts(currentOrg.id).then(setAccounts)
      getCategories(currentOrg.id, formData.type as any).then(setCategories)
    }
  }, [currentOrg, formData.type])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return

    setIsLoading(true)
    setError(null)

    // Validar monto
    const amountFloat = parseFloat(formData.amount.replace(',', '.'))
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError('El monto debe ser mayor a 0')
      setIsLoading(false)
      return
    }

    const payload = {
      type: formData.type as 'income' | 'expense',
      amount_cents: Math.round(amountFloat * 100),
      account_id: formData.account_id,
      category_id: formData.category_id || undefined,
      description: formData.description,
      transaction_date: formData.transaction_date,
    }

    const { error } = await createTransaction(currentOrg.id, payload)

    if (error) {
      setError(error)
      setIsLoading(false)
    } else {
      router.push('/finance')
      router.refresh()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/finance"
          className="p-2 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo Movimiento</h1>
          <p className="text-neutral-400 mt-1">
            Registrá un ingreso o egreso manual.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-6">
          
          {/* Tipo de Movimiento (Tabs) */}
          <div className="flex p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'income', category_id: '' }))}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                formData.type === 'income' 
                  ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Ingreso (Cobro)
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category_id: '' }))}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                formData.type === 'expense' 
                  ? 'bg-rose-500/10 text-rose-400 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              Egreso (Gasto)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-red-400" />
                  Monto *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">$</span>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-lg focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all placeholder:text-neutral-600 font-semibold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-red-400" />
                  Fecha *
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  required
                  value={formData.transaction_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-red-400" />
                  Cuenta Origen/Destino *
                </label>
                <select
                  name="account_id"
                  required
                  value={formData.account_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all"
                >
                  <option value="" disabled>Seleccioná una cuenta...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.account_type === 'cash' ? 'Caja Fija' : acc.account_type === 'bank' ? 'Banco' : 'Billetera Virtual'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-red-400" />
                  Categoría
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all"
                >
                  <option value="">Sin categoría...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-400" />
              Descripción (Opcional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all resize-none"
              placeholder="Aclaración, número de comprobante, etc."
            />
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Link
            href="/finance"
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading || !formData.account_id}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Registrar Movimiento
          </button>
        </div>
      </form>
    </div>
  )
}
