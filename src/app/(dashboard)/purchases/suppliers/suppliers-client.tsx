'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Search, Mail, Phone, MapPin, Edit, Trash2, Loader2, User, AlertCircle, MessageSquare } from 'lucide-react'
import { SupplierModal } from './supplier-modal'
import { SupplierDrawer, WhatsAppIcon, InstagramIcon, FacebookIcon } from './supplier-drawer'
import { deleteSupplier } from '@/modules/purchases/actions/purchases'
import { useOrg } from '@/providers/org-provider'
import { useToast } from '@/providers/toast-provider'

interface SuppliersClientProps {
  initialSuppliers: any[]
}

export function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
  const router = useRouter()
  const { currentOrg } = useOrg()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null)
  const [drawerSupplier, setDrawerSupplier] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [supplierToDelete, setSupplierToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleOpenNew = () => {
    setEditingSupplier(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (supplier: any) => {
    setEditingSupplier(supplier)
    setIsModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!currentOrg || !supplierToDelete) return

    const supplierName = supplierToDelete.trade_name || supplierToDelete.name
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await deleteSupplier(supplierToDelete.id, currentOrg.id)
      if (res.success) {
        setSupplierToDelete(null)
        toast.success(`El proveedor "${supplierName}" fue eliminado correctamente.`, 'Proveedor eliminado')
        router.refresh()
      } else {
        setDeleteError(res.error || 'Error al eliminar el proveedor')
        toast.error(res.error || 'No se pudo eliminar el proveedor', 'Error al eliminar')
      }
    } catch {
      setDeleteError('Error inesperado al eliminar el proveedor')
      toast.error('Ocurrió un error inesperado al eliminar.', 'Error')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredSuppliers = initialSuppliers.filter((s) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.trade_name && s.trade_name.toLowerCase().includes(term)) ||
      (s.tax_id && s.tax_id.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.contact_name && s.contact_name.toLowerCase().includes(term)) ||
      (s.city && s.city.toLowerCase().includes(term))
    )
  })

  return (
    <div className="space-y-6">
      <SupplierModal
        supplier={editingSupplier}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-red-400" />
            Proveedores
          </h1>
          <p className="text-neutral-400 mt-1">Directorio de empresas que abastecen tu inventario.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20 w-fit cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar proveedor por nombre, CUIT, contacto o ciudad..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all placeholder:text-neutral-600"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => {
          const meta = supplier.metadata || {}
          const rawWhatsapp = meta.whatsapp || supplier.contact_phone || supplier.phone || ''
          const cleanPhone = rawWhatsapp.replace(/[^0-9]/g, '')
          const instagram = (meta.instagram || '').replace('@', '').trim()
          const rawFacebook = meta.facebook || ''
          let cleanFb = rawFacebook.trim()
          if (cleanFb.startsWith('http://') || cleanFb.startsWith('https://')) {
            try {
              const u = new URL(cleanFb)
              cleanFb = u.pathname.replace(/^\//, '').replace(/\/$/, '')
            } catch {}
          }
          cleanFb = cleanFb.replace('@', '').replace(/^facebook\.com\//, '').trim()
          const fbUrl = cleanFb ? `https://m.me/${cleanFb}` : (rawFacebook.startsWith('http') ? rawFacebook : '')
          const notesCount = Array.isArray(meta.notes_log) ? meta.notes_log.length : 0

          let whatsappUrl = ''
          if (cleanPhone) {
            let finalPhone = cleanPhone
            if (finalPhone.length === 10 && !finalPhone.startsWith('54')) finalPhone = `549${finalPhone}`
            whatsappUrl = `https://wa.me/${finalPhone}`
          }

          return (
            <div
              key={supplier.id}
              className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 hover:bg-neutral-900/70 hover:border-neutral-700/80 transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Avatar, Name & Action buttons */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700/40 flex items-center justify-center text-white font-bold text-base group-hover:bg-red-500/20 group-hover:text-red-400 group-hover:border-red-500/30 transition-all shrink-0">
                      {supplier.trade_name ? supplier.trade_name.charAt(0).toUpperCase() : supplier.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-base leading-tight">
                        {supplier.trade_name || supplier.name}
                      </h3>
                      {supplier.trade_name && (
                        <p className="text-xs text-neutral-400 mt-0.5">{supplier.name}</p>
                      )}
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {supplier.tax_id ? `CUIT: ${supplier.tax_id}` : 'Sin CUIT'}
                      </p>
                    </div>
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(supplier)}
                      title="Editar proveedor"
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError(null)
                        setSupplierToDelete(supplier)
                      }}
                      title="Eliminar proveedor"
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm border-t border-neutral-800/60 pt-3">
                  {supplier.contact_name && (
                    <div className="flex items-center gap-2 text-neutral-300">
                      <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">{supplier.contact_name}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {rawWhatsapp && (
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{rawWhatsapp}</span>
                      {supplier.phone && supplier.phone !== rawWhatsapp && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Celular</span>
                      )}
                    </div>
                  )}
                  {supplier.phone && supplier.phone !== rawWhatsapp && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">{supplier.phone}</span>
                      {rawWhatsapp && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50">Fijo</span>
                      )}
                    </div>
                  )}
                  {(supplier.address || supplier.city) && (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="truncate">
                        {supplier.city ? `${supplier.city}${supplier.address ? `, ${supplier.address}` : ''}` : supplier.address}
                      </span>
                    </div>
                  )}
                  {supplier.notes && (
                    <p className="text-xs text-neutral-500 italic line-clamp-2 mt-2 pt-2 border-t border-neutral-800/40">
                      {supplier.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Bottom: Quick Communications & Drawer Hub */}
              <div className="pt-3.5 mt-3.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`Abrir WhatsApp (${rawWhatsapp})`}
                      className="p-2 text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDrawerSupplier(supplier)}
                      title="Configurar WhatsApp"
                      className="p-2 text-neutral-600 hover:text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4 opacity-40" />
                    </button>
                  )}

                  {instagram ? (
                    <a
                      href={`https://ig.me/m/${instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`Abrir Instagram (@${instagram})`}
                      className="p-2 text-pink-400 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    >
                      <InstagramIcon className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDrawerSupplier(supplier)}
                      title="Configurar Instagram"
                      className="p-2 text-neutral-600 hover:text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    >
                      <InstagramIcon className="w-4 h-4 opacity-40" />
                    </button>
                  )}

                  {fbUrl ? (
                    <a
                      href={fbUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={`Abrir Facebook / Messenger (${cleanFb || rawFacebook})`}
                      className="p-2 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    >
                      <FacebookIcon className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDrawerSupplier(supplier)}
                      title="Configurar Facebook"
                      className="p-2 text-neutral-600 hover:text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    >
                      <FacebookIcon className="w-4 h-4 opacity-40" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerSupplier(supplier)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/80 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60 rounded-xl text-xs font-medium transition-all cursor-pointer group/btn"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400 group-hover/btn:text-emerald-400 transition-colors" />
                  <span>Chat & Bitácora</span>
                  {notesCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                      {notesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )
        })}

        {/* Empty state: No suppliers registered */}
        {initialSuppliers.length === 0 && (
          <div className="col-span-full bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-12 text-center">
            <div className="flex flex-col items-center justify-center text-neutral-500">
              <Building2 className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-white mb-1">No tenés proveedores registrados</p>
              <p className="text-sm mb-4">Agregá tu primer proveedor para asociarlo a tus órdenes de compra.</p>
              <button
                onClick={handleOpenNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Crear Proveedor
              </button>
            </div>
          </div>
        )}

        {/* Empty state: Search filter yielded 0 */}
        {initialSuppliers.length > 0 && filteredSuppliers.length === 0 && (
          <div className="col-span-full bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-12 text-center">
            <p className="text-neutral-400 font-medium">No se encontraron proveedores que coincidan con "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      {supplierToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !isDeleting && setSupplierToDelete(null)}
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
                <h3 className="text-lg font-bold text-white">¿Eliminar proveedor?</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  ¿Estás seguro de que querés eliminar al proveedor{' '}
                  <strong className="text-white font-semibold">
                    "{supplierToDelete.trade_name || supplierToDelete.name}"
                  </strong>
                  ?
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  Esta acción no se puede deshacer. El proveedor ya no aparecerá en el listado ni en compras futuras.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer de Comunicación y Bitácora */}
      <SupplierDrawer
        supplier={initialSuppliers.find(s => s.id === drawerSupplier?.id) || drawerSupplier}
        isOpen={!!drawerSupplier}
        onClose={() => setDrawerSupplier(null)}
        onEditSupplier={(s) => {
          setDrawerSupplier(null)
          handleOpenEdit(s)
        }}
      />
    </div>
  )
}
