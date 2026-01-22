/**
 * Image Proxy API - Proxies Google Drive images to avoid CORS and 403 errors
 * 
 * This API endpoint fetches images from Google Drive and serves them with proper headers
 * to avoid browser blocking and CORS issues.
 */

import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Google Drive API configuration
const SERVICE_ACCOUNT_PATH = join(__dirname, '..', 'Google Cloud API Keys - Gsheet', 'cnc-assam-website-77d11776902d.json');

/**
 * Get Google Drive API client using service account
 */
function getDriveClient() {
  try {
    if (!existsSync(SERVICE_ACCOUNT_PATH)) {
      console.warn('Service account file not found, using fetch method');
      return null;
    }

    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/drive.readonly']
    );

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.warn('Failed to initialize Drive client:', error.message);
    return null;
  }
}

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
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'Missing image URL parameter'
        });
      }

      // Decode the URL
      const imageUrl = decodeURIComponent(url);

      // Validate it's a Google Drive URL
      if (!imageUrl.includes('drive.google.com')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image URL - must be a Google Drive URL'
        });
      }

      console.log('Proxying image:', imageUrl);

      // Extract file ID from URL - try multiple formats
      let fileId = null;
      
      // Method 1: Extract from ?id= or &id= parameter (most common)
      const idMatch = imageUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        fileId = idMatch[1];
      }
      
      // Method 2: Extract from /file/d/FILE_ID format (fallback)
      if (!fileId) {
        const fileIdMatch = imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          fileId = fileIdMatch[1];
        }
      }
      
      // Method 3: Extract from /open?id= format (fallback)
      if (!fileId) {
        const openIdMatch = imageUrl.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
        if (openIdMatch) {
          fileId = openIdMatch[1];
        }
      }
      
      console.log('Extracted file ID:', fileId);

      let imageBuffer = null;
      let contentType = 'image/jpeg';
      let success = false;

      // Method 1: Try Google Drive API (most reliable)
      if (fileId) {
        try {
          const drive = getDriveClient();
          if (drive) {
            const fileResponse = await drive.files.get(
              { fileId: fileId, alt: 'media' },
              { responseType: 'arraybuffer' }
            );
            
            imageBuffer = Buffer.from(fileResponse.data);
            // Try to get content type from file metadata
            try {
              const fileMetadata = await drive.files.get({ fileId: fileId, fields: 'mimeType' });
              contentType = fileMetadata.data.mimeType || 'image/jpeg';
            } catch (e) {
              // Use default
            }
            success = true;
            console.log('Successfully fetched via Drive API');
          }
        } catch (driveError) {
          console.warn('Drive API failed, trying fetch method:', driveError.message);
        }
      }

      // Method 2: Fallback to direct fetch with proper headers
      if (!success) {
        try {
          const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://drive.google.com/',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            redirect: 'follow'
          });

          if (response.ok) {
            imageBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(imageBuffer);
            contentType = response.headers.get('content-type') || 'image/jpeg';
            success = true;
            console.log('Successfully fetched via direct URL');
            } else if (fileId) {
              // Method 3: Try alternative URL format (download)
              const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
              const altResponse = await fetch(altUrl, {
                method: 'GET',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Referer': 'https://drive.google.com/'
                },
                redirect: 'follow'
              });
              
              if (altResponse.ok) {
                imageBuffer = await altResponse.arrayBuffer();
                imageBuffer = Buffer.from(imageBuffer);
                contentType = altResponse.headers.get('content-type') || 'image/jpeg';
                success = true;
                console.log('Successfully fetched via alternative URL (download)');
              } else if (fileId) {
                // Method 4: Try view format if download failed
                const viewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                const viewResponse = await fetch(viewUrl, {
                  method: 'GET',
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://drive.google.com/'
                  },
                  redirect: 'follow'
                });
                
                if (viewResponse.ok) {
                  imageBuffer = await viewResponse.arrayBuffer();
                  imageBuffer = Buffer.from(imageBuffer);
                  contentType = viewResponse.headers.get('content-type') || 'image/jpeg';
                  success = true;
                  console.log('Successfully fetched via view URL');
                }
              }
            }
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError.message);
        }
      }

      if (!success || !imageBuffer) {
        console.error('All methods failed to fetch image');
        return res.status(404).json({
          success: false,
          message: 'Failed to fetch image from Google Drive'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type');

      // Return the image
      return res.status(200).send(imageBuffer);

    } catch (error) {
      console.error('Error proxying image:', error);
      return res.status(500).json({
        success: false,
        message: 'Error proxying image',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  });
}

