-- ============================================================================
-- MIGRACIÓN 00010: FUNCIONES AUXILIARES Y VISTAS DE REPORTES
-- ============================================================================

-- ============================================================================
-- VISTA: Productos más vendidos
-- ============================================================================
CREATE OR REPLACE VIEW v_top_products AS
SELECT
  si.product_id,
  p.organization_id,
  p.name AS product_name,
  p.sku,
  p.metadata,
  SUM(si.quantity) AS total_quantity_sold,
  SUM(si.subtotal_cents) AS total_revenue_cents,
  SUM(si.quantity * si.unit_cost_cents) AS total_cost_cents,
  SUM(si.subtotal_cents) - SUM(si.quantity * si.unit_cost_cents)::INTEGER AS total_margin_cents,
  CASE
    WHEN SUM(si.subtotal_cents) > 0
    THEN ROUND(
      ((SUM(si.subtotal_cents) - SUM(si.quantity * si.unit_cost_cents)) * 100.0)
      / SUM(si.subtotal_cents), 2
    )
    ELSE 0
  END AS margin_percent
FROM sale_items si
JOIN products p ON p.id = si.product_id
JOIN sales s ON s.id = si.sale_id AND s.status = 'completed'
GROUP BY si.product_id, p.organization_id, p.name, p.sku, p.metadata;

COMMENT ON VIEW v_top_products IS 'Productos más vendidos con revenue, costo y margen';

-- ============================================================================
-- VISTA: Stock valorizado
-- ============================================================================
CREATE OR REPLACE VIEW v_stock_valuation AS
SELECT
  psc.organization_id,
  psc.product_id,
  p.name AS product_name,
  p.sku,
  psc.warehouse_id,
  w.name AS warehouse_name,
  psc.quantity AS current_stock,
  p.cost_price_cents,
  p.sale_price_cents,
  (psc.quantity * p.cost_price_cents)::INTEGER AS stock_value_cost_cents,
  (psc.quantity * p.sale_price_cents)::INTEGER AS stock_value_sale_cents
FROM product_stock_cache psc
JOIN products p ON p.id = psc.product_id AND p.deleted_at IS NULL
JOIN warehouses w ON w.id = psc.warehouse_id
WHERE psc.quantity > 0;

COMMENT ON VIEW v_stock_valuation IS 'Stock valorizado al costo y al precio de venta';

-- ============================================================================
-- VISTA: Ventas por vendedor
-- ============================================================================
CREATE OR REPLACE VIEW v_sales_by_seller AS
SELECT
  s.organization_id,
  s.seller_id,
  pr.full_name AS seller_name,
  COUNT(s.id) AS total_sales,
  SUM(s.total_cents) AS total_revenue_cents,
  AVG(s.total_cents)::INTEGER AS avg_sale_cents,
  SUM(s.discount_cents) AS total_discounts_cents,
  date_trunc('day', s.created_at)::DATE AS sale_date
FROM sales s
JOIN profiles pr ON pr.id = s.seller_id
WHERE s.status = 'completed'
GROUP BY s.organization_id, s.seller_id, pr.full_name, date_trunc('day', s.created_at);

COMMENT ON VIEW v_sales_by_seller IS 'Resumen de ventas por vendedor y día';

-- ============================================================================
-- VISTA: Ventas diarias
-- ============================================================================
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT
  s.organization_id,
  date_trunc('day', s.created_at)::DATE AS sale_date,
  COUNT(s.id) AS total_sales,
  SUM(s.total_cents) AS total_revenue_cents,
  SUM(s.discount_cents) AS total_discounts_cents,
  SUM(s.total_cents) - SUM(s.discount_cents) AS net_revenue_cents,
  COUNT(DISTINCT s.customer_id) AS unique_customers,
  COUNT(DISTINCT s.seller_id) AS active_sellers
FROM sales s
WHERE s.status = 'completed'
GROUP BY s.organization_id, date_trunc('day', s.created_at);

COMMENT ON VIEW v_daily_sales IS 'Resumen de ventas por día';

-- ============================================================================
-- VISTA: Rentabilidad por producto
-- ============================================================================
CREATE OR REPLACE VIEW v_product_profitability AS
SELECT
  p.organization_id,
  p.id AS product_id,
  p.name,
  p.sku,
  p.cost_price_cents,
  p.sale_price_cents,
  p.sale_price_cents - p.cost_price_cents AS unit_margin_cents,
  CASE
    WHEN p.sale_price_cents > 0
    THEN ROUND(((p.sale_price_cents - p.cost_price_cents) * 100.0) / p.sale_price_cents, 2)
    ELSE 0
  END AS margin_percent,
  COALESCE(sold.total_quantity, 0) AS total_quantity_sold,
  COALESCE(sold.total_revenue_cents, 0) AS total_revenue_cents,
  COALESCE(sold.total_cost_cents, 0) AS total_cost_cents,
  COALESCE(sold.total_revenue_cents - sold.total_cost_cents, 0) AS total_profit_cents,
  COALESCE(stock.total_stock, 0) AS current_stock
FROM products p
LEFT JOIN LATERAL (
  SELECT
    SUM(si.quantity) AS total_quantity,
    SUM(si.subtotal_cents) AS total_revenue_cents,
    SUM(si.quantity * si.unit_cost_cents)::INTEGER AS total_cost_cents
  FROM sale_items si
  JOIN sales s ON s.id = si.sale_id AND s.status = 'completed'
  WHERE si.product_id = p.id
) sold ON true
LEFT JOIN LATERAL (
  SELECT SUM(psc.quantity) AS total_stock
  FROM product_stock_cache psc
  WHERE psc.product_id = p.id
) stock ON true
WHERE p.deleted_at IS NULL AND p.is_active = true;

COMMENT ON VIEW v_product_profitability IS 'Rentabilidad por producto: margen unitario, ventas totales y stock';

-- ============================================================================
-- FUNCIÓN: resumen de caja de un período
-- ============================================================================
CREATE OR REPLACE FUNCTION get_cash_session_summary(_session_id UUID)
RETURNS TABLE(
  payment_method TEXT,
  total_amount_cents BIGINT,
  sale_count BIGINT
) AS $$
  SELECT
    sp.payment_method,
    SUM(sp.amount_cents) AS total_amount_cents,
    COUNT(DISTINCT s.id) AS sale_count
  FROM sale_payments sp
  JOIN sales s ON s.id = sp.sale_id
  WHERE s.cash_session_id = _session_id
    AND s.status = 'completed'
  GROUP BY sp.payment_method;
$$ LANGUAGE sql STABLE;
