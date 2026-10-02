-- ============================================================================
-- MIGRACIÓN 00006: MÓDULO CLIENTES
-- Clientes y notas de cliente
-- ============================================================================

-- ============================================================================
-- CUSTOMERS (clientes)
-- ============================================================================
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT,
  email           TEXT,
  phone           TEXT,
  document_type   TEXT,
  document_number TEXT,
  address         TEXT,
  city            TEXT,
  province        TEXT,
  postal_code     TEXT,
  notes           TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  CONSTRAINT chk_document_type CHECK (
    document_type IS NULL OR document_type IN ('dni', 'cuit', 'cuil', 'pasaporte', 'otro')
  )
);

COMMENT ON TABLE customers IS 'Clientes de la organización';

CREATE INDEX idx_customers_org ON customers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_name ON customers(organization_id, first_name, last_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_document ON customers(organization_id, document_number)
  WHERE document_number IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers(organization_id, email)
  WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_customers_phone ON customers(organization_id, phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Agregar FK de sales → customers (diferida de migración 00005)
ALTER TABLE sales
  ADD CONSTRAINT fk_sales_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- ============================================================================
-- CUSTOMER_NOTES (notas del cliente)
-- ============================================================================
CREATE TABLE customer_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE customer_notes IS 'Notas internas sobre clientes';

CREATE INDEX idx_customer_notes_customer ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_org ON customer_notes(organization_id);

-- ============================================================================
-- VISTA: ficha de cliente con historial resumido
-- ============================================================================
CREATE OR REPLACE VIEW v_customer_summary AS
SELECT
  c.id,
  c.organization_id,
  c.first_name,
  c.last_name,
  c.first_name || COALESCE(' ' || c.last_name, '') AS full_name,
  c.email,
  c.phone,
  c.document_type,
  c.document_number,
  c.is_active,
  c.created_at,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS total_purchases,
  COALESCE(SUM(s.total_cents) FILTER (WHERE s.status = 'completed'), 0) AS total_spent_cents,
  MAX(s.created_at) FILTER (WHERE s.status = 'completed') AS last_purchase_at
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

COMMENT ON VIEW v_customer_summary IS 'Resumen del cliente con total de compras y último pedido';
