-- ============================================================================
-- MIGRACIÓN 00015: EQUIPO, ROLES E INVITACIONES
-- ============================================================================

-- 1. Agregar email a profiles si no existe y actualizar trigger
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

DO $$
BEGIN
  -- Backfill de emails desde auth.users
  UPDATE profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Actualizar función handle_new_user para guardar el email automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TABLA: ORGANIZATION_INVITATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  invited_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'canceled')),
  token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE organization_invitations IS 'Invitaciones pendientes y procesadas para unirse a una organización';

CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(lower(email));
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_invitations_pending_email 
  ON organization_invitations(organization_id, lower(email)) 
  WHERE status = 'pending';

-- Habilitar RLS
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para organization_invitations
CREATE POLICY "Users can view invitations for their organizations"
  ON organization_invitations FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Admins and owners can insert invitations"
  ON organization_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    AND (
      user_has_permission(organization_id, 'users.write')
      OR user_has_permission(organization_id, '*')
    )
  );

CREATE POLICY "Admins and owners can update invitations"
  ON organization_invitations FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    AND (
      user_has_permission(organization_id, 'users.write')
      OR user_has_permission(organization_id, '*')
    )
  )
  WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    AND (
      user_has_permission(organization_id, 'users.write')
      OR user_has_permission(organization_id, '*')
    )
  );

CREATE POLICY "Admins and owners can delete invitations"
  ON organization_invitations FOR DELETE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    AND (
      user_has_permission(organization_id, 'users.write')
      OR user_has_permission(organization_id, '*')
    )
  );

-- ============================================================================
-- POLÍTICAS RLS ADICIONALES PARA MEMBERSHIPS
-- ============================================================================
CREATE POLICY "Admins and owners can insert memberships"
  ON memberships FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    AND (
      user_has_permission(organization_id, 'users.write')
      OR user_has_permission(organization_id, '*')
    )
  );

CREATE POLICY "Admins and owners can update memberships"
  ON memberships FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    AND (
      user_has_permission(organization_id, 'users.write')
      OR user_has_permission(organization_id, '*')
    )
  )
  WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    AND (
      user_has_permission(organization_id, 'users.write')
      OR user_has_permission(organization_id, '*')
    )
  );

CREATE POLICY "Admins and owners can delete memberships"
  ON memberships FOR DELETE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    AND (
      user_has_permission(organization_id, 'users.write')
      OR user_has_permission(organization_id, '*')
    )
  );
