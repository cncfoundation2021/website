/**
 * Admin User Management API with RBAC
 * Handles CRUD operations for admin users with role-based permissions
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Use NEXT_PUBLIC_SUPABASE_URL for consistency, fallback to SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('Supabase Key:', supabaseKey ? 'Set' : 'Missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to verify session and get user
async function verifySession(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.split(' ')[1];
    
    const now = new Date().toISOString();
    const { data: session, error } = await supabase
        .from('admin_sessions')
        .select('*, admin_users(*)')
        .eq('session_token', token)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .single();

    if (error || !session) {
        console.error('Session verification error:', error);
        return { success: false, error: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' };
    }

    // Handle array result from relation (should be single user)
    const user = Array.isArray(session.admin_users) ? session.admin_users[0] : session.admin_users;
    
    if (!user) {
        console.error('User not found in session');
        return { success: false, error: 'User not found' };
    }

    if (!user.is_active) {
        return { success: false, error: 'User account is inactive' };
    }

    return { success: true, user };
}

// Check if user has specific permission
async function checkPermission(userId, permissionName) {
    try {
        const { data, error } = await supabase
            .rpc('user_has_permission', {
                p_user_id: userId,
                p_permission_name: permissionName
            });

        if (error) {
            console.error('Permission check error:', error);
            // If function doesn't exist, check if user is super_admin
            if (error.code === '42883' || error.message?.includes('function')) {
                const { data: user } = await supabase
                    .from('admin_users')
                    .select('role')
                    .eq('id', userId)
                    .single();
                return user?.role === 'super_admin';
            }
            return false;
        }

        return data === true;
    } catch (err) {
        console.error('Permission check exception:', err);
        return false;
    }
}

// Get user's permissions
async function getUserPermissions(userId) {
    try {
        const { data, error } = await supabase
            .rpc('get_user_permissions', {
                p_user_id: userId
            });

        if (error) {
            console.error('Get permissions error:', error);
            // If function doesn't exist, return empty array
            if (error.code === '42883' || error.message?.includes('function')) {
                console.warn('RBAC schema not installed. Please run admin/config/rbac-schema.sql in Supabase');
                return [];
            }
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Get permissions exception:', err);
        return [];
    }
}

// Log admin action
async function logAuditAction(adminUserId, action, targetUserId, details, ipAddress) {
    try {
        const { error } = await supabase
            .from('admin_audit_log')
            .insert({
                admin_user_id: adminUserId,
                action,
                target_user_id: targetUserId,
                details: details || {},
                ip_address: ipAddress || 'unknown',
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to log audit action:', error);
        } else {
            console.log(`✅ Audit logged: ${action} by user ${adminUserId}`);
        }
    } catch (err) {
        console.error('Audit logging error:', err);
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const authResult = await verifySession(req.headers.authorization);
        if (!authResult.success) {
            return res.status(401).json({ success: false, message: authResult.error });
        }

        const currentUser = authResult.user;
        const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

        // GET - List users or get user details
        if (req.method === 'GET') {
            const hasPermission = await checkPermission(currentUser.id, 'view_users');
            if (!hasPermission) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to view users' 
                });
            }

            const { userId, audit } = req.query;

            // Handle audit log requests
            if (audit === 'true') {
                const { action, limit = 100 } = req.query;
                
                let query = supabase
                    .from('admin_audit_log')
                    .select(`
                        *,
                        admin_user:admin_user_id (
                            id, username, full_name, email
                        ),
                        target_user:target_user_id (
                            id, username, full_name, email
                        )
                    `)
                    .order('created_at', { ascending: false })
                    .limit(parseInt(limit));

                if (action && action !== 'all') {
                    query = query.eq('action', action);
                }

                const { data: auditLogs, error } = await query;

                if (error) {
                    console.error('Audit log query error:', error);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to fetch audit log' 
                    });
                }

                return res.status(200).json({
                    success: true,
                    auditLogs: auditLogs || []
                });
            }

            if (userId) {
                // Get specific user with permissions
                const { data: user, error } = await supabase
                    .from('admin_users')
                    .select('id, username, email, full_name, role, is_active, last_login, created_at, updated_at')
                    .eq('id', userId)
                    .single();

                if (error || !user) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                // Get user's permissions
                const permissions = await getUserPermissions(userId);

                return res.status(200).json({
                    success: true,
                    user: {
                        ...user,
                        permissions
                    }
                });
            } else {
                // List all users
                const { data: users, error } = await supabase
                    .from('admin_users')
                    .select('id, username, email, full_name, role, is_active, last_login, created_at, updated_at')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Failed to fetch users:', error);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to fetch users: ' + error.message 
                    });
                }

                // Get all available permissions (gracefully handle if tables don't exist)
                let allPermissions = [];
                let rolePermissions = [];
                
                try {
                    const permResult = await supabase
                        .from('permissions')
                        .select('*')
                        .order('category, name');
                    allPermissions = permResult.data || [];
                    
                    const rolePermResult = await supabase
                        .from('role_permissions')
                        .select('role, permission_id, permissions(name, description, category)');
                    rolePermissions = rolePermResult.data || [];
                } catch (permError) {
                    console.warn('RBAC tables not found. Please run admin/config/rbac-schema.sql');
                }

                return res.status(200).json({
                    success: true,
                    users,
                    permissions: allPermissions,
                    rolePermissions: rolePermissions
                });
            }
        }

        // POST - Create new user
        if (req.method === 'POST') {
            const hasPermission = await checkPermission(currentUser.id, 'create_users');
            if (!hasPermission) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to create users' 
                });
            }

            const { username, email, password, full_name, role } = req.body;

            // Validate input
            if (!username || !email || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Username, email, and password are required' 
                });
            }

            // Validate role
            const validRoles = ['super_admin', 'admin', 'manager', 'viewer'];
            if (role && !validRoles.includes(role)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid role' 
                });
            }

            // Only super_admin can create other super_admins
            if (role === 'super_admin' && currentUser.role !== 'super_admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only super admins can create super admin accounts' 
                });
            }

            // Check if username or email already exists
            const { data: existingUser } = await supabase
                .from('admin_users')
                .select('id')
                .or(`username.eq.${username},email.eq.${email}`)
                .single();

            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Username or email already exists' 
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const { data: newUser, error } = await supabase
                .from('admin_users')
                .insert({
                    username,
                    email,
                    password_hash: passwordHash,
                    full_name: full_name || username,
                    role: role || 'admin'
                })
                .select('id, username, email, full_name, role, is_active, created_at')
                .single();

            if (error) {
                console.error('Create user error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to create user' 
                });
            }

            // Log action
            await logAuditAction(
                currentUser.id,
                'create_user',
                newUser.id,
                { 
                    username, 
                    email, 
                    role: role || 'admin',
                    full_name: full_name,
                    action_type: 'manual_creation',
                    timestamp: new Date().toISOString()
                },
                ipAddress
            );

            return res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: newUser
            });
        }

        // PUT - Update user
        if (req.method === 'PUT') {
            const hasPermission = await checkPermission(currentUser.id, 'update_users');
            if (!hasPermission) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to update users' 
                });
            }

            const { userId, username, email, full_name, role, is_active, password } = req.body;

            if (!userId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'User ID is required' 
                });
            }

            // Get target user
            const { data: targetUser } = await supabase
                .from('admin_users')
                .select('*')
                .eq('id', userId)
                .single();

            if (!targetUser) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Only super_admin can modify other super_admins
            if (targetUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only super admins can modify super admin accounts' 
                });
            }

            // Build update object
            const updates = {};
            if (username) updates.username = username;
            if (email) updates.email = email;
            if (full_name !== undefined) updates.full_name = full_name;
            if (role) {
                if (role === 'super_admin' && currentUser.role !== 'super_admin') {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Only super admins can promote users to super admin' 
                    });
                }
                updates.role = role;
            }
            if (is_active !== undefined) updates.is_active = is_active;
            if (password) {
                updates.password_hash = await bcrypt.hash(password, 10);
            }

            // Update user
            const { data: updatedUser, error } = await supabase
                .from('admin_users')
                .update(updates)
                .eq('id', userId)
                .select('id, username, email, full_name, role, is_active, updated_at')
                .single();

            if (error) {
                console.error('Update user error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to update user' 
                });
            }

            // Log action
            await logAuditAction(
                currentUser.id,
                'update_user',
                userId,
                { 
                    action_type: 'user_update',
                    changes: updates,
                    previous_user: targetUser,
                    new_user: updatedUser,
                    timestamp: new Date().toISOString()
                },
                ipAddress
            );

            return res.status(200).json({
                success: true,
                message: 'User updated successfully',
                user: updatedUser
            });
        }

        // PATCH - Update user permissions
        if (req.method === 'PATCH') {
            const hasPermission = await checkPermission(currentUser.id, 'manage_permissions');
            if (!hasPermission) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to manage permissions' 
                });
            }

            const { userId, permissions } = req.body;

            if (!userId || !Array.isArray(permissions)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'User ID and permissions array are required' 
                });
            }

            // Delete existing custom permissions
            await supabase
                .from('user_permissions')
                .delete()
                .eq('admin_user_id', userId);

            // Insert new custom permissions
            if (permissions.length > 0) {
                const permissionInserts = permissions.map(p => ({
                    admin_user_id: userId,
                    permission_id: p.permission_id,
                    granted: p.granted !== false
                }));

                const { error } = await supabase
                    .from('user_permissions')
                    .insert(permissionInserts);

                if (error) {
                    console.error('Update permissions error:', error);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to update permissions' 
                    });
                }
            }

            // Log action
            await logAuditAction(
                currentUser.id,
                'update_permissions',
                userId,
                { 
                    action_type: 'permission_update',
                    permissions: permissions,
                    user_role: targetUser.role,
                    timestamp: new Date().toISOString()
                },
                ipAddress
            );

            return res.status(200).json({
                success: true,
                message: 'Permissions updated successfully'
            });
        }

        // DELETE - Delete user
        if (req.method === 'DELETE') {
            const hasPermission = await checkPermission(currentUser.id, 'delete_users');
            if (!hasPermission) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You do not have permission to delete users' 
                });
            }

            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'User ID is required' 
                });
            }

            // Can't delete yourself
            if (userId === currentUser.id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'You cannot delete your own account' 
                });
            }

            // Get target user
            const { data: targetUser } = await supabase
                .from('admin_users')
                .select('role')
                .eq('id', userId)
                .single();

            if (!targetUser) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Only super_admin can delete other super_admins
            if (targetUser.role === 'super_admin' && currentUser.role !== 'super_admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only super admins can delete super admin accounts' 
                });
            }

            // Delete user (cascade will handle sessions, permissions, etc.)
            const { error } = await supabase
                .from('admin_users')
                .delete()
                .eq('id', userId);

            if (error) {
                console.error('Delete user error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to delete user' 
                });
            }

            // Log action
            await logAuditAction(
                currentUser.id,
                'delete_user',
                userId,
                { 
                    action_type: 'user_deletion',
                    deleted_user: targetUser,
                    timestamp: new Date().toISOString()
                },
                ipAddress
            );

            return res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        }

        return res.status(405).json({ success: false, message: 'Method not allowed' });

    } catch (error) {
        console.error('Admin users API error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
}

