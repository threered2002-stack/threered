'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Minus, Trash2, User, CreditCard, Banknote, ShoppingCart, ArrowRight, Package, UserPlus, Check, X, Phone, Mail, FileText, ChevronDown, Loader2 } from 'lucide-react'
import { createSale } from '@/modules/sales/actions/sales'
import { createCustomer } from '@/modules/customers/actions/customers'
import { useToast } from '@/providers/toast-provider'

interface POSClientProps {
  products: any[]
  customers: any[]
  warehouses: any[]
  userId: string
  orgId: string
}

export function POSClient({ products, customers: initialCustomers, warehouses, userId, orgId }: POSClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [customersList, setCustomersList] = useState<any[]>(initialCustomers)
  const [cart, setCart] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'account'>('cash')

  // Customer search & dropdown state
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const customerDropdownRef = useRef<HTMLDivElement>(null)

  // Quick Customer Create Modal state
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    document_number: '',
    notes: ''
  })
  const [customerCreateError, setCustomerCreateError] = useState<string | null>(null)

  useEffect(() => {
    setCustomersList(initialCustomers)
  }, [initialCustomers])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const defaultWarehouse = warehouses.find(w => w.is_default) || warehouses[0]

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(cents / 100)
  }

  const selectedCustomerObj = customersList.find(c => c.id === selectedCustomer)

  const filteredCustomers = customersList.filter(c => {
    if (!customerSearchQuery.trim()) return true
    const q = customerSearchQuery.toLowerCase()
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
    const doc = (c.document_number || '').toLowerCase()
    const phone = (c.phone || '').toLowerCase()
    const email = (c.email || '').toLowerCase()
    return fullName.includes(q) || doc.includes(q) || phone.includes(q) || email.includes(q)
  })

  const handleOpenQuickCustomer = (initialName: string = '') => {
    const parts = initialName.trim().split(' ')
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''
    setNewCustomerForm({
      first_name: firstName,
      last_name: lastName,
      phone: '',
      email: '',
      document_number: '',
      notes: ''
    })
    setCustomerCreateError(null)
    setIsQuickCustomerModalOpen(true)
    setIsCustomerDropdownOpen(false)
  }

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerForm.first_name.trim()) {
      setCustomerCreateError('El nombre es obligatorio')
      return
    }

    setIsCreatingCustomer(true)
    setCustomerCreateError(null)

    try {
      const res = await createCustomer(orgId, {
        first_name: newCustomerForm.first_name.trim(),
        last_name: newCustomerForm.last_name.trim() || undefined,
        phone: newCustomerForm.phone.trim() || undefined,
        email: newCustomerForm.email.trim() || undefined,
        document_number: newCustomerForm.document_number.trim() || undefined,
        notes: newCustomerForm.notes.trim() || undefined,
      })

      if (res.error) {
        setCustomerCreateError(res.error)
      } else if (res.data) {
        const created = res.data
        setCustomersList(prev => [created, ...prev])
        setSelectedCustomer(created.id)
        setIsQuickCustomerModalOpen(false)
        setCustomerSearchQuery('')
        toast.success(`Cliente ${created.first_name} ${created.last_name || ''} creado y seleccionado.`, 'Cliente registrado')
      }
    } catch {
      setCustomerCreateError('Error inesperado al crear el cliente')
    } finally {
      setIsCreatingCustomer(false)
    }
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
    p.warehouse_id === defaultWarehouse?.id && // Filter by active warehouse
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
      toast.error('Debe seleccionar un cliente para cobrar con Cuenta Corriente.', 'Cliente requerido')
      return
    }

    setIsProcessing(true)

    try {
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
        toast.success(`Venta registrada exitosamente por ${formatCurrency(total)}.`, 'Venta completada')
        setCart([])
        setSelectedCustomer(null)
        setSearch('')
        router.refresh()
      } else {
        toast.error('Error al registrar la venta: ' + res.error, 'Error de venta')
      }
    } catch {
      toast.error('Ocurrió un error inesperado al procesar la venta.', 'Error')
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
              className="w-full pl-10 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all placeholder:text-neutral-600 text-lg"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <button
                key={p.product_id}
                onClick={() => addToCart(p)}
                className="group relative bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-left transition-all hover:bg-neutral-800 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-1 flex flex-col h-full overflow-hidden"
              >
                {/* Plus icon on hover */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 bg-red-500/20 text-red-400 p-1.5 rounded-lg border border-red-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mb-4 border border-neutral-700/50 group-hover:scale-110 transition-transform duration-300 group-hover:bg-red-500/10 group-hover:border-red-500/20">
                  <Package className="w-6 h-6 text-neutral-400 group-hover:text-red-400 transition-colors" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-white font-medium line-clamp-2 leading-tight group-hover:text-red-50 transition-colors">{p.product_name}</h3>
                  <p className="text-xs text-neutral-500 mt-1.5 font-mono">{p.sku || 'Sin SKU'}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-neutral-800/50 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Precio</p>
                    <p className="text-red-400 font-bold text-lg leading-none">{formatCurrency(p.sale_price_cents)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Stock</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      p.current_stock > 10 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {p.current_stock}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/20 rounded-2xl border border-neutral-800/50 border-dashed">
                <Package className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-xl font-medium text-white/70">No se encontraron productos</p>
                <p className="text-sm mt-2 max-w-sm text-center">Revisá la búsqueda o asegurate de que el producto tenga stock disponible en este depósito.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart / Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-neutral-900/40 border border-neutral-800/80 rounded-2xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/80">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-red-400" />
            Venta Actual
          </h2>
        </div>

        {/* Customer Search & Select Combobox */}
        <div className="p-4 border-b border-neutral-800/60 bg-neutral-900/40 relative" ref={customerDropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-red-400" />
              Cliente
            </span>
            <button
              type="button"
              onClick={() => handleOpenQuickCustomer(customerSearchQuery)}
              className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer group"
              title="Registrar nuevo cliente"
            >
              <UserPlus className="w-3 h-3 group-hover:scale-110 transition-transform" />
              <span>+ Nuevo</span>
            </button>
          </div>

          {/* Trigger button or current selected card */}
          {selectedCustomerObj ? (
            <div className="flex items-center justify-between p-2.5 bg-neutral-800/80 border border-neutral-700/80 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">
                  {(selectedCustomerObj.first_name || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate leading-tight">
                    {selectedCustomerObj.full_name || `${selectedCustomerObj.first_name || ''} ${selectedCustomerObj.last_name || ''}`.trim()}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {selectedCustomerObj.phone || (selectedCustomerObj.document_number ? `DNI: ${selectedCustomerObj.document_number}` : selectedCustomerObj.email || 'Registrado')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700/50 rounded-lg transition-colors cursor-pointer"
                  title="Cambiar cliente"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Quitar cliente (Consumidor Final)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsCustomerDropdownOpen(true)}
              className="flex items-center justify-between px-3 py-2 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 text-neutral-500 group-hover:text-neutral-400 transition-colors shrink-0" />
                <span className="text-xs text-neutral-300 font-medium truncate">Consumidor Final</span>
              </div>
              <span className="text-[11px] text-neutral-500 group-hover:text-neutral-400 flex items-center gap-1">
                Buscar <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {/* Dropdown Menu with Live Search */}
          {isCustomerDropdownOpen && (
            <div className="absolute left-4 right-4 top-full mt-1.5 bg-neutral-900 border border-neutral-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 border-b border-neutral-800 bg-neutral-950/70">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscar por nombre, DNI o teléfono..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                {/* Consumidor Final default option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null)
                    setIsCustomerDropdownOpen(false)
                    setCustomerSearchQuery('')
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                    selectedCustomer === null
                      ? 'bg-red-500/15 text-red-300 font-medium'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Consumidor Final (Sin asignar)</span>
                  </div>
                  {selectedCustomer === null && <Check className="w-3.5 h-3.5 text-red-400" />}
                </button>

                {/* Filtered Customer items */}
                {filteredCustomers.map((c) => {
                  const name = c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Cliente'
                  const isSelected = selectedCustomer === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(c.id)
                        setIsCustomerDropdownOpen(false)
                        setCustomerSearchQuery('')
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-red-500/15 text-red-300 font-medium'
                          : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-white truncate">{name}</p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {c.phone ? `Tel: ${c.phone}` : (c.document_number ? `DNI: ${c.document_number}` : c.email || 'Sin datos adicionales')}
                        </p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                    </button>
                  )
                })}

                {filteredCustomers.length === 0 && customerSearchQuery.trim() !== '' && (
                  <div className="p-3 text-center">
                    <p className="text-xs text-neutral-400 mb-2">No se encontró "{customerSearchQuery}"</p>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickCustomer(customerSearchQuery)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Crear "{customerSearchQuery}"
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
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
                    <p className="text-red-400 font-bold">{formatCurrency(item.unit_price_cents * item.quantity)}</p>
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
                  ? 'bg-red-500/10 border-red-500/50 text-red-400' 
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
            className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:shadow-none flex items-center justify-center gap-2 text-lg cursor-pointer"
          >
            {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
            {!isProcessing && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Quick Customer Creation Modal */}
      {isQuickCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nuevo Cliente Rápido</h3>
                  <p className="text-[11px] text-neutral-400">Creá el cliente y continualo en la venta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCustomerModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCustomerSubmit} className="p-6 space-y-4">
              {customerCreateError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  {customerCreateError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej. Juan"
                    value={newCustomerForm.first_name}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800/70 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Pérez"
                    value={newCustomerForm.last_name}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800/70 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-neutral-500" />
                    Teléfono / Celular
                  </label>
                  <input
                    type="tel"
                    placeholder="11 2345-6789"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800/70 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-neutral-500" />
                    DNI / CUIT
                  </label>
                  <input
                    type="text"
                    placeholder="35123456"
                    value={newCustomerForm.document_number}
                    onChange={(e) => setNewCustomerForm(prev => ({ ...prev, document_number: e.target.value }))}
                    className="w-full px-3 py-2 bg-neutral-800/70 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-neutral-500" />
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="juan@email.com"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-neutral-800/70 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickCustomerModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  {isCreatingCustomer ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Guardar y Seleccionar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
