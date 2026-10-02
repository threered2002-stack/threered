import type { Role, Membership } from '@/lib/types'

/**
 * Verifica si un usuario tiene un permiso específico basándose en su membership y rol.
 */
export function hasPermission(membership: Membership, permission: string): boolean {
  const role = membership.role
  if (!role) return false

  // Wildcard: acceso total
  if (role.permissions.includes('*')) return true

  // Permiso exacto
  if (role.permissions.includes(permission)) return true

  // Permiso por módulo (ej: "stock.*" cubre "stock.read", "stock.write", etc.)
  const [module] = permission.split('.')
  if (role.permissions.includes(`${module}.*`)) return true

  return false
}

/**
 * Verifica si el rol tiene acceso a un módulo específico.
 */
export function canAccessModule(membership: Membership, moduleSlug: string): boolean {
  return hasPermission(membership, `${moduleSlug}.read`)
}

/**
 * Verifica si el usuario puede escribir en un módulo.
 */
export function canWriteModule(membership: Membership, moduleSlug: string): boolean {
  return hasPermission(membership, `${moduleSlug}.write`)
}

/**
 * Verifica si el usuario puede eliminar en un módulo.
 */
export function canDeleteModule(membership: Membership, moduleSlug: string): boolean {
  return hasPermission(membership, `${moduleSlug}.delete`)
}

/**
 * Verifica si el usuario es dueño de la organización.
 */
export function isOwner(membership: Membership): boolean {
  return membership.role?.name === 'owner'
}

/**
 * Verifica si el usuario es administrador o dueño.
 */
export function isAdminOrOwner(membership: Membership): boolean {
  const roleName = membership.role?.name
  return roleName === 'owner' || roleName === 'admin'
}

/**
 * Retorna el display name del rol en español.
 */
export function getRoleDisplayName(role: Role): string {
  return role.display_name
}

/**
 * Permisos del sistema organizados por módulo (para UI de configuración de roles).
 */
export const PERMISSION_CATALOG = {
  stock: {
    label: 'Stock e Inventario',
    permissions: [
      { key: 'stock.read', label: 'Ver productos y stock' },
      { key: 'stock.write', label: 'Crear y editar productos' },
      { key: 'stock.delete', label: 'Eliminar productos' },
    ],
  },
  sales: {
    label: 'Ventas',
    permissions: [
      { key: 'sales.read', label: 'Ver ventas' },
      { key: 'sales.write', label: 'Crear ventas' },
      { key: 'sales.void', label: 'Anular ventas' },
    ],
  },
  customers: {
    label: 'Clientes',
    permissions: [
      { key: 'customers.read', label: 'Ver clientes' },
      { key: 'customers.write', label: 'Crear y editar clientes' },
      { key: 'customers.delete', label: 'Eliminar clientes' },
    ],
  },
  purchases: {
    label: 'Compras',
    permissions: [
      { key: 'purchases.read', label: 'Ver órdenes de compra' },
      { key: 'purchases.write', label: 'Crear y editar compras' },
      { key: 'purchases.receive', label: 'Recibir mercadería' },
    ],
  },
  finance: {
    label: 'Finanzas',
    permissions: [
      { key: 'finance.read', label: 'Ver finanzas' },
      { key: 'finance.write', label: 'Registrar ingresos y egresos' },
    ],
  },
  reports: {
    label: 'Reportes',
    permissions: [
      { key: 'reports.read', label: 'Ver reportes' },
    ],
  },
  settings: {
    label: 'Configuración',
    permissions: [
      { key: 'settings.read', label: 'Ver configuración' },
      { key: 'settings.write', label: 'Modificar configuración' },
    ],
  },
  users: {
    label: 'Usuarios',
    permissions: [
      { key: 'users.read', label: 'Ver usuarios' },
      { key: 'users.write', label: 'Gestionar usuarios' },
    ],
  },
} as const
