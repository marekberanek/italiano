/**
 * BookKit Read Skill - MCP Entry Point
 * Loads a BookKit page by URL
 */

const path = require('path');
const { parseBookKitUri, loadBookKitPage } = require(path.join(__dirname, '../shared/bookkit.js'));

/**
 * Skill parameter schema - used by MCP for tool generation
 */
const schema = {
    name: 'bookkit-read',
    description: 'Load a BookKit page and return its content including all sections. Returns page code, name, and body[] array with section codes, content, and revision numbers needed for updates.',
    parameters: {
        url: {
            type: 'string',
            required: true,
            description: 'BookKit page URL (e.g., https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code={pageCode})'
        }
    },
    returns: {
        code: 'Page code',
        name: 'Page name',
        'body[]': 'Array of sections with: code (section code), content (UU5 string), sys.rev (revision for updates)'
    }
};

/**
 * Execute the skill
 * @param {Object} params - { url: string }
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function execute(params, http) {
    const { url } = params;
    
    if (!url) {
        throw new Error('url parameter is required');
    }
    
    return await loadBookKitPage(url, http);
}

module.exports = { execute, schema, parseBookKitUri };
