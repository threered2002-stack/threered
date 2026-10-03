-- ============================================================================
-- MIGRACIÓN 00012: Agregar notas a la vista de clientes
-- ============================================================================

DROP VIEW IF EXISTS v_customer_summary;

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
  c.notes, -- <-- Added notes here
  c.is_active,
  c.created_at,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') AS total_purchases,
  COALESCE(SUM(s.total_cents) FILTER (WHERE s.status = 'completed'), 0) AS total_spent_cents,
  MAX(s.created_at) FILTER (WHERE s.status = 'completed') AS last_purchase_at
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

COMMENT ON VIEW v_customer_summary IS 'Resumen del cliente con total de compras y último pedido y notas';
