// ============================================================================
// Tipos del Sistema PADRE
// ============================================================================

// ---- Núcleo ----

export interface Profile {
  id: string
  full_name: string
  email?: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationInvitation {
  id: string
  organization_id: string
  email: string
  role_id: string
  invited_by: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'canceled'
  token: string
  expires_at: string
  created_at: string
  updated_at: string
  role?: Role
  inviter?: Profile
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  template_id: string | null
  settings: OrganizationSettings
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  currency: string
  currency_symbol: string
  timezone: string
  decimal_separator: string
  thousands_separator: string
  date_format: string
  business_type: string
  [key: string]: unknown
}

export interface Role {
  id: string
  name: string
  display_name: string
  permissions: string[]
  is_system: boolean
  organization_id: string | null
  created_at: string
}

export interface Membership {
  id: string
  user_id: string
  organization_id: string
  role_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined relations
  role?: Role
  organization?: Organization
  profile?: Profile
}

export interface Module {
  id: string
  slug: ModuleSlug
  name: string
  description: string | null
  icon: string | null
  is_available: boolean
  sort_order: number
  created_at: string
}

export type ModuleSlug =
  | 'stock'
  | 'sales'
  | 'customers'
  | 'purchases'
  | 'finance'
  | 'reports'
  | 'employees'
  | 'vehicles'
  | 'logistics'
  | 'chat'
  | 'ecommerce'

export interface Template {
  id: string
  slug: string
  name: string
  description: string | null
  default_modules: string[]
  default_settings: Record<string, unknown>
  product_fields: ProductFieldDefinition[]
  is_active: boolean
  created_at: string
}

export interface ProductFieldDefinition {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'date'
  required: boolean
  placeholder?: string
  options?: string[]
  default?: string
  min?: number
  max?: number
}

export interface OrganizationModule {
  id: string
  organization_id: string
  module_id: string
  is_active: boolean
  settings: Record<string, unknown>
  activated_at: string
  activated_by: string | null
  // Joined
  module?: Module
}

// ---- Stock ----

export interface Category {
  id: string
  organization_id: string
  name: string
  parent_id: string | null
  sort_order: number
  created_at: string
  children?: Category[]
}

export interface Product {
  id: string
  organization_id: string
  sku: string | null
  barcode: string | null
  name: string
  description: string | null
  category_id: string | null
  cost_price_cents: number
  sale_price_cents: number
  min_stock: number
  unit: string
  image_url: string | null
  is_composite: boolean
  is_active: boolean
  metadata: VinotecaMetadata | Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Joined
  category?: Category
  stock?: ProductStockCache[]
}

export interface VinotecaMetadata {
  winery?: string
  brand?: string
  varietal?: string
  wine_type?: 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Dulce' | 'Fortificado' | 'Otro'
  vintage?: number
  region?: string
  volume_ml?: string
}

export interface ProductComponent {
  id: string
  parent_product_id: string
  component_product_id: string
  quantity: number
  created_at: string
  // Joined
  component?: Product
}

export interface Warehouse {
  id: string
  organization_id: string
  name: string
  address: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
}

export type MovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'adjustment'
  | 'loss'
  | 'transfer_in'
  | 'transfer_out'
  | 'initial'

export interface StockMovement {
  id: string
  organization_id: string
  product_id: string
  warehouse_id: string
  movement_type: MovementType
  quantity: number
  unit_cost_cents: number | null
  reference_type: string | null
  reference_id: string | null
  transfer_movement_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  // Joined
  product?: Product
  warehouse?: Warehouse
  creator?: Profile
}

export interface ProductStockCache {
  product_id: string
  warehouse_id: string
  organization_id: string
  quantity: number
  last_movement_at: string | null
  updated_at: string
  // Joined
  warehouse?: Warehouse
}

// ---- Ventas ----

export interface CashRegister {
  id: string
  organization_id: string
  name: string
  is_active: boolean
  created_at: string
}

export type SessionStatus = 'open' | 'closed'

export interface CashSession {
  id: string
  organization_id: string
  cash_register_id: string
  opened_by: string
  closed_by: string | null
  opened_at: string
  closed_at: string | null
  opening_amount_cents: number
  expected_amount_cents: number | null
  actual_amount_cents: number | null
  difference_cents: number | null
  notes: string | null
  status: SessionStatus
  // Joined
  cash_register?: CashRegister
  opener?: Profile
}

export type SaleStatus = 'draft' | 'completed' | 'voided'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'
export type DeliveryStatus = 'pending' | 'shipped' | 'delivered'

export interface Sale {
  id: string
  organization_id: string
  sale_number: string
  customer_id: string | null
  cash_session_id: string | null
  seller_id: string
  warehouse_id: string
  subtotal_cents: number
  discount_cents: number
  discount_percent: number
  tax_cents: number
  total_cents: number
  status: SaleStatus
  voided_at: string | null
  voided_by: string | null
  void_reason: string | null
  notes: string | null
  is_delivery: boolean
  delivery_address: string | null
  delivery_date: string | null
  delivery_status: DeliveryStatus | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  items?: SaleItem[]
  payments?: SalePayment[]
  customer?: Customer
  seller?: Profile
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price_cents: number
  unit_cost_cents: number
  discount_cents: number
  discount_percent: number
  subtotal_cents: number
  created_at: string
  // Joined
  product?: Product
}

export interface SalePayment {
  id: string
  sale_id: string
  payment_method: PaymentMethod
  amount_cents: number
  reference: string | null
  created_at: string
}

// ---- Clientes ----

export type DocumentType = 'dni' | 'cuit' | 'cuil' | 'pasaporte' | 'otro'

export interface Customer {
  id: string
  organization_id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  document_type: DocumentType | null
  document_number: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  notes: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CustomerNote {
  id: string
  customer_id: string
  organization_id: string
  content: string
  created_by: string | null
  created_at: string
  // Joined
  creator?: Profile
}

// ---- Proveedores y Compras ----

export interface Supplier {
  id: string
  organization_id: string
  name: string
  trade_name: string | null
  tax_id: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  province: string | null
  contact_name: string | null
  contact_phone: string | null
  notes: string | null
  payment_terms_days: number
  metadata: Record<string, unknown>
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'

export interface PurchaseOrder {
  id: string
  organization_id: string
  order_number: string
  supplier_id: string
  warehouse_id: string
  status: PurchaseOrderStatus
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  expected_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  items?: PurchaseOrderItem[]
  supplier?: Supplier
  warehouse?: Warehouse
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  quantity_ordered: number
  quantity_received: number
  unit_cost_cents: number
  subtotal_cents: number
  created_at: string
  // Joined
  product?: Product
}

// ---- Finanzas ----

export type AccountType = 'cash' | 'bank' | 'digital_wallet'

export interface FinanceAccount {
  id: string
  organization_id: string
  name: string
  account_type: AccountType
  balance_cents: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type FinanceCategoryType = 'income' | 'expense'

export interface FinanceCategory {
  id: string
  organization_id: string
  name: string
  type: FinanceCategoryType
  parent_id: string | null
  is_system: boolean
  created_at: string
}

export interface FinanceTransaction {
  id: string
  organization_id: string
  account_id: string
  category_id: string | null
  type: FinanceCategoryType
  amount_cents: number
  description: string | null
  reference_type: string | null
  reference_id: string | null
  transaction_date: string
  created_by: string | null
  created_at: string
  // Joined
  account?: FinanceAccount
  category?: FinanceCategory
  creator?: Profile
}

export type PayableReceivableStatus = 'pending' | 'partial' | 'paid' | 'overdue'

export interface AccountPayable {
  id: string
  organization_id: string
  supplier_id: string
  purchase_order_id: string | null
  amount_cents: number
  paid_cents: number
  due_date: string
  status: PayableReceivableStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  supplier?: Supplier
}

export interface AccountReceivable {
  id: string
  organization_id: string
  customer_id: string
  sale_id: string | null
  amount_cents: number
  received_cents: number
  due_date: string
  status: PayableReceivableStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  customer?: Customer
}

// ---- Auditoría ----

export interface AuditLog {
  id: string
  organization_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  metadata: Record<string, unknown>
  created_at: string
}

// ---- Carrito (solo frontend, no en BD) ----

export interface CartItem {
  product: Product
  quantity: number
  unit_price_cents: number
  unit_cost_cents: number
  discount_cents: number
  discount_percent: number
  subtotal_cents: number
}

export interface Cart {
  items: CartItem[]
  customer_id: string | null
  discount_cents: number
  discount_percent: number
  subtotal_cents: number
  total_cents: number
  notes: string
}
