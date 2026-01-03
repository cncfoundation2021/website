// Product Catalog Management - Google Sheets Integration
class ProductCatalog {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.googleSheetsId = '1jxb-aUNEc6jKR39wHKRlxHVuLC5Eh6YfxngT7vMTTl4';
        // Direct Google Sheets URL (may have CORS issues)
        this.directCsvUrl = `https://docs.google.com/spreadsheets/d/${this.googleSheetsId}/export?format=csv&gid=0`;
        // API proxy URL (works in production)
        // On localhost, try to detect if we're on a different port and use full URL
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const currentPort = window.location.port;
        // If on localhost and not on port 3000, use full URL to port 3000 (Vercel dev)
        if (isLocalhost && currentPort && currentPort !== '3000') {
            this.apiProxyUrl = `http://localhost:3000/api/product-catalog`;
        } else {
            this.apiProxyUrl = `/api/product-catalog`;
        }
        this.lastSyncTime = null;
        this.syncInterval = 5 * 60 * 1000; // Sync every 5 minutes
        this.isLoading = false;
        this.filters = {
            search: '',
            category: '',
            brand: ''
        };
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupFilters();
        // Set up auto-refresh
        setInterval(() => this.loadProducts(true), this.syncInterval);
    }

    // Helper function to check if we're on localhost or private network
    isLocalOrPrivateNetwork() {
        const hostname = window.location.hostname;
        
        // Check for localhost variants
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
            return true;
        }
        
        // Check for private IP ranges
        // 192.168.0.0 - 192.168.255.255
        if (hostname.startsWith('192.168.')) {
            return true;
        }
        
        // 10.0.0.0 - 10.255.255.255
        if (hostname.startsWith('10.')) {
            return true;
        }
        
        // 172.16.0.0 - 172.31.255.255
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            const firstOctet = parseInt(parts[0], 10);
            const secondOctet = parseInt(parts[1], 10);
            if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) {
                return true;
            }
        }
        
        return false;
    }

    // Setup filter event listeners
    setupFilters() {
        const searchInput = document.getElementById('search-product-name');
        const categoryFilter = document.getElementById('filter-category');
        const brandFilter = document.getElementById('filter-brand');
        const clearSearchBtn = document.getElementById('clear-search');
        const clearAllBtn = document.getElementById('clear-all-filters');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value.trim().toLowerCase();
                this.updateClearSearchButton();
                this.applyFilters();
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.filters.search = '';
                if (searchInput) searchInput.value = '';
                this.updateClearSearchButton();
                this.applyFilters();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (brandFilter) {
            brandFilter.addEventListener('change', (e) => {
                this.filters.brand = e.target.value;
                this.applyFilters();
            });
        }

        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    // Update clear search button visibility
    updateClearSearchButton() {
        const clearSearchBtn = document.getElementById('clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.style.display = this.filters.search ? 'block' : 'none';
        }
    }

    // Clear all filters
    clearAllFilters() {
        this.filters = {
            search: '',
            category: '',
            brand: ''
        };

        const searchInput = document.getElementById('search-product-name');
        const categoryFilter = document.getElementById('filter-category');
        const brandFilter = document.getElementById('filter-brand');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (brandFilter) brandFilter.value = '';

        this.updateClearSearchButton();
        this.applyFilters();
    }

    // Populate filter dropdowns with unique values
    populateFilterOptions() {
        const categories = new Set();
        const brands = new Set();

        this.products.forEach(product => {
            if (product.category) categories.add(product.category);
            if (product.brand) brands.add(product.brand);
        });

        const categoryFilter = document.getElementById('filter-category');
        const brandFilter = document.getElementById('filter-brand');

        if (categoryFilter) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            Array.from(categories).sort().forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
            if (currentValue) categoryFilter.value = currentValue;
        }

        if (brandFilter) {
            const currentValue = brandFilter.value;
            brandFilter.innerHTML = '<option value="">All Brands</option>';
            Array.from(brands).sort().forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                brandFilter.appendChild(option);
            });
            if (currentValue) brandFilter.value = currentValue;
        }
    }

    // Apply filters to products
    applyFilters() {
        this.filteredProducts = this.products.filter(product => {
            // Search filter (product name)
            if (this.filters.search) {
                const productName = (product.productName || '').toLowerCase();
                if (!productName.includes(this.filters.search)) {
                    return false;
                }
            }

            // Category filter
            if (this.filters.category) {
                if (product.category !== this.filters.category) {
                    return false;
                }
            }

            // Brand filter
            if (this.filters.brand) {
                if (product.brand !== this.filters.brand) {
                    return false;
                }
            }

            return true;
        });

        this.renderProducts();
        this.updateResultsInfo();
    }

    // Update results count info
    updateResultsInfo() {
        const resultsInfo = document.getElementById('filter-results-info');
        const resultsCount = document.getElementById('results-count');
        const hasActiveFilters = this.filters.search || this.filters.category || this.filters.brand;

        if (resultsInfo && resultsCount) {
            if (hasActiveFilters) {
                resultsInfo.style.display = 'block';
                resultsCount.textContent = this.filteredProducts.length;
            } else {
                resultsInfo.style.display = 'none';
            }
        }
    }

    // Parse CSV text into array of objects
    parseCSV(csvText) {
        if (!csvText || typeof csvText !== 'string') {
            console.error('Invalid CSV text:', typeof csvText);
            return [];
        }
        
        const lines = csvText.split('\n').filter(line => line && line.trim());
        if (lines.length < 2) {
            console.warn('CSV has less than 2 lines');
            return [];
        }

        // Parse header row
        const headers = this.parseCSVLine(lines[0]);
        if (!headers || headers.length === 0) {
            console.error('No headers found in CSV');
            return [];
        }
        
        // Map headers to our expected format (handle variations)
        const headerMap = {
            'Serial No.': 'serialNo',
            'Category': 'category',
            'Image': 'image',
            'Product Name': 'productName',
            'Unit': 'unit',
            'Description': 'description',
            'Brand': 'brand',
            'Dimensions': 'dimensions',
            'MRP': 'mrp'
        };

        // Parse data rows with merged cell handling
        const products = [];
        let previousRowValues = {}; // Store previous row values to handle merged cells
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === 0) continue;
            
            // Skip if first column (serial no) is empty or not a number
            const serialNo = values[0] != null ? String(values[0]).trim() : '';
            if (!serialNo || isNaN(parseInt(serialNo))) continue;

            const product = {};
            const currentRowValues = {}; // Track what values we're using for this row
            
            headers.forEach((header, index) => {
                try {
                    const cleanHeader = header != null ? String(header).trim() : '';
                    const mappedKey = headerMap[cleanHeader];
                    if (mappedKey && values[index] !== undefined) {
                        // Safely convert to string and trim
                        let value = values[index] != null ? String(values[index]).trim() : '';
                        
                        // Handle merged cells: if current cell is empty and previous row had a value,
                        // inherit it (except for serialNo which should always be unique)
                        if (!value && mappedKey !== 'serialNo' && previousRowValues[mappedKey] != null) {
                            const prevValue = previousRowValues[mappedKey];
                            value = prevValue != null ? String(prevValue) : '';
                        }
                        
                        // Convert numeric fields
                        if (['mrp'].includes(mappedKey)) {
                            product[mappedKey] = this.parseNumber(value);
                            // Store the original value for merged cell propagation
                            currentRowValues[mappedKey] = value ? this.parseNumber(value) : (previousRowValues[mappedKey] || 0);
                        } else {
                            product[mappedKey] = value;
                            // Store value for merged cell propagation (use current if exists, otherwise previous)
                            const prevValue = previousRowValues[mappedKey];
                            currentRowValues[mappedKey] = value || (prevValue != null ? String(prevValue) : '');
                            
                            // Debug: Log image values to help troubleshoot
                            if (mappedKey === 'image') {
                                if (value) {
                                    console.log('Image value found in CSV:', value.substring(0, 100));
                                } else {
                                    console.log('Image column is empty for row', i);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error parsing column ${index} (${header}):`, error);
                }
            });

            // Only add if we have at least a serial number
            if (product.serialNo) {
                products.push(product);
                // Update previous row values for merged cell handling
                // Store all values (including inherited ones) so they propagate to next row if needed
                previousRowValues = { ...currentRowValues };
            }
        }

        return products;
    }

    // Parse a single CSV line handling quoted fields
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    // Parse number from string, handling various formats
    parseNumber(value) {
        if (!value || value.trim() === '') return 0;
        // Remove currency symbols, commas, and other non-numeric characters except decimal point
        const cleaned = value.toString().replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }

    // Load products from Google Sheets
    async loadProducts(silent = false) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        if (!silent) {
            this.updateSyncStatus('syncing', 'Syncing with Google Sheets...');
        }

        try {
            // Try API proxy first (works in production), fallback to direct URL
            let url = `${this.apiProxyUrl}?t=${Date.now()}`;
            let useDirectUrl = false;
            
            // On localhost or private network, prefer API proxy (which has image URLs from Column D)
            // Only use direct CSV as last resort since it doesn't have image data
            const isLocalhost = this.isLocalOrPrivateNetwork();
            
            // Always try API first to get image URLs from Column D
            // CSV doesn't contain image data, so we skip it
            
            console.log('Fetching from URL:', url);
            
            let response;
            try {
                response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json, text/csv, */*'
                    }
                });
            } catch (fetchError) {
                // If direct URL fails (CORS), try API proxy
                if (useDirectUrl) {
                    console.warn('Direct URL failed, trying API proxy:', fetchError.message);
                    url = `${this.apiProxyUrl}?t=${Date.now()}`;
                    response = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Accept': 'application/json, text/csv, */*'
                        }
                    });
                } else {
                    throw fetchError;
                }
            }
            
            console.log('Response status:', response.status, response.statusText);
            console.log('Content-Type:', response.headers.get('content-type'));
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unable to read error response');
                console.error('Response error:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0, 100)}`);
            }

            // Check if response is JSON (from API) or CSV (fallback)
            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            
            if (isJson) {
                // Handle JSON response from Google Sheets API
                const jsonData = await response.json();
                console.log('JSON response received:', jsonData);
                
                if (jsonData.success && jsonData.products) {
                    this.products = jsonData.products;
                    console.log('Loaded products from API:', this.products.length);
                    // Debug: Log first product's image
                    if (this.products.length > 0) {
                        console.log('First product image:', this.products[0].image);
                    }
                } else {
                    throw new Error('Invalid JSON response format');
                }
            } else {
                // Handle CSV response (fallback)
                const csvText = await response.text();
                console.log('CSV received, length:', csvText.length, 'characters');
                console.log('First 500 chars:', csvText.substring(0, 500));
                
                if (!csvText || csvText.trim().length === 0) {
                    throw new Error('Empty CSV response received');
                }
                
                this.products = this.parseCSV(csvText);
                console.log('Parsed products from CSV:', this.products.length);
                // Debug: Log image data from first few products
                if (this.products.length > 0) {
                    console.log('Sample products with images:');
                    this.products.slice(0, 3).forEach((p, i) => {
                        console.log(`Product ${i + 1}:`, {
                            name: p.productName,
                            image: p.image,
                            hasImage: !!p.image
                        });
                    });
                }
            }
            
            this.lastSyncTime = new Date();
            
            // Populate filter options and apply current filters
            this.populateFilterOptions();
            this.applyFilters();
            
            if (!silent) {
                this.updateSyncStatus('success', `Last synced: ${this.lastSyncTime.toLocaleTimeString()}`);
                setTimeout(() => {
                    const statusEl = document.getElementById('sync-status');
                    if (statusEl) statusEl.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error loading products from Google Sheets:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            const errorMessage = error.message || 'Unknown error';
            this.updateSyncStatus('error', `Failed to sync: ${errorMessage.substring(0, 50)}...`);
            
            // Try to load from cache if available
            const cached = localStorage.getItem('cnc_product_catalog_cache');
            if (cached) {
                try {
                    const cachedData = JSON.parse(cached);
                    this.products = cachedData.products || [];
                    this.lastSyncTime = cachedData.lastSyncTime ? new Date(cachedData.lastSyncTime) : null;
                    console.log('Loaded from cache:', this.products.length, 'products');
                    this.populateFilterOptions();
                    this.applyFilters();
                } catch (e) {
                    console.error('Error loading cached data:', e);
                }
            } else {
                console.warn('No cached data available');
            }
        } finally {
            this.isLoading = false;
            
            // Cache the data
            if (this.products.length > 0) {
                localStorage.setItem('cnc_product_catalog_cache', JSON.stringify({
                    products: this.products,
                    lastSyncTime: this.lastSyncTime
                }));
            }
        }
    }

    // Update sync status indicator
    updateSyncStatus(status, message) {
        const statusEl = document.getElementById('sync-status');
        if (!statusEl) return;

        const icon = statusEl.querySelector('i');
        const text = statusEl.querySelector('span');

        statusEl.style.display = 'flex';
        statusEl.className = `sync-status sync-${status}`;

        if (icon) {
            icon.className = status === 'syncing' 
                ? 'fas fa-sync-alt fa-spin' 
                : status === 'success' 
                    ? 'fas fa-check-circle' 
                    : 'fas fa-exclamation-triangle';
        }

        if (text) {
            text.textContent = message;
        }
    }

    // Render products table
    renderProducts() {
        const tbody = document.getElementById('product-table-body');
        const emptyState = document.getElementById('empty-state');
        
        if (!tbody) return;

        const hasActiveFilters = this.filters.search || this.filters.category || this.filters.brand;
        const productsToRender = hasActiveFilters ? this.filteredProducts : this.products;

        if (productsToRender.length === 0) {
            const emptyMessage = hasActiveFilters 
                ? 'No products found matching your filters. Try adjusting your search criteria.'
                : 'No products found. The catalog is being updated.';
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-${hasActiveFilters ? 'search' : 'inbox'}" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5;"></i>
                            <p style="margin: 0; font-size: 1rem;">${emptyMessage}</p>
                            ${hasActiveFilters ? '<button onclick="window.productCatalog.clearAllFilters()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">Clear All Filters</button>' : ''}
                        </div>
                    </td>
                </tr>
            `;
            if (emptyState) {
                emptyState.style.display = 'none';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Render all rows individually with duplicated merged values
        tbody.innerHTML = productsToRender.map((product) => {
            // Convert Google Drive URL to proxy URL to avoid 403 errors
            let imageUrl = 'https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Product';
            
            if (product.image && product.image.trim()) {
                const originalImage = product.image.trim();
                const convertedUrl = this.convertGoogleDriveUrl(originalImage);
                if (convertedUrl) {
                    // Use proxy API to avoid 403 errors from Google Drive
                    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const currentPort = window.location.port;
                    let proxyBaseUrl = '/api/image-proxy';
                    
                    // If on localhost and not on port 3000, use full URL to port 3000
                    if (isLocalhost && currentPort && currentPort !== '3000') {
                        proxyBaseUrl = 'http://localhost:3000/api/image-proxy';
                    }
                    
                    // Encode the image URL for the proxy
                    imageUrl = `${proxyBaseUrl}?url=${encodeURIComponent(convertedUrl)}`;
                    
                    // Debug logging (only log first few to avoid spam)
                    if (productsToRender.indexOf(product) < 3) {
                        console.log('Image URL:', { original: originalImage, converted: convertedUrl, proxied: imageUrl });
                    }
                } else {
                    // Debug: Log when conversion fails
                    if (productsToRender.indexOf(product) < 3) {
                        console.warn('Image conversion failed for:', originalImage);
                    }
                }
            } else {
                // Debug: Log when no image is found
                if (productsToRender.indexOf(product) < 3) {
                    console.log('No image found for product:', product.productName || product.serialNo);
                }
            }
            
            const productName = this.escapeHtml(product.productName || 'Product');
            const productDescription = this.escapeHtml(product.description || '');
            const fullImageUrl = this.escapeHtml(imageUrl);
            
            // Escape for JavaScript string (handle quotes and backslashes)
            const escapedImageUrl = fullImageUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
            const escapedProductName = productName.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
            const escapedDescription = productDescription.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
            
            return `
                <tr>
                    <td>${this.escapeHtml(product.serialNo || '')}</td>
                    <td>${this.escapeHtml(product.category || '')}</td>
                    <td class="product-image-cell">
                        <div class="product-image-wrapper" 
                             onclick="productCatalog.openImageLightbox('${escapedImageUrl}', '${escapedProductName}', '${escapedDescription}')"
                             role="button"
                             tabindex="0"
                             aria-label="View full image of ${productName}"
                             onkeydown="if(event.key === 'Enter' || event.key === ' ') { productCatalog.openImageLightbox('${escapedImageUrl}', '${escapedProductName}', '${escapedDescription}'); event.preventDefault(); }">
                            <img src="${fullImageUrl}" 
                                 alt="${productName}" 
                                 class="product-image" 
                                 onerror="this.src='https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Product'; console.error('Failed to load image:', '${escapedImageUrl}');">
                            <div class="product-image-enlarge-icon" aria-hidden="true">
                                <i class="fas fa-expand"></i>
                            </div>
                        </div>
                    </td>
                    <td>${productName}</td>
                    <td>${this.escapeHtml(product.unit || '')}</td>
                    <td>${productDescription}</td>
                    <td>${this.escapeHtml(product.brand || '')}</td>
                    <td>${this.escapeHtml(product.dimensions || '')}</td>
                    <td>${product.mrp ? '₹' + this.formatNumber(product.mrp) : ''}</td>
                </tr>
            `;
        }).join('');
    }

    // Convert Google Drive URL to direct image URL
    convertGoogleDriveUrl(url) {
        if (!url || !url.trim()) {
            return null;
        }
        
        let trimmedUrl = url.trim();
        
        // Handle Google Sheets IMAGE formula: =IMAGE("url") or =IMAGE(url)
        const imageFormulaMatch = trimmedUrl.match(/^=IMAGE\(["']?([^"')]+)["']?\)$/i);
        if (imageFormulaMatch) {
            trimmedUrl = imageFormulaMatch[1].trim();
        }
        
        // Remove quotes if present
        trimmedUrl = trimmedUrl.replace(/^["']|["']$/g, '');
        
        // If it's already a direct image URL (with file extension), return as-is
        if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmedUrl)) {
            return trimmedUrl;
        }
        
        // If it's already in the correct Google Drive view format (from Column D), return as-is
        if (trimmedUrl.includes('drive.google.com/uc?export=view&id=')) {
            return trimmedUrl;
        }
        
        // Handle Google Drive file URLs
        // Format: https://drive.google.com/file/d/FILE_ID/view
        const fileIdMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
        }
        
        // Format: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID or &id=FILE_ID
        const openIdMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (openIdMatch) {
            return `https://drive.google.com/uc?export=view&id=${openIdMatch[1]}`;
        }
        
        // Format: https://docs.google.com/spreadsheets/d/... (might contain image URL in formula)
        // Try to extract any URL from the string
        const urlMatch = trimmedUrl.match(/https?:\/\/[^\s"']+/);
        if (urlMatch) {
            return this.convertGoogleDriveUrl(urlMatch[0]); // Recursively process
        }
        
        // If it looks like a file ID (alphanumeric string), try using it directly
        if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmedUrl)) {
            return `https://drive.google.com/uc?export=view&id=${trimmedUrl}`;
        }
        
        // Return as-is if it's a valid HTTP/HTTPS URL (might be a valid URL we didn't catch)
        if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
            return trimmedUrl;
        }
        
        return null;
    }

    // Format number with commas
    formatNumber(num) {
        const numValue = parseFloat(num || 0);
        if (isNaN(numValue)) return '0.00';
        return numValue.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (text == null) return '';
        const textStr = String(text);
        const div = document.createElement('div');
        div.textContent = textStr;
        return div.innerHTML;
    }

    // Get all products
    getProducts() {
        return this.products;
    }

    // Manual refresh
    async refresh() {
        await this.loadProducts(false);
    }

    // Open image lightbox
    openImageLightbox(imageUrl, productName, description) {
        const lightbox = document.getElementById('image-lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDescription = document.getElementById('lightbox-description');
        const lightboxLoading = document.getElementById('lightbox-loading');
        const lightboxInfo = document.getElementById('lightbox-info');

        if (!lightbox || !lightboxImage) return;

        // Set product info
        lightboxTitle.textContent = productName || 'Product Image';
        lightboxDescription.textContent = description || '';
        
        // Show loading state
        lightboxLoading.style.display = 'flex';
        lightboxImage.style.display = 'none';
        lightboxInfo.style.display = 'none';

        // Show lightbox
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Load image
        const img = new Image();
        img.onload = () => {
            lightboxImage.src = imageUrl;
            lightboxImage.style.display = 'block';
            lightboxLoading.style.display = 'none';
            lightboxInfo.style.display = 'block';
        };
        img.onerror = () => {
            lightboxImage.src = 'https://via.placeholder.com/800x600/0ea5e9/ffffff?text=Image+Not+Available';
            lightboxImage.style.display = 'block';
            lightboxLoading.style.display = 'none';
            lightboxInfo.style.display = 'block';
        };
        img.src = imageUrl;

        // Close handlers
        const closeLightbox = () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        };

        // Close button
        const closeBtn = lightbox.querySelector('.lightbox-close');
        if (closeBtn) {
            closeBtn.onclick = closeLightbox;
        }

        // Overlay click
        const overlay = lightbox.querySelector('.lightbox-overlay');
        if (overlay) {
            overlay.onclick = closeLightbox;
        }

        // ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
}

// Initialize product catalog when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.productCatalog = new ProductCatalog();
    
    // Add manual refresh button handler if needed
    const refreshBtn = document.getElementById('manual-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.productCatalog.refresh();
        });
    }
});
