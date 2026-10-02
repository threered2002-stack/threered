-- ============================================================================
-- MIGRACIÓN 00007: MÓDULO PROVEEDORES Y COMPRAS
-- Proveedores, órdenes de compra, recepciones
-- ============================================================================

-- ============================================================================
-- SUPPLIERS (proveedores)
-- ============================================================================
CREATE TABLE suppliers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  trade_name       TEXT,
  tax_id           TEXT,
  email            TEXT,
  phone            TEXT,
  address          TEXT,
  city             TEXT,
  province         TEXT,
  contact_name     TEXT,
  contact_phone    TEXT,
  notes            TEXT,
  payment_terms_days INTEGER NOT NULL DEFAULT 0,
  metadata         JSONB NOT NULL DEFAULT '{}',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

COMMENT ON TABLE suppliers IS 'Proveedores de la organización';

CREATE INDEX idx_suppliers_org ON suppliers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_name ON suppliers(organization_id, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_tax_id ON suppliers(organization_id, tax_id)
  WHERE tax_id IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECUENCIA para órdenes de compra
-- ============================================================================
CREATE TABLE purchase_order_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_number     INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_purchase_order_number(_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  _next INTEGER;
BEGIN
  INSERT INTO purchase_order_sequences (organization_id, last_number)
  VALUES (_org_id, 1)
  ON CONFLICT (organization_id)
  DO UPDATE SET last_number = purchase_order_sequences.last_number + 1
  RETURNING last_number INTO _next;

  RETURN 'OC-' || LPAD(_next::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PURCHASE_ORDERS (órdenes de compra)
-- ============================================================================
CREATE TABLE purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_number    TEXT NOT NULL,
  supplier_id     UUID NOT NULL REFERENCES suppliers(id),
  warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
  status          TEXT NOT NULL DEFAULT 'draft',
  subtotal_cents  INTEGER NOT NULL DEFAULT 0,
  tax_cents       INTEGER NOT NULL DEFAULT 0,
  total_cents     INTEGER NOT NULL DEFAULT 0,
  expected_date   DATE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_po_status CHECK (
    status IN ('draft', 'sent', 'partial', 'received', 'cancelled')
  ),
  CONSTRAINT uq_po_number_org UNIQUE (organization_id, order_number)
);

COMMENT ON TABLE purchase_orders IS 'Órdenes de compra a proveedores';

CREATE INDEX idx_purchase_orders_org ON purchase_orders(organization_id, created_at);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(organization_id, status);

CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PURCHASE_ORDER_ITEMS (ítems de orden de compra)
-- ============================================================================
CREATE TABLE purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id),
  quantity_ordered  NUMERIC(12,2) NOT NULL,
  quantity_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_cost_cents   INTEGER NOT NULL,
  subtotal_cents    INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_poi_quantity_positive CHECK (quantity_ordered > 0),
  CONSTRAINT chk_poi_cost_positive CHECK (unit_cost_cents >= 0)
);

COMMENT ON TABLE purchase_order_items IS 'Ítems de una orden de compra';

CREATE INDEX idx_po_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);

-- ============================================================================
-- SECUENCIA para recepciones
-- ============================================================================
CREATE TABLE receipt_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_number     INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_receipt_number(_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  _next INTEGER;
BEGIN
  INSERT INTO receipt_sequences (organization_id, last_number)
  VALUES (_org_id, 1)
  ON CONFLICT (organization_id)
  DO UPDATE SET last_number = receipt_sequences.last_number + 1
  RETURNING last_number INTO _next;

  RETURN 'RC-' || LPAD(_next::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PURCHASE_RECEIPTS (recepciones de mercadería)
-- ============================================================================
CREATE TABLE purchase_receipts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
  receipt_number    TEXT NOT NULL,
  received_by       UUID NOT NULL REFERENCES auth.users(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_receipt_number_org UNIQUE (organization_id, receipt_number)
);

COMMENT ON TABLE purchase_receipts IS 'Recepciones de mercadería contra órdenes de compra';

CREATE INDEX idx_receipts_org ON purchase_receipts(organization_id);
CREATE INDEX idx_receipts_po ON purchase_receipts(purchase_order_id);

-- ============================================================================
-- PURCHASE_RECEIPT_ITEMS (ítems recibidos)
-- ============================================================================
CREATE TABLE purchase_receipt_items (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id             UUID NOT NULL REFERENCES purchase_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES purchase_order_items(id),
  product_id             UUID NOT NULL REFERENCES products(id),
  quantity_received      NUMERIC(12,2) NOT NULL,
  unit_cost_cents        INTEGER NOT NULL,
  stock_movement_id      UUID REFERENCES stock_movements(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_receipt_quantity_positive CHECK (quantity_received > 0)
);

COMMENT ON TABLE purchase_receipt_items IS 'Detalle de ítems recibidos, cada uno genera un movimiento de stock';

CREATE INDEX idx_receipt_items_receipt ON purchase_receipt_items(receipt_id);

-- ============================================================================
-- FUNCIÓN: recibir mercadería (transaccional)
-- Crea la recepción, actualiza cantidades recibidas, genera movimientos de stock
-- ============================================================================
CREATE OR REPLACE FUNCTION receive_purchase_order(
  _org_id UUID,
  _purchase_order_id UUID,
  _received_by UUID,
  _notes TEXT,
  _items JSONB  -- [{purchase_order_item_id, product_id, quantity_received, unit_cost_cents}]
)
RETURNS UUID AS $$
DECLARE
  _receipt_id UUID;
  _receipt_number TEXT;
  _item JSONB;
  _movement_id UUID;
  _po_warehouse_id UUID;
  _all_received BOOLEAN;
BEGIN
  -- Obtener depósito de la OC
  SELECT warehouse_id INTO _po_warehouse_id
  FROM purchase_orders WHERE id = _purchase_order_id;

  -- Generar número de recepción
  _receipt_number := next_receipt_number(_org_id);

  -- Crear recepción
  INSERT INTO purchase_receipts (
    organization_id, purchase_order_id, receipt_number, received_by, notes
  ) VALUES (
    _org_id, _purchase_order_id, _receipt_number, _received_by, _notes
  ) RETURNING id INTO _receipt_id;

  -- Procesar cada ítem
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    -- Crear movimiento de stock (ingreso por compra)
    INSERT INTO stock_movements (
      organization_id, product_id, warehouse_id, movement_type,
      quantity, unit_cost_cents, reference_type, reference_id,
      created_by
    ) VALUES (
      _org_id,
      (_item->>'product_id')::UUID,
      _po_warehouse_id,
      'purchase_in',
      (_item->>'quantity_received')::NUMERIC,
      (_item->>'unit_cost_cents')::INTEGER,
      'purchase_order',
      _purchase_order_id,
      _received_by
    ) RETURNING id INTO _movement_id;

    -- Crear ítem de recepción
    INSERT INTO purchase_receipt_items (
      receipt_id, purchase_order_item_id, product_id,
      quantity_received, unit_cost_cents, stock_movement_id
    ) VALUES (
      _receipt_id,
      (_item->>'purchase_order_item_id')::UUID,
      (_item->>'product_id')::UUID,
      (_item->>'quantity_received')::NUMERIC,
      (_item->>'unit_cost_cents')::INTEGER,
      _movement_id
    );

    -- Actualizar cantidad recibida en el ítem de la OC
    UPDATE purchase_order_items
    SET quantity_received = quantity_received + (_item->>'quantity_received')::NUMERIC
    WHERE id = (_item->>'purchase_order_item_id')::UUID;

    -- Actualizar costo del producto
    UPDATE products
    SET cost_price_cents = (_item->>'unit_cost_cents')::INTEGER,
        updated_at = now()
    WHERE id = (_item->>'product_id')::UUID;
  END LOOP;

  -- Actualizar estado de la OC
  SELECT NOT EXISTS (
    SELECT 1 FROM purchase_order_items
    WHERE purchase_order_id = _purchase_order_id
      AND quantity_received < quantity_ordered
  ) INTO _all_received;

  UPDATE purchase_orders
  SET status = CASE WHEN _all_received THEN 'received' ELSE 'partial' END,
      updated_at = now()
  WHERE id = _purchase_order_id;

  RETURN _receipt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
