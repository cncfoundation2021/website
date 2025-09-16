const fs = require('fs');
const path = require('path');

// Function to fix all layout issues
function fixLayoutIssues(htmlContent) {
    let fixedContent = htmlContent;
    
    // Fix extra closing div tags in logo section - multiple patterns
    const patterns = [
        // Pattern 1: Extra closing div before header
        /<\/div>\s*<\/div>\s*<\/header>/g,
        // Pattern 2: Double extra closing divs
        /<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/g,
        // Pattern 3: Triple extra closing divs
        /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/g,
        // Pattern 4: Multiple closing divs with whitespace
        /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/g,
        // Pattern 5: Closing div after logo-right
        /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/g
    ];
    
    patterns.forEach(pattern => {
        fixedContent = fixedContent.replace(pattern, '</div>\n        </header>');
    });
    
    // Fix malformed header structure
    fixedContent = fixedContent.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/header>/g, '</div>\n        </header>');
    
    // Fix any remaining extra closing tags before header
    fixedContent = fixedContent.replace(/(<\/div>\s*){2,}\s*<\/header>/g, '</div>\n        </header>');
    
    return fixedContent;
}

// Function to process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = fixLayoutIssues(content);
        
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
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Main execution
console.log('Starting comprehensive layout fix for all pages...');

const htmlFiles = findHtmlFiles('.');
let successCount = 0;
let totalCount = htmlFiles.length;
let fixedCount = 0;

htmlFiles.forEach(filePath => {
    if (processFile(filePath)) {
        successCount++;
        // Check if file was actually modified
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('</div>\n        </header>')) {
            fixedCount++;
        }
    }
});

console.log(`\nLayout fix completed!`);
console.log(`Successfully processed: ${successCount}/${totalCount} files`);
console.log(`Files actually fixed: ${fixedCount}`);

if (successCount === totalCount) {
    console.log('✅ All pages processed successfully!');
} else {
    console.log('⚠️  Some files failed to process. Check the errors above.');
}
