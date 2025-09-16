const fs = require('fs');
const path = require('path');

// Function to fix logo paths in HTML content
function fixLogoPaths(htmlContent, filePath) {
    let fixedContent = htmlContent;
    
    // Calculate the relative path from current file to Assets folder
    const depth = filePath.split(path.sep).length - 1;
    const relativePath = '../'.repeat(depth) + 'Assets/1000126838.png';
    
    // Replace logo source with correct relative path
    const logoPattern = /src="Assets\/1000126838\.png"/g;
    fixedContent = fixedContent.replace(logoPattern, `src="${relativePath}"`);
    
    return fixedContent;
}

// Function to process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = fixLogoPaths(content, filePath);
        
        // Only write if content changed
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`Fixed logo path in: ${filePath}`);
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
console.log('Starting logo path fix for all pages...');

const htmlFiles = findHtmlFiles('.');
let successCount = 0;
let totalCount = htmlFiles.length;

htmlFiles.forEach(filePath => {
    if (processFile(filePath)) {
        successCount++;
    }
});

console.log(`\nLogo path fix completed!`);
console.log(`Successfully processed: ${successCount}/${totalCount} files`);

if (successCount === totalCount) {
    console.log('✅ All logo paths fixed successfully!');
} else {
    console.log('⚠️  Some files failed to process. Check the errors above.');
}
