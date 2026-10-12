'use client'

import { useEffect, useState, Suspense } from 'react'
import { useOrg } from '@/providers/org-provider'
import { getProducts, deleteProduct, bulkUpdateProducts } from '@/modules/stock/actions/products'
import { getWarehouses } from '@/modules/stock/actions/stock'
import { formatMoney } from '@/lib/utils/money'
import { ModuleGuard } from '@/components/layout/module-guard'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Package, ArrowUpDown, Edit, Trash2, ListChecks, DollarSign, Power, X, Boxes, Loader2, AlertCircle } from 'lucide-react'
import type { Product } from '@/lib/types'
import { AdjustStockModal } from './adjust-stock-modal'
import { EditProductModal } from './edit-product-modal'
import { BulkActionsModal } from './bulk-actions-modal'
import { getCategories } from '@/modules/stock/actions/products'
import { useToast } from '@/providers/toast-provider'

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
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const warehouseId = searchParams.get('warehouse_id')
  
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [deleteProductError, setDeleteProductError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkActionConfig, setBulkActionConfig] = useState<'price' | 'category' | 'delete' | 'stock' | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  const loadData = async (orgId: string) => {
    const [productsData, warehousesData, categoriesData] = await Promise.all([
      getProducts(orgId),
      getWarehouses(orgId),
      getCategories(orgId)
    ])
    setProducts(productsData as any)
    setWarehouses(warehousesData)
    setCategories(categoriesData)
    setIsLoading(false)
  }

  useEffect(() => {
    if (currentOrg) {
      loadData(currentOrg.id)
    }
  }, [currentOrg])

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))

    if (warehouseId) {
      const stockQty = p.stock?.reduce((sum, s) => {
        if (s.warehouse_id === warehouseId) return sum + s.quantity
        return sum
      }, 0) || 0
      
      // Solo mostrar productos que realmente tengan stock en este depósito
      return matchesSearch && stockQty > 0
    }

    return matchesSearch
  })

  const selectedWarehouse = warehouses.find(w => w.id === warehouseId)

  const totalStock = products.reduce((acc, p) => {
    const stockQty = p.stock?.reduce((sum, s) => {
      if (warehouseId && s.warehouse_id !== warehouseId) return sum
      return sum + s.quantity
    }, 0) || 0
    return acc + stockQty
  }, 0)

  const handleConfirmDeleteProduct = async () => {
    if (!currentOrg || !productToDelete) return
    const productName = productToDelete.name
    setIsDeletingProduct(true)
    setDeleteProductError(null)

    const res = await deleteProduct(productToDelete.id, currentOrg.id)
    if (res?.error) {
      setDeleteProductError(res.error)
      toast.error(res.error, 'Error al borrar producto')
      setIsDeletingProduct(false)
    } else {
      setProducts(products.filter(p => p.id !== productToDelete.id))
      setProductToDelete(null)
      setIsDeletingProduct(false)
      toast.success(`El producto "${productName}" fue eliminado del inventario.`, 'Producto eliminado')
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProducts.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <BulkActionsModal
        action={bulkActionConfig}
        selectedIds={selectedIds}
        products={products}
        categories={categories}
        warehouses={warehouses}
        onClose={() => setBulkActionConfig(null)}
        onSuccess={() => {
          const actionDone = bulkActionConfig
          const count = selectedIds.length
          setBulkActionConfig(null)
          setSelectedIds([])
          if (actionDone === 'delete') {
            toast.success(`Se eliminaron ${count} productos correctamente.`, 'Productos eliminados')
          } else if (actionDone === 'price') {
            toast.success(`Se actualizaron los precios de ${count} productos.`, 'Precios actualizados')
          } else if (actionDone === 'category') {
            toast.success(`Se actualizó la categoría de ${count} productos.`, 'Categoría actualizada')
          } else if (actionDone === 'stock') {
            toast.success(`Se ajustó el stock de ${count} productos.`, 'Stock actualizado')
          }
          if (currentOrg) loadData(currentOrg.id)
        }}
      />
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
            Inventario {selectedWarehouse && <span className="text-red-400">({selectedWarehouse.name})</span>}
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20"
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
            <div className="p-2.5 bg-red-500/10 rounded-lg">
              <Search className="w-5 h-5 text-red-400" />
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
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-500 focus:ring-red-500/40 focus:ring-offset-neutral-900"
                  />
                </th>
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
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    <div className="flex justify-center items-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-red-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Cargando productos...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockQty = product.stock?.reduce((sum, s) => {
                    if (warehouseId && s.warehouse_id !== warehouseId) return sum
                    return sum + s.quantity
                  }, 0) || 0
                  
                  const isSelected = selectedIds.includes(product.id)
                  
                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-neutral-800/30 transition-colors group ${isSelected ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(product.id)}
                          className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-red-500 focus:ring-red-500/40 focus:ring-offset-neutral-900"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center shrink-0 border border-neutral-700/50">
                            <Package className="w-5 h-5 text-neutral-400 group-hover:text-red-400 transition-colors" />
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-red-300 transition-colors">
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
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Editar producto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteProductError(null)
                              setProductToDelete(product)
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
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

      {/* Floating Action Bar for Selected Items */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center bg-[#111111] border border-neutral-800 rounded-xl shadow-2xl p-1.5 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="text-white text-sm font-medium px-4 border-r border-neutral-800">
            {selectedIds.length} seleccionados
          </div>
          
          <div className="flex items-center gap-1 px-3 border-r border-neutral-800">
            <button onClick={() => setBulkActionConfig('category')} className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors font-medium">
              <Package className="w-4 h-4" /> Categoría
            </button>
            <button onClick={() => setBulkActionConfig('price')} className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors font-medium">
              <DollarSign className="w-4 h-4" /> % Precio %
            </button>
            <button onClick={() => setBulkActionConfig('stock')} className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors font-medium">
              <Boxes className="w-4 h-4" /> Stock
            </button>
          </div>

          <div className="flex items-center gap-1 px-3">
            <button onClick={() => setBulkActionConfig('delete')} className="flex items-center gap-2 px-3 py-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors font-medium">
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
            <button onClick={() => setSelectedIds([])} className="p-2 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg ml-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación para borrar producto */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isDeletingProduct && setProductToDelete(null)}
        >
          <div
            className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">¿Borrar producto?</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  ¿Estás seguro de que querés borrar{' '}
                  <strong className="text-white font-semibold">"{productToDelete.name}"</strong>?
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Esta acción eliminará el producto del inventario.
                </p>
              </div>
            </div>

            {deleteProductError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteProductError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Borrando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Borrar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
