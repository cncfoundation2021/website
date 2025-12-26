// Product Catalog Management - Google Sheets Integration
class ProductCatalog {
    constructor() {
        this.products = [];
        this.googleSheetsId = '1jxb-aUNEc6jKR39wHKRlxHVuLC5Eh6YfxngT7vMTTl4';
        this.csvUrl = `https://docs.google.com/spreadsheets/d/${this.googleSheetsId}/export?format=csv&gid=0`;
        this.lastSyncTime = null;
        this.syncInterval = 5 * 60 * 1000; // Sync every 5 minutes
        this.isLoading = false;
        this.init();
    }

    init() {
        this.loadProducts();
        // Set up auto-refresh
        setInterval(() => this.loadProducts(true), this.syncInterval);
    }

    // Parse CSV text into array of objects
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        // Parse header row
        const headers = this.parseCSVLine(lines[0]);
        
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

        // Parse data rows
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === 0) continue;
            
            // Skip if first column (serial no) is empty or not a number
            const serialNo = values[0] ? values[0].trim() : '';
            if (!serialNo || isNaN(parseInt(serialNo))) continue;

            const product = {};
            headers.forEach((header, index) => {
                const cleanHeader = header.trim();
                const mappedKey = headerMap[cleanHeader];
                if (mappedKey && values[index] !== undefined) {
                    const value = values[index] ? values[index].trim() : '';
                    // Convert numeric fields
                    if (['mrp', 'discountRate', 'offeredRate', 'taxesIncl', 'totalAmount'].includes(mappedKey)) {
                        product[mappedKey] = this.parseNumber(value);
                    } else {
                        product[mappedKey] = value;
                    }
                }
            });

            // Only add if we have at least a serial number
            if (product.serialNo) {
                products.push(product);
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
            // Add timestamp to prevent caching
            const url = `${this.csvUrl}&t=${Date.now()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const csvText = await response.text();
            this.products = this.parseCSV(csvText);
            this.lastSyncTime = new Date();
            
            this.renderProducts();
            
            if (!silent) {
                this.updateSyncStatus('success', `Last synced: ${this.lastSyncTime.toLocaleTimeString()}`);
                setTimeout(() => {
                    const statusEl = document.getElementById('sync-status');
                    if (statusEl) statusEl.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error loading products from Google Sheets:', error);
            this.updateSyncStatus('error', 'Failed to sync. Showing cached data.');
            
            // Try to load from cache if available
            const cached = localStorage.getItem('cnc_product_catalog_cache');
            if (cached) {
                try {
                    const cachedData = JSON.parse(cached);
                    this.products = cachedData.products || [];
                    this.lastSyncTime = cachedData.lastSyncTime ? new Date(cachedData.lastSyncTime) : null;
                    this.renderProducts();
                } catch (e) {
                    console.error('Error loading cached data:', e);
                }
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

        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                            <i class="fas fa-inbox" style="font-size: 3rem; color: var(--text-muted); opacity: 0.5;"></i>
                            <p style="margin: 0; font-size: 1rem;">No products found. The catalog is being updated.</p>
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

        tbody.innerHTML = this.products.map(product => {
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
        return parseFloat(num || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text.toString();
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
