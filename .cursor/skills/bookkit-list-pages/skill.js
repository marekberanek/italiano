/**
 * BookKit List Pages Skill - MCP Entry Point
 * Lists all pages in a BookKit book
 */

const path = require('path');
const { parseBookKitUri, listBookKitPages } = require(path.join(__dirname, '../shared/bookkit.js'));

/**
 * Skill parameter schema - used by MCP for tool generation
 */
const schema = {
    name: 'bookkit-list-pages',
    description: 'List all pages in a BookKit book. Returns page codes, names, and hierarchy. Useful for getting overview of book structure before reading specific pages.',
    parameters: {
        url: {
            type: 'string',
            required: true,
            description: 'Any BookKit URL from the book (e.g., https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code={pageCode})'
        },
        outputFile: {
            type: 'string',
            required: false,
            description: 'Optional path to save the output as JSON file for later grep/search'
        }
    },
    returns: {
        'itemList[]': 'Array of pages with: code, name, indent, visible, desc',
        pageInfo: 'Pagination info'
    }
};

/**
 * Execute the skill
 * @param {Object} params - { url: string, outputFile?: string }
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function execute(params, http) {
    const { url, outputFile } = params;
    
    if (!url) {
        throw new Error('url parameter is required');
    }
    
    const parsed = parseBookKitUri(url);
    const result = await listBookKitPages(parsed.baseUri, http);
    
    // Helper to extract name from multilang object
    const getName = (name) => {
        if (typeof name === 'string') return name;
        if (name && typeof name === 'object') {
            return name.en || name.cs || name.uk || Object.values(name)[0] || '';
        }
        return '';
    };
    
    // If outputFile specified, save to file
    if (outputFile) {
        const fs = require('fs');
        const outputPath = path.resolve(outputFile);
        
        // Format for easy grepping - one page per line with key info
        const lines = result.itemList.map(page => {
            const indent = '  '.repeat(page.indent || 0);
            return `${indent}[${page.code}] ${getName(page.name)}`;
        });
        
        // Save both readable format and JSON
        const output = {
            summary: lines.join('\n'),
            pages: result.itemList,
            pageInfo: result.pageInfo
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        
        return {
            message: `Saved ${result.itemList.length} pages to ${outputPath}`,
            pageCount: result.itemList.length,
            outputFile: outputPath
        };
    }
    
    return result;
}

module.exports = { execute, schema, parseBookKitUri };
