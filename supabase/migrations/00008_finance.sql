-- ============================================================================
-- MIGRACIÓN 00008: MÓDULO FINANZAS
-- Cuentas, categorías financieras, transacciones, cuentas por pagar/cobrar
-- ============================================================================

-- ============================================================================
-- FINANCE_ACCOUNTS (cuentas: caja, banco, billetera digital)
-- ============================================================================
CREATE TABLE finance_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  account_type    TEXT NOT NULL,
  balance_cents   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_account_type CHECK (
    account_type IN ('cash', 'bank', 'digital_wallet')
  )
);

COMMENT ON TABLE finance_accounts IS 'Cuentas financieras: caja física, banco, billetera digital';
COMMENT ON COLUMN finance_accounts.balance_cents IS 'Saldo actual en centavos (cache, actualizado por trigger)';

CREATE INDEX idx_finance_accounts_org ON finance_accounts(organization_id);

CREATE TRIGGER trg_finance_accounts_updated_at
  BEFORE UPDATE ON finance_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FINANCE_CATEGORIES (categorías de ingresos/egresos)
-- ============================================================================
CREATE TABLE finance_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,
  parent_id       UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  is_system       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_finance_category_type CHECK (type IN ('income', 'expense'))
);

COMMENT ON TABLE finance_categories IS 'Categorías para clasificar ingresos y egresos';

CREATE INDEX idx_finance_categories_org ON finance_categories(organization_id);
CREATE INDEX idx_finance_categories_type ON finance_categories(organization_id, type);

-- ============================================================================
-- FINANCE_TRANSACTIONS (movimientos financieros)
-- ============================================================================
CREATE TABLE finance_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES finance_accounts(id),
  category_id      UUID REFERENCES finance_categories(id),
  type             TEXT NOT NULL,
  amount_cents     INTEGER NOT NULL,
  description      TEXT,
  reference_type   TEXT,
  reference_id     UUID,
  transaction_date DATE NOT NULL,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_transaction_type CHECK (type IN ('income', 'expense')),
  CONSTRAINT chk_transaction_amount_positive CHECK (amount_cents > 0)
);

COMMENT ON TABLE finance_transactions IS 'Ingresos y egresos financieros';
COMMENT ON COLUMN finance_transactions.amount_cents IS 'Monto siempre positivo. El tipo (income/expense) determina la dirección';
COMMENT ON COLUMN finance_transactions.reference_type IS 'Origen: sale, purchase_order, manual';

CREATE INDEX idx_finance_tx_org ON finance_transactions(organization_id, transaction_date);
CREATE INDEX idx_finance_tx_account ON finance_transactions(account_id, transaction_date);
CREATE INDEX idx_finance_tx_category ON finance_transactions(category_id);
CREATE INDEX idx_finance_tx_ref ON finance_transactions(reference_type, reference_id);
CREATE INDEX idx_finance_tx_date ON finance_transactions(organization_id, transaction_date, type);

-- ============================================================================
-- TRIGGER: actualizar saldo de la cuenta al insertar transacción
-- ============================================================================
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'income' THEN
    UPDATE finance_accounts
    SET balance_cents = balance_cents + NEW.amount_cents,
        updated_at = now()
    WHERE id = NEW.account_id;
  ELSIF NEW.type = 'expense' THEN
    UPDATE finance_accounts
    SET balance_cents = balance_cents - NEW.amount_cents,
        updated_at = now()
    WHERE id = NEW.account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_finance_tx_balance
  AFTER INSERT ON finance_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- ============================================================================
-- ACCOUNTS_PAYABLE (cuentas por pagar)
-- ============================================================================
CREATE TABLE accounts_payable (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id       UUID NOT NULL REFERENCES suppliers(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  amount_cents      INTEGER NOT NULL,
  paid_cents        INTEGER NOT NULL DEFAULT 0,
  due_date          DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_ap_status CHECK (
    status IN ('pending', 'partial', 'paid', 'overdue')
  ),
  CONSTRAINT chk_ap_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT chk_ap_paid_valid CHECK (paid_cents >= 0 AND paid_cents <= amount_cents)
);

COMMENT ON TABLE accounts_payable IS 'Cuentas por pagar a proveedores';

CREATE INDEX idx_ap_org ON accounts_payable(organization_id, status);
CREATE INDEX idx_ap_supplier ON accounts_payable(supplier_id);
CREATE INDEX idx_ap_due_date ON accounts_payable(organization_id, due_date) WHERE status != 'paid';

CREATE TRIGGER trg_ap_updated_at
  BEFORE UPDATE ON accounts_payable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ACCOUNTS_RECEIVABLE (cuentas por cobrar)
-- ============================================================================
CREATE TABLE accounts_receivable (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id),
  sale_id         UUID REFERENCES sales(id),
  amount_cents    INTEGER NOT NULL,
  received_cents  INTEGER NOT NULL DEFAULT 0,
  due_date        DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_ar_status CHECK (
    status IN ('pending', 'partial', 'paid', 'overdue')
  ),
  CONSTRAINT chk_ar_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT chk_ar_received_valid CHECK (received_cents >= 0 AND received_cents <= amount_cents)
);

COMMENT ON TABLE accounts_receivable IS 'Cuentas por cobrar a clientes';

CREATE INDEX idx_ar_org ON accounts_receivable(organization_id, status);
CREATE INDEX idx_ar_customer ON accounts_receivable(customer_id);
CREATE INDEX idx_ar_due_date ON accounts_receivable(organization_id, due_date) WHERE status != 'paid';

CREATE TRIGGER trg_ar_updated_at
  BEFORE UPDATE ON accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VISTA: dashboard financiero
-- ============================================================================
CREATE OR REPLACE VIEW v_finance_summary AS
SELECT
  fa.organization_id,
  fa.id AS account_id,
  fa.name AS account_name,
  fa.account_type,
  fa.balance_cents,
  COALESCE(SUM(ft.amount_cents) FILTER (WHERE ft.type = 'income' AND ft.transaction_date >= date_trunc('month', CURRENT_DATE)), 0) AS month_income_cents,
  COALESCE(SUM(ft.amount_cents) FILTER (WHERE ft.type = 'expense' AND ft.transaction_date >= date_trunc('month', CURRENT_DATE)), 0) AS month_expense_cents,
  COALESCE(SUM(ft.amount_cents) FILTER (WHERE ft.type = 'income' AND ft.transaction_date >= date_trunc('day', CURRENT_DATE)), 0) AS today_income_cents,
  COALESCE(SUM(ft.amount_cents) FILTER (WHERE ft.type = 'expense' AND ft.transaction_date >= date_trunc('day', CURRENT_DATE)), 0) AS today_expense_cents
FROM finance_accounts fa
LEFT JOIN finance_transactions ft ON ft.account_id = fa.id
WHERE fa.is_active = true
GROUP BY fa.id;

COMMENT ON VIEW v_finance_summary IS 'Resumen financiero por cuenta con totales del mes y del día';
