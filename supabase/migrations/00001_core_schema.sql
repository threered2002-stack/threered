-- ============================================================================
-- MIGRACIÓN 00001: ESQUEMA NÚCLEO
-- Profiles, Organizations, Roles, Memberships
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PROFILES (extiende auth.users de Supabase)
-- ============================================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfil público del usuario, extiende auth.users de Supabase';

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  logo_url    TEXT,
  template_id UUID,  -- FK se agrega en migración 00002
  settings    JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizations IS 'Organizaciones (tenants) del sistema';

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(id) WHERE is_active = true;

-- ============================================================================
-- ROLES
-- ============================================================================
CREATE TABLE roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  permissions     JSONB NOT NULL DEFAULT '[]',
  is_system       BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE roles IS 'Roles del sistema y personalizados por organización';
COMMENT ON COLUMN roles.is_system IS 'true = rol global no editable, false = rol custom de la org';
COMMENT ON COLUMN roles.organization_id IS 'NULL = rol global del sistema, con valor = rol de la org';

-- Un rol del sistema con ese nombre es único globalmente
CREATE UNIQUE INDEX idx_roles_system_name
  ON roles(name) WHERE is_system = true;

-- Un rol custom con ese nombre es único dentro de la org
CREATE UNIQUE INDEX idx_roles_org_name
  ON roles(organization_id, name) WHERE is_system = false AND organization_id IS NOT NULL;

-- ============================================================================
-- MEMBERSHIPS (usuario ↔ organización ↔ rol)
-- ============================================================================
CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id         UUID NOT NULL REFERENCES roles(id),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_membership_user_org UNIQUE (user_id, organization_id)
);

COMMENT ON TABLE memberships IS 'Relación usuario-organización con rol asignado';

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_org ON memberships(organization_id);
CREATE INDEX idx_memberships_active ON memberships(user_id, organization_id) WHERE is_active = true;

-- ============================================================================
-- FUNCIÓN HELPER: obtener IDs de organizaciones del usuario autenticado
-- Usada en todas las políticas RLS para performance
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id
  FROM memberships
  WHERE user_id = auth.uid()
    AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_org_ids() IS 'Retorna los organization_id del usuario autenticado (para RLS)';

-- ============================================================================
-- FUNCIÓN HELPER: verificar si el usuario tiene un permiso en una org
-- ============================================================================
CREATE OR REPLACE FUNCTION user_has_permission(
  _org_id UUID,
  _permission TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM memberships m
    JOIN roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid()
      AND m.organization_id = _org_id
      AND m.is_active = true
      AND (
        r.permissions ? _permission
        OR r.permissions ? '*'
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION user_has_permission(UUID, TEXT) IS 'Verifica si el usuario actual tiene un permiso específico en una organización';

-- ============================================================================
-- TRIGGER: updated_at automático
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
