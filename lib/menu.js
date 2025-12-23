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

    // Get top navigation items with children
    getTopTabs() {
        if (!this.sitemap) return [];
        return this.sitemap.sitemap.topNav.map(item => ({
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
            'home', 'e-bussiness', 'cnc-bazar'
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

