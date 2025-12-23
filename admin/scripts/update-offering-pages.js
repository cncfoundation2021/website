/**
 * Script to automatically add request form integration to all offering pages
 * Run this with Node.js: node admin/scripts/update-offering-pages.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OFFERINGS_DIR = path.join(__dirname, '../../offerings');
const EXCLUDE_DIRS = ['cnc-bazar']; // Don't add request button to these

// Files to skip
const SKIP_FILES = ['index.html']; // Index/landing pages

// CSS to add in <head>
const CSS_LINK = '    <link rel="stylesheet" href="../../admin/styles/request-form.css">';

// EmailJS SDK to add in <head>
const EMAILJS_SDK = '    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>';

// Script to add before </body>
const JS_SCRIPT = '    <script src="../../admin/scripts/request-form.js"></script>';

// Button HTML to add in hero section
const BUTTON_HTML = `                        <button class="raise-request-btn" onclick="requestForm.openModal()">
                            <i class="fas fa-file-alt"></i> Raise Request
                        </button>`;

/**
 * Check if file already has request form integration
 */
function hasIntegration(content) {
    return content.includes('request-form.css') || 
           content.includes('request-form.js') ||
           content.includes('raise-request-btn') ||
           content.includes('@emailjs/browser');
}

/**
 * Add CSS link and EmailJS SDK to HTML file
 */
function addCSSLink(content) {
    let modified = content;
    
    // Add CSS link if not present
    if (!content.includes('request-form.css')) {
        // Add after visual-effects.css or main.css
        const targets = [
            /(<link rel="stylesheet" href="[^"]*visual-effects\.css">)/,
            /(<link rel="stylesheet" href="[^"]*main\.css">)/
        ];

        for (const target of targets) {
            if (target.test(modified)) {
                modified = modified.replace(target, `$1\n${CSS_LINK}`);
                break;
            }
        }
    }

    // Add EmailJS SDK if not present
    if (!modified.includes('@emailjs/browser')) {
        // Add before </head>
        if (modified.includes('</head>')) {
            modified = modified.replace('</head>', `${EMAILJS_SDK}\n    \n</head>`);
        }
    }

    return modified;
}

/**
 * Add JS script to HTML file
 */
function addJSScript(content) {
    if (content.includes('request-form.js')) {
        return content; // Already added
    }

    // Add after feedback-popup.js or other scripts
    const targets = [
        /(<script src="[^"]*feedback-popup\.js"><\/script>)/,
        /(<script src="[^"]*main\.js"><\/script>)/
    ];

    for (const target of targets) {
        if (target.test(content)) {
            return content.replace(target, `$1\n${JS_SCRIPT}`);
        }
    }

    return content;
}

/**
 * Add request button to hero section
 */
function addRequestButton(content) {
    if (content.includes('raise-request-btn')) {
        return content; // Already added
    }

    // Find hero sections and add button
    const heroPatterns = [
        // Pattern 1: After hero description paragraph
        /(<div class="hero-content">[\s\S]*?<p>[\s\S]*?<\/p>)/,
        // Pattern 2: After service overview paragraph
        /(<div class="service-overview">[\s\S]*?<p>[\s\S]*?<\/p>)/
    ];

    for (const pattern of heroPatterns) {
        if (pattern.test(content)) {
            return content.replace(pattern, `$1\n${BUTTON_HTML}`);
        }
    }

    return content;
}

/**
 * Process a single HTML file
 */
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if already integrated
        if (hasIntegration(content)) {
            console.log(`⏭️  Skipped (already integrated): ${filePath}`);
            return { status: 'skipped', reason: 'already_integrated' };
        }

        const originalContent = content;

        // Add integrations
        content = addCSSLink(content);
        content = addJSScript(content);
        content = addRequestButton(content);

        // Check if any changes were made
        if (content === originalContent) {
            console.log(`⚠️  No changes made: ${filePath}`);
            return { status: 'no_changes' };
        }

        // Write back to file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
        return { status: 'updated' };

    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return { status: 'error', error: error.message };
    }
}

/**
 * Recursively process all HTML files in a directory
 */
function processDirectory(dir, relativePath = '') {
    const stats = {
        total: 0,
        updated: 0,
        skipped: 0,
        errors: 0
    };

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Skip excluded directories
            if (EXCLUDE_DIRS.includes(item)) {
                console.log(`📁 Skipping directory: ${relPath}`);
                continue;
            }

            // Recursively process subdirectory
            const subStats = processDirectory(fullPath, relPath);
            stats.total += subStats.total;
            stats.updated += subStats.updated;
            stats.skipped += subStats.skipped;
            stats.errors += subStats.errors;

        } else if (stat.isFile() && item.endsWith('.html')) {
            // Skip certain files
            if (SKIP_FILES.includes(item)) {
                console.log(`📄 Skipping file: ${relPath}`);
                continue;
            }

            stats.total++;
            const result = processFile(fullPath);

            if (result.status === 'updated') {
                stats.updated++;
            } else if (result.status === 'skipped') {
                stats.skipped++;
            } else if (result.status === 'error') {
                stats.errors++;
            }
        }
    }

    return stats;
}

/**
 * Main function
 */
function main() {
    console.log('🚀 Starting to update offering pages...\n');
    console.log(`📁 Offerings directory: ${OFFERINGS_DIR}`);
    console.log(`🚫 Excluding directories: ${EXCLUDE_DIRS.join(', ')}\n`);

    if (!fs.existsSync(OFFERINGS_DIR)) {
        console.error(`❌ Offerings directory not found: ${OFFERINGS_DIR}`);
        process.exit(1);
    }

    const stats = processDirectory(OFFERINGS_DIR);

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log('='.repeat(50));
    console.log(`Total files processed: ${stats.total}`);
    console.log(`✅ Updated: ${stats.updated}`);
    console.log(`⏭️  Skipped: ${stats.skipped}`);
    console.log(`❌ Errors: ${stats.errors}`);
    console.log('='.repeat(50));

    if (stats.errors > 0) {
        console.log('\n⚠️  Some files had errors. Please review them manually.');
        process.exit(1);
    } else {
        console.log('\n✅ All files processed successfully!');
        process.exit(0);
    }
}

// Run the script
main();

export { processFile, processDirectory };

