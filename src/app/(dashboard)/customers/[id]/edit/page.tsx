'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrg } from '@/providers/org-provider'
import { ModuleGuard } from '@/components/layout/module-guard'
import { updateCustomer, getCustomerById } from '@/modules/customers/actions/customers'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, User, Mail, Phone, MapPin, CreditCard, AlignLeft } from 'lucide-react'
import { DOCUMENT_TYPES } from '@/lib/constants'

export default function EditCustomerPage() {
  return (
    <ModuleGuard module="customers">
      <EditCustomerContent />
    </ModuleGuard>
  )
}

function EditCustomerContent() {
  const { currentOrg } = useOrg()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    document_type: 'dni',
    document_number: '',
    address: '',
    city: '',
    notes: '',
  })

  useEffect(() => {
    if (currentOrg) {
      getCustomerById(id, currentOrg.id).then(data => {
        if (data) {
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone: data.phone || '',
            document_type: data.document_type || 'dni',
            document_number: data.document_number || '',
            address: data.address || '',
            city: data.city || '',
            notes: data.notes || '',
          })
        }
        setIsFetching(false)
      })
    }
  }, [currentOrg, id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg) return

    setIsLoading(true)
    setError(null)

    const { error } = await updateCustomer(id, currentOrg.id, formData)

    if (error) {
      setError(error)
      setIsLoading(false)
    } else {
      router.push('/customers')
      router.refresh()
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/customers"
          className="p-2 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Cliente</h1>
          <p className="text-neutral-400 mt-1">
            Modificá los datos del cliente.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info Personal */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-violet-400" />
              Datos Personales
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Nombre *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600"
                  placeholder="Ej: Juan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Apellido</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600"
                  placeholder="Ej: Pérez"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
                  Tipo Doc.
                </label>
                <select
                  name="document_type"
                  value={formData.document_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                >
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-violet-400" />
                  Número
                </label>
                <input
                  type="text"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600"
                  placeholder="Sin puntos ni guiones"
                />
              </div>
            </div>
          </div>

          {/* Contacto & Ubicación */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-violet-400" />
              Contacto y Ubicación
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-violet-400" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600"
                  placeholder="juan@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-violet-400" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600"
                  placeholder="Cod. de área + número"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600"
                  placeholder="Calle 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">Ciudad</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all placeholder:text-neutral-600"
                  placeholder="Ciudad o Barrio"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notas Internas */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
          <label className="block text-sm font-medium text-neutral-300 mb-1.5 flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-violet-400" />
            Notas Internas (Opcional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all resize-none placeholder:text-neutral-600"
            placeholder="Preferencias del cliente, horarios de entrega, etc..."
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
          <Link
            href="/customers"
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading || !formData.first_name}
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
