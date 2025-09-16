const fs = require('fs');
const path = require('path');

// Function to update logo source in HTML content
function updateLogoSource(htmlContent) {
    // Replace old logo sources with new WhatsApp image
    const oldLogoPattern = /src="Assets\/03\.jpg"/g;
    const newLogoSource = 'src="Assets/WhatsApp Image 2025-09-16 at 11.19.21 AM.jpeg"';
    
    return htmlContent.replace(oldLogoPattern, newLogoSource);
}

// Function to process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = updateLogoSource(content);
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
console.log('Starting logo source update...');

const htmlFiles = findHtmlFiles('.');
let successCount = 0;
let totalCount = htmlFiles.length;

htmlFiles.forEach(filePath => {
    if (processFile(filePath)) {
        successCount++;
    }
});

console.log(`\nLogo source update completed!`);
console.log(`Successfully updated: ${successCount}/${totalCount} files`);

if (successCount === totalCount) {
    console.log('✅ All files updated successfully!');
} else {
    console.log('⚠️  Some files failed to update. Check the errors above.');
}
