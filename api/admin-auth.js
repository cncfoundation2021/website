import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify password - supports both bcrypt and legacy SHA256
 */
async function verifyPassword(password, hash) {
  // Try bcrypt first (for new users)
  try {
    const isBcryptValid = await bcrypt.compare(password, hash);
    if (isBcryptValid) {
      return true;
    }
  } catch (err) {
    // Not a bcrypt hash, might be SHA256
  }
  
  // Try SHA256 (for legacy users)
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
  return sha256Hash === hash;
}

/**
 * Generate session token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Handle login
 */
async function handleLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user
    const { data: users, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Verify password (supports both bcrypt and SHA256)
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // If password was verified with SHA256, migrate to bcrypt
    const isBcryptHash = user.password_hash.startsWith('$2');
    if (!isBcryptHash) {
      console.log(`Migrating user ${user.username} password to bcrypt`);
      const newHash = await hashPassword(password);
      await supabase
        .from('admin_users')
        .update({ password_hash: newHash })
        .eq('id', user.id);
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour session

    console.log('🔐 Creating session for user:', user.username, 'token preview:', sessionToken.substring(0, 10) + '...');
    
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .insert([{
        admin_user_id: user.id,
        session_token: sessionToken,
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown',
        expires_at: expiresAt.toISOString()
      }])
      .select();

    if (sessionError) {
      console.error('❌ Session creation error:', sessionError);
      return res.status(500).json({
        success: false,
        message: 'Session creation failed'
      });
    }
    
    if (session && session.length > 0) {
      console.log('✅ Session created successfully:', session[0].id, 'expires:', expiresAt.toISOString());
    } else {
      console.log('⚠️ Session insert returned no data');
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Log login action
    try {
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: user.id,
          action: 'login',
          target_user_id: user.id,
          details: {
            action_type: 'user_login',
            login_method: 'password',
            timestamp: new Date().toISOString()
          },
          ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
          created_at: new Date().toISOString()
        });
      console.log(`✅ Audit logged: login by user ${user.id}`);
    } catch (auditError) {
      console.error('Failed to log login audit:', auditError);
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      sessionToken: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
}

/**
 * Handle logout
 */
async function handleLogout(req, res) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        message: 'Session token required'
      });
    }

    // Log logout action before deleting session
    try {
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_user_id: user.id,
          action: 'logout',
          target_user_id: user.id,
          details: {
            action_type: 'user_logout',
            logout_method: 'manual',
            timestamp: new Date().toISOString()
          },
          ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
          created_at: new Date().toISOString()
        });
      console.log(`✅ Audit logged: logout by user ${user.id}`);
    } catch (auditError) {
      console.error('Failed to log logout audit:', auditError);
    }

    // Delete session
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('session_token', sessionToken);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout error'
    });
  }
}

/**
 * Verify session
 */
async function handleVerify(req, res) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }

    // Check session
    const { data: sessions, error } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_users (*)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (error || !sessions || sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const session = sessions[0];
    const user = session.admin_users;

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification error'
    });
  }
}

/**
 * Create new admin user (requires super_admin)
 */
async function handleCreateUser(req, res) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    const { username, email, password, full_name, role = 'admin' } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify requesting user is super_admin
    const { data: sessions } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_users (*)
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (!sessions || sessions.length === 0 || sessions[0].admin_users.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{
        username,
        email,
        password_hash: passwordHash,
        full_name: full_name || username,
        role
      }])
      .select();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
      console.error('User creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'User creation failed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: data[0].id,
        username: data[0].username,
        email: data[0].email,
        role: data[0].role
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'User creation error'
    });
  }
}

/**
 * Get user permissions
 */
async function handleGetPermissions(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No authorization header' });
    }

    const sessionToken = authHeader.replace('Bearer ', '');
    
    // Verify session
    const { data: session } = await supabase
      .from('admin_sessions')
      .select('admin_user_id')
      .eq('session_token', sessionToken)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();
    
    if (!session) {
      return res.status(401).json({ success: false, error: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' });
    }
    
    // Get user permissions using the database function
    const { data: permissions, error } = await supabase
      .rpc('get_user_permissions', { p_user_id: session.admin_user_id });
    
    if (error) {
      console.error('Error fetching permissions:', error);
      return res.status(500).json({ success: false, message: 'Error fetching permissions' });
    }
    
    const permissionNames = permissions.map(p => p.permission_name);
    
    return res.status(200).json({
      success: true,
      permissions: permissionNames
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving permissions' });
  }
}

/**
 * Get audit log
 */
async function handleGetAuditLog(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No authorization header' });
    }

    const sessionToken = authHeader.replace('Bearer ', '');
    const limit = parseInt(req.body?.limit) || 100;
    
    // Verify session
    const { data: session } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_user:admin_user_id (role)
      `)
      .eq('session_token', sessionToken)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();
    
    if (!session) {
      return res.status(401).json({ success: false, error: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' });
    }
    
    // Get audit log
    const { data: auditLog, error } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin_user:admin_user_id (id, username, email, full_name),
        target_user:target_user_id (id, username, email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching audit log:', error);
      return res.status(500).json({ success: false, message: 'Error fetching audit log' });
    }
    
    return res.status(200).json({
      success: true,
      auditLog: auditLog || []
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving audit log' });
  }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check for action in both query and body
  const action = req.query?.action || req.body?.action;
  
  console.log('🔍 API Handler - Method:', req.method, 'Action:', action);

  if (req.method === 'POST') {
    if (action === 'login') {
      return handleLogin(req, res);
    }
    if (action === 'logout') {
      return handleLogout(req, res);
    }
    if (action === 'create-user') {
      return handleCreateUser(req, res);
    }
    if (action === 'get_permissions') {
      return handleGetPermissions(req, res);
    }
    if (action === 'get_audit_log') {
      return handleGetAuditLog(req, res);
    }
  }

  if (req.method === 'GET' && action === 'verify') {
    return handleVerify(req, res);
  }

  console.log('❌ No matching route for method:', req.method, 'action:', action);
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
    debug: { method: req.method, action: action }
  });
}

