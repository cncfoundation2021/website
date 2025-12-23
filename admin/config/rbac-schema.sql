-- RBAC (Role-Based Access Control) Schema Extension
-- Run this SQL in your Supabase SQL Editor to add RBAC functionality

-- Permissions Table - Defines all available permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'overview', 'requests', 'feedback', 'users', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions Table - Maps permissions to roles
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin', 'viewer', 'manager')),
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- User Custom Permissions Table - User-specific permission overrides
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true, -- true = grant, false = revoke
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(admin_user_id, permission_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Create updated_at trigger for user_permissions
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE
    ON user_permissions FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view permissions" ON permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view role permissions" ON role_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view user permissions" ON user_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only super admins can modify permissions
CREATE POLICY "Only super admins can manage permissions" ON permissions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Only super admins can manage role permissions" ON role_permissions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Only super admins can manage user permissions" ON user_permissions
    FOR ALL USING (auth.role() = 'authenticated');

-- Update admin_users table to add role column with more options
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
    CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer'));

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
    ('view_overview', 'View dashboard overview and statistics', 'overview'),
    ('view_requests', 'View service requests', 'requests'),
    ('create_requests', 'Create new service requests', 'requests'),
    ('update_requests', 'Update service request status and details', 'requests'),
    ('delete_requests', 'Delete service requests', 'requests'),
    ('add_comments', 'Add comments to service requests', 'requests'),
    ('view_feedback', 'View website feedback', 'feedback'),
    ('delete_feedback', 'Delete feedback entries', 'feedback'),
    ('view_users', 'View admin users list', 'users'),
    ('create_users', 'Create new admin users', 'users'),
    ('update_users', 'Update admin user details and permissions', 'users'),
    ('delete_users', 'Delete admin users', 'users'),
    ('manage_permissions', 'Manage user roles and permissions', 'users')
ON CONFLICT (name) DO NOTHING;

-- Define default role permissions
-- Super Admin: Full access to everything
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- Admin: Access to most features except user management
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name IN (
    'view_overview',
    'view_requests', 'create_requests', 'update_requests', 'add_comments',
    'view_feedback',
    'view_users'
)
ON CONFLICT DO NOTHING;

-- Manager: Can manage requests and view feedback
INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions 
WHERE name IN (
    'view_overview',
    'view_requests', 'update_requests', 'add_comments',
    'view_feedback'
)
ON CONFLICT DO NOTHING;

-- Viewer: Read-only access
INSERT INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions 
WHERE name IN (
    'view_overview',
    'view_requests',
    'view_feedback'
)
ON CONFLICT DO NOTHING;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_has_permission BOOLEAN;
    v_custom_permission BOOLEAN;
BEGIN
    -- Get user role
    SELECT role INTO v_role FROM admin_users WHERE id = p_user_id AND is_active = true;
    
    IF v_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Super admin has all permissions
    IF v_role = 'super_admin' THEN
        RETURN true;
    END IF;
    
    -- Check for custom user permission (overrides role permission)
    SELECT up.granted INTO v_custom_permission
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.admin_user_id = p_user_id AND p.name = p_permission_name;
    
    IF v_custom_permission IS NOT NULL THEN
        RETURN v_custom_permission;
    END IF;
    
    -- Check role permission
    SELECT EXISTS(
        SELECT 1 FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = v_role AND p.name = p_permission_name
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_name TEXT, granted BOOLEAN, source TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH user_role AS (
        SELECT role FROM admin_users WHERE id = p_user_id
    ),
    role_perms AS (
        SELECT p.name, true as granted, 'role' as source
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN user_role ur ON rp.role = ur.role
    ),
    custom_perms AS (
        SELECT p.name, up.granted, 'custom' as source
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.admin_user_id = p_user_id
    )
    SELECT 
        COALESCE(cp.name, rp.name) as permission_name,
        COALESCE(cp.granted, rp.granted) as granted,
        COALESCE(cp.source, rp.source) as source
    FROM role_perms rp
    FULL OUTER JOIN custom_perms cp ON rp.name = cp.name
    WHERE COALESCE(cp.granted, rp.granted) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit log table for user management actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create_user', 'update_user', 'delete_user', 'grant_permission', etc.
    target_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit log" ON admin_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert audit log" ON admin_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

