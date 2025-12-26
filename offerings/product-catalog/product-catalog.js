// Product Catalog Management
class ProductCatalog {
    constructor() {
        this.products = [];
        this.storageKey = 'cnc_product_catalog';
        this.init();
    }

    init() {
        this.loadProducts();
        this.renderProducts();
    }

    // Load products from localStorage
    loadProducts() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.products = JSON.parse(stored);
            } else {
                // Initialize with sample products from authorized reseller brands
                this.products = this.getSampleProducts();
                this.saveProducts();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
        }
    }

    // Get sample products based on authorized reseller brands
    getSampleProducts() {
        return [
            {
                serialNo: 1,
                name: "LG 55 inch 4K Smart TV",
                category: "Electronics",
                mrp: 65000,
                description: "55 inch 4K Ultra HD Smart LED TV with webOS, HDR10, and built-in WiFi",
                brand: "LG",
                dimensions: "123.2 x 71.8 x 8.9 cm",
                discountRate: 12,
                offeredRate: 57200,
                taxesIncl: 10296,
                totalAmount: 67496,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=LG+TV"
            },
            {
                serialNo: 2,
                name: "LG 320L Double Door Refrigerator",
                category: "Home Appliances",
                mrp: 35000,
                description: "320L Double Door Refrigerator with Inverter Compressor, Frost Free Technology",
                brand: "LG",
                dimensions: "60 x 65 x 170 cm",
                discountRate: 10,
                offeredRate: 31500,
                taxesIncl: 5670,
                totalAmount: 37170,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=LG+Fridge"
            },
            {
                serialNo: 3,
                name: "Blue Star 1.5 Ton Split AC",
                category: "Air Conditioning",
                mrp: 45000,
                description: "1.5 Ton 5 Star Split Air Conditioner with Inverter Technology, R32 Refrigerant",
                brand: "Blue Star",
                dimensions: "Indoor: 80 x 30 x 20 cm, Outdoor: 85 x 35 x 65 cm",
                discountRate: 15,
                offeredRate: 38250,
                taxesIncl: 6885,
                totalAmount: 45135,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=AC"
            },
            {
                serialNo: 4,
                name: "Luminous 1500VA Inverter",
                category: "Power Solutions",
                mrp: 18000,
                description: "1500VA Pure Sine Wave Inverter with Battery Charger, LCD Display",
                brand: "Luminous",
                dimensions: "35 x 25 x 15 cm",
                discountRate: 8,
                offeredRate: 16560,
                taxesIncl: 2980.8,
                totalAmount: 19540.8,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Inverter"
            },
            {
                serialNo: 5,
                name: "Acer Aspire 5 Laptop",
                category: "Computers",
                mrp: 55000,
                description: "15.6 inch FHD Laptop, Intel Core i5, 8GB RAM, 512GB SSD, Windows 11",
                brand: "Acer",
                dimensions: "36.3 x 23.8 x 1.99 cm",
                discountRate: 10,
                offeredRate: 49500,
                taxesIncl: 8910,
                totalAmount: 58410,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Laptop"
            },
            {
                serialNo: 6,
                name: "Uniline 6mm Electrical Wire",
                category: "Electrical",
                mrp: 850,
                description: "6mm 90m Copper Electrical Wire, ISI Certified, Fire Resistant",
                brand: "Uniline",
                dimensions: "90m x 6mm",
                discountRate: 5,
                offeredRate: 807.5,
                taxesIncl: 145.35,
                totalAmount: 952.85,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Wire"
            },
            {
                serialNo: 7,
                name: "Microtek 1000VA UPS",
                category: "Power Backup",
                mrp: 5500,
                description: "1000VA Line Interactive UPS with Automatic Voltage Regulation, Battery Backup",
                brand: "Microtek",
                dimensions: "30 x 20 x 12 cm",
                discountRate: 7,
                offeredRate: 5115,
                taxesIncl: 920.7,
                totalAmount: 6035.7,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=UPS"
            },
            {
                serialNo: 8,
                name: "Cello Duraplast Dinner Set",
                category: "Kitchenware",
                mrp: 2500,
                description: "22 Piece Duraplast Dinner Set, BPA Free, Microwave Safe, Dishwasher Safe",
                brand: "Cello",
                dimensions: "Set includes plates, bowls, serving dishes",
                discountRate: 12,
                offeredRate: 2200,
                taxesIncl: 396,
                totalAmount: 2596,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Dinner+Set"
            },
            {
                serialNo: 9,
                name: "Supreme Furniture Sofa Set",
                category: "Furniture",
                mrp: 85000,
                description: "3+2+1 Seater Premium Sofa Set with Coffee Table, Fabric Upholstery",
                brand: "Supreme Furniture",
                dimensions: "3 Seater: 210 x 90 x 85 cm, 2 Seater: 160 x 90 x 85 cm",
                discountRate: 18,
                offeredRate: 69700,
                taxesIncl: 12546,
                totalAmount: 82246,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Sofa"
            },
            {
                serialNo: 10,
                name: "BenQ 1080p Projector",
                category: "Display Solutions",
                mrp: 45000,
                description: "Full HD 1080p Projector, 3500 Lumens, HDMI, USB, Wireless Connectivity",
                brand: "BenQ",
                dimensions: "31.2 x 11.2 x 24.2 cm",
                discountRate: 14,
                offeredRate: 38700,
                taxesIncl: 6966,
                totalAmount: 45666,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Projector"
            },
            {
                serialNo: 11,
                name: "Kent Grand Plus Water Purifier",
                category: "Water Purifiers",
                mrp: 18000,
                description: "8L RO+UV+UF+Mineral Guard Water Purifier with Storage Tank, Auto Shut-off",
                brand: "Kent",
                dimensions: "40 x 30 x 50 cm",
                discountRate: 10,
                offeredRate: 16200,
                taxesIncl: 2916,
                totalAmount: 19116,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Purifier"
            },
            {
                serialNo: 12,
                name: "Gym Creation Treadmill",
                category: "Fitness Equipment",
                mrp: 35000,
                description: "Motorized Treadmill with 2.5HP Motor, LCD Display, Speed Control, Incline",
                brand: "Gym Creation",
                dimensions: "150 x 70 x 130 cm",
                discountRate: 15,
                offeredRate: 29750,
                taxesIncl: 5355,
                totalAmount: 35105,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Treadmill"
            },
            {
                serialNo: 13,
                name: "Zebronics Bluetooth Speaker",
                category: "Audio",
                mrp: 2500,
                description: "40W Bluetooth Speaker with Bass, USB, FM Radio, LED Lights, Portable",
                brand: "Zebronics",
                dimensions: "25 x 10 x 10 cm",
                discountRate: 8,
                offeredRate: 2300,
                taxesIncl: 414,
                totalAmount: 2714,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Speaker"
            },
            {
                serialNo: 14,
                name: "Eezy Modular Switch",
                category: "Electrical",
                mrp: 450,
                description: "Modular Switch 6A 250V, Single Pole, White, ISI Certified",
                brand: "Eezy",
                dimensions: "8.6 x 8.6 x 3.5 cm",
                discountRate: 5,
                offeredRate: 427.5,
                taxesIncl: 76.95,
                totalAmount: 504.45,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Switch"
            },
            {
                serialNo: 15,
                name: "Dr. Shred Paper Shredder",
                category: "Office Equipment",
                mrp: 12000,
                description: "A4 Paper Shredder, 12 Sheet Capacity, Cross Cut, Auto Start/Stop",
                brand: "Dr. Shred",
                dimensions: "35 x 25 x 50 cm",
                discountRate: 10,
                offeredRate: 10800,
                taxesIncl: 1944,
                totalAmount: 12744,
                imageUrl: "https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Shredder"
            }
        ];
    }

    // Save products to localStorage
    saveProducts() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.products));
        } catch (error) {
            console.error('Error saving products:', error);
        }
    }

    // Add a new product
    addProduct(product) {
        const newProduct = {
            serialNo: this.products.length + 1,
            name: product.name || '',
            category: product.category || '',
            mrp: product.mrp || 0,
            description: product.description || '',
            brand: product.brand || '',
            dimensions: product.dimensions || '',
            discountRate: product.discountRate || 0,
            offeredRate: product.offeredRate || 0,
            taxesIncl: product.taxesIncl || 0,
            totalAmount: product.totalAmount || 0,
            imageUrl: product.imageUrl || 'https://via.placeholder.com/100x100/0ea5e9/ffffff?text=Product'
        };
        
        this.products.push(newProduct);
        this.updateSerialNumbers();
        this.saveProducts();
        this.renderProducts();
        return newProduct;
    }

    // Update serial numbers
    updateSerialNumbers() {
        this.products.forEach((product, index) => {
            product.serialNo = index + 1;
        });
    }

    // Delete a product
    deleteProduct(serialNo) {
        this.products = this.products.filter(p => p.serialNo !== serialNo);
        this.updateSerialNumbers();
        this.saveProducts();
        this.renderProducts();
    }

    // Render products table
    renderProducts() {
        const tbody = document.getElementById('product-table-body');
        const emptyState = document.getElementById('empty-state');
        
        if (!tbody) return;

        // Show "Coming Soon" message in the table
        const comingSoonRow = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        <i class="fas fa-hourglass-half" style="font-size: 3rem; color: var(--primary); opacity: 0.7;"></i>
                        <h3 style="margin: 0; color: var(--text); font-size: 1.5rem;">Coming Soon</h3>
                        <p style="margin: 0; font-size: 1rem; max-width: 500px;">
                            Our comprehensive product catalog is currently under development. 
                            We're working hard to bring you detailed product information, pricing, and specifications.
                            Please check back soon!
                        </p>
                    </div>
                </td>
            </tr>
        `;

        tbody.innerHTML = comingSoonRow;

        if (emptyState) {
            emptyState.style.display = 'none';
        }
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get all products
    getProducts() {
        return this.products;
    }

    // Clear all products
    clearProducts() {
        if (confirm('Are you sure you want to clear all products?')) {
            this.products = [];
            this.saveProducts();
            this.renderProducts();
        }
    }
}

// Initialize product catalog when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.productCatalog = new ProductCatalog();
});

