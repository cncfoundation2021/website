import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      console.log('Private feedback dashboard request received');
      
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

      // Calculate comprehensive analytics
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

      // Page-specific feedback analytics with better page names
      const pageFeedbackAnalytics = {};
      const pageNameMapping = {
        '/': 'Homepage',
        '/index.html': 'Homepage',
        '/offerings/authorized-reseller/': 'Authorized Reseller - Main',
        '/offerings/authorized-reseller/index.html': 'Authorized Reseller - Main',
        '/offerings/dealers/': 'Dealers - Main',
        '/offerings/dealers/index.html': 'Dealers - Main',
        '/offerings/manufacturing-of-products/': 'Manufacturing & Reselling - Main',
        '/offerings/manufacturing-of-products/index.html': 'Manufacturing & Reselling - Main',
        '/offerings/services/': 'Services - Main',
        '/offerings/services/index.html': 'Services - Main',
        '/offerings/construction-repairing/': 'Construction & Repairing - Main',
        '/offerings/construction-repairing/index.html': 'Construction & Repairing - Main',
        '/offerings/donation/': 'Donation - Main',
        '/offerings/donation/index.html': 'Donation - Main',
        '/offerings/distributors/': 'Distributors - Main',
        '/offerings/distributors/index.html': 'Distributors - Main',
        '/offerings/cnc-bazar/': 'CnC Bazar - Main',
        '/offerings/cnc-bazar/index.html': 'CnC Bazar - Main',
        '/offerings/e-bussiness/': 'E-Business - Main',
        '/offerings/e-bussiness/index.html': 'E-Business - Main',
        '/offerings/home/': 'Home Services - Main',
        '/offerings/home/index.html': 'Home Services - Main',
        '/offerings/product-marketing/': 'Product Marketing - Main',
        '/offerings/product-marketing/index.html': 'Product Marketing - Main',
        '/offerings/service-centre/': 'Service Centre - Main',
        '/offerings/service-centre/index.html': 'Service Centre - Main',
        '/offerings/supply-of-products/': 'Supply of Products - Main',
        '/offerings/supply-of-products/index.html': 'Supply of Products - Main'
      };

      feedbackData.forEach(feedback => {
        const page = feedback.page || 'unknown';
        let pageName = pageNameMapping[page];
        
        // If not in mapping, try to extract meaningful name from path
        if (!pageName) {
          if (page.includes('/offerings/')) {
            const pathParts = page.split('/').filter(p => p);
            if (pathParts.length >= 2) {
              const category = pathParts[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const subpage = pathParts[2] ? pathParts[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
              pageName = `${category}${subpage ? ' - ' + subpage : ''}`;
            }
          } else if (page.includes('/info/')) {
            const pathParts = page.split('/').filter(p => p);
            if (pathParts.length >= 2) {
              pageName = pathParts[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
          } else {
            pageName = page;
          }
        }
        
        if (!pageFeedbackAnalytics[pageName]) {
          pageFeedbackAnalytics[pageName] = {
            count: 0,
            totalRating: 0,
            ratings: 0,
            originalPath: page
          };
        }
        pageFeedbackAnalytics[pageName].count++;
        if (feedback.rating > 0) {
          pageFeedbackAnalytics[pageName].totalRating += feedback.rating;
          pageFeedbackAnalytics[pageName].ratings++;
        }
      });

      // Calculate average ratings per page
      Object.keys(pageFeedbackAnalytics).forEach(page => {
        const data = pageFeedbackAnalytics[page];
        data.averageRating = data.ratings > 0 ? data.totalRating / data.ratings : 0;
      });

      // Recent feedback with enhanced page names
      const recentFeedback = feedbackData.slice(0, 100).map(feedback => {
        const page = feedback.page || 'unknown';
        let pageName = pageNameMapping[page];
        
        if (!pageName) {
          if (page.includes('/offerings/')) {
            const pathParts = page.split('/').filter(p => p);
            if (pathParts.length >= 2) {
              const category = pathParts[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const subpage = pathParts[2] ? pathParts[2].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
              pageName = `${category}${subpage ? ' - ' + subpage : ''}`;
            }
          } else if (page.includes('/info/')) {
            const pathParts = page.split('/').filter(p => p);
            if (pathParts.length >= 2) {
              pageName = pathParts[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
          } else {
            pageName = page;
          }
        }
        
        return {
          ...feedback,
          pageName: pageName,
          originalPath: page
        };
      });

      const analytics = {
        totalFeedback,
        totalRatings: ratings.length,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingDistribution,
        pageFeedbackAnalytics,
        recentFeedback,
        storageType: 'Supabase PostgreSQL',
        lastUpdated: new Date().toISOString(),
        domain: req.headers.host || 'cncassam.com'
      };

      console.log('Analytics calculated:', analytics);

      return res.status(200).json({
        success: true,
        analytics
      });

    } catch (error) {
      console.error('Error in private dashboard handler:', error);
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
