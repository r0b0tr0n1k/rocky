-- ═══════════════════════════════════════════════════════════════
-- Seed: Permissions & Role→Permission Mappings
-- Based on: SM.PDF (privileges), FS-HK, FS-Eartags, FS-Registration
-- ═══════════════════════════════════════════════════════════════
--
-- Architecture:
--   Layer 1: pgPolicy (RLS) — which rows you see
--   Layer 2: RLSMiddleware — SET LOCAL session vars
--   Layer 3: PermissionGuard — whether you can CALL this procedure
--
-- This seed populates Layer 3's data.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- 1. PERMISSIONS — resource:action pairs
-- ═══════════════════════════════════════════════════════════════

-- System Management
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('sm:users',    'read',  'View system users',                    '*'),
  ('sm:users',    'write', 'Create/update/delete system users',    '*'),
  ('sm:roles',    'read',  'View roles and their permissions',     '*'),
  ('sm:roles',    'write', 'Create/update/delete roles',           '*'),
  ('sm:orgs',     'read',  'View organizations',                   '*'),
  ('sm:orgs',     'write', 'Create/update/delete organizations',   '*'),
  ('sm:audit',    'read',  'View audit log',                       '*'),
  ('sm:sysparams','read',  'View system parameters',               '*'),
  ('sm:sysparams','write', 'Modify system parameters',              '*')
ON CONFLICT (resource, action) DO NOTHING;

-- Holder/Keeper (HK) Module
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('hk:farm',     'read',  'View farm/holding data',               'org'),
  ('hk:farm',     'write', 'Create/update farms',                  'org'),
  ('hk:subject',  'read',  'View holder/keeper data',              'org'),
  ('hk:subject',  'write', 'Create/update holder/keeper records',  'org'),
  ('hk:address',  'read',  'View addresses',                       'org'),
  ('hk:address',  'write', 'Create/update addresses',              'org'),
  ('hk:binding',  'read',  'View holder-farm bindings',            'org'),
  ('hk:binding',  'write', 'Manage holder-farm bindings',          'org'),
  ('hk:import',   'admin', 'Import HK data from flat files/PDA',   '*')
ON CONFLICT (resource, action) DO NOTHING;

-- Animal Module
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('animal',      'read',     'View animal records',               'farm'),
  ('animal',      'register', 'Register new animals',              'farm'),
  ('animal',      'write',    'Update animal data',                'farm'),
  ('animal',      'death',    'Record animal death/stillborn',     'farm')
ON CONFLICT (resource, action) DO NOTHING;

-- Movement Module
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('movement',    'read',      'View movement records',            'farm'),
  ('movement',    'write',     'Record animal movements',          'farm'),
  ('movement',    'import',    'Import animals from other states', 'org'),
  ('movement',    'export',    'Export animals',                   'org'),
  ('movement',    'pasture',   'Declare pasture movements',        'farm')
ON CONFLICT (resource, action) DO NOTHING;

-- Ear Tag Module
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('eartag',      'read',            'View ear tag data',           'org'),
  ('eartag',      'generate',        'Generate new ear tag numbers','*'),
  ('eartag',      'order',           'Place ear tag orders',        'farm'),
  ('eartag',      'order:cancel',    'Cancel own ear tag orders',   'farm'),
  ('eartag',      'order:cancel:any','Cancel any ear tag order',    '*'),
  ('eartag',      'order:view_all',  'View all orders system-wide', '*'),
  ('eartag',      'supply',          'Manage supplier contingents', '*'),
  ('eartag',      'collect_orders',  'Collect orders for printing', 'org'),
  ('eartag',      'confirm_delivery','Confirm ear tag delivery',    'org'),
  ('eartag',      'allocate',        'Allocate tags to vet stations','*')
ON CONFLICT (resource, action) DO NOTHING;

-- Slaughter Module
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('slaughter',   'read',    'View slaughter records',             'farm'),
  ('slaughter',   'register','Register slaughter',                 'farm')
ON CONFLICT (resource, action) DO NOTHING;

-- Birth Notification Module
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('birth_notification', 'read',  'View birth notifications',      'farm'),
  ('birth_notification', 'write', 'Record birth notifications',    'farm')
ON CONFLICT (resource, action) DO NOTHING;

-- Pasture Module
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('pasture',     'read',     'View pasture declarations',         'farm'),
  ('pasture',     'declare',  'Declare pasture movements',         'farm')
ON CONFLICT (resource, action) DO NOTHING;

-- Analysis / Reports
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('analysis',    'read',  'View risk analyses',                   '*'),
  ('analysis',    'run',   'Execute risk analyses',                '*'),
  ('report',      'read',  'View system reports',                  'org'),
  ('report',      'generate', 'Generate reports',                  'org')
ON CONFLICT (resource, action) DO NOTHING;

-- PDA / Mobile
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('pda',         'sync',  'Sync data with PDA subsystem',         'org'),
  ('pda',         'import','Import PDA field data',                '*')
ON CONFLICT (resource, action) DO NOTHING;

-- Notification Module
INSERT INTO permissions (resource, action, description, scope) VALUES
  ('notification','read',  'View notifications',                   'org'),
  ('notification','write', 'Send/manage notifications',            'org'),
  ('notification','admin', 'Configure notification templates',     '*')
ON CONFLICT (resource, action) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 2. ROLE → PERMISSION MAPPINGS
-- ═══════════════════════════════════════════════════════════════
--
-- Based on the FS documents:
--   SUPER_ADMIN     → everything
--   VD_ADMIN        → everything (minus system config)
--   VD_STAFF        → everything read + HK write + eartag supply
--   VETERINARIAN    → animal/movement write, scoped to org area
--   TECHNICIAN      → animal register, eartag order, scoped to org
--   SUPPLIER        → eartag collect/deliver, scoped to supplier org
--   SLAUGHTERHOUSE_OP → slaughter, animal read, own farm only
--   MARKET_OP      → movement write at market, own farm only
--   FARMER          → own animal read, eartag order, own farm only
-- ═══════════════════════════════════════════════════════════════

-- Helper: lookup permission_id by resource:action
-- (Use a temp table to avoid repeating subqueries)
CREATE TEMP TABLE perm_id AS
  SELECT resource, action, id FROM permissions;

-- ── SUPER_ADMIN: everything ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'SUPER_ADMIN'
  AND r.is_system = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ── VD_ADMIN: everything ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'VD_ADMIN'
  AND r.is_system = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ── VD_STAFF: full read + HK/eartag/admin writes ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'VD_STAFF'
  AND r.is_system = true
  AND p.resource || ':' || p.action IN (
    -- All reads
    'sm:users:read', 'sm:roles:read', 'sm:orgs:read', 'sm:audit:read', 'sm:sysparams:read',
    'hk:farm:read', 'hk:subject:read', 'hk:address:read', 'hk:binding:read',
    'animal:read',
    'movement:read',
    'eartag:read', 'eartag:order:view_all',
    'slaughter:read',
    'birth_notification:read',
    'pasture:read',
    'analysis:read',
    'report:read', 'report:generate',
    'notification:read',
    -- HK writes (VD manages HK data)
    'hk:farm:write', 'hk:subject:write', 'hk:address:write', 'hk:binding:write', 'hk:import',
    -- Ear tag management
    'eartag:generate', 'eartag:supply', 'eartag:allocate',
    -- Admin
    'sm:roles:write', 'sm:users:write', 'sm:orgs:write',
    'notification:write', 'notification:admin',
    -- PDA
    'pda:sync', 'pda:import'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ── VETERINARIAN: animal ops, movement, eartag orders, org-scoped ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'VETERINARIAN'
  AND r.is_system = true
  AND p.resource || ':' || p.action IN (
    'animal:read', 'animal:register', 'animal:write', 'animal:death',
    'movement:read', 'movement:write',
    'eartag:read', 'eartag:order',
    'birth_notification:read', 'birth_notification:write',
    'slaughter:read',
    'pasture:read', 'pasture:declare',
    'report:read',
    'hk:farm:read', 'hk:subject:read', 'hk:address:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ── TECHNICIAN: animal registration, eartag ops, org-scoped ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'TECHNICIAN'
  AND r.is_system = true
  AND p.resource || ':' || p.action IN (
    'animal:read', 'animal:register',
    'movement:read',
    'eartag:read', 'eartag:order',
    'hk:farm:read', 'hk:subject:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ── SUPPLIER: ear tag order management only ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'SUPPLIER'
  AND r.is_system = true
  AND p.resource || ':' || p.action IN (
    'eartag:read', 'eartag:order:view_all',
    'eartag:collect_orders', 'eartag:confirm_delivery',
    'hk:farm:read',
    'report:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ── SLAUGHTERHOUSE_OP: slaughter + own animal read, farm-scoped ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'SLAUGHTERHOUSE_OP'
  AND r.is_system = true
  AND p.resource || ':' || p.action IN (
    'animal:read',
    'movement:read',
    'slaughter:read', 'slaughter:register',
    'eartag:read',
    'hk:farm:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ── MARKET_OP: movement write at market, own farm only ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'MARKET_OP'
  AND r.is_system = true
  AND p.resource || ':' || p.action IN (
    'animal:read',
    'movement:read', 'movement:write',
    'eartag:read',
    'hk:farm:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ── FARMER: own animal read, eartag orders, own farm only ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'FARMER'
  AND r.is_system = true
  AND p.resource || ':' || p.action IN (
    'animal:read',
    'movement:read',
    'eartag:read', 'eartag:order',
    'birth_notification:read', 'birth_notification:write',
    'pasture:read', 'pasture:declare',
    'hk:farm:read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

DROP TABLE IF EXISTS perm_id;

COMMIT;
