import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Google Sheets configuration
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

/**
 * Initialize Google Sheets API
 */
function getGoogleSheetsClient() {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEETS_ID) {
    console.warn('Google Sheets credentials not configured');
    return null;
  }

  try {
    const auth = new google.auth.JWT(
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      GOOGLE_PRIVATE_KEY,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Failed to initialize Google Sheets client:', error);
    return null;
  }
}

/**
 * Save request to Google Sheets
 */
async function saveToGoogleSheets(requestData) {
  const sheets = getGoogleSheetsClient();
  if (!sheets) {
    console.log('Skipping Google Sheets save (not configured)');
    return false;
  }

  try {
    const row = [
      requestData.id || '',
      new Date(requestData.created_at).toLocaleString('en-IN'),
      requestData.offering_category || '',
      requestData.offering_name || '',
      requestData.customer_name || '',
      requestData.customer_email || '',
      requestData.customer_phone || '',
      requestData.customer_address || '',
      JSON.stringify(requestData.request_details),
      requestData.status || 'pending',
      requestData.priority || 'normal',
      requestData.page_url || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: 'Service Requests!A:L',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row]
      }
    });

    console.log('Successfully saved to Google Sheets');
    return true;
  } catch (error) {
    console.error('Failed to save to Google Sheets:', error);
    return false;
  }
}

/**
 * Handle POST request - Create new service request
 */
async function handlePost(req, res) {
  try {
    console.log('POST request received:', req.body);

    const requestData = {
      offering_category: req.body.offering_category || 'unknown',
      offering_name: req.body.offering_name || 'unknown',
      customer_name: req.body.customer_name || '',
      customer_email: req.body.customer_email || '',
      customer_phone: req.body.customer_phone || '',
      customer_address: req.body.customer_address || '',
      request_details: req.body.request_details || {},
      status: 'pending',
      priority: 'normal',
      created_at: new Date().toISOString()
    };

    // Add page URL if provided
    if (req.body.page_url) {
      requestData.request_details.page_url = req.body.page_url;
    }

    console.log('Inserting request data:', requestData);

    // Save to Supabase
    const { data, error } = await supabase
      .from('service_requests')
      .insert([requestData])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error storing request in database',
        error: error.message
      });
    }

    const insertedData = data[0];
    console.log('Request stored successfully in Supabase:', insertedData.id);

    // Also save to Google Sheets (async, don't wait)
    saveToGoogleSheets({
      ...requestData,
      id: insertedData.id
    }).catch(err => console.error('Google Sheets error:', err));

    return res.status(200).json({
      success: true,
      message: 'Request received successfully',
      requestId: insertedData.id,
      data: insertedData
    });

  } catch (error) {
    console.error('Error in POST handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
}

/**
 * Handle GET request - Retrieve service requests
 */
async function handleGet(req, res) {
  try {
    console.log('GET request received');

    // Parse query parameters
    const {
      status,
      category,
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search
    } = req.query;

    let query = supabase
      .from('service_requests')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.eq('offering_category', category);
    }

    // Apply search
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: requests, error, count } = await query;

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving requests',
        error: error.message
      });
    }

    console.log('Retrieved requests:', requests.length, 'of', count);

    // Calculate statistics
    const stats = {
      total: count || 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0
    };

    // Get status counts
    const { data: statusCounts } = await supabase
      .from('service_requests')
      .select('status')
      .then(result => {
        if (result.data) {
          result.data.forEach(item => {
            if (item.status === 'pending') stats.pending++;
            else if (item.status === 'in-progress') stats.inProgress++;
            else if (item.status === 'completed') stats.completed++;
            else if (item.status === 'cancelled') stats.cancelled++;
          });
        }
        return result;
      });

    return res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < (count || 0)
      },
      statistics: stats
    });

  } catch (error) {
    console.error('Error in GET handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving requests',
      error: error.message
    });
  }
}

/**
 * Handle PATCH request - Update service request
 */
async function handlePatch(req, res) {
  try {
    const { id, status, priority, notes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating request',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    console.log('Request updated successfully:', id);

    return res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      data: data[0]
    });

  } catch (error) {
    console.error('Error in PATCH handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating request',
      error: error.message
    });
  }
}

/**
 * Handle PUT requests (status updates and comments)
 */
async function handlePut(req, res) {
  try {
    const { id, status, comment } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    let updateData = {};

    // Update status if provided
    if (status) {
      updateData.status = status;
    }

    // Add comment if provided
    if (comment) {
      // First, get the current request to retrieve existing comments
      const { data: currentRequest, error: fetchError } = await supabase
        .from('service_requests')
        .select('comments')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching current request:', fetchError);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch current request'
        });
      }

      // Add new comment to existing comments array
      const existingComments = currentRequest.comments || [];
      const updatedComments = [...existingComments, comment];
      updateData.comments = updatedComments;
    }

    // Update the request in Supabase
    const { data, error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating request:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update request'
      });
    }

    console.log('Request updated successfully:', data);

    return res.status(200).json({
      success: true,
      data: data[0],
      message: 'Request updated successfully'
    });

  } catch (error) {
    console.error('Error in handlePut:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res);
  }

  if (req.method === 'PUT') {
    return handlePut(req, res);
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}

