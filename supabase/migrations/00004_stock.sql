-- ============================================================================
-- MIGRACIÓN 00004: MÓDULO STOCK
-- Categorías, Productos, Depósitos, Movimientos, Cache de stock
-- ============================================================================

-- ============================================================================
-- CATEGORIES (categorías de productos, jerárquicas)
-- ============================================================================
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'Categorías jerárquicas de productos';

CREATE INDEX idx_categories_org ON categories(organization_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ============================================================================
-- PRODUCTS
-- ============================================================================
CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku              TEXT,
  barcode          TEXT,
  name             TEXT NOT NULL,
  description      TEXT,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  cost_price_cents INTEGER NOT NULL DEFAULT 0,
  sale_price_cents INTEGER NOT NULL DEFAULT 0,
  min_stock        NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit             TEXT NOT NULL DEFAULT 'unidad',
  image_url        TEXT,
  is_composite     BOOLEAN NOT NULL DEFAULT false,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  metadata         JSONB NOT NULL DEFAULT '{}',
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

COMMENT ON TABLE products IS 'Productos del inventario. Campos de rubro en metadata JSONB';
COMMENT ON COLUMN products.metadata IS 'Campos específicos del rubro. Vinoteca: winery, brand, varietal, wine_type, vintage, region, volume_ml';
COMMENT ON COLUMN products.is_composite IS 'true = combo/caja de regalo compuesto por otros productos';
COMMENT ON COLUMN products.cost_price_cents IS 'Último costo en centavos';
COMMENT ON COLUMN products.sale_price_cents IS 'Precio de venta en centavos';

CREATE INDEX idx_products_org ON products(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_barcode ON products(organization_id, barcode) WHERE barcode IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(organization_id, sku) WHERE sku IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_products_name ON products(organization_id, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_metadata ON products USING GIN(metadata);
CREATE INDEX idx_products_active ON products(organization_id) WHERE is_active = true AND deleted_at IS NULL;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PRODUCT_COMPONENTS (para combos / cajas de regalo)
-- ============================================================================
CREATE TABLE product_components (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity              NUMERIC(12,2) NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_product_component UNIQUE (parent_product_id, component_product_id),
  CONSTRAINT chk_no_self_reference CHECK (parent_product_id != component_product_id),
  CONSTRAINT chk_positive_quantity CHECK (quantity > 0)
);

COMMENT ON TABLE product_components IS 'Componentes de productos compuestos (combos, cajas de regalo)';

CREATE INDEX idx_product_components_parent ON product_components(parent_product_id);

-- ============================================================================
-- WAREHOUSES (depósitos / ubicaciones)
-- ============================================================================
CREATE TABLE warehouses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE warehouses IS 'Depósitos y ubicaciones físicas (salón, depósito, sucursal)';

CREATE INDEX idx_warehouses_org ON warehouses(organization_id);

-- Asegurar que solo un depósito sea default por org
CREATE UNIQUE INDEX idx_warehouses_default
  ON warehouses(organization_id) WHERE is_default = true;

-- ============================================================================
-- STOCK_MOVEMENTS (ledger de stock - tabla central)
-- ============================================================================
CREATE TABLE stock_movements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES products(id),
  warehouse_id          UUID NOT NULL REFERENCES warehouses(id),
  movement_type         TEXT NOT NULL,
  quantity              NUMERIC(12,2) NOT NULL,
  unit_cost_cents       INTEGER,
  reference_type        TEXT,
  reference_id          UUID,
  transfer_movement_id  UUID REFERENCES stock_movements(id),
  notes                 TEXT,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_movement_type CHECK (
    movement_type IN (
      'purchase_in',    -- Ingreso por compra
      'sale_out',       -- Salida por venta
      'adjustment',     -- Ajuste manual
      'loss',           -- Merma/rotura
      'transfer_in',    -- Entrada por transferencia
      'transfer_out',   -- Salida por transferencia
      'initial'         -- Stock inicial
    )
  ),
  CONSTRAINT chk_quantity_not_zero CHECK (quantity != 0)
);

COMMENT ON TABLE stock_movements IS 'Ledger de movimientos de stock. El saldo actual = SUM(quantity) por producto y depósito';
COMMENT ON COLUMN stock_movements.quantity IS 'Positivo = entrada, negativo = salida';
COMMENT ON COLUMN stock_movements.reference_type IS 'Tipo del documento origen: sale, purchase_order, adjustment, transfer';
COMMENT ON COLUMN stock_movements.reference_id IS 'FK polimórfica al documento que originó el movimiento';
COMMENT ON COLUMN stock_movements.transfer_movement_id IS 'En transferencias, apunta al movimiento par (in↔out)';

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id, warehouse_id, created_at);
CREATE INDEX idx_stock_movements_org ON stock_movements(organization_id, created_at);
CREATE INDEX idx_stock_movements_ref ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id, created_at);

-- ============================================================================
-- PRODUCT_STOCK_CACHE (cache calculado por trigger)
-- ============================================================================
CREATE TABLE product_stock_cache (
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id     UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quantity         NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_movement_at TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (product_id, warehouse_id)
);

COMMENT ON TABLE product_stock_cache IS 'Cache del stock actual por producto y depósito. Actualizado por trigger sobre stock_movements';

CREATE INDEX idx_stock_cache_org ON product_stock_cache(organization_id);
CREATE INDEX idx_stock_cache_low_stock ON product_stock_cache(organization_id, product_id)
  WHERE quantity > 0;  -- Para alertas de stock bajo se compara con products.min_stock

-- ============================================================================
-- TRIGGER: actualizar cache de stock al insertar movimiento
-- ============================================================================
CREATE OR REPLACE FUNCTION update_stock_cache()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_stock_cache (product_id, warehouse_id, organization_id, quantity, last_movement_at, updated_at)
  VALUES (NEW.product_id, NEW.warehouse_id, NEW.organization_id, NEW.quantity, NEW.created_at, now())
  ON CONFLICT (product_id, warehouse_id)
  DO UPDATE SET
    quantity = product_stock_cache.quantity + NEW.quantity,
    last_movement_at = NEW.created_at,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_movement_cache
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_cache();

-- ============================================================================
-- VISTA: stock actual con datos de producto (para queries frecuentes)
-- ============================================================================
CREATE OR REPLACE VIEW v_current_stock AS
SELECT
  psc.product_id,
  psc.warehouse_id,
  psc.organization_id,
  psc.quantity AS current_stock,
  p.name AS product_name,
  p.sku,
  p.barcode,
  p.min_stock,
  p.sale_price_cents,
  p.cost_price_cents,
  p.is_active AS product_active,
  p.metadata AS product_metadata,
  w.name AS warehouse_name,
  CASE
    WHEN psc.quantity <= 0 THEN 'sin_stock'
    WHEN psc.quantity <= p.min_stock THEN 'bajo'
    ELSE 'normal'
  END AS stock_status
FROM product_stock_cache psc
JOIN products p ON p.id = psc.product_id AND p.deleted_at IS NULL
JOIN warehouses w ON w.id = psc.warehouse_id;

COMMENT ON VIEW v_current_stock IS 'Vista de stock actual con datos de producto y estado de alerta';

-- ============================================================================
-- FUNCIÓN: transferencia de stock entre depósitos
-- ============================================================================
CREATE OR REPLACE FUNCTION transfer_stock(
  _org_id UUID,
  _product_id UUID,
  _from_warehouse_id UUID,
  _to_warehouse_id UUID,
  _quantity NUMERIC,
  _user_id UUID,
  _notes TEXT DEFAULT NULL
)
RETURNS TABLE(out_movement_id UUID, in_movement_id UUID) AS $$
DECLARE
  _out_id UUID;
  _in_id UUID;
  _current_stock NUMERIC;
BEGIN
  -- Validar que haya stock suficiente
  SELECT COALESCE(quantity, 0) INTO _current_stock
  FROM product_stock_cache
  WHERE product_id = _product_id AND warehouse_id = _from_warehouse_id;

  IF _current_stock < _quantity THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, solicitado: %', _current_stock, _quantity;
  END IF;

  -- Movimiento de salida
  INSERT INTO stock_movements (
    organization_id, product_id, warehouse_id, movement_type,
    quantity, reference_type, notes, created_by
  ) VALUES (
    _org_id, _product_id, _from_warehouse_id, 'transfer_out',
    -_quantity, 'transfer', _notes, _user_id
  ) RETURNING id INTO _out_id;

  -- Movimiento de entrada
  INSERT INTO stock_movements (
    organization_id, product_id, warehouse_id, movement_type,
    quantity, reference_type, transfer_movement_id, notes, created_by
  ) VALUES (
    _org_id, _product_id, _to_warehouse_id, 'transfer_in',
    _quantity, 'transfer', _out_id, _notes, _user_id
  ) RETURNING id INTO _in_id;

  -- Actualizar referencia cruzada
  UPDATE stock_movements SET transfer_movement_id = _in_id WHERE id = _out_id;

  RETURN QUERY SELECT _out_id, _in_id;
END;
$$ LANGUAGE plpgsql;
