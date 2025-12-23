-- Add view_audit permission
-- Run this in Supabase SQL Editor

-- Add the view_audit permission if it doesn't exist
INSERT INTO permissions (name, description, category) VALUES
    ('view_audit', 'View audit log and system activities', 'audit')
ON CONFLICT (name) DO NOTHING;

-- Grant to super_admin role
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions WHERE name = 'view_audit'
ON CONFLICT DO NOTHING;

-- Grant to admin role (optional - you can remove this line if you don't want regular admins to see audit log)
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name = 'view_audit'
ON CONFLICT DO NOTHING;


