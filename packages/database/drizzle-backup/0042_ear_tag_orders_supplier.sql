-- ── Add supplier_organization_id FK to ear_tag_orders ──
-- This enables SUPPLIER role RLS by linking orders to the supplier's org.
-- The RLS policy on ear_tag_orders allows supplier organizations to see
-- orders placed with them.

ALTER TABLE ear_tag_orders ADD COLUMN supplier_organization_id uuid REFERENCES organizations(id);
CREATE INDEX idx_ear_tag_orders_supplier ON ear_tag_orders(supplier_organization_id);

-- Re-create the RLS policy to include supplier access.
-- The old policy only checked organization_id (the BUYER).
-- The new policy also checks supplier_organization_id (the SELLER).
DROP POLICY IF EXISTS ear_tag_order_access_policy ON ear_tag_orders;
CREATE POLICY ear_tag_order_access_policy ON ear_tag_orders
  AS PERMISSIVE
  FOR ALL
  TO PUBLIC
  USING (
    current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN')
    OR organization_id = current_setting('app.current_org_id', true)::uuid
    OR supplier_organization_id = current_setting('app.current_org_id', true)::uuid
  )
  WITH CHECK (
    current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')
    OR organization_id = current_setting('app.current_org_id', true)::uuid
  );
