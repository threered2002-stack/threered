-- ============================================================================
-- MIGRACIÓN 00011: DATOS SEMILLA
-- Roles del sistema, catálogo de módulos, plantilla Vinoteca
-- ============================================================================

-- ============================================================================
-- MÓDULOS DEL SISTEMA
-- ============================================================================
INSERT INTO modules (slug, name, description, icon, is_available, sort_order) VALUES
  ('stock',       'Stock e Inventario',     'Gestión de productos, stock, depósitos y movimientos de inventario',     'Package',       true,  1),
  ('sales',       'Ventas',                 'Punto de venta, carrito, pagos, cierre de caja e historial',             'ShoppingCart',  true,  2),
  ('customers',   'Clientes',               'Ficha de clientes, contacto, historial de compras y notas',             'Users',         true,  3),
  ('purchases',   'Proveedores y Compras',  'Órdenes de compra, recepción de mercadería y cuentas por pagar',        'Truck',         true,  4),
  ('finance',     'Finanzas',               'Caja, ingresos y egresos, cuentas por cobrar/pagar, reportes',          'DollarSign',    true,  5),
  ('reports',     'Reportes',               'Análisis de ventas, productos, márgenes, stock y rendimiento',          'BarChart3',     true,  6),
  ('employees',   'Empleados',              'Gestión de personal, turnos, asistencia y liquidaciones',               'UserCheck',     false, 7),
  ('vehicles',    'Vehículos',              'Flota de vehículos, mantenimiento y seguimiento',                       'Car',           false, 8),
  ('logistics',   'Logística',              'Rutas de reparto, seguimiento de envíos y entregas',                    'MapPin',        false, 9),
  ('chat',        'Chat y Redes',           'Integración con WhatsApp, Instagram y Facebook para atención',          'MessageCircle', false, 10),
  ('ecommerce',   'E-commerce',             'Tienda online, catálogo público, pedidos y pagos',                      'Globe',         false, 11);

-- ============================================================================
-- ROLES DEL SISTEMA
-- ============================================================================
INSERT INTO roles (name, display_name, permissions, is_system, organization_id) VALUES
  (
    'owner',
    'Dueño',
    '["*"]'::JSONB,
    true,
    NULL
  ),
  (
    'admin',
    'Administrador',
    '["stock.read","stock.write","stock.delete","sales.read","sales.write","sales.void","customers.read","customers.write","customers.delete","purchases.read","purchases.write","finance.read","finance.write","reports.read","settings.read","settings.write","users.read","users.write"]'::JSONB,
    true,
    NULL
  ),
  (
    'seller',
    'Vendedor',
    '["stock.read","sales.read","sales.write","customers.read","customers.write","reports.read"]'::JSONB,
    true,
    NULL
  ),
  (
    'warehouse',
    'Depósito',
    '["stock.read","stock.write","purchases.read","purchases.receive"]'::JSONB,
    true,
    NULL
  );

-- ============================================================================
-- PLANTILLA: VINOTECA
-- ============================================================================
INSERT INTO templates (slug, name, description, default_modules, default_settings, product_fields) VALUES
  (
    'vinoteca',
    'Vinoteca',
    'Plantilla para comercio de vinos, espumantes y bebidas. Incluye campos específicos como bodega, varietal, tipo, cosecha y región.',
    '["stock","sales","customers","purchases","finance","reports"]'::JSONB,
    '{
      "currency": "ARS",
      "currency_symbol": "$",
      "timezone": "America/Argentina/Buenos_Aires",
      "decimal_separator": ",",
      "thousands_separator": ".",
      "date_format": "DD/MM/YYYY",
      "business_type": "vinoteca"
    }'::JSONB,
    '[
      {
        "key": "winery",
        "label": "Bodega",
        "type": "text",
        "required": false,
        "placeholder": "Ej: Catena Zapata"
      },
      {
        "key": "brand",
        "label": "Marca / Línea",
        "type": "text",
        "required": false,
        "placeholder": "Ej: Catena Alta"
      },
      {
        "key": "varietal",
        "label": "Varietal / Cepa",
        "type": "select",
        "required": false,
        "options": [
          "Malbec", "Cabernet Sauvignon", "Merlot", "Pinot Noir",
          "Syrah", "Tempranillo", "Bonarda", "Tannat",
          "Chardonnay", "Sauvignon Blanc", "Torrontés", "Viognier",
          "Riesling", "Gewürztraminer", "Semillón", "Blend",
          "Otro"
        ]
      },
      {
        "key": "wine_type",
        "label": "Tipo de Vino",
        "type": "select",
        "required": false,
        "options": ["Tinto", "Blanco", "Rosado", "Espumante", "Dulce", "Fortificado", "Otro"]
      },
      {
        "key": "vintage",
        "label": "Cosecha / Añada",
        "type": "number",
        "required": false,
        "placeholder": "Ej: 2020",
        "min": 1900,
        "max": 2100
      },
      {
        "key": "region",
        "label": "Región / Origen",
        "type": "text",
        "required": false,
        "placeholder": "Ej: Valle de Uco, Mendoza"
      },
      {
        "key": "volume_ml",
        "label": "Volumen (ml)",
        "type": "select",
        "required": false,
        "options": ["187", "375", "500", "750", "1000", "1500", "3000", "6000"],
        "default": "750"
      }
    ]'::JSONB
  );

-- ============================================================================
-- CATEGORÍAS POR DEFECTO PARA FINANZAS (se crean por org)
-- Estas se usarán como plantilla al crear una organización
-- ============================================================================

-- Nota: las categorías financieras se crean en runtime al activar el módulo
-- de finanzas para una organización. Aquí definimos las predeterminadas
-- en la plantilla como parte de default_settings.
-- La lógica de la app las insertará al crear la org.

-- ============================================================================
-- FIN DEL SEED
-- ============================================================================
