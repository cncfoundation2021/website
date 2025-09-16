const fs = require('fs');
const path = require('path');

// Function to fix sub-page layout issues
function fixSubPageLayout(htmlContent) {
    // Fix extra closing div tags in logo section
    const extraDivPattern = /<\/div>\s*<\/div>\s*<\/header>/g;
    const fixedContent = htmlContent.replace(extraDivPattern, '</div>\n        </header>');
    
    // Fix any other common layout issues
    const doubleClosingDiv = /<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/g;
    const fixedContent2 = fixedContent.replace(doubleClosingDiv, '</div>\n        </header>');
    
    return fixedContent2;
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
            console.log(`No changes needed: ${filePath}`);
            return true;
        }
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Function to find sub-page HTML files
function findSubPageFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Look in all subdirectories except certain ones
            if (!['node_modules', '.git', 'scripts', 'config', 'lib', 'styles', 'templates', 'docs', 'Assets'].includes(file)) {
                findSubPageFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html') && (filePath.includes('offerings/') || filePath.includes('info/') || filePath.includes('left-pane/'))) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Main execution
console.log('Starting sub-page layout fix...');

const subPageFiles = findSubPageFiles('.');
let successCount = 0;
let totalCount = subPageFiles.length;

subPageFiles.forEach(filePath => {
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
