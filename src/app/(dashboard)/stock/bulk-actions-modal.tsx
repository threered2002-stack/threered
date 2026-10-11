import { useState } from 'react'
import { useOrg } from '@/providers/org-provider'
import { bulkUpdateProducts } from '@/modules/stock/actions/products'
import { bulkCreateStockMovements } from '@/modules/stock/actions/stock'
import { X, Save, Loader2, AlertTriangle, Boxes } from 'lucide-react'

interface BulkActionsModalProps {
  action: 'price' | 'category' | 'delete' | 'stock' | null
  selectedIds: string[]
  products: any[]
  categories?: any[] // We can pass categories or fetch them
  warehouses?: any[] // Passed from page.tsx
  onClose: () => void
  onSuccess: () => void
}

export function BulkActionsModal({ action, selectedIds, products, categories = [], warehouses = [], onClose, onSuccess }: BulkActionsModalProps) {
  const { currentOrg } = useOrg()
  const [isLoading, setIsLoading] = useState(false)
  const [percentage, setPercentage] = useState('')
  const [targetPrices, setTargetPrices] = useState<'both' | 'cost' | 'sale'>('both')
  const [selectedCategory, setSelectedCategory] = useState('')
  
  // Stock States
  const [stockWarehouse, setStockWarehouse] = useState(warehouses?.[0]?.id || '')
  const [stockType, setStockType] = useState('adjustment')
  const [stockQuantity, setStockQuantity] = useState('')

  if (!action || selectedIds.length === 0) return null

  const handlePriceUpdate = async () => {
    if (!currentOrg || !percentage) return
    setIsLoading(true)
    
    const pct = parseFloat(percentage) / 100
    const multiplier = 1 + pct

    const updates = selectedIds.map(id => {
      const product = products.find(p => p.id === id)
      const newData: any = {}
      
      if (targetPrices === 'both' || targetPrices === 'cost') {
        newData.cost_price_cents = Math.round(product.cost_price_cents * multiplier)
      }
      if (targetPrices === 'both' || targetPrices === 'sale') {
        newData.sale_price_cents = Math.round(product.sale_price_cents * multiplier)
      }
      
      return { id, data: newData }
    })

    const res = await bulkUpdateProducts(currentOrg.id, updates)
    setIsLoading(false)
    
    if (res.error) alert(res.error)
    else onSuccess()
  }

  const handleCategoryUpdate = async () => {
    if (!currentOrg || !selectedCategory) return
    setIsLoading(true)
    
    const updates = selectedIds.map(id => ({
      id,
      data: { category_id: selectedCategory }
    }))

    const res = await bulkUpdateProducts(currentOrg.id, updates)
    setIsLoading(false)
    
    if (res.error) alert(res.error)
    else onSuccess()
  }

  const handleDelete = async () => {
    if (!currentOrg) return
    setIsLoading(true)
    
    // Soft delete can just be a bulk update setting deleted_at
    const updates = selectedIds.map(id => ({
      id,
      data: { deleted_at: new Date().toISOString() }
    }))

    const res = await bulkUpdateProducts(currentOrg.id, updates)
    setIsLoading(false)
    
    if (res.error) alert(res.error)
    else onSuccess()
  }

  const handleStockUpdate = async () => {
    if (!currentOrg || !stockWarehouse || !stockQuantity) return
    setIsLoading(true)

    const quantityNum = parseFloat(stockQuantity)
    if (isNaN(quantityNum) || quantityNum === 0) {
      setIsLoading(false)
      return alert("Cantidad inválida")
    }

    const movements = selectedIds.map(id => ({
      product_id: id,
      warehouse_id: stockWarehouse,
      movement_type: stockType,
      quantity: quantityNum,
      notes: 'Ajuste masivo'
    }))

    const res = await bulkCreateStockMovements(currentOrg.id, movements)
    setIsLoading(false)

    if (res.error) alert(res.error)
    else onSuccess()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">
            {action === 'price' && 'Ajuste de Precios'}
            {action === 'category' && 'Cambiar Categoría'}
            {action === 'stock' && 'Ajuste Masivo de Stock'}
            {action === 'delete' && 'Eliminar Productos'}
          </h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50">
            <p className="text-sm text-neutral-300">
              Se aplicará el cambio a <strong className="text-white">{selectedIds.length}</strong> productos seleccionados.
            </p>
          </div>

          {action === 'price' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Ajuste Porcentual (%)</label>
                <input
                  type="number"
                  placeholder="Ej: 10 o -5"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-red-500/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Aplicar a</label>
                <select
                  value={targetPrices}
                  onChange={(e) => setTargetPrices(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                >
                  <option value="both">Costo y Venta</option>
                  <option value="cost">Solo Costo</option>
                  <option value="sale">Solo Venta</option>
                </select>
              </div>
            </div>
          )}

          {action === 'category' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Nueva Categoría</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {action === 'stock' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Depósito</label>
                <select
                  value={stockWarehouse}
                  onChange={(e) => setStockWarehouse(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                >
                  <option value="">Seleccionar depósito...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Tipo</label>
                  <select
                    value={stockType}
                    onChange={(e) => setStockType(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                  >
                    <option value="adjustment">Ajuste Manual (+/-)</option>
                    <option value="purchase_in">Ingreso (+)</option>
                    <option value="loss">Merma (-)</option>
                    <option value="initial">Stock Inicial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">Cantidad</label>
                  <input
                    type="number"
                    placeholder="Ej: 10 o -5"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white focus:ring-2 focus:ring-red-500/40"
                  />
                </div>
              </div>
            </div>
          )}

          {action === 'delete' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-white font-medium">¿Estás seguro?</p>
              <p className="text-sm text-neutral-400">Esta acción no se puede deshacer de forma sencilla.</p>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (action === 'price') handlePriceUpdate()
                if (action === 'category') handleCategoryUpdate()
                if (action === 'stock') handleStockUpdate()
                if (action === 'delete') handleDelete()
              }}
              disabled={
                isLoading || 
                (action === 'price' && !percentage) || 
                (action === 'category' && !selectedCategory) ||
                (action === 'stock' && (!stockWarehouse || !stockQuantity))
              }
              className={`px-4 py-2 text-white font-medium rounded-lg transition-colors shadow-lg flex items-center gap-2 text-sm disabled:opacity-50 ${
                action === 'delete' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {action === 'delete' ? 'Eliminar' : 'Aplicar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
