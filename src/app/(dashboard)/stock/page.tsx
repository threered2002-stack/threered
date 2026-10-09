'use client'

import { useEffect, useState, Suspense } from 'react'
import { useOrg } from '@/providers/org-provider'
import { getProducts, deleteProduct } from '@/modules/stock/actions/products'
import { getWarehouses } from '@/modules/stock/actions/stock'
import { formatMoney } from '@/lib/utils/money'
import { ModuleGuard } from '@/components/layout/module-guard'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Package, ArrowUpDown, Edit, Trash2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { AdjustStockModal } from './adjust-stock-modal'
import { EditProductModal } from './edit-product-modal'

export default function StockPage() {
  return (
    <ModuleGuard module="stock">
      <Suspense fallback={<div className="p-8 text-center text-neutral-500">Cargando inventario...</div>}>
        <StockContent />
      </Suspense>
    </ModuleGuard>
  )
}

function StockContent() {
  const { currentOrg } = useOrg()
  const searchParams = useSearchParams()
  const warehouseId = searchParams.get('warehouse_id')
  
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const loadData = async (orgId: string) => {
    const [productsData, warehousesData] = await Promise.all([
      getProducts(orgId),
      getWarehouses(orgId)
    ])
    setProducts(productsData as any)
    setWarehouses(warehousesData)
    setIsLoading(false)
  }

  useEffect(() => {
    if (currentOrg) {
      loadData(currentOrg.id)
    }
  }, [currentOrg])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedWarehouse = warehouses.find(w => w.id === warehouseId)

  const totalStock = products.reduce((acc, p) => {
    const stockQty = p.stock?.reduce((sum, s) => {
      if (warehouseId && s.warehouse_id !== warehouseId) return sum
      return sum + s.quantity
    }, 0) || 0
    return acc + stockQty
  }, 0)

  const handleDelete = async (productId: string) => {
    if (!currentOrg) return
    if (!confirm('¿Estás seguro de querer borrar este producto?')) return

    const res = await deleteProduct(productId, currentOrg.id)
    if (res?.error) {
      alert(res.error)
    } else {
      setProducts(products.filter(p => p.id !== productId))
    }
  }

  return (
    <div className="space-y-6">
      <AdjustStockModal 
        product={adjustingProduct} 
        warehouses={warehouses}
        preselectedWarehouseId={warehouseId}
        isOpen={!!adjustingProduct} 
        onClose={() => {
          setAdjustingProduct(null)
          if (currentOrg) loadData(currentOrg.id) // Reload to get updated stock
        }} 
      />
      <EditProductModal 
        product={editingProduct} 
        isOpen={!!editingProduct} 
        onClose={() => {
          setEditingProduct(null)
          if (currentOrg) loadData(currentOrg.id) // Reload to get updated product data
        }} 
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Inventario {selectedWarehouse && <span className="text-violet-400">({selectedWarehouse.name})</span>}
          </h1>
          <p className="text-neutral-400 mt-1">
            {selectedWarehouse 
              ? `Viendo el inventario específico para ${selectedWarehouse.name}.` 
              : 'Gestioná el inventario global, precios y depósitos.'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {warehouseId && (
            <Link 
              href="/stock"
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors text-sm"
            >
              Ver Global
            </Link>
          )}
          <Link
            href="/stock/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-500/10 rounded-lg">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-neutral-400">Total Productos</p>
          </div>
          <p className="text-3xl font-bold text-white">{products.length}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg">
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-neutral-400">Unidades en Stock {selectedWarehouse ? 'Local' : 'Total'}</p>
          </div>
          <p className="text-3xl font-bold text-white">{totalStock}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-violet-500/10 rounded-lg">
              <Search className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-neutral-400">Valorización {selectedWarehouse ? 'Local' : 'Total'}</p>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatMoney(
              products.reduce((acc, p) => {
                const stockQty = p.stock?.reduce((sum, s) => {
                  if (warehouseId && s.warehouse_id !== warehouseId) return sum
                  return sum + s.quantity
                }, 0) || 0
                return acc + (stockQty * p.cost_price_cents)
              }, 0)
            )}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium text-right">Costo</th>
                <th className="px-4 py-3 font-medium text-right">Precio Venta</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    <div className="flex justify-center items-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-violet-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Cargando productos...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockQty = product.stock?.reduce((sum, s) => {
                    if (warehouseId && s.warehouse_id !== warehouseId) return sum
                    return sum + s.quantity
                  }, 0) || 0
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-neutral-800/30 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0 border border-neutral-700/50">
                            <Package className="w-5 h-5 text-neutral-400 group-hover:text-violet-400 transition-colors" />
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-violet-300 transition-colors">
                              {product.name}
                            </p>
                            {(() => {
                              const meta = product.metadata as import('@/lib/types').VinotecaMetadata
                              if (meta?.varietal) {
                                return (
                                  <p className="text-xs text-neutral-500">
                                    {meta.varietal} {meta.vintage}
                                  </p>
                                )
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-400 font-mono text-xs">
                        {product.sku || '-'}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-300">
                        {formatMoney(product.cost_price_cents)}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {formatMoney(product.sale_price_cents)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                            stockQty <= product.min_stock
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {stockQty} {product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setAdjustingProduct(product)}
                            className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Ajustar Stock"
                          >
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1.5 text-neutral-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                            title="Editar producto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Borrar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
