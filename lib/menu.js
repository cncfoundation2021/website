// Menu utilities for reading sitemap.json and providing navigation helpers
class MenuManager {
    constructor() {
        this.sitemap = null;
        this.init();
    }

    async init() {
        try {
            // Determine the correct path to sitemap.json based on current location
            const currentPath = window.location.pathname;
            let sitemapPath = 'config/sitemap.json';
            
            // If we're in a subdirectory, adjust the path
            if (currentPath.includes('/offerings/')) {
                const depth = currentPath.split('/').length - 2; // Count directory levels
                sitemapPath = '../'.repeat(depth) + 'config/sitemap.json';
            }
            
            const response = await fetch(sitemapPath);
            this.sitemap = await response.json();
            console.log('Sitemap loaded successfully from:', sitemapPath);
        } catch (error) {
            console.error('Failed to load sitemap:', error);
        }
    }

    // Get left pane navigation items
    getLeftPane() {
        if (!this.sitemap) return [];
        return this.sitemap.sitemap.leftPane.map(item => ({
            title: item.title,
            slug: item.slug,
            route: `/info/${item.slug}.html`
        }));
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

    // Get top navigation items with children
    getTopTabs() {
        if (!this.sitemap) return [];
        
        // Check if we're on localhost or private network (for sandboxed/local-only items)
        const isLocalhost = this.isLocalOrPrivateNetwork();
        
        return this.sitemap.sitemap.topNav
            .filter(item => {
                // Filter out localOnly items if not on localhost/private network
                if (item.localOnly && !isLocalhost) {
                    return false;
                }
                return true;
            })
            .map(item => ({
                title: item.title,
                slug: item.slug,
                route: item.slug.startsWith('http') 
                    ? item.slug 
                    : (item.children && item.children.length > 0 
                        ? `/offerings/${item.slug}/index.html` 
                        : this.getRouteForSlug(item.slug)),
                external: item.slug.startsWith('http'),
                children: item.children ? item.children.map(child => ({
                    title: child.title,
                    slug: child.slug,
                    route: (item.slug === 'e-bussiness' && child.slug === 'govt-e-marketplace')
                        ? 'https://mkp.gem.gov.in/market'
                        : `/offerings/${item.slug}/${child.slug}.html`,
                    external: (item.slug === 'e-bussiness' && child.slug === 'govt-e-marketplace')
                })) : []
            }));
    }

    // Helper method to determine correct route for a slug
    getRouteForSlug(slug) {
        // Check if the slug has an index.html file
        const slugsWithIndex = [
            'distributors', 'dealers', 'service-centre', 'authorized-reseller', 
            'product-marketing', 'construction-repairing', 'donation',
            'supply-of-products', 'services', 'manufacturing-of-products',
            'home', 'e-bussiness', 'cnc-bazar', 'product-catalog'
        ];
        
        if (slugsWithIndex.includes(slug)) {
            return `/offerings/${slug}/index.html`;
        }
        
        return `/offerings/${slug}.html`;
    }

    // Get breadcrumbs for current path
    getBreadcrumbs(path) {
        const breadcrumbs = [];
        
        if (path.startsWith('/info/')) {
            const slug = path.replace('/info/', '').replace('.html', '');
            const leftPaneItem = this.sitemap.sitemap.leftPane.find(item => item.slug === slug);
            if (leftPaneItem) {
                breadcrumbs.push({ title: leftPaneItem.title, route: path });
            }
        } else if (path.startsWith('/offerings/')) {
            const pathParts = path.replace('/offerings/', '').split('/');
            // Remove .html extension from the first part for slug matching
            const mainSlug = pathParts[0].replace('.html', '').replace('index.html', '');
            const topNavItem = this.sitemap.sitemap.topNav.find(item => item.slug === mainSlug);
            
            if (topNavItem) {
                // Use the correct route for parent items
                const parentRoute = topNavItem.children && topNavItem.children.length > 0 
                    ? `/offerings/${topNavItem.slug}/index.html` 
                    : this.getRouteForSlug(topNavItem.slug);
                breadcrumbs.push({ title: topNavItem.title, route: parentRoute });
                
                if (pathParts[1] && pathParts[1] !== 'index.html') {
                    // Remove .html extension from child slug for matching
                    const childSlug = pathParts[1].replace('.html', '');
                    const childItem = topNavItem.children?.find(child => child.slug === childSlug);
                    if (childItem) {
                        breadcrumbs.push({ title: childItem.title, route: path });
                    }
                }
            }
        }
        
        return breadcrumbs;
    }

    // Get all available routes
    getRoutes() {
        if (!this.sitemap) return [];
        return this.sitemap.routes || [];
    }

    // Find item by slug
    findBySlug(slug, type = 'all') {
        if (!this.sitemap) return null;
        
        if (type === 'leftPane' || type === 'all') {
            const leftPaneItem = this.sitemap.sitemap.leftPane.find(item => item.slug === slug);
            if (leftPaneItem) return { ...leftPaneItem, type: 'leftPane' };
        }
        
        if (type === 'topNav' || type === 'all') {
            for (const topNavItem of this.sitemap.sitemap.topNav) {
                if (topNavItem.slug === slug) {
                    return { ...topNavItem, type: 'topNav' };
                }
                if (topNavItem.children) {
                    const childItem = topNavItem.children.find(child => child.slug === slug);
                    if (childItem) {
                        return { ...childItem, type: 'topNavChild', parent: topNavItem };
                    }
                }
            }
        }
        
        return null;
    }

    // Get configuration from sitemap
    getConfig() {
        if (!this.sitemap) return null;
        return this.sitemap.sitemap.config || null;
    }
}

// Create global instance
window.menuManager = new MenuManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuManager;
}

