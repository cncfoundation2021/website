/**
 * Admin Signup Request API
 * Handles user signup requests that require super admin approval
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to verify session and get user (for authenticated endpoints)
async function verifySession(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.split(' ')[1];
    
    const { data: session, error } = await supabase
        .from('admin_sessions')
        .select('*, admin_users(*)')
        .eq('session_token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error || !session) {
        return { success: false, error: 'Invalid or expired session' };
    }

    if (!session.admin_users.is_active) {
        return { success: false, error: 'User account is inactive' };
    }

    return { success: true, user: session.admin_users };
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // POST - Submit a new signup request (public, no auth required)
        if (req.method === 'POST') {
            const { username, email, full_name, password, reason, organization } = req.body;

            // Validate input
            if (!username || !email || !full_name || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Username, email, full name, and password are required' 
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid email format' 
                });
            }

            // Validate username (alphanumeric and underscore only)
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
                });
            }

            // Validate password strength
            if (password.length < 8) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Password must be at least 8 characters long' 
                });
            }

            // Check if username or email already exists in admin_users
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

            // Check if there's already a pending request with this username or email
            const { data: existingRequest } = await supabase
                .from('admin_signup_requests')
                .select('id, status')
                .or(`username.eq.${username},email.eq.${email}`)
                .eq('status', 'pending')
                .single();

            if (existingRequest) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'A signup request with this username or email is already pending approval' 
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Get IP and user agent
            const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
            const userAgent = req.headers['user-agent'];

            // Create signup request
            const { data: newRequest, error } = await supabase
                .from('admin_signup_requests')
                .insert({
                    username,
                    email,
                    full_name,
                    password_hash: passwordHash,
                    reason: reason || null,
                    organization: organization || null,
                    ip_address: ipAddress,
                    user_agent: userAgent
                })
                .select('id, username, email, full_name, requested_at')
                .single();

            if (error) {
                console.error('Create signup request error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to submit signup request' 
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Signup request submitted successfully. Please wait for admin approval.',
                request: newRequest
            });
        }

        // For all other methods, authentication is required
        const authResult = await verifySession(req.headers.authorization);
        if (!authResult.success) {
            return res.status(401).json({ success: false, message: authResult.error });
        }

        const currentUser = authResult.user;

        // Only super admins can manage signup requests
        if (currentUser.role !== 'super_admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only super admins can manage signup requests' 
            });
        }

        // GET - List all signup requests
        if (req.method === 'GET') {
            const { status, limit = 50 } = req.query;

            let query = supabase
                .from('admin_signup_requests')
                .select(`
                    *,
                    reviewed_by_user:admin_users!admin_signup_requests_reviewed_by_fkey(username, full_name)
                `)
                .order('requested_at', { ascending: false })
                .limit(parseInt(limit));

            if (status && status !== 'all') {
                query = query.eq('status', status);
            }

            const { data: requests, error } = await query;

            if (error) {
                console.error('Fetch signup requests error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to fetch signup requests' 
                });
            }

            // Get statistics
            const { data: stats } = await supabase.rpc('get_signup_stats');

            return res.status(200).json({
                success: true,
                requests,
                statistics: stats?.[0] || {
                    total_requests: 0,
                    pending_requests: 0,
                    approved_requests: 0,
                    rejected_requests: 0
                }
            });
        }

        // PUT - Approve a signup request
        if (req.method === 'PUT') {
            const { requestId, role, customPermissions } = req.body;

            if (!requestId || !role) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Request ID and role are required' 
                });
            }

            // Validate role
            const validRoles = ['viewer', 'manager', 'admin', 'super_admin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid role' 
                });
            }

            // Call the approve function
            const { data, error } = await supabase.rpc('approve_signup_request', {
                p_request_id: requestId,
                p_approved_by: currentUser.id,
                p_role: role,
                p_custom_permissions: customPermissions || []
            });

            if (error) {
                console.error('Approve signup error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to approve signup request' 
                });
            }

            const result = data[0];
            if (!result.success) {
                return res.status(400).json({ 
                    success: false, 
                    message: result.message 
                });
            }

            // Log the approval action
            const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
            try {
                await supabase
                    .from('admin_audit_log')
                    .insert({
                        admin_user_id: currentUser.id,
                        action: 'approve_signup',
                        target_user_id: result.user_id,
                        details: {
                            action_type: 'signup_approval',
                            signup_request_id: requestId,
                            approved_role: role,
                            custom_permissions: customPermissions || [],
                            timestamp: new Date().toISOString()
                        },
                        ip_address: ipAddress || 'unknown',
                        created_at: new Date().toISOString()
                    });
                console.log(`✅ Audit logged: approve_signup by user ${currentUser.id}`);
            } catch (auditError) {
                console.error('Failed to log signup approval audit:', auditError);
            }

            return res.status(200).json({
                success: true,
                message: 'Signup request approved and user created',
                userId: result.user_id
            });
        }

        // DELETE - Reject a signup request
        if (req.method === 'DELETE') {
            const { requestId, reason } = req.body;

            if (!requestId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Request ID is required' 
                });
            }

            // Call the reject function
            const { data, error } = await supabase.rpc('reject_signup_request', {
                p_request_id: requestId,
                p_rejected_by: currentUser.id,
                p_rejection_reason: reason || 'No reason provided'
            });

            if (error) {
                console.error('Reject signup error:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to reject signup request' 
                });
            }

            const result = data[0];
            if (!result.success) {
                return res.status(400).json({ 
                    success: false, 
                    message: result.message 
                });
            }

            // Log the rejection action
            const ipAddress = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
            try {
                await supabase
                    .from('admin_audit_log')
                    .insert({
                        admin_user_id: currentUser.id,
                        action: 'reject_signup',
                        target_user_id: null,
                        details: {
                            action_type: 'signup_rejection',
                            signup_request_id: requestId,
                            rejection_reason: reason || 'No reason provided',
                            timestamp: new Date().toISOString()
                        },
                        ip_address: ipAddress || 'unknown',
                        created_at: new Date().toISOString()
                    });
                console.log(`✅ Audit logged: reject_signup by user ${currentUser.id}`);
            } catch (auditError) {
                console.error('Failed to log signup rejection audit:', auditError);
            }

            return res.status(200).json({
                success: true,
                message: 'Signup request rejected'
            });
        }

        return res.status(405).json({ success: false, message: 'Method not allowed' });

    } catch (error) {
        console.error('Signup request API error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
}

