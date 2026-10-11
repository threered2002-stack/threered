import { useState } from 'react'
import { createStockMovement } from '@/modules/stock/actions/stock'
import { useOrg } from '@/providers/org-provider'
import { X, Save, Loader2, Package } from 'lucide-react'
import type { Product } from '@/lib/types'

interface AdjustStockModalProps {
  product: Product | null
  warehouses: any[]
  preselectedWarehouseId?: string | null
  isOpen: boolean
  onClose: () => void
}

export function AdjustStockModal({ product, warehouses, preselectedWarehouseId, isOpen, onClose }: AdjustStockModalProps) {
  const { currentOrg } = useOrg()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    warehouse_id: preselectedWarehouseId || (warehouses.find(w => w.is_default)?.id || (warehouses[0]?.id || '')),
    movement_type: 'adjustment',
    quantity: '',
    notes: ''
  })

  // Reset form when product changes
  if (!isOpen || !product) return null

  const stockQty = product.stock?.reduce((sum, s) => {
    if (formData.warehouse_id && s.warehouse_id !== formData.warehouse_id) return sum
    return sum + s.quantity
  }, 0) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return

    setIsLoading(true)
    const { error } = await createStockMovement(currentOrg.id, {
      product_id: product.id,
      warehouse_id: formData.warehouse_id,
      movement_type: formData.movement_type,
      quantity: Number(formData.quantity),
      notes: formData.notes
    })

    setIsLoading(false)
    if (error) {
      alert(error)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Ajustar Stock</h2>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product Info */}
          <div className="p-4 rounded-xl border bg-red-500/10 border-red-500/30 text-white flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">{product.name}</div>
              <div className="text-sm text-neutral-400 mt-1 flex items-center gap-4">
                <span>SKU: {product.sku || '-'}</span>
                <span>Stock Actual: <strong className="text-white">{stockQty}</strong></span>
              </div>
            </div>
            <Package className="w-8 h-8 text-red-400/50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Depósito *
              </label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData(prev => ({ ...prev, warehouse_id: e.target.value }))}
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white appearance-none focus:ring-2 focus:ring-red-500/40 transition-all text-sm"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Tipo de Movimiento *
              </label>
              <select
                value={formData.movement_type}
                onChange={(e) => setFormData(prev => ({ ...prev, movement_type: e.target.value }))}
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white appearance-none focus:ring-2 focus:ring-red-500/40 transition-all text-sm"
              >
                <option value="adjustment">Ajuste (Positivo/Negativo)</option>
                <option value="purchase_in">Entrada por Compra</option>
                <option value="loss">Salida por Merma/Rotura</option>
                <option value="sale_out">Salida Manual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Cantidad a modificar *
            </label>
            <input
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Ej: 10 o -5"
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-red-500/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              placeholder="Motivo del ajuste..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-red-500/40 transition-all resize-none text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
