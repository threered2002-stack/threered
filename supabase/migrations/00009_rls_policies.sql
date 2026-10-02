-- ============================================================================
-- MIGRACIÓN 00009: POLÍTICAS RLS
-- Row Level Security para todas las tablas de negocio
-- ============================================================================

-- ============================================================================
-- PROFILES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and admins can update their organizations"
  ON organizations FOR UPDATE
  USING (id IN (SELECT get_user_org_ids()))
  WITH CHECK (id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- ROLES
-- ============================================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System roles are visible to all authenticated users"
  ON roles FOR SELECT
  USING (
    is_system = true
    OR organization_id IN (SELECT get_user_org_ids())
  );

-- ============================================================================
-- MEMBERSHIPS
-- ============================================================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memberships of their organizations"
  ON memberships FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can view their own memberships"
  ON memberships FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- ORGANIZATION_MODULES
-- ============================================================================
ALTER TABLE organization_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view modules of their organizations"
  ON organization_modules FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- AUDIT_LOGS
-- ============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs of their organizations"
  ON audit_logs FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- CATEGORIES
-- ============================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON categories FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON categories FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON categories FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_delete" ON categories FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- PRODUCTS
-- ============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON products FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON products FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON products FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_delete" ON products FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- PRODUCT_COMPONENTS
-- ============================================================================
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON product_components FOR SELECT
  USING (
    parent_product_id IN (
      SELECT id FROM products WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "org_insert" ON product_components FOR INSERT
  WITH CHECK (
    parent_product_id IN (
      SELECT id FROM products WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "org_update" ON product_components FOR UPDATE
  USING (
    parent_product_id IN (
      SELECT id FROM products WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "org_delete" ON product_components FOR DELETE
  USING (
    parent_product_id IN (
      SELECT id FROM products WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================================
-- WAREHOUSES
-- ============================================================================
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON warehouses FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON warehouses FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON warehouses FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_delete" ON warehouses FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- STOCK_MOVEMENTS
-- ============================================================================
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON stock_movements FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON stock_movements FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- No se permite UPDATE ni DELETE en movimientos de stock (ledger inmutable)

-- ============================================================================
-- PRODUCT_STOCK_CACHE
-- ============================================================================
ALTER TABLE product_stock_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON product_stock_cache FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

-- INSERT/UPDATE solo por triggers (SECURITY DEFINER), no directo

-- ============================================================================
-- CASH_REGISTERS
-- ============================================================================
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON cash_registers FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON cash_registers FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON cash_registers FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- CASH_SESSIONS
-- ============================================================================
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON cash_sessions FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON cash_sessions FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON cash_sessions FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- SALES
-- ============================================================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON sales FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON sales FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON sales FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- SALE_ITEMS
-- ============================================================================
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON sale_items FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "org_insert" ON sale_items FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================================
-- SALE_PAYMENTS
-- ============================================================================
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON sale_payments FOR SELECT
  USING (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "org_insert" ON sale_payments FOR INSERT
  WITH CHECK (
    sale_id IN (
      SELECT id FROM sales WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================================
-- CUSTOMERS
-- ============================================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON customers FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON customers FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON customers FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_delete" ON customers FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- CUSTOMER_NOTES
-- ============================================================================
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON customer_notes FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON customer_notes FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_delete" ON customer_notes FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- SUPPLIERS
-- ============================================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON suppliers FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON suppliers FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON suppliers FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_delete" ON suppliers FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- PURCHASE_ORDERS
-- ============================================================================
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON purchase_orders FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON purchase_orders FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON purchase_orders FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- PURCHASE_ORDER_ITEMS
-- ============================================================================
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON purchase_order_items FOR SELECT
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "org_insert" ON purchase_order_items FOR INSERT
  WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "org_update" ON purchase_order_items FOR UPDATE
  USING (
    purchase_order_id IN (
      SELECT id FROM purchase_orders WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================================
-- PURCHASE_RECEIPTS
-- ============================================================================
ALTER TABLE purchase_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON purchase_receipts FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON purchase_receipts FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- PURCHASE_RECEIPT_ITEMS
-- ============================================================================
ALTER TABLE purchase_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON purchase_receipt_items FOR SELECT
  USING (
    receipt_id IN (
      SELECT id FROM purchase_receipts WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "org_insert" ON purchase_receipt_items FOR INSERT
  WITH CHECK (
    receipt_id IN (
      SELECT id FROM purchase_receipts WHERE organization_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================================
-- FINANCE_ACCOUNTS
-- ============================================================================
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON finance_accounts FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON finance_accounts FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON finance_accounts FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- FINANCE_CATEGORIES
-- ============================================================================
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON finance_categories FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON finance_categories FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON finance_categories FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_delete" ON finance_categories FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- FINANCE_TRANSACTIONS
-- ============================================================================
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON finance_transactions FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON finance_transactions FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- Las transacciones financieras son inmutables (como el ledger de stock)

-- ============================================================================
-- ACCOUNTS_PAYABLE
-- ============================================================================
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON accounts_payable FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON accounts_payable FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON accounts_payable FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- ACCOUNTS_RECEIVABLE
-- ============================================================================
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON accounts_receivable FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_insert" ON accounts_receivable FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_update" ON accounts_receivable FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- ============================================================================
-- SEQUENCE TABLES (no necesitan RLS, solo acceden las funciones SECURITY DEFINER)
-- ============================================================================
-- sale_sequences, purchase_order_sequences, receipt_sequences
-- Estas tablas son accedidas solo por funciones con SECURITY DEFINER
