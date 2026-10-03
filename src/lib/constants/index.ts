// ============================================================================
// Constantes del sistema
// ============================================================================

// Slugs de módulos
export const MODULE_SLUGS = {
  STOCK: 'stock',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  PURCHASES: 'purchases',
  FINANCE: 'finance',
  REPORTS: 'reports',
  EMPLOYEES: 'employees',
  VEHICLES: 'vehicles',
  LOGISTICS: 'logistics',
  CHAT: 'chat',
  ECOMMERCE: 'ecommerce',
} as const

// Navegación por módulo (para el sidebar)
export const MODULE_NAV = {
  stock: {
    label: 'Stock',
    icon: 'Package',
    basePath: '/stock',
    items: [
      { label: 'Inventario', path: '/stock', icon: 'Package' },
      { label: 'Movimientos', path: '/stock/movements', icon: 'ArrowLeftRight' },
      { label: 'Depósitos', path: '/stock/warehouses', icon: 'Warehouse' },
      { label: 'Alertas', path: '/stock/alerts', icon: 'AlertTriangle' },
    ],
  },
  sales: {
    label: 'Ventas',
    icon: 'ShoppingCart',
    basePath: '/sales',
    defaultPath: '/sales/pos',
    items: [
      { label: 'Punto de Venta', path: '/sales/pos', icon: 'Monitor' },
      { label: 'Historial', path: '/sales', icon: 'History' },
      { label: 'Caja', path: '/sales/cash', icon: 'Banknote' },
    ],
  },
  customers: {
    label: 'Clientes',
    icon: 'Users',
    basePath: '/customers',
    items: [
      { label: 'Lista', path: '/customers', icon: 'Users' },
    ],
  },
  purchases: {
    label: 'Compras',
    icon: 'Truck',
    basePath: '/purchases',
    items: [
      { label: 'Órdenes de Compra', path: '/purchases', icon: 'ClipboardList' },
      { label: 'Proveedores', path: '/purchases/suppliers', icon: 'Building2' },
    ],
  },
  finance: {
    label: 'Finanzas',
    icon: 'DollarSign',
    basePath: '/finance',
    items: [
      { label: 'Dashboard', path: '/finance', icon: 'LayoutDashboard' },
      { label: 'Transacciones', path: '/finance/transactions', icon: 'ArrowLeftRight' },
      { label: 'Cuentas', path: '/finance/accounts', icon: 'CreditCard' },
      { label: 'Por Pagar / Cobrar', path: '/finance/payables-receivables', icon: 'FileText' },
    ],
  },
  reports: {
    label: 'Reportes',
    icon: 'BarChart3',
    basePath: '/reports',
    items: [
      { label: 'Panel General', path: '/reports', icon: 'BarChart3' },
    ],
  },
} as const

// Roles del sistema
export const SYSTEM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  SELLER: 'seller',
  WAREHOUSE: 'warehouse',
} as const

// Métodos de pago
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: 'Banknote' },
  { value: 'card', label: 'Tarjeta', icon: 'CreditCard' },
  { value: 'transfer', label: 'Transferencia', icon: 'ArrowRightLeft' },
  { value: 'other', label: 'Otro', icon: 'Wallet' },
] as const

// Tipos de movimiento de stock
export const MOVEMENT_TYPES = {
  purchase_in: { label: 'Ingreso por compra', color: 'emerald', sign: '+' },
  sale_out: { label: 'Salida por venta', color: 'red', sign: '-' },
  adjustment: { label: 'Ajuste manual', color: 'amber', sign: '±' },
  loss: { label: 'Merma / Rotura', color: 'red', sign: '-' },
  transfer_in: { label: 'Transferencia (entrada)', color: 'blue', sign: '+' },
  transfer_out: { label: 'Transferencia (salida)', color: 'blue', sign: '-' },
  initial: { label: 'Stock inicial', color: 'slate', sign: '+' },
} as const

// Estados de órdenes de compra
export const PO_STATUSES = {
  draft: { label: 'Borrador', color: 'slate' },
  sent: { label: 'Enviada', color: 'blue' },
  partial: { label: 'Recepción Parcial', color: 'amber' },
  received: { label: 'Recibida', color: 'emerald' },
  cancelled: { label: 'Cancelada', color: 'red' },
} as const

// Estados de venta
export const SALE_STATUSES = {
  draft: { label: 'Borrador', color: 'slate' },
  completed: { label: 'Completada', color: 'emerald' },
  voided: { label: 'Anulada', color: 'red' },
} as const

// Tipos de documento
export const DOCUMENT_TYPES = [
  { value: 'dni', label: 'DNI' },
  { value: 'cuit', label: 'CUIT' },
  { value: 'cuil', label: 'CUIL' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'otro', label: 'Otro' },
] as const
