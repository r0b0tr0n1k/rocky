-- ── Enable Row Level Security on all scoped tables ──
-- Run after migrations. Each table must have pgPolicy() defined in schema.

-- System Management
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Holder Keeper
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_errors ENABLE ROW LEVEL SECURITY;

-- Animals & Movements
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE birth_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE slaughter_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pasture_declarations ENABLE ROW LEVEL SECURITY;

-- Global reference tables do NOT have RLS enabled:
-- roles, permissions, role_permissions
-- modules, business_rules, module_business_rules
-- code_tables, system_parameters
-- states, zip_codes, communes, admin_units
