-- Fix para el trigger de actualización de stock
-- El trigger necesita ejecutarse con permisos elevados (SECURITY DEFINER) para poder insertar/actualizar
-- en la tabla product_stock_cache, la cual tiene RLS habilitado pero no tiene políticas de INSERT/UPDATE
-- para los usuarios comunes (como manda el diseño del ledger inmutable).

CREATE OR REPLACE FUNCTION update_stock_cache()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
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
