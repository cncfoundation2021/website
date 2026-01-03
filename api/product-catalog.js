import { google } from 'googleapis';

// Google Sheets configuration
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID || '1jxb-aUNEc6jKR39wHKRlxHVuLC5Eh6YfxngT7vMTTl4';
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
 * Extract image URL from Google Sheets IMAGE formula or text
 */
function extractImageUrl(value) {
  if (!value || typeof value !== 'string') return null;
  
  const trimmed = value.trim();
  
  // Handle IMAGE formula: =IMAGE("url") or =IMAGE(url) or =IMAGE(C2) (cell reference)
  const imageFormulaMatch = trimmed.match(/^=IMAGE\(["']?([^"')]+)["']?\)$/i);
  if (imageFormulaMatch) {
    const extracted = imageFormulaMatch[1].trim().replace(/^["']|["']$/g, '');
    
    // Check if it's a cell reference (e.g., "C2", "A1", "Sheet1!C2")
    // Cell references typically match pattern: [A-Z]+[0-9]+
    if (/^[A-Z]+\d+/.test(extracted) || extracted.includes('!')) {
      console.warn(`Image formula references a cell (${extracted}), but cell references are not supported. Please use direct URLs.`);
      return null; // Cell references not supported - need actual URLs
    }
    
    return extracted;
  }
  
  // Return as-is if it's already a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Check if it looks like a cell reference
  if (/^[A-Z]+\d+/.test(trimmed)) {
    console.warn(`Value looks like a cell reference (${trimmed}), skipping.`);
    return null;
  }
  
  return trimmed || null;
}

/**
 * Convert Google Drive URL to direct image URL
 */
function convertGoogleDriveUrl(url) {
  if (!url) return null;
  
  // If it's already a direct image URL (with file extension), return as-is
  if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
    return url;
  }
  
  // If it's already in the correct Google Drive view format, return as-is
  if (url.includes('drive.google.com/uc?export=view&id=')) {
    return url;
  }
  
  // Handle Google Drive file URLs
  // Format: https://drive.google.com/file/d/FILE_ID/view
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
  }
  
  // Format: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID or &id=FILE_ID
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch) {
    return `https://drive.google.com/uc?export=view&id=${openIdMatch[1]}`;
  }
  
  // If it looks like a file ID (alphanumeric string), try using it directly
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) {
    return `https://drive.google.com/uc?export=view&id=${url}`;
  }
  
  // Return as-is if no conversion needed
  return url;
}

/**
 * Parse number value
 */
function parseNumber(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Product Catalog API - Google Sheets API Integration
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
      const sheets = getGoogleSheetsClient();
      
      if (!sheets) {
        // Fallback to CSV if API not configured
        console.log('Google Sheets API not configured, falling back to CSV');
        const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=0`;
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
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300');
        return res.status(200).send(csvText);
      }

      console.log('Fetching data from Google Sheets API...');

      // Get all data from the sheet
      // Try common sheet names, or use the first sheet if none match
      let range = 'Sheet1!A:Z';
      try {
        // Get sheet metadata to find the actual sheet name
        const sheetMetadata = await sheets.spreadsheets.get({
          spreadsheetId: GOOGLE_SHEETS_ID,
        });
        
        if (sheetMetadata.data.sheets && sheetMetadata.data.sheets.length > 0) {
          const firstSheetName = sheetMetadata.data.sheets[0].properties.title;
          range = `${firstSheetName}!A:Z`;
          console.log('Using sheet name:', firstSheetName);
        }
      } catch (metaError) {
        console.warn('Could not get sheet metadata, using default Sheet1:', metaError.message);
      }
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range: range,
        valueRenderOption: 'UNFORMATTED_VALUE', // Get actual values (URLs), not formulas
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        throw new Error('No data found in sheet');
      }

      // Parse headers (first row)
      const headers = rows[0].map(h => (h || '').trim());
      
      // Map headers to our expected format
      // Note: Check for both "Image" and "Image URL" - prefer "Image URL" if it exists
      const headerMap = {
        'Serial No.': 'serialNo',
        'Category': 'category',
        'Image': 'image',
        'Image ': 'image', // Handle trailing space
        'Image URL': 'image', // Prefer Image URL column if it exists
        'Product Name': 'productName',
        'Unit': 'unit',
        'Description': 'description',
        'Brand': 'brand',
        'Dimensions': 'dimensions',
        'MRP': 'mrp'
      };
      
      // Find which column has image data
      // Check both "Image" and "Image URL" columns, prefer the one with actual data
      let imageColumnIndex = -1;
      let imageUrlColumnIndex = -1;
      
      headers.forEach((header, index) => {
        const cleanHeader = (header || '').trim();
        if (cleanHeader === 'Image' || cleanHeader === 'Image ') {
          imageColumnIndex = index;
        } else if (cleanHeader === 'Image URL') {
          imageUrlColumnIndex = index;
        }
      });
      
      // Prefer "Image URL" column (Column D) as it has the direct URLs
      // Use "Image" column (Column C) only if "Image URL" doesn't exist
      let finalImageColumnIndex = -1;
      if (imageUrlColumnIndex >= 0) {
        finalImageColumnIndex = imageUrlColumnIndex; // Prefer Image URL column
      } else if (imageColumnIndex >= 0) {
        finalImageColumnIndex = imageColumnIndex; // Fallback to Image column
      }

      // Parse data rows
      const products = [];
      let previousRowValues = {}; // For handling merged cells

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Skip if first column (serial no) is empty or not a number
        const serialNo = row[0] != null ? String(row[0]).trim() : '';
        if (!serialNo || isNaN(parseInt(serialNo))) continue;

        const product = {};
        const currentRowValues = {};

        // Process image column separately
        // Prefer "Image URL" column (Column D) which has direct URLs
        // Fallback to "Image" column (Column C) if Image URL is not available
        let imageValue = '';
        
        if (finalImageColumnIndex >= 0 && row[finalImageColumnIndex] !== undefined) {
          imageValue = row[finalImageColumnIndex] != null ? String(row[finalImageColumnIndex]).trim() : '';
        }
        
        // Handle merged cells: if current cell is empty and previous row had a value, inherit it
        if (!imageValue && previousRowValues['image'] != null) {
          imageValue = String(previousRowValues['image']);
        }
        
        // Extract image URL from formula or text
        // Column D should contain direct URLs like: https://drive.google.com/uc?export=view&id=...
        if (imageValue) {
          const imageUrl = extractImageUrl(imageValue);
          if (imageUrl) {
            // Since Column D contains direct URLs, convertGoogleDriveUrl will handle them
            // URLs are already in format: https://drive.google.com/uc?export=view&id=...
            const convertedUrl = convertGoogleDriveUrl(imageUrl);
            product['image'] = convertedUrl || imageUrl;
            currentRowValues['image'] = convertedUrl || imageUrl;
            
            // Debug logging for first few products
            if (products.length < 3) {
              console.log(`Product ${serialNo} image URL: ${imageValue.substring(0, 80)}...`);
              console.log(`  -> Final URL: ${convertedUrl || imageUrl}`);
            }
          } else {
            // Debug logging if extraction failed
            if (products.length < 3 && imageValue) {
              console.log(`Product ${serialNo} image extraction failed for: ${imageValue.substring(0, 50)}...`);
            }
            product['image'] = '';
            currentRowValues['image'] = '';
          }
        } else {
          product['image'] = '';
          currentRowValues['image'] = '';
        }
        
        headers.forEach((header, index) => {
          try {
            const cleanHeader = header.trim();
            const mappedKey = headerMap[cleanHeader];
            
            // Skip image column as we've already processed it
            if (mappedKey === 'image') {
              return;
            }
            
            if (mappedKey && row[index] !== undefined) {
              let value = row[index] != null ? String(row[index]).trim() : '';
              
              // Handle merged cells: if current cell is empty and previous row had a value,
              // inherit it (except for serialNo which should always be unique)
              if (!value && mappedKey !== 'serialNo' && previousRowValues[mappedKey] != null) {
                value = String(previousRowValues[mappedKey]);
              }

              // Process based on field type
              if (mappedKey === 'mrp') {
                product[mappedKey] = parseNumber(value);
                currentRowValues[mappedKey] = value ? parseNumber(value) : (previousRowValues[mappedKey] || 0);
              } else {
                product[mappedKey] = value;
                const prevValue = previousRowValues[mappedKey];
                currentRowValues[mappedKey] = value || (prevValue != null ? String(prevValue) : '');
              }
            }
          } catch (error) {
            console.error(`Error parsing column ${index} (${header}):`, error);
          }
        });

        // Only add if we have at least a serial number
        if (product.serialNo) {
          products.push(product);
          previousRowValues = { ...currentRowValues };
        }
      }

      // Return JSON data
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      
      return res.status(200).json({
        success: true,
        products: products,
        count: products.length
      });

    } catch (error) {
      console.error('Error fetching product catalog:', error);
      
      // Try CSV fallback on error
      try {
        console.log('Attempting CSV fallback...');
        const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv&gid=0`;
        const response = await fetch(csvUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ProductCatalog/1.0)'
          }
        });

        if (response.ok) {
          const csvText = await response.text();
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=300');
          return res.status(200).send(csvText);
        }
      } catch (fallbackError) {
        console.error('CSV fallback also failed:', fallbackError);
      }
      
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
