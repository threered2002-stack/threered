'use client'

import { useState, useEffect } from 'react'
import { useOrg } from '@/providers/org-provider'
import { createSupplier, updateSupplier } from '@/modules/purchases/actions/purchases'
import { X, Save, Loader2, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SupplierModalProps {
  supplier: any | null
  isOpen: boolean
  onClose: () => void
}

export function SupplierModal({ supplier, isOpen, onClose }: SupplierModalProps) {
  const { currentOrg } = useOrg()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    trade_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    contact_name: '',
    contact_phone: '',
    notes: ''
  })

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData({
          name: supplier.name || '',
          trade_name: supplier.trade_name || '',
          tax_id: supplier.tax_id || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          city: supplier.city || '',
          province: supplier.province || '',
          contact_name: supplier.contact_name || '',
          contact_phone: supplier.contact_phone || '',
          notes: supplier.notes || ''
        })
      } else {
        setFormData({
          name: '',
          trade_name: '',
          tax_id: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          province: '',
          contact_name: '',
          contact_phone: '',
          notes: ''
        })
      }
      setError(null)
    }
  }, [isOpen, supplier])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return

    if (!formData.name.trim()) {
      setError('El nombre o razón social es obligatorio')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (supplier) {
        const res = await updateSupplier(supplier.id, currentOrg.id, formData)
        if (!res.success) {
          setError(res.error || 'Error al actualizar el proveedor')
          return
        }
      } else {
        const res = await createSupplier(currentOrg.id, formData)
        if (!res.success) {
          setError(res.error || 'Error al crear el proveedor')
          return
        }
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error inesperado al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <p className="text-xs text-neutral-400">
                {supplier ? 'Modificá los datos del proveedor seleccionado' : 'Ingresá los datos del nuevo proveedor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Row 1: Nombre & Nombre de Fantasía */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Razón Social / Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Distribuidora del Norte S.A."
                className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Nombre de Fantasía (Comercial)
              </label>
              <input
                type="text"
                name="trade_name"
                value={formData.trade_name}
                onChange={handleChange}
                placeholder="Ej. Bodega Norton"
                className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Row 2: CUIT & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                CUIT / Identificación Fiscal
              </label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                placeholder="Ej. 30-71234567-8"
                className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ventas@proveedor.com"
                className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Row 3: Teléfono & Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Teléfono
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+54 11 4455-6677"
                className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Persona de Contacto
              </label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                placeholder="Ej. Carlos Bianchi"
                className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Row 4: Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Av. Corrientes 1234"
                className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Ciudad / Provincia
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mendoza"
                className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Row 5: Notas */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Notas u Observaciones
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Días de entrega, condiciones comerciales, etc."
              className="w-full px-3.5 py-2.5 bg-neutral-800/60 border border-neutral-700/80 rounded-xl text-white text-sm focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-medium rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {supplier ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
