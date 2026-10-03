CREATE POLICY "Users can manage organization modules if they are admin or owner"
ON organization_modules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON m.role_id = r.id
    WHERE m.organization_id = organization_modules.organization_id
    AND m.user_id = auth.uid()
    AND r.name IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m
    JOIN roles r ON m.role_id = r.id
    WHERE m.organization_id = organization_modules.organization_id
    AND m.user_id = auth.uid()
    AND r.name IN ('owner', 'admin')
  )
);
