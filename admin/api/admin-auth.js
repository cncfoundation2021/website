import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Simple password hashing (use bcrypt in production)
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
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

    // Hash the password
    const passwordHash = hashPassword(password);

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

    // Verify password
    if (user.password_hash !== passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour session

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
      console.error('Session creation error:', sessionError);
      return res.status(500).json({
        success: false,
        message: 'Session creation failed'
      });
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

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
    const passwordHash = hashPassword(password);

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

  const { action } = req.query;

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
  }

  if (req.method === 'GET' && action === 'verify') {
    return handleVerify(req, res);
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}

