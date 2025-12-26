// Product Catalog API - Proxy for Google Sheets CSV
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const googleSheetsId = '1jxb-aUNEc6jKR39wHKRlxHVuLC5Eh6YfxngT7vMTTl4';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${googleSheetsId}/export?format=csv&gid=0`;
      
      console.log('Fetching Google Sheets CSV from:', csvUrl);
      
      // Fetch the CSV with redirect following
      const response = await fetch(csvUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProductCatalog/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const csvText = await response.text();
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Empty CSV response received');
      }

      // Return the CSV text
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      
      return res.status(200).send(csvText);

    } catch (error) {
      console.error('Error fetching Google Sheets CSV:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching product catalog',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}

