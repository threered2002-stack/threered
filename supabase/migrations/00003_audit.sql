-- ============================================================================
-- MIGRACIÓN 00003: AUDITORÍA
-- Tabla de log de auditoría para cambios importantes
-- ============================================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  action          TEXT NOT NULL,  -- 'create', 'update', 'delete', 'void', 'login', etc.
  entity_type     TEXT NOT NULL,  -- nombre de la tabla afectada
  entity_id       UUID NOT NULL,  -- PK del registro afectado
  old_data        JSONB,          -- estado anterior (en updates/deletes)
  new_data        JSONB,          -- estado nuevo (en creates/updates)
  metadata        JSONB DEFAULT '{}', -- IP, user-agent, contexto extra
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_logs IS 'Log de auditoría para cambios importantes en el sistema';

-- Índices para consultas frecuentes
CREATE INDEX idx_audit_logs_org_entity
  ON audit_logs(organization_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_org_date
  ON audit_logs(organization_id, created_at);
CREATE INDEX idx_audit_logs_user
  ON audit_logs(user_id, created_at);

-- ============================================================================
-- FUNCIÓN: registrar entrada de auditoría
-- ============================================================================
CREATE OR REPLACE FUNCTION create_audit_log(
  _org_id UUID,
  _action TEXT,
  _entity_type TEXT,
  _entity_id UUID,
  _old_data JSONB DEFAULT NULL,
  _new_data JSONB DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    organization_id, user_id, action, entity_type, entity_id,
    old_data, new_data, metadata
  )
  VALUES (
    _org_id, auth.uid(), _action, _entity_type, _entity_id,
    _old_data, _new_data, _metadata
  )
  RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
