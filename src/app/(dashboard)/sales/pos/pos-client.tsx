'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Minus, Trash2, User, CreditCard, Banknote, ShoppingCart, ArrowRight } from 'lucide-react'
import { createSale } from '@/modules/sales/actions/sales'

interface POSClientProps {
  products: any[]
  customers: any[]
  warehouses: any[]
  userId: string
  orgId: string
}

export function POSClient({ products, customers, warehouses, userId, orgId }: POSClientProps) {
  const router = useRouter()
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'account'>('cash')

  const defaultWarehouse = warehouses.find(w => w.is_default) || warehouses[0]

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id)
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          alert('No hay más stock disponible para este producto.')
          return prev
        }
        return prev.map(item => 
          item.product_id === product.product_id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, {
        product_id: product.product_id,
        name: product.product_name,
        unit_price_cents: product.sale_price_cents,
        unit_cost_cents: product.cost_price_cents,
        quantity: 1,
        current_stock: product.current_stock, // Store max stock for validation
        discount_cents: 0,
        discount_percent: 0,
      }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQuantity = item.quantity + delta
        if (newQuantity > item.current_stock) {
          alert('No hay más stock disponible para este producto.')
          return item
        }
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
      }
      return item
    }))
  }

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId))
  }

  const filteredProducts = products.filter(p => 
    p.current_stock > 0 && // Only show products with stock
    (p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())))
  )

  const subtotal = cart.reduce((acc, item) => acc + (item.unit_price_cents * item.quantity), 0)
  const total = subtotal // Add discounts/taxes here later

  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (cart.length === 0 || !defaultWarehouse) return
    if (paymentMethod === 'account' && !selectedCustomer) {
      alert('Debe seleccionar un cliente para cobrar con Cuenta Corriente.')
      return
    }

    setIsProcessing(true)

    try {
      // Usar un session temporal si no hay (en un MVP) o null
      const res = await createSale(orgId, {
        customer_id: selectedCustomer || undefined,
        seller_id: userId,
        warehouse_id: defaultWarehouse.id,
        discount_cents: 0,
        discount_percent: 0,
        notes: '',
        items: cart,
        payments: [
          {
            payment_method: paymentMethod === 'account' ? 'other' : paymentMethod,
            amount_cents: total,
            reference: paymentMethod === 'account' ? 'cuenta_corriente' : 'POS'
          }
        ]
      })

      if (res.success) {
        alert('Venta registrada con éxito')
        setCart([])
        setSelectedCustomer(null)
        setSearch('')
        router.refresh()
      } else {
        alert('Error al registrar la venta: ' + res.error)
      }
    } catch (e) {
      alert('Error inesperado')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* LEFT: Products Grid */}
      <div className="flex-1 flex flex-col bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar productos por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600 text-lg"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <button
                key={p.product_id}
                onClick={() => addToCart(p)}
                className="bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/50 rounded-xl p-4 text-left transition-colors flex flex-col h-full"
              >
                <div className="flex-1">
                  <h3 className="text-white font-medium line-clamp-2 leading-tight">{p.product_name}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{p.sku || 'Sin SKU'}</p>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-violet-400 font-bold text-lg">{formatCurrency(p.sale_price_cents)}</p>
                  <span className="text-xs text-neutral-400 bg-neutral-900 px-2 py-1 rounded">
                    Stock: {p.current_stock}
                  </span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-500">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart / Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/80">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-violet-400" />
            Venta Actual
          </h2>
        </div>

        {/* Customer Select */}
        <div className="p-4 border-b border-neutral-800/50">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value || null)}
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white appearance-none focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
            >
              <option value="">Consumidor Final</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-6 text-center">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p>El carrito está vacío</p>
              <p className="text-xs mt-1">Seleccioná productos de la lista para agregarlos.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.product_id} className="bg-neutral-800/30 border border-neutral-700/50 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-medium text-sm leading-tight pr-4">{item.name}</p>
                    <button onClick={() => removeItem(item.product_id)} className="text-neutral-500 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-violet-400 font-bold">{formatCurrency(item.unit_price_cents * item.quantity)}</p>
                    <div className="flex items-center gap-3 bg-neutral-900 rounded-lg p-1">
                      <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-white text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-neutral-800 rounded-md text-neutral-400 hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-900/60">
          <p className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Método de pago</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                paymentMethod === 'cash' 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                  : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <Banknote className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium text-center">Efectivo</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                paymentMethod === 'card' 
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                  : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <CreditCard className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium text-center">Tarjeta</span>
            </button>
            <button
              onClick={() => setPaymentMethod('transfer')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                paymentMethod === 'transfer' 
                  ? 'bg-violet-500/10 border-violet-500/50 text-violet-400' 
                  : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <ArrowRight className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium text-center">Transfer.</span>
            </button>
            <button
              onClick={() => setPaymentMethod('account')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                paymentMethod === 'account' 
                  ? 'bg-orange-500/10 border-orange-500/50 text-orange-400' 
                  : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <User className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium text-center leading-tight">Cta. Cte.</span>
            </button>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="p-4 bg-neutral-900/80 border-t border-neutral-800/80">
          <div className="flex justify-between items-end mb-4">
            <span className="text-neutral-400">Total a cobrar:</span>
            <span className="text-3xl font-bold text-white tracking-tight">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:shadow-none flex items-center justify-center gap-2 text-lg"
          >
            {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
            {!isProcessing && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
