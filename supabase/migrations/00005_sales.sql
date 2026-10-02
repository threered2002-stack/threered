-- ============================================================================
-- MIGRACIÓN 00005: MÓDULO VENTAS
-- Cajas registradoras, sesiones de caja, ventas, ítems, pagos
-- ============================================================================

-- ============================================================================
-- CASH_REGISTERS (cajas registradoras)
-- ============================================================================
CREATE TABLE cash_registers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE cash_registers IS 'Cajas registradoras (puntos de venta)';

CREATE INDEX idx_cash_registers_org ON cash_registers(organization_id);

-- ============================================================================
-- CASH_SESSIONS (turnos / sesiones de caja)
-- ============================================================================
CREATE TABLE cash_sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cash_register_id      UUID NOT NULL REFERENCES cash_registers(id),
  opened_by             UUID NOT NULL REFERENCES auth.users(id),
  closed_by             UUID REFERENCES auth.users(id),
  opened_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at             TIMESTAMPTZ,
  opening_amount_cents  INTEGER NOT NULL DEFAULT 0,
  expected_amount_cents INTEGER,
  actual_amount_cents   INTEGER,
  difference_cents      INTEGER,
  notes                 TEXT,
  status                TEXT NOT NULL DEFAULT 'open',

  CONSTRAINT chk_session_status CHECK (status IN ('open', 'closed'))
);

COMMENT ON TABLE cash_sessions IS 'Sesiones/turnos de caja con apertura, cierre y diferencias';

CREATE INDEX idx_cash_sessions_org ON cash_sessions(organization_id);
CREATE INDEX idx_cash_sessions_register ON cash_sessions(cash_register_id);
CREATE INDEX idx_cash_sessions_open ON cash_sessions(organization_id, status) WHERE status = 'open';

-- ============================================================================
-- SECUENCIA para números de venta por organización
-- Usamos una tabla auxiliar para generar secuencias por org
-- ============================================================================
CREATE TABLE sale_sequences (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  last_number     INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE sale_sequences IS 'Secuencia de numeración de ventas por organización';

CREATE OR REPLACE FUNCTION next_sale_number(_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  _next INTEGER;
BEGIN
  INSERT INTO sale_sequences (organization_id, last_number)
  VALUES (_org_id, 1)
  ON CONFLICT (organization_id)
  DO UPDATE SET last_number = sale_sequences.last_number + 1
  RETURNING last_number INTO _next;

  RETURN 'V-' || LPAD(_next::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SALES (ventas)
-- ============================================================================
CREATE TABLE sales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_number       TEXT NOT NULL,
  customer_id       UUID,  -- FK se agrega en migración 00006
  cash_session_id   UUID REFERENCES cash_sessions(id),
  seller_id         UUID NOT NULL REFERENCES auth.users(id),
  warehouse_id      UUID NOT NULL REFERENCES warehouses(id),
  subtotal_cents    INTEGER NOT NULL,
  discount_cents    INTEGER NOT NULL DEFAULT 0,
  discount_percent  NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_cents         INTEGER NOT NULL DEFAULT 0,
  total_cents       INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'completed',
  voided_at         TIMESTAMPTZ,
  voided_by         UUID REFERENCES auth.users(id),
  void_reason       TEXT,
  notes             TEXT,
  -- Campos para envío (preparados para uso futuro)
  is_delivery       BOOLEAN NOT NULL DEFAULT false,
  delivery_address  TEXT,
  delivery_date     DATE,
  delivery_status   TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_sale_status CHECK (
    status IN ('draft', 'completed', 'voided')
  ),
  CONSTRAINT chk_delivery_status CHECK (
    delivery_status IS NULL OR delivery_status IN ('pending', 'shipped', 'delivered')
  ),
  CONSTRAINT chk_total_positive CHECK (total_cents >= 0),
  CONSTRAINT uq_sale_number_org UNIQUE (organization_id, sale_number)
);

COMMENT ON TABLE sales IS 'Ventas realizadas. Soporta venta de mostrador y preparado para envíos';

CREATE INDEX idx_sales_org ON sales(organization_id, created_at);
CREATE INDEX idx_sales_customer ON sales(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_sales_session ON sales(cash_session_id);
CREATE INDEX idx_sales_seller ON sales(seller_id);
CREATE INDEX idx_sales_status ON sales(organization_id, status);
CREATE INDEX idx_sales_date ON sales(organization_id, created_at);

CREATE TRIGGER trg_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SALE_ITEMS (ítems de venta)
-- ============================================================================
CREATE TABLE sale_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id          UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id       UUID NOT NULL REFERENCES products(id),
  product_name     TEXT NOT NULL,
  quantity         NUMERIC(12,2) NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  unit_cost_cents  INTEGER NOT NULL,
  discount_cents   INTEGER NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal_cents   INTEGER NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_item_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_item_subtotal_positive CHECK (subtotal_cents >= 0)
);

COMMENT ON TABLE sale_items IS 'Ítems de una venta. product_name es snapshot para historial';

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- ============================================================================
-- SALE_PAYMENTS (pagos de una venta)
-- ============================================================================
CREATE TABLE sale_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id        UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount_cents   INTEGER NOT NULL,
  reference      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_payment_method CHECK (
    payment_method IN ('cash', 'card', 'transfer', 'other')
  ),
  CONSTRAINT chk_payment_amount_positive CHECK (amount_cents > 0)
);

COMMENT ON TABLE sale_payments IS 'Pagos de una venta. Soporta pagos mixtos (múltiples registros por venta)';

CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);

-- ============================================================================
-- FUNCIÓN: crear venta completa (transaccional)
-- Crea la venta, ítems, pagos y movimientos de stock en una transacción
-- ============================================================================
CREATE OR REPLACE FUNCTION create_sale(
  _org_id UUID,
  _customer_id UUID,
  _session_id UUID,
  _seller_id UUID,
  _warehouse_id UUID,
  _discount_cents INTEGER,
  _discount_percent NUMERIC,
  _notes TEXT,
  _items JSONB,    -- [{product_id, quantity, unit_price_cents, unit_cost_cents, discount_cents, discount_percent}]
  _payments JSONB  -- [{payment_method, amount_cents, reference}]
)
RETURNS UUID AS $$
DECLARE
  _sale_id UUID;
  _sale_number TEXT;
  _subtotal INTEGER := 0;
  _total INTEGER := 0;
  _item JSONB;
  _payment JSONB;
  _item_subtotal INTEGER;
  _payment_total INTEGER := 0;
BEGIN
  -- Generar número de venta
  _sale_number := next_sale_number(_org_id);

  -- Calcular subtotal
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _item_subtotal := (
      (_item->>'quantity')::NUMERIC * (_item->>'unit_price_cents')::INTEGER
      - COALESCE((_item->>'discount_cents')::INTEGER, 0)
    )::INTEGER;
    _subtotal := _subtotal + _item_subtotal;
  END LOOP;

  -- Calcular total
  _total := _subtotal - _discount_cents;

  -- Validar pagos
  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments)
  LOOP
    _payment_total := _payment_total + (_payment->>'amount_cents')::INTEGER;
  END LOOP;

  IF _payment_total < _total THEN
    RAISE EXCEPTION 'El total de pagos (%) es menor que el total de la venta (%)',
      _payment_total, _total;
  END IF;

  -- Insertar venta
  INSERT INTO sales (
    organization_id, sale_number, customer_id, cash_session_id,
    seller_id, warehouse_id, subtotal_cents, discount_cents,
    discount_percent, total_cents, notes, created_by
  ) VALUES (
    _org_id, _sale_number, _customer_id, _session_id,
    _seller_id, _warehouse_id, _subtotal, _discount_cents,
    _discount_percent, _total, _notes, _seller_id
  ) RETURNING id INTO _sale_id;

  -- Insertar ítems y crear movimientos de stock
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _item_subtotal := (
      (_item->>'quantity')::NUMERIC * (_item->>'unit_price_cents')::INTEGER
      - COALESCE((_item->>'discount_cents')::INTEGER, 0)
    )::INTEGER;

    -- Ítem de venta
    INSERT INTO sale_items (
      sale_id, product_id, product_name, quantity,
      unit_price_cents, unit_cost_cents, discount_cents,
      discount_percent, subtotal_cents
    ) VALUES (
      _sale_id,
      (_item->>'product_id')::UUID,
      COALESCE(_item->>'product_name', (SELECT name FROM products WHERE id = (_item->>'product_id')::UUID)),
      (_item->>'quantity')::NUMERIC,
      (_item->>'unit_price_cents')::INTEGER,
      (_item->>'unit_cost_cents')::INTEGER,
      COALESCE((_item->>'discount_cents')::INTEGER, 0),
      COALESCE((_item->>'discount_percent')::NUMERIC, 0),
      _item_subtotal
    );

    -- Movimiento de stock (salida)
    INSERT INTO stock_movements (
      organization_id, product_id, warehouse_id, movement_type,
      quantity, unit_cost_cents, reference_type, reference_id,
      created_by
    ) VALUES (
      _org_id,
      (_item->>'product_id')::UUID,
      _warehouse_id,
      'sale_out',
      -(_item->>'quantity')::NUMERIC,
      (_item->>'unit_cost_cents')::INTEGER,
      'sale',
      _sale_id,
      _seller_id
    );
  END LOOP;

  -- Insertar pagos
  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments)
  LOOP
    INSERT INTO sale_payments (sale_id, payment_method, amount_cents, reference)
    VALUES (
      _sale_id,
      _payment->>'payment_method',
      (_payment->>'amount_cents')::INTEGER,
      _payment->>'reference'
    );
  END LOOP;

  RETURN _sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN: anular venta
-- Revierte los movimientos de stock y marca la venta como anulada
-- ============================================================================
CREATE OR REPLACE FUNCTION void_sale(
  _sale_id UUID,
  _user_id UUID,
  _reason TEXT
)
RETURNS VOID AS $$
DECLARE
  _sale RECORD;
  _item RECORD;
BEGIN
  -- Obtener la venta
  SELECT * INTO _sale FROM sales WHERE id = _sale_id;

  IF _sale IS NULL THEN
    RAISE EXCEPTION 'Venta no encontrada: %', _sale_id;
  END IF;

  IF _sale.status = 'voided' THEN
    RAISE EXCEPTION 'La venta ya está anulada';
  END IF;

  -- Revertir movimientos de stock (crear movimientos positivos de ajuste)
  FOR _item IN
    SELECT si.*, sm.warehouse_id
    FROM sale_items si
    JOIN stock_movements sm ON sm.reference_id = _sale_id
      AND sm.reference_type = 'sale'
      AND sm.product_id = si.product_id
    WHERE si.sale_id = _sale_id
    GROUP BY si.id, si.product_id, si.quantity, si.unit_cost_cents,
             si.product_name, si.unit_price_cents, si.discount_cents,
             si.discount_percent, si.subtotal_cents, si.sale_id,
             si.created_at, sm.warehouse_id
  LOOP
    INSERT INTO stock_movements (
      organization_id, product_id, warehouse_id, movement_type,
      quantity, unit_cost_cents, reference_type, reference_id,
      notes, created_by
    ) VALUES (
      _sale.organization_id,
      _item.product_id,
      _item.warehouse_id,
      'adjustment',
      _item.quantity,  -- Positivo: devuelve al stock
      _item.unit_cost_cents,
      'sale',
      _sale_id,
      'Reversión por anulación de venta ' || _sale.sale_number,
      _user_id
    );
  END LOOP;

  -- Marcar venta como anulada
  UPDATE sales SET
    status = 'voided',
    voided_at = now(),
    voided_by = _user_id,
    void_reason = _reason,
    updated_at = now()
  WHERE id = _sale_id;

  -- Auditoría
  PERFORM create_audit_log(
    _sale.organization_id,
    'void',
    'sales',
    _sale_id,
    row_to_json(_sale)::JSONB,
    NULL,
    jsonb_build_object('reason', _reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
