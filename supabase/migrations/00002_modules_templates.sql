-- ============================================================================
-- MIGRACIÓN 00002: MÓDULOS Y PLANTILLAS
-- Catálogo de módulos, plantillas de rubro, activación de módulos por org
-- ============================================================================

-- ============================================================================
-- MODULES (catálogo global de módulos)
-- ============================================================================
CREATE TABLE modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,
  is_available  BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE modules IS 'Catálogo global de módulos disponibles en el sistema';

-- ============================================================================
-- TEMPLATES (plantillas de rubro)
-- ============================================================================
CREATE TABLE templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  default_modules  JSONB NOT NULL DEFAULT '[]',
  default_settings JSONB NOT NULL DEFAULT '{}',
  product_fields   JSONB NOT NULL DEFAULT '[]',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE templates IS 'Plantillas de rubro que definen módulos y configuraciones por defecto';
COMMENT ON COLUMN templates.product_fields IS 'Definición de campos extra de producto para este rubro (nombre, tipo, opciones, etc.)';

-- Ahora agrego la FK de organizations → templates
ALTER TABLE organizations
  ADD CONSTRAINT fk_organizations_template
  FOREIGN KEY (template_id) REFERENCES templates(id);

-- ============================================================================
-- ORGANIZATION_MODULES (módulos activos por organización)
-- ============================================================================
CREATE TABLE organization_modules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  settings        JSONB NOT NULL DEFAULT '{}',
  activated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_by    UUID REFERENCES auth.users(id),

  CONSTRAINT uq_org_module UNIQUE (organization_id, module_id)
);

COMMENT ON TABLE organization_modules IS 'Relación de módulos activos por organización';

CREATE INDEX idx_org_modules_org ON organization_modules(organization_id);
CREATE INDEX idx_org_modules_active ON organization_modules(organization_id, module_id) WHERE is_active = true;

-- ============================================================================
-- FUNCIÓN: activar módulos de una plantilla al crear una organización
-- ============================================================================
CREATE OR REPLACE FUNCTION activate_template_modules(
  _org_id UUID,
  _template_id UUID,
  _user_id UUID
)
RETURNS VOID AS $$
DECLARE
  _module_slug TEXT;
  _module_id UUID;
  _default_modules JSONB;
BEGIN
  -- Obtener los módulos por defecto de la plantilla
  SELECT default_modules INTO _default_modules
  FROM templates
  WHERE id = _template_id;

  -- Activar cada módulo
  FOR _module_slug IN SELECT jsonb_array_elements_text(_default_modules)
  LOOP
    SELECT id INTO _module_id FROM modules WHERE slug = _module_slug;

    IF _module_id IS NOT NULL THEN
      INSERT INTO organization_modules (organization_id, module_id, is_active, activated_by)
      VALUES (_org_id, _module_id, true, _user_id)
      ON CONFLICT (organization_id, module_id) DO UPDATE
        SET is_active = true, activated_by = _user_id, activated_at = now();
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCIÓN HELPER: verificar si un módulo está activo para una org
-- ============================================================================
CREATE OR REPLACE FUNCTION org_has_module(
  _org_id UUID,
  _module_slug TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_modules om
    JOIN modules m ON m.id = om.module_id
    WHERE om.organization_id = _org_id
      AND m.slug = _module_slug
      AND om.is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
