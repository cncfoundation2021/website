// Script to create all pages from sitemap
async function createAllPages() {
    try {
        // Load sitemap
        const response = await fetch('config/sitemap.json');
        const sitemap = await response.json();
        
        // Load page generator
        const script = document.createElement('script');
        script.src = 'scripts/generate-pages.js';
        document.head.appendChild(script);
        
        await new Promise(resolve => {
            script.onload = resolve;
        });
        
        const generator = window.pageGenerator;
        await generator.init();
        
        // Create pages for all routes
        const routes = sitemap.sitemap.routes;
        
        for (const route of routes) {
            if (route === '/') continue; // Skip homepage
            
            const pageData = getPageDataFromRoute(route);
            const content = generator.getDummyContent(pageData.type, pageData.slug);
            const html = generator.generatePage(route, pageData.title, pageData.description, content);
            
            // Create the page file
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            // For demo purposes, we'll just log the pages
            console.log(`Created page: ${route}`);
            console.log(`Title: ${pageData.title}`);
            console.log(`Type: ${pageData.type}`);
            console.log('---');
        }
        
        console.log('All pages created successfully!');
        
    } catch (error) {
        console.error('Error creating pages:', error);
    }
}

function getPageDataFromRoute(route) {
    // Parse route to determine page type and slug
    if (route.startsWith('/info/')) {
        const slug = route.replace('/info/', '');
        return {
            type: 'info',
            slug: slug,
            title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `Information about ${slug.replace(/-/g, ' ')}`
        };
    } else if (route.startsWith('/offerings/')) {
        const pathParts = route.replace('/offerings/', '').split('/');
        const mainSlug = pathParts[0];
        const subSlug = pathParts[1];
        
        const typeMap = {
            'manufacturing-of-products': 'manufacturing',
            'supply-of-products': 'supply',
            'services': 'services',
            'e-bussiness': 'ebusiness',
            'distributors': 'dealers',
            'dealers': 'dealers',
            'service-centre': 'service-centre',
            'authorized-reseller': 'authorized-reseller',
            'product-marketing': 'dealers',
            'construction-repairing': 'construction-repairing',
            'donation': 'donation'
        };
        
        return {
            type: typeMap[mainSlug] || 'default',
            slug: subSlug || mainSlug,
            title: (subSlug || mainSlug).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `Information about ${(subSlug || mainSlug).replace(/-/g, ' ')}`
        };
    }
    
    return {
        type: 'default',
        slug: route.replace('/', ''),
        title: 'Page',
        description: 'Page description'
    };
}

// Run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createAllPages);
} else {
    createAllPages();
}
