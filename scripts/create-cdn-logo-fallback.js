const fs = require('fs');
const path = require('path');

// Function to add CDN fallback for logo
function addCdnFallback(htmlContent) {
    // Add a script to handle logo loading with fallback
    const fallbackScript = `
    <script>
    // Logo fallback script
    document.addEventListener('DOMContentLoaded', function() {
        const logos = document.querySelectorAll('.logo');
        logos.forEach(logo => {
            logo.addEventListener('error', function() {
                // If local logo fails, try CDN version
                const originalSrc = this.src;
                if (originalSrc.includes('Assets/1000126838.png')) {
                    this.src = 'https://cncassam.com/Assets/1000126838.png';
                }
            });
        });
    });
    </script>`;
    
    // Insert before closing body tag
    return htmlContent.replace('</body>', fallbackScript + '\n</body>');
}

// Function to process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = addCdnFallback(content);
        
        // Only write if content changed
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`Added CDN fallback to: ${filePath}`);
            return true;
        } else {
            return true;
        }
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
            if (!['node_modules', '.git', 'scripts', 'config', 'lib', 'styles', 'templates', 'docs', 'Assets'].includes(file)) {
                findHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Main execution
console.log('Adding CDN fallback for logo loading...');

const htmlFiles = findHtmlFiles('.');
let successCount = 0;
let totalCount = htmlFiles.length;

htmlFiles.forEach(filePath => {
    if (processFile(filePath)) {
        successCount++;
    }
});

console.log(`\nCDN fallback addition completed!`);
console.log(`Successfully processed: ${successCount}/${totalCount} files`);

if (successCount === totalCount) {
    console.log('✅ All files updated with CDN fallback!');
} else {
    console.log('⚠️  Some files failed to process. Check the errors above.');
}
