const fs = require('fs');
const path = require('path');

// Function to update logo layout in HTML content
function updateLogoLayout(htmlContent) {
    // Replace the old logo section with new professional layout
    const oldLogoSection = /<div class="logo-section">[\s\S]*?<\/div>/;
    const newLogoSection = `<div class="logo-section">
                <div class="logo-left">
                    <img src="Assets/03.jpg" alt="CNC Foundation Logo" class="logo">
                </div>
                <div class="title-section">
                    <h1>CARE & CURE FOUNDATION (CnC Foundation), ASSAM</h1>
                    <p class="tagline">Manufacturing Excellence Across Assam</p>
                </div>
                <div class="logo-right">
                    <img src="Assets/03.jpg" alt="CNC Foundation Logo" class="logo">
                </div>
            </div>`;
    
    return htmlContent.replace(oldLogoSection, newLogoSection);
}

// Function to process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = updateLogoLayout(content);
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Function to recursively find all HTML files
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip certain directories
            if (!['node_modules', '.git', 'scripts', 'config', 'lib', 'styles', 'templates', 'docs'].includes(file)) {
                findHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Main execution
console.log('Starting logo layout update...');

const htmlFiles = findHtmlFiles('.');
let successCount = 0;
let totalCount = htmlFiles.length;

htmlFiles.forEach(filePath => {
    if (processFile(filePath)) {
        successCount++;
    }
});

console.log(`\nLogo layout update completed!`);
console.log(`Successfully updated: ${successCount}/${totalCount} files`);

if (successCount === totalCount) {
    console.log('✅ All files updated successfully!');
} else {
    console.log('⚠️  Some files failed to update. Check the errors above.');
}
