// Script to generate index.html files for each directory to enable clean URLs on GitHub Pages
const fs = require('fs');
const path = require('path');

// Read the base template
const baseTemplate = fs.readFileSync('templates/base-page.html', 'utf8');

// Define the directories that need index.html files
const directories = [
    'offerings/manufacturing-of-products',
    'offerings/supply-of-products', 
    'offerings/services',
    'offerings/e-bussiness',
    'offerings/distributors',
    'offerings/dealers',
    'offerings/service-centre',
    'offerings/authorized-reseller',
    'offerings/product-marketing',
    'offerings/construction-repairing',
    'offerings/donation',
    'info/about-us',
    'info/key-contacts',
    'info/organisational-chart',
    'info/mission-vission',
    'info/online-marketing',
    'info/marketing-research',
    'info/social-media',
    'info/employee-management',
    'info/business-tie-ups',
    'info/grievances',
    'info/gallery-publications',
    'info/announcements',
    'info/search',
    'info/contact-us',
    'left-pane/about-us',
    'left-pane/key-contacts',
    'left-pane/organisational-chart',
    'left-pane/mission-vission',
    'left-pane/online-marketing',
    'left-pane/marketing-research',
    'left-pane/social-media',
    'left-pane/employee-management',
    'left-pane/business-tie-ups',
    'left-pane/grievances',
    'left-pane/gallery-publications',
    'left-pane/announcements',
    'left-pane/search',
    'left-pane/contact-us',
    // Subdirectories for dropdown items
    'offerings/manufacturing-of-products/sweets',
    'offerings/manufacturing-of-products/nimkin',
    'offerings/manufacturing-of-products/puffed-rice',
    'offerings/manufacturing-of-products/flattened-rice',
    'offerings/services/vehicle-services',
    'offerings/services/manpower-services',
    'offerings/services/event-organizing',
    'offerings/services/catering-services',
    'offerings/services/photography',
    'offerings/services/videography',
    'offerings/services/web-development',
    'offerings/services/graphic-design',
    'offerings/services/email-marketing',
    'offerings/services/paid-advertizing',
    'offerings/services/online-apply-services',
    'offerings/e-bussiness/govt-e-marketplace',
    'offerings/construction-repairing/civil',
    'offerings/construction-repairing/electrical',
    'offerings/construction-repairing/maintenance',
    'offerings/donation/csr',
    'offerings/donation/relief-fund',
    'offerings/donation/zakat',
    'offerings/donation/charity-fund'
];

// Function to get page title from directory path
function getPageTitle(dirPath) {
    const parts = dirPath.split('/');
    const lastPart = parts[parts.length - 1];
    
    // Convert kebab-case to Title Case
    return lastPart
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Function to get page description
function getPageDescription(dirPath) {
    const title = getPageTitle(dirPath);
    return `Learn more about ${title} at CNC Foundation - Manufacturing Excellence Across NorthEast`;
}

// Function to get relative path for assets
function getRelativePath(dirPath) {
    const depth = dirPath.split('/').length - 1;
    return '../'.repeat(depth);
}

// Generate index.html for each directory
directories.forEach(dirPath => {
    const title = getPageTitle(dirPath);
    const description = getPageDescription(dirPath);
    const relativePath = getRelativePath(dirPath);
    
    // Create the directory if it doesn't exist
    const fullDirPath = path.join('.', dirPath);
    if (!fs.existsSync(fullDirPath)) {
        fs.mkdirSync(fullDirPath, { recursive: true });
    }
    
    // Generate the HTML content
    const htmlContent = baseTemplate
        .replace(/\{\{title\}\}/g, title)
        .replace(/\{\{description\}\}/g, description)
        .replace(/\{\{pageTitle\}\}/g, title)
        .replace(/\{\{pageDescription\}\}/g, description)
        .replace(/\{\{content\}\}/g, `
            <div class="page-header">
                <h1>${title}</h1>
                <p class="page-description">${description}</p>
            </div>
            
            <div class="content-section">
                <div class="info-card">
                    <h2>About ${title}</h2>
                    <p>This page provides detailed information about ${title.toLowerCase()} services and offerings at CNC Foundation.</p>
                    
                    <div class="features-grid">
                        <div class="feature-item">
                            <i class="fas fa-check-circle" aria-hidden="true"></i>
                            <h3>Professional Service</h3>
                            <p>High-quality ${title.toLowerCase()} solutions tailored to your needs.</p>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-users" aria-hidden="true"></i>
                            <h3>Expert Team</h3>
                            <p>Experienced professionals dedicated to delivering excellence.</p>
                        </div>
                        <div class="feature-item">
                            <i class="fas fa-clock" aria-hidden="true"></i>
                            <h3>24/7 Support</h3>
                            <p>Round-the-clock assistance for all your requirements.</p>
                        </div>
                    </div>
                    
                    <div class="cta-section">
                        <h3>Get Started Today</h3>
                        <p>Contact us to learn more about our ${title.toLowerCase()} services.</p>
                        <a href="${relativePath}info/contact-us" class="cta-button">Contact Us</a>
                    </div>
                </div>
            </div>
        `)
        .replace(/href="Assets\//g, `href="${relativePath}Assets/`)
        .replace(/href="styles\//g, `href="${relativePath}styles/`)
        .replace(/href="scripts\//g, `href="${relativePath}scripts/`)
        .replace(/href="lib\//g, `href="${relativePath}lib/`)
        .replace(/src="Assets\//g, `src="${relativePath}Assets/`)
        .replace(/src="styles\//g, `src="${relativePath}styles/`)
        .replace(/src="scripts\//g, `src="${relativePath}scripts/`)
        .replace(/src="lib\//g, `src="${relativePath}lib/`)
        .replace(/src="\.\.\/lib\/menu\.js"/g, `src="${relativePath}lib/menu.js?v=4"`)
        .replace(/src="\.\.\/scripts\/main\.js"/g, `src="${relativePath}scripts/main.js?v=4"`);
    
    // Write the index.html file
    const indexPath = path.join(fullDirPath, 'index.html');
    fs.writeFileSync(indexPath, htmlContent);
    
    console.log(`Generated: ${indexPath}`);
});

console.log('All directory index files generated successfully!');
