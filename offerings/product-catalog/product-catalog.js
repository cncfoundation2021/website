// Product Catalog Management - Google Sheets Integration
class ProductCatalog {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.googleSheetsId = '1jxb-aUNEc6jKR39wHKRlxHVuLC5Eh6YfxngT7vMTTl4';
        // Direct Google Sheets URL (may have CORS issues)
        this.directCsvUrl = `https://docs.google.com/spreadsheets/d/${this.googleSheetsId}/export?format=csv&gid=0`;
        // API proxy URL (works in production)
        this.apiProxyUrl = `/api/product-catalog`;
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
            'MRP': 'mrp',
            'Discount Rate': 'discountRate',
            'Offered Rate': 'offeredRate',
            'Taxes Incl.': 'taxesIncl',
            'Total Amount': 'totalAmount'
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
                        if (['mrp', 'discountRate', 'offeredRate', 'taxesIncl', 'totalAmount'].includes(mappedKey)) {
                            product[mappedKey] = this.parseNumber(value);
                            // Store the original value for merged cell propagation
                            currentRowValues[mappedKey] = value ? this.parseNumber(value) : (previousRowValues[mappedKey] || 0);
                        } else {
                            product[mappedKey] = value;
                            // Store value for merged cell propagation (use current if exists, otherwise previous)
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
            
            // On localhost, try direct URL first, then API proxy
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1';
            
            if (isLocalhost) {
                url = `${this.directCsvUrl}&t=${Date.now()}`;
                useDirectUrl = true;
            }
            
            console.log('Fetching from URL:', url);
            
            let response;
            try {
                response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'text/csv'
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
                            'Accept': 'text/csv'
                        }
                    });
                } else {
                    throw fetchError;
                }
            }
            
            console.log('Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unable to read error response');
                console.error('Response error:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText.substring(0, 100)}`);
            }

            const csvText = await response.text();
            console.log('CSV received, length:', csvText.length, 'characters');
            console.log('First 500 chars:', csvText.substring(0, 500));
            
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('Empty CSV response received');
            }
            
            this.products = this.parseCSV(csvText);
            console.log('Parsed products:', this.products.length);
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
            const imageUrl = product.image && product.image.trim() 
                ? product.image.trim() 
                : 'https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Product';
            
            return `
                <tr>
                    <td>${this.escapeHtml(product.serialNo || '')}</td>
                    <td>${this.escapeHtml(product.category || '')}</td>
                    <td class="product-image-cell">
                        <img src="${this.escapeHtml(imageUrl)}" 
                             alt="${this.escapeHtml(product.productName || 'Product')}" 
                             class="product-image" 
                             onerror="this.src='https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Product'">
                    </td>
                    <td>${this.escapeHtml(product.productName || '')}</td>
                    <td>${this.escapeHtml(product.unit || '')}</td>
                    <td>${this.escapeHtml(product.description || '')}</td>
                    <td>${this.escapeHtml(product.brand || '')}</td>
                    <td>${this.escapeHtml(product.dimensions || '')}</td>
                    <td>${product.mrp ? '₹' + this.formatNumber(product.mrp) : ''}</td>
                    <td>${product.discountRate ? product.discountRate + '%' : ''}</td>
                    <td>${product.offeredRate ? '₹' + this.formatNumber(product.offeredRate) : ''}</td>
                    <td>${product.taxesIncl ? '₹' + this.formatNumber(product.taxesIncl) : ''}</td>
                    <td>${product.totalAmount ? '₹' + this.formatNumber(product.totalAmount) : ''}</td>
                </tr>
            `;
        }).join('');
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
