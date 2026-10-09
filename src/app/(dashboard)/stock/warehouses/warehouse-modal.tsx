import { useState, useEffect } from 'react'
import { useOrg } from '@/providers/org-provider'
import { createWarehouse, updateWarehouse } from '@/modules/stock/actions/stock'
import { X, Save, Loader2, Warehouse } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WarehouseModalProps {
  warehouse: any | null
  isOpen: boolean
  onClose: () => void
}

export function WarehouseModal({ warehouse, isOpen, onClose }: WarehouseModalProps) {
  const { currentOrg } = useOrg()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    is_default: false,
    is_active: true,
  })

  useEffect(() => {
    if (isOpen) {
      if (warehouse) {
        setFormData({
          name: warehouse.name || '',
          address: warehouse.address || '',
          is_default: warehouse.is_default || false,
          is_active: warehouse.is_active !== false,
        })
      } else {
        setFormData({
          name: '',
          address: '',
          is_default: false,
          is_active: true,
        })
      }
      setError(null)
    }
  }, [isOpen, warehouse])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return

    setIsLoading(true)
    setError(null)

    let res
    if (warehouse?.id) {
      res = await updateWarehouse(warehouse.id, currentOrg.id, formData)
    } else {
      res = await createWarehouse(currentOrg.id, formData)
    }

    if (res.error) {
      setError(res.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onClose()
      router.refresh()
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
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <Warehouse className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {warehouse ? 'Editar Depósito' : 'Nuevo Depósito'}
              </h2>
              <p className="text-neutral-400 text-sm mt-0.5">
                {warehouse ? 'Modificar datos de la ubicación' : 'Crear una nueva ubicación física'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Nombre *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Salón Principal"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Dirección</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ej: Av. Siempreviva 742"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:ring-2 focus:ring-violet-500/40 transition-all text-sm"
            />
          </div>

          <div className="pt-2 border-t border-neutral-800 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">Depósito Principal</p>
                <p className="text-xs text-neutral-500">Se usará por defecto para las ventas del POS.</p>
              </div>
            </label>

            {warehouse && (
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">Depósito Activo</p>
                  <p className="text-xs text-neutral-500">Permite registrar movimientos en este depósito.</p>
                </div>
              </label>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
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
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center gap-2 text-sm"
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
