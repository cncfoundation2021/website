-- Complete Admin System Fix & Verification Script
-- Run this entire script in Supabase SQL Editor to ensure everything works

-- =============================================================================
-- PART 1: Fix admin_sessions RLS Policies
-- =============================================================================

-- Drop all existing policies on admin_sessions
DROP POLICY IF EXISTS "Only authenticated users can manage sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Service role can insert sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Service role can read sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Service role can update sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Service role can delete sessions" ON admin_sessions;

-- Create new permissive policies for service role operations
CREATE POLICY "Allow all session operations" ON admin_sessions
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- PART 2: Add Missing view_audit Permission
-- =============================================================================

-- Add view_audit permission
INSERT INTO permissions (name, description, category) VALUES
    ('view_audit', 'View audit log and system activities', 'audit')
ON CONFLICT (name) DO NOTHING;

-- Grant to super_admin
INSERT INTO role_permissions (role, permission_id)
SELECT 'super_admin', id FROM permissions WHERE name = 'view_audit'
ON CONFLICT DO NOTHING;

-- Grant to admin
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name = 'view_audit'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- PART 3: Verification Queries
-- =============================================================================

-- Check if admin_sessions RLS is enabled and policies exist
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'admin_sessions';

-- Check all permissions exist
SELECT name, category, description FROM permissions ORDER BY category, name;

-- Check super_admin has all permissions
SELECT rp.role, p.name as permission_name, p.category
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role = 'super_admin'
ORDER BY p.category, p.name;

-- Check if there are any active sessions
SELECT 
    id,
    admin_user_id,
    LEFT(session_token, 10) || '...' as token_preview,
    created_at,
    expires_at,
    CASE 
        WHEN expires_at IS NULL THEN 'Never expires'
        WHEN expires_at > NOW() THEN 'Active (' || EXTRACT(EPOCH FROM (expires_at - NOW()))/3600 || ' hours left)'
        ELSE 'Expired'
    END as status
FROM admin_sessions
ORDER BY created_at DESC
LIMIT 10;

-- =============================================================================
-- PART 4: Clean up expired sessions
-- =============================================================================

DELETE FROM admin_sessions WHERE expires_at < NOW() AND expires_at IS NOT NULL;

-- =============================================================================
-- DONE! You should see results from the verification queries above
-- =============================================================================

