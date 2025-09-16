const fs = require('fs');
const path = require('path');

// Function to fix sub-page layout issues
function fixSubPageLayout(htmlContent) {
    let fixedContent = htmlContent;
    
    // Fix extra closing div tags in logo section
    fixedContent = fixedContent.replace(/<\/div>\s*<\/div>\s*<\/header>/g, '</div>\n        </header>');
    
    // Fix double closing divs
    fixedContent = fixedContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/g, '</div>\n        </header>');
    
    // Fix any malformed logo sections
    fixedContent = fixedContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/g, '</div>\n        </header>');
    
    return fixedContent;
}

// Function to process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = fixSubPageLayout(content);
        
        // Only write if content changed
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`Fixed: ${filePath}`);
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
        } else if (file.endsWith('.html') && filePath !== './index.html') {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Main execution
console.log('Starting comprehensive sub-page layout fix...');

const htmlFiles = findHtmlFiles('.');
let successCount = 0;
let totalCount = htmlFiles.length;

htmlFiles.forEach(filePath => {
    if (processFile(filePath)) {
        successCount++;
    }
});

console.log(`\nSub-page layout fix completed!`);
console.log(`Successfully processed: ${successCount}/${totalCount} files`);

if (successCount === totalCount) {
    console.log('✅ All sub-pages fixed successfully!');
} else {
    console.log('⚠️  Some files failed to process. Check the errors above.');
}
