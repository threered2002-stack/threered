'use client'

import { useState } from 'react'
import { X, Send, Plus, Trash2, Globe, FileText, Phone, Mail, User, Building2, Calendar, MessageSquare, ExternalLink, Loader2 } from 'lucide-react'
import { addSupplierNoteLog, deleteSupplierNoteLog } from '@/modules/purchases/actions/purchases'
import { useOrg } from '@/providers/org-provider'
import { useToast } from '@/providers/toast-provider'
import { useRouter } from 'next/navigation'

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

export function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

export function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

interface SupplierDrawerProps {
  supplier: any | null
  isOpen: boolean
  onClose: () => void
  onEditSupplier?: (supplier: any) => void
}

export function SupplierDrawer({ supplier, isOpen, onClose, onEditSupplier }: SupplierDrawerProps) {
  const { currentOrg } = useOrg()
  const { toast } = useToast()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'chat' | 'log'>('chat')
  const [newNoteText, setNewNoteText] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

  // Mensaje de WhatsApp
  const [selectedTemplate, setSelectedTemplate] = useState<'catalog' | 'stock' | 'shipping' | 'custom'>('catalog')
  const [customMessage, setCustomMessage] = useState('')

  if (!isOpen || !supplier) return null

  const meta = supplier.metadata || {}
  const rawWhatsapp = meta.whatsapp || supplier.contact_phone || supplier.phone || ''
  const cleanPhone = rawWhatsapp.replace(/[^0-9]/g, '')
  const instagram = (meta.instagram || '').replace('@', '').trim()
  const rawFacebook = meta.facebook || ''
  let cleanFacebookHandle = rawFacebook.trim()
  if (cleanFacebookHandle.startsWith('http://') || cleanFacebookHandle.startsWith('https://')) {
    try {
      const u = new URL(cleanFacebookHandle)
      cleanFacebookHandle = u.pathname.replace(/^\//, '').replace(/\/$/, '')
    } catch {}
  }
  cleanFacebookHandle = cleanFacebookHandle.replace('@', '').replace(/^facebook\.com\//, '').trim()
  const facebookProfileUrl = rawFacebook.startsWith('http') ? rawFacebook : `https://facebook.com/${cleanFacebookHandle}`
  const facebookMessengerUrl = `https://m.me/${cleanFacebookHandle}`
  const website = meta.website || ''
  const catalogUrl = meta.catalog_url || ''
  const notesLog: Array<any> = Array.isArray(meta.notes_log) ? meta.notes_log : []

  const supplierName = supplier.trade_name || supplier.name
  const orgName = currentOrg?.name || 'nuestro negocio'

  // Plantillas de WhatsApp
  const templates = {
    catalog: `Hola ${supplier.contact_name ? supplier.contact_name : supplierName}, te escribo de ${orgName}. ¿Podrías enviarnos la lista de precios o catálogo actualizado? ¡Muchas gracias!`,
    stock: `Hola ${supplier.contact_name ? supplier.contact_name : supplierName}, te escribo de ${orgName}. Quería consultarte si tienen disponibilidad de stock para realizar un pedido.`,
    shipping: `Hola ${supplier.contact_name ? supplier.contact_name : supplierName}, te consulto de ${orgName} sobre el estado de entrega de nuestro último pedido. ¿Tenés fecha estimada o seguimiento?`,
    custom: customMessage || `Hola ${supplierName}, te escribo de ${orgName}.`
  }

  const activeMessageText = selectedTemplate === 'custom' ? customMessage : templates[selectedTemplate]

  const handleOpenWhatsApp = () => {
    if (!cleanPhone) {
      toast.error('Este proveedor no tiene configurado un número de teléfono o WhatsApp', 'Sin número')
      return
    }

    let finalPhone = cleanPhone
    // Si es argentino sin código de país (ej. 1123456789), anteponer 549
    if (finalPhone.length === 10 && !finalPhone.startsWith('54')) {
      finalPhone = `549${finalPhone}`
    }

    const encoded = encodeURIComponent(activeMessageText)
    const url = `https://wa.me/${finalPhone}?text=${encoded}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleOpenInstagramDM = () => {
    if (!instagram) return
    window.open(`https://ig.me/m/${instagram}`, '_blank', 'noopener,noreferrer')
  }

  const handleOpenInstagramProfile = () => {
    if (!instagram) return
    window.open(`https://instagram.com/${instagram}`, '_blank', 'noopener,noreferrer')
  }

  const handleOpenFacebookProfile = () => {
    if (!cleanFacebookHandle && !rawFacebook) return
    window.open(facebookProfileUrl, '_blank', 'noopener,noreferrer')
  }

  const handleOpenFacebookMessenger = () => {
    if (!cleanFacebookHandle) {
      if (rawFacebook.startsWith('http')) {
        window.open(rawFacebook, '_blank', 'noopener,noreferrer')
      }
      return
    }
    window.open(facebookMessengerUrl, '_blank', 'noopener,noreferrer')
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg || !newNoteText.trim()) return

    setIsSubmittingNote(true)
    try {
      const res = await addSupplierNoteLog(supplier.id, currentOrg.id, newNoteText.trim())
      if (res.success) {
        setNewNoteText('')
        toast.success('Acuerdo guardado en la bitácora', 'Bitácora actualizada')
        router.refresh()
      } else {
        toast.error(res.error || 'No se pudo guardar la nota', 'Error')
      }
    } catch {
      toast.error('Ocurrió un error inesperado al guardar la nota', 'Error')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!currentOrg) return

    setDeletingNoteId(noteId)
    try {
      const res = await deleteSupplierNoteLog(supplier.id, currentOrg.id, noteId)
      if (res.success) {
        toast.success('Nota eliminada de la bitácora', 'Nota borrada')
        router.refresh()
      } else {
        toast.error(res.error || 'No se pudo borrar la nota', 'Error')
      }
    } catch {
      toast.error('Ocurrió un error al borrar la nota', 'Error')
    } finally {
      setDeletingNoteId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-lg shrink-0">
                {supplier.trade_name ? supplier.trade_name.charAt(0).toUpperCase() : supplier.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">
                  {supplierName}
                </h2>
                {supplier.trade_name && (
                  <p className="text-xs text-neutral-400 truncate">{supplier.name}</p>
                )}
                <p className="text-xs text-neutral-500 mt-0.5">
                  {supplier.tax_id ? `CUIT: ${supplier.tax_id}` : 'Sin CUIT'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick contact tags */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
            {supplier.contact_name && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/80 text-neutral-300 border border-neutral-700/50">
                <User className="w-3 h-3 text-neutral-400" />
                {supplier.contact_name}
              </span>
            )}
            {rawWhatsapp && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <WhatsAppIcon className="w-3 h-3" />
                {rawWhatsapp}
              </span>
            )}
            {supplier.phone && supplier.phone !== rawWhatsapp && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/80 text-neutral-300 border border-neutral-700/50">
                <Phone className="w-3 h-3 text-neutral-400" />
                {supplier.phone} (Fijo)
              </span>
            )}
            {instagram && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 font-medium">
                <InstagramIcon className="w-3 h-3" />
                @{instagram}
              </span>
            )}
            {rawFacebook && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                <FacebookIcon className="w-3 h-3" />
                {cleanFacebookHandle ? `@${cleanFacebookHandle}` : 'Facebook'}
              </span>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 p-1 bg-neutral-950/60 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Chat & Redes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('log')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'log'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Bitácora de Acuerdos ({notesLog.length})
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'chat' && (
            <div className="space-y-6">
              {/* WhatsApp Module */}
              <div className="p-5 rounded-2xl bg-neutral-950/60 border border-emerald-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <WhatsAppIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">WhatsApp Directo</h3>
                      <p className="text-xs text-neutral-400">
                        {rawWhatsapp ? `Número: ${rawWhatsapp}` : 'No configurado'}
                      </p>
                    </div>
                  </div>

                  {rawWhatsapp && (
                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Abrir Chat
                    </button>
                  )}
                </div>

                {cleanPhone ? (
                  <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                    <label className="block text-xs font-medium text-neutral-300">
                      Plantillas de Mensaje Rápido:
                    </label>

                    {/* Template Pills */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate('catalog')}
                        className={`p-2 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                          selectedTemplate === 'catalog'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        📄 Pedir lista de precios
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTemplate('stock')}
                        className={`p-2 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                          selectedTemplate === 'stock'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        📦 Consultar stock
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTemplate('shipping')}
                        className={`p-2 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                          selectedTemplate === 'shipping'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        🚚 Estado de pedido
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate('custom')
                          if (!customMessage) setCustomMessage(templates.catalog)
                        }}
                        className={`p-2 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                          selectedTemplate === 'custom'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-medium'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        ✍️ Mensaje propio
                      </button>
                    </div>

                    {/* Preview / Edit Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Texto que se enviará:</span>
                        {selectedTemplate !== 'custom' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomMessage(templates[selectedTemplate])
                              setSelectedTemplate('custom')
                            }}
                            className="text-emerald-400 hover:underline cursor-pointer"
                          >
                            Editar texto
                          </button>
                        )}
                      </div>

                      {selectedTemplate === 'custom' ? (
                        <textarea
                          rows={3}
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          placeholder="Escribí tu mensaje aquí..."
                          className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none transition-all resize-none"
                        />
                      ) : (
                        <div className="p-3 bg-neutral-900/90 border border-neutral-800/80 rounded-xl text-xs text-neutral-300 leading-relaxed italic">
                          "{templates[selectedTemplate]}"
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      Enviar mensaje por WhatsApp
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3 text-xs text-neutral-500">
                    <p>No se encontró un número válido de WhatsApp.</p>
                    {onEditSupplier && (
                      <button
                        type="button"
                        onClick={() => onEditSupplier(supplier)}
                        className="mt-2 text-emerald-400 hover:underline font-medium cursor-pointer"
                      >
                        Configurar WhatsApp ahora
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Instagram Module */}
              <div className="p-5 rounded-2xl bg-neutral-950/60 border border-pink-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                      <InstagramIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Instagram Direct</h3>
                      <p className="text-xs text-neutral-400">
                        {instagram ? `@${instagram}` : 'No configurado'}
                      </p>
                    </div>
                  </div>

                  {instagram && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenInstagramDM}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-pink-600/20 transition-all cursor-pointer"
                        title="Abrir chat directo de Instagram"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Abrir DM
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenInstagramProfile}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                        title="Ver perfil de Instagram"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!instagram && (
                  <div className="text-center py-2 text-xs text-neutral-500">
                    <p>No hay usuario de Instagram asociado a este proveedor.</p>
                    {onEditSupplier && (
                      <button
                        type="button"
                        onClick={() => onEditSupplier(supplier)}
                        className="mt-2 text-pink-400 hover:underline font-medium cursor-pointer"
                      >
                        Agregar @usuario de Instagram
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Facebook & Messenger Module */}
              <div className="p-5 rounded-2xl bg-neutral-950/60 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <FacebookIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Facebook & Messenger</h3>
                      <p className="text-xs text-neutral-400">
                        {cleanFacebookHandle ? `@${cleanFacebookHandle}` : rawFacebook || 'No configurado'}
                      </p>
                    </div>
                  </div>

                  {(cleanFacebookHandle || rawFacebook) && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenFacebookMessenger}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                        title="Abrir chat de Messenger"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Messenger
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenFacebookProfile}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                        title="Ver página o perfil de Facebook"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!rawFacebook && (
                  <div className="text-center py-2 text-xs text-neutral-500">
                    <p>No hay página o usuario de Facebook asociado a este proveedor.</p>
                    {onEditSupplier && (
                      <button
                        type="button"
                        onClick={() => onEditSupplier(supplier)}
                        className="mt-2 text-blue-400 hover:underline font-medium cursor-pointer"
                      >
                        Agregar Facebook / Messenger
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Web & Catálogo Links */}
              {(website || catalogUrl) && (
                <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
                    Enlaces y Documentos Online
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {website && (
                      <a
                        href={website.startsWith('http') ? website : `https://${website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-all group"
                      >
                        <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="truncate flex-1">Sitio Web</span>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
                      </a>
                    )}
                    {catalogUrl && (
                      <a
                        href={catalogUrl.startsWith('http') ? catalogUrl : `https://${catalogUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-all group"
                      >
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate flex-1">Catálogo / Lista</span>
                        <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'log' && (
            <div className="space-y-6">
              {/* Form to add note */}
              <form onSubmit={handleAddNote} className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 space-y-3">
                <label className="block text-xs font-semibold text-white">
                  Registrar acuerdo o conversación:
                </label>
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Ej: 'Hablamos por WhatsApp con Juan. Nos prometió 10% de dto si compramos 10 cajas antes del viernes...'"
                  className="w-full p-3 bg-neutral-900 border border-neutral-700/80 rounded-xl text-white text-xs focus:border-red-500 focus:outline-none transition-all placeholder:text-neutral-600 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all cursor-pointer"
                  >
                    {isSubmittingNote ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Guardar en Bitácora
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Notes list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Historial de Notas ({notesLog.length})
                </h4>

                {notesLog.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-950/40 border border-neutral-800/60 rounded-2xl">
                    <p className="text-sm font-medium text-neutral-400">Sin acuerdos registrados</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Usá el formulario de arriba para asentar pedidos hablados, plazos o descuentos pactados por chat.
                    </p>
                  </div>
                ) : (
                  notesLog.map((note: any) => {
                    const isDeleting = deletingNoteId === note.id
                    const dateFormatted = note.created_at
                      ? new Intl.DateTimeFormat('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(note.created_at))
                      : 'Fecha desconocida'

                    return (
                      <div
                        key={note.id}
                        className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700/80 transition-all flex items-start justify-between gap-3 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-medium text-neutral-400">
                              {dateFormatted}
                            </span>
                            {note.author && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">
                                {note.author}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                            {note.text}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={isDeleting}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0 disabled:opacity-50"
                          title="Eliminar nota"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
