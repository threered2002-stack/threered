'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronDown,
  Crown,
  ShoppingCart,
  Package,
  KeyRound
} from 'lucide-react'
import {
  getOrganizationTeam,
  getOrganizationRoles,
  getOrganizationInvitations,
  updateMemberRole,
  removeTeamMember,
  createOrganizationInvitation,
  cancelOrganizationInvitation,
  type TeamMember
} from '@/modules/core/actions/team'
import type { Role, OrganizationInvitation } from '@/lib/types'

interface TeamSettingsProps {
  organizationId: string
  currentUserId?: string
}

export function TeamSettings({ organizationId, currentUserId }: TeamSettingsProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modal / Form state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    loadTeamData()
  }, [organizationId])

  async function loadTeamData() {
    setIsLoading(true)
    try {
      const [membersData, rolesData, invitationsData] = await Promise.all([
        getOrganizationTeam(organizationId),
        getOrganizationRoles(organizationId),
        getOrganizationInvitations(organizationId),
      ])
      setMembers(membersData)
      setRoles(rolesData)
      setInvitations(invitationsData)

      // Por defecto seleccionar rol de vendedor o admin si existe
      if (rolesData.length > 0 && !selectedRoleId) {
        const defaultRole = rolesData.find(r => r.name === 'seller') || rolesData[0]
        setSelectedRoleId(defaultRole.id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRoleChange(membershipId: string, newRoleId: string) {
    setActionLoading(membershipId)
    setFeedback(null)
    const res = await updateMemberRole(membershipId, newRoleId)
    if (res.success) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === membershipId
            ? { ...m, role_id: newRoleId, role: roles.find((r) => r.id === newRoleId) }
            : m
        )
      )
      setFeedback({ type: 'success', message: 'Rol de usuario actualizado correctamente.' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al actualizar el rol.' })
    }
    setActionLoading(null)
  }

  async function handleRemoveMember(membershipId: string, memberName: string) {
    if (!confirm(`¿Estás seguro de desvincular a ${memberName} de la organización?`)) {
      return
    }

    setActionLoading(membershipId)
    setFeedback(null)
    const res = await removeTeamMember(membershipId)
    if (res.success) {
      setMembers((prev) => prev.filter((m) => m.id !== membershipId))
      setFeedback({ type: 'success', message: 'Miembro desvinculado con éxito.' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'No se pudo desvincular al miembro.' })
    }
    setActionLoading(null)
  }

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail || !selectedRoleId) return

    setActionLoading('invite')
    setFeedback(null)

    const res = await createOrganizationInvitation(organizationId, inviteEmail, selectedRoleId)
    if (res.success) {
      setInviteEmail('')
      setIsInviteOpen(false)
      setFeedback({ type: 'success', message: `Invitación enviada exitosamente a ${inviteEmail}.` })
      // Recargar invitaciones
      const invs = await getOrganizationInvitations(organizationId)
      setInvitations(invs)
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al enviar la invitación.' })
    }
    setActionLoading(null)
  }

  async function handleCancelInvitation(invitationId: string) {
    setActionLoading(invitationId)
    setFeedback(null)
    const res = await cancelOrganizationInvitation(invitationId)
    if (res.success) {
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
      setFeedback({ type: 'success', message: 'Invitación cancelada.' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'No se pudo cancelar la invitación.' })
    }
    setActionLoading(null)
  }

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName?.toLowerCase()) {
      case 'owner':
      case 'dueño':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'admin':
      case 'administrador':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'seller':
      case 'vendedor':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'warehouse':
      case 'depósito':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700'
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-neutral-400">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
        <p className="text-sm">Cargando equipo y roles...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerta de feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header y métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Miembros Activos</p>
              <h3 className="text-xl font-bold text-white">{members.length}</h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Roles Disponibles</p>
              <h3 className="text-xl font-bold text-white">{roles.length}</h3>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Invitaciones Pendientes</p>
              <h3 className="text-xl font-bold text-white">{invitations.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de acción principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
        <div>
          <h2 className="text-lg font-semibold text-white">Miembros del Negocio</h2>
          <p className="text-sm text-neutral-400">
            Administra los usuarios con acceso a tu sucursal y asigna sus responsabilidades.
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-600/20 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Invitar Miembro
        </button>
      </div>

      {/* Modal / Formulario de invitación */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-white font-semibold">
                <UserPlus className="h-5 w-5 text-purple-400" />
                Invitar nuevo colaborador
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@negocio.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Rol y Permisos
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display_name} {r.name === 'owner' ? '(Control total)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-neutral-400">
                  {roles.find(r => r.id === selectedRoleId)?.name === 'seller' && 'Acceso limitado a ventas, POS y clientes.'}
                  {roles.find(r => r.id === selectedRoleId)?.name === 'warehouse' && 'Acceso a inventario, stock y recepción de compras.'}
                  {roles.find(r => r.id === selectedRoleId)?.name === 'admin' && 'Acceso a configuración, finanzas, stock y operaciones.'}
                  {roles.find(r => r.id === selectedRoleId)?.name === 'owner' && 'Propietario de la organización con permisos absolutos.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-300 hover:bg-neutral-800 text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'invite' || !inviteEmail}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all disabled:opacity-50"
                >
                  {actionLoading === 'invite' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Enviar Invitación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Miembros */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400 tracking-wider uppercase">
            Equipo ({members.length})
          </span>
        </div>

        <div className="divide-y divide-neutral-800/60">
          {members.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-sm">
              No se encontraron miembros activos.
            </div>
          ) : (
            members.map((member) => {
              const fullName = member.profile?.full_name || 'Usuario'
              const email = member.profile?.email || 'Sin correo asociado'
              const initials = fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              const isOwnerRole = member.role?.name === 'owner'
              const isCurrent = member.user_id === currentUserId
              const isLoadingThis = actionLoading === member.id

              return (
                <div
                  key={member.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-inner">
                      {initials || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{fullName}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700">
                            Tú
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400">{email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Selector de Rol */}
                    <div className="relative">
                      {isOwnerRole ? (
                        <div
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${getRoleBadgeColor(
                            'owner'
                          )}`}
                        >
                          <Shield className="h-3.5 w-3.5" />
                          {member.role?.display_name || 'Dueño'}
                        </div>
                      ) : (
                        <select
                          disabled={isLoadingThis}
                          value={member.role_id}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.display_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Botón eliminar (no disponible para Dueño) */}
                    {!isOwnerRole && (
                      <button
                        title="Desvincular del negocio"
                        disabled={isLoadingThis}
                        onClick={() => handleRemoveMember(member.id, fullName)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      >
                        {isLoadingThis ? (
                          <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Invitaciones Pendientes */}
      {invitations.length > 0 && (
        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-neutral-300 tracking-wider uppercase">
                Invitaciones Pendientes ({invitations.length})
              </span>
            </div>
          </div>

          <div className="divide-y divide-neutral-800/60">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">{inv.email}</span>
                    <span className="text-xs text-neutral-500">
                      Rol: {inv.role?.display_name || 'Asignado'} • Vence en 7 días
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Pendiente
                  </span>
                  <button
                    disabled={actionLoading === inv.id}
                    onClick={() => handleCancelInvitation(inv.id)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === inv.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Cancelar'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Niveles de Acceso y Roles */}
      <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Niveles de Acceso y Roles del Sistema</h3>
        </div>
        <p className="text-xs text-neutral-400">
          Cada rol determina qué módulos y operaciones tiene permitidas cada usuario dentro de la sucursal:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Dueño */}
          <div className="p-4 rounded-xl bg-neutral-800/40 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Crown className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-amber-300">Dueño (Owner)</h4>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 ml-auto">
                Acceso Total (*)
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Control absoluto y sin restricciones. Puede gestionar integrantes, asignar y cambiar roles, alterar la configuración general, facturación y eliminar registros críticos.
            </p>
          </div>

          {/* Administrador */}
          <div className="p-4 rounded-xl bg-neutral-800/40 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Shield className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-purple-300">Administrador (Admin)</h4>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 ml-auto">
                Operaciones + Finanzas
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Gestión operativa completa del negocio. Administra productos, inventario, precios, proveedores, compras, finanzas, cuentas bancarias, clientes y colabora en la invitación de usuarios.
            </p>
          </div>

          {/* Vendedor */}
          <div className="p-4 rounded-xl bg-neutral-800/40 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-emerald-300">Vendedor (Seller)</h4>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 ml-auto">
                Punto de Venta
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Enfocado en la atención de mostrador y cobro. Acceso al Punto de Venta (POS), carrito, cobro de ventas, apertura y cierre de su caja personal, consulta de precios y registro de clientes.
            </p>
          </div>

          {/* Depósito */}
          <div className="p-4 rounded-xl bg-neutral-800/40 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Package className="h-4 w-4" />
              </div>
              <h4 className="text-sm font-bold text-cyan-300">Depósito (Warehouse)</h4>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 ml-auto">
                Logística & Stock
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Destinado al personal de logística y bodega. Permite auditar inventario físico, registrar movimientos entre depósitos, ajustes de stock y recepcionar compras de proveedores.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
