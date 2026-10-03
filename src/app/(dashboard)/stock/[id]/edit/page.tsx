'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrg } from '@/providers/org-provider'
import { ModuleGuard } from '@/components/layout/module-guard'
import { updateProduct, getCategories, getProductById } from '@/modules/stock/actions/products'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Package, Tag, DollarSign } from 'lucide-react'

export default function EditProductPage() {
  return (
    <ModuleGuard module="stock">
      <EditProductContent />
    </ModuleGuard>
  )
}

function EditProductContent() {
  const { currentOrg } = useOrg()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

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
    if (currentOrg && productId) {
      // Fetch categories
      getCategories(currentOrg.id).then((cats) => {
        setCategories(cats as any)
      })

      // Fetch existing product
      getProductById(productId, currentOrg.id).then((product) => {
        if (product) {
          setFormData({
            name: product.name || '',
            sku: product.sku || '',
            barcode: product.barcode || '',
            category_id: product.category_id || '',
            cost_price: (product.cost_price_cents / 100).toString(),
            sale_price: (product.sale_price_cents / 100).toString(),
            min_stock: (product.min_stock || 0).toString(),
            unit: product.unit || 'unidades',
            varietal: product.metadata?.varietal || '',
            vintage: product.metadata?.vintage ? product.metadata.vintage.toString() : '',
          })
        } else {
          setError('Producto no encontrado')
        }
        setIsFetching(false)
      })
    }
  }, [currentOrg, productId])

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

    const { error } = await updateProduct(productId, currentOrg.id, payload)

    if (error) {
      setError(error)
      setIsLoading(false)
    } else {
      router.push('/stock')
      router.refresh()
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/stock"
          className="p-2 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Producto</h1>
          <p className="text-neutral-400 mt-1">
            Modificá la información de este artículo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información Principal */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-4 mb-4">
              <Package className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">Información Principal</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Categoría
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Unidad de Medida
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                  >
                    <option value="unidades">Unidades (Botellas)</option>
                    <option value="cajas">Cajas</option>
                    <option value="litros">Litros</option>
                    <option value="kg">Kilogramos</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Precios y Detalles Específicos */}
          <div className="space-y-6">
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-4 mb-4">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">Precios y Stock</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Precio de Costo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <input
                      type="number"
                      name="cost_price"
                      min="0"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Precio de Venta
                  </label>
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
                      className="w-full pl-8 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Stock Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  name="min_stock"
                  min="0"
                  value={formData.min_stock}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                />
              </div>
            </div>

            {/* Metadatos (Vinoteca) */}
            {currentOrg?.template_id && (
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-4 mb-4">
                  <Tag className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-semibold text-white">Detalles del Vino</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                      Varietal
                    </label>
                    <input
                      type="text"
                      name="varietal"
                      value={formData.varietal}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                      Añada (Año)
                    </label>
                    <input
                      type="number"
                      name="vintage"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formData.vintage}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-neutral-800">
          <Link
            href="/stock"
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading || error === 'Producto no encontrado'}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  )
}
