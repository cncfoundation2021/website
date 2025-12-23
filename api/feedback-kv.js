// Feedback storage using a simple approach that works with Vercel
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
      const feedbackData = {
        ...req.body,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'
      };

      // For now, we'll use a simple approach with Vercel's environment
      // In a production setup, you'd use a proper database
      
      // Store in a simple way that persists across function calls
      // This is a temporary solution until we get a proper database
      
      console.log('Feedback received:', JSON.stringify(feedbackData, null, 2));
      
      // You can view these logs in Vercel dashboard under Functions > Logs
      
      return res.status(200).json({
        success: true,
        message: 'Feedback received and logged',
        id: feedbackData.id,
        note: 'Check Vercel function logs to see the feedback data'
      });

    } catch (error) {
      console.error('Error processing feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing feedback',
        error: error.message
      });
    }
  }

  if (req.method === 'GET') {
    // Return a message about where to find the data
    return res.status(200).json({
      success: true,
      message: 'Feedback data is logged in Vercel function logs',
      instructions: 'Check your Vercel dashboard > Functions > Logs to see all feedback submissions'
    });
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}
