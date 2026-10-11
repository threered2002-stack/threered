'use client'

import { useState } from 'react'
import { Plus, Building2, Package, Save, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createPurchaseOrder } from '@/modules/purchases/actions/purchases'
import { useOrg } from '@/providers/org-provider'

export function PurchaseOrderForm({ suppliers, warehouses, products }: { suppliers: any[], warehouses: any[], products: any[] }) {
  const router = useRouter()
  const { currentOrg } = useOrg()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '')
  const [expectedDate, setExpectedDate] = useState('')
  
  const [items, setItems] = useState<{ productId: string, quantity: number, costCents: number }[]>([])

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, costCents: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    const item = { ...newItems[index], [field]: value }
    
    // Auto fill cost if product selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        item.costCents = product.cost_price_cents
      }
    }
    
    newItems[index] = item
    setItems(newItems)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return
    if (items.length === 0) {
      alert('Debes agregar al menos un producto a la orden.')
      return
    }

    setIsSubmitting(true)
    
    const res = await createPurchaseOrder(currentOrg.id, {
      supplier_id: supplierId,
      warehouse_id: warehouseId,
      expected_date: expectedDate || undefined,
      items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost_cents: item.costCents
      }))
    })

    setIsSubmitting(false)

    if (res.error) {
      alert(res.error)
    } else {
      router.push('/purchases')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-4">
        <Link 
          href="/purchases"
          className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Nueva Orden de Compra
          </h1>
          <p className="text-neutral-400 mt-1">Generá un pedido de reposición de stock.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-neutral-800/80">
            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-red-400" />
              Datos del Proveedor
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Proveedor</label>
                <select 
                  required
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white appearance-none focus:ring-2 focus:ring-red-500/40 transition-all"
                >
                  <option value="">Seleccionar proveedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.trade_name ? `(${s.trade_name})` : ''}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Depósito Destino</label>
                <select 
                  required
                  value={warehouseId}
                  onChange={e => setWarehouseId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white appearance-none focus:ring-2 focus:ring-red-500/40 transition-all"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Fecha Esperada</label>
                <input 
                  type="date"
                  value={expectedDate}
                  onChange={e => setExpectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-red-400" />
              Ítems Solicitados
            </h2>
            
            {items.length > 0 && (
              <div className="space-y-3 mb-6">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-end p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Producto</label>
                      <select 
                        required
                        value={item.productId}
                        onChange={e => updateItem(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-1 focus:ring-red-500 transition-all"
                      >
                        <option value="">Seleccionar producto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-24">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Cantidad</label>
                      <input 
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-1 focus:ring-red-500 transition-all"
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Costo Unit. ($)</label>
                      <input 
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={item.costCents / 100}
                        onChange={e => updateItem(index, 'costCents', Math.round(parseFloat(e.target.value) * 100) || 0)}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:ring-1 focus:ring-red-500 transition-all"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div 
              onClick={addItem}
              className="border-2 border-dashed border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-red-500/50 hover:bg-red-500/5 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3 group-hover:bg-red-500/20 group-hover:text-red-400">
                <Plus className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="font-medium text-white">Agregar Producto</p>
              <p className="text-sm text-neutral-500 mt-1">Seleccioná los artículos a reponer</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/purchases"
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/20"
          >
            {isSubmitting ? 'Guardando...' : (
              <>
                <Save className="w-4 h-4" />
                Crear Orden
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
