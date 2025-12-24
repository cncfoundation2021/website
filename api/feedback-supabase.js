import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service key if available (for admin operations), otherwise fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('Supabase Key:', supabaseKey ? 'Set' : 'Missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Verify admin session
async function verifySession(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No auth header or invalid format');
    return { success: false, error: 'No session token provided' };
  }

  const sessionToken = authHeader.replace('Bearer ', '');
  console.log('🔍 Verifying session token (length:', sessionToken.length, ')');
  console.log('🔑 Token preview:', sessionToken.substring(0, 10) + '...' + sessionToken.substring(sessionToken.length - 10));
  
  try {
    // Find the session - check for both NULL expires_at AND future expires_at
    const now = new Date().toISOString();
    
    // First try to find session with valid expiration (matching pattern from admin-users.js)
    let { data: sessions, error: fetchError } = await supabase
      .from('admin_sessions')
      .select('*, admin_users(*)')
      .eq('session_token', sessionToken)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    console.log('📊 Sessions found:', sessions?.length || 0);
    
    // If no sessions found, check if Supabase connection is working
    if (fetchError) {
      console.error('❌ Supabase connection error:', fetchError);
      console.error('Error code:', fetchError.code);
      console.error('Error message:', fetchError.message);
      console.error('Error details:', fetchError.details);
      
      // Check if this is a connection/authentication error
      if (fetchError.code === 'PGRST116' || fetchError.message?.includes('JWT') || fetchError.message?.includes('authentication')) {
        return { success: false, error: 'Supabase authentication failed - please check environment variables' };
      }
      
      return { success: false, error: 'Database error: ' + (fetchError.message || 'Unknown error') };
    }

    if (!sessions || sessions.length === 0) {
      console.log('❌ No session found for token');
      // Debug: Check if any sessions exist
      const { data: allSessions } = await supabase
        .from('admin_sessions')
        .select('id, session_token, created_at, expires_at, admin_user_id')
        .limit(5);
      console.log('📊 Total sessions in DB:', allSessions?.length || 0);
      return { success: false, error: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' };
    }

    const session = sessions[0];
    
    // Check if user relation was loaded (admin_users is the relation name)
    if (!session.admin_users || !Array.isArray(session.admin_users) || session.admin_users.length === 0) {
      console.log('❌ User not found in session - checking admin_user_id:', session.admin_user_id);
      
      // Try to fetch user directly if relation failed
      if (session.admin_user_id) {
        const { data: user, error: userError } = await supabase
          .from('admin_users')
          .select('id, username, email, full_name, role, is_active')
          .eq('id', session.admin_user_id)
          .single();
        
        if (userError || !user) {
          console.error('❌ Failed to fetch user directly:', userError);
          return { success: false, error: 'User not found - please contact administrator' };
        }
        
        if (!user.is_active) {
          return { success: false, error: 'User account is inactive' };
        }
        
        console.log('✅ User fetched directly:', user.username);
        return { success: true, user };
      }
      
      return { success: false, error: 'User not found' };
    }

    // Handle array result from relation (should be single user)
    const user = Array.isArray(session.admin_users) ? session.admin_users[0] : session.admin_users;
    
    console.log('✅ Session verified for user:', user?.username, '(expires:', session.expires_at || 'never', ')');

    if (!user) {
      console.log('❌ User object is null');
      return { success: false, error: 'User not found' };
    }

    if (!user.is_active) {
      console.log('❌ User account is inactive');
      return { success: false, error: 'User account is inactive' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Session verification error:', error);
    return { success: false, error: 'Session verification failed: ' + error.message };
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      console.log('POST request received:', req.body);
      
      const feedbackData = {
        rating: req.body.rating || 0,
        feedback: req.body.feedback || '',
        page: req.body.page || 'unknown',
        user_agent: req.body.userAgent || 'unknown',
        ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
        created_at: new Date().toISOString()
      };

      console.log('Inserting feedback data:', feedbackData);

      // Insert feedback into Supabase
      const { data, error } = await supabase
        .from('feedback')
        .insert([feedbackData])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({
          success: false,
          message: 'Error storing feedback',
          error: error.message
        });
      }

      console.log('Feedback stored successfully:', data[0]);

      return res.status(200).json({
        success: true,
        message: 'Feedback received successfully',
        id: data[0].id,
        data: data[0]
      });

    } catch (error) {
      console.error('Error in POST handler:', error);
      return res.status(500).json({
        success: false,
        message: 'Error storing feedback',
        error: error.message
      });
    }
  }

  if (req.method === 'GET') {
    try {
      console.log('GET request received');
      
      // Verify admin session for GET requests
      const authResult = await verifySession(req.headers.authorization);
      if (!authResult.success) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required to view feedback',
          error: authResult.error
        });
      }

      const currentUser = authResult.user;
      
      // Check if user has permission to view feedback
      // Super admin has all permissions
      if (currentUser.role !== 'super_admin') {
        // Check user-specific permissions
        const { data: userPermissions, error: permError } = await supabase
          .from('user_permissions')
          .select('permission_name')
          .eq('user_id', currentUser.id);

        if (permError) {
          console.error('Permission check error:', permError);
          return res.status(500).json({ 
            success: false, 
            message: 'Error checking permissions' 
          });
        }

        const hasViewFeedback = userPermissions?.some(p => p.permission_name === 'view_feedback');
        if (!hasViewFeedback) {
          return res.status(403).json({ 
            success: false, 
            message: 'You do not have permission to view feedback' 
          });
        }
      }
      
      // Get all feedback from Supabase
      const { data: feedbackData, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase select error:', error);
        return res.status(500).json({
          success: false,
          message: 'Error retrieving feedback',
          error: error.message
        });
      }

      console.log('Retrieved feedback data:', feedbackData.length, 'entries');

      // Calculate feedback analytics
      const totalFeedback = feedbackData.length;
      const ratings = feedbackData.filter(f => f.rating > 0).map(f => f.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      // Rating distribution
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach(rating => {
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating]++;
        }
      });

      // Page-specific feedback analytics
      const pageFeedbackAnalytics = {};
      console.log('Processing feedback data for page analytics:', feedbackData.length, 'entries');
      
      feedbackData.forEach(feedback => {
        const page = feedback.page || 'unknown';
        console.log('Processing feedback for page:', page, 'rating:', feedback.rating);
        
        if (!pageFeedbackAnalytics[page]) {
          pageFeedbackAnalytics[page] = {
            count: 0,
            totalRating: 0,
            ratings: 0
          };
        }
        pageFeedbackAnalytics[page].count++;
        if (feedback.rating > 0) {
          pageFeedbackAnalytics[page].totalRating += feedback.rating;
          pageFeedbackAnalytics[page].ratings++;
        }
      });
      
      console.log('Page analytics calculated:', Object.keys(pageFeedbackAnalytics));

      // Calculate average ratings per page
      Object.keys(pageFeedbackAnalytics).forEach(page => {
        const data = pageFeedbackAnalytics[page];
        data.averageRating = data.ratings > 0 ? data.totalRating / data.ratings : 0;
      });

      // Recent feedback (last 50)
      const recentFeedback = feedbackData.slice(0, 50);

      const analytics = {
        totalFeedback,
        totalRatings: ratings.length,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingDistribution,
        pageFeedbackAnalytics,
        recentFeedback,
        storageType: 'Supabase PostgreSQL',
        lastUpdated: new Date().toISOString()
      };

      console.log('Analytics calculated:', analytics);

      return res.status(200).json({
        success: true,
        analytics
      });

    } catch (error) {
      console.error('Error in GET handler:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving analytics',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}
