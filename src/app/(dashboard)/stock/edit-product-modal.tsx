import { useState, useEffect } from 'react'
import { useOrg } from '@/providers/org-provider'
import { updateProduct, getCategories, getProductById } from '@/modules/stock/actions/products'
import { X, Save, Loader2, Package, Tag, DollarSign } from 'lucide-react'
import type { Product } from '@/lib/types'

interface EditProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export function EditProductModal({ product, isOpen, onClose }: EditProductModalProps) {
  const { currentOrg } = useOrg()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    cost_price: '',
    sale_price: '',
    min_stock: '0',
    unit: 'unidades',
    varietal: '',
    vintage: '',
  })

  useEffect(() => {
    if (isOpen && currentOrg && product?.id) {
      setIsFetching(true)
      // Fetch categories
      getCategories(currentOrg.id).then((cats) => {
        setCategories(cats as any)
      })

      // Fetch existing product
      getProductById(product.id, currentOrg.id).then((fetchedProduct) => {
        if (fetchedProduct) {
          setFormData({
            name: fetchedProduct.name || '',
            sku: fetchedProduct.sku || '',
            barcode: fetchedProduct.barcode || '',
            category_id: fetchedProduct.category_id || '',
            cost_price: (fetchedProduct.cost_price_cents / 100).toString(),
            sale_price: (fetchedProduct.sale_price_cents / 100).toString(),
            min_stock: (fetchedProduct.min_stock || 0).toString(),
            unit: fetchedProduct.unit || 'unidades',
            varietal: fetchedProduct.metadata?.varietal || '',
            vintage: fetchedProduct.metadata?.vintage ? fetchedProduct.metadata.vintage.toString() : '',
          })
        } else {
          setError('Producto no encontrado')
        }
        setIsFetching(false)
      })
    }
  }, [isOpen, currentOrg, product])

  if (!isOpen || !product) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return

    setIsLoading(true)
    setError(null)

    const costPriceCents = Math.round(parseFloat(formData.cost_price || '0') * 100)
    const salePriceCents = Math.round(parseFloat(formData.sale_price || '0') * 100)

    const payload = {
      name: formData.name,
      sku: formData.sku || null,
      barcode: formData.barcode || null,
      category_id: formData.category_id || null,
      cost_price_cents: costPriceCents,
      sale_price_cents: salePriceCents,
      min_stock: parseInt(formData.min_stock || '0', 10),
      unit: formData.unit,
      metadata: {
        varietal: formData.varietal || null,
        vintage: formData.vintage ? parseInt(formData.vintage, 10) : null,
      },
    }

    const { error } = await updateProduct(product.id, currentOrg.id, payload)

    if (error) {
      setError(error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
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
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Editar Producto</h2>
            <p className="text-neutral-400 text-sm mt-0.5">Modificá la información de este artículo.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {isFetching ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
          ) : (
            <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Principal */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-3">
                    <Package className="w-5 h-5 text-violet-400" />
                    <h3 className="text-base font-semibold text-white">Información Principal</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1.5">Nombre del Producto *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">SKU</label>
                        <input
                          type="text"
                          name="sku"
                          value={formData.sku}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Código de Barras</label>
                        <input
                          type="text"
                          name="barcode"
                          value={formData.barcode}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Categoría</label>
                        <select
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
                        >
                          <option value="">Sin categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Unidad</label>
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
                        >
                          <option value="unidades">Unidades</option>
                          <option value="cajas">Cajas</option>
                          <option value="litros">Litros</option>
                          <option value="kg">Kg</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Precios y Detalles Específicos */}
                <div className="space-y-4">
                  <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-3">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-semibold text-white">Precios y Stock</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Precio de Costo</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                          <input
                            type="number"
                            name="cost_price"
                            min="0"
                            step="0.01"
                            value={formData.cost_price}
                            onChange={handleChange}
                            className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1.5">Precio de Venta</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                          <input
                            type="number"
                            name="sale_price"
                            required
                            min="0"
                            step="0.01"
                            value={formData.sale_price}
                            onChange={handleChange}
                            className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/40 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1.5">Stock Mínimo (Alerta)</label>
                      <input
                        type="number"
                        name="min_stock"
                        min="0"
                        value={formData.min_stock}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Metadatos (Vinoteca) */}
                  {currentOrg?.template_id && (
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-3">
                        <Tag className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base font-semibold text-white">Detalles Vinoteca</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Varietal</label>
                          <input
                            type="text"
                            name="varietal"
                            value={formData.varietal}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-amber-500/40 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Añada (Año)</label>
                          <input
                            type="number"
                            name="vintage"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            value={formData.vintage}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-amber-500/40 transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-neutral-800 bg-neutral-900 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-product-form"
            disabled={isLoading || error === 'Producto no encontrado'}
            className="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50 text-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  )
}
