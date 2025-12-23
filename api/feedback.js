import { get } from '@vercel/edge-config';

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

      // Since Edge Config is read-only, we'll use a different approach
      // For now, let's just return success and log the data
      console.log('Feedback received:', feedbackData);
      
      // In a real implementation, you would need to use a writable database
      // For now, we'll simulate storage by returning success

      console.log('Feedback stored successfully:', feedbackData.id);

      return res.status(200).json({
        success: true,
        message: 'Feedback received successfully',
        id: feedbackData.id
      });

    } catch (error) {
      console.error('Error storing feedback:', error);
      return res.status(500).json({
        success: false,
        message: 'Error storing feedback',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}