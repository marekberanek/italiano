/**
 * Management Kit Read Skill - MCP Entry Point
 * Loads a Management Kit document page
 */

const path = require('path');
const { parseMngKitUri, loadMngKitPage } = require(path.join(__dirname, '../shared/mngkit.js'));

/**
 * Skill parameter schema - used by MCP for tool generation
 */
const schema = {
    name: 'mngkit-read',
    description: 'Load a ManagementKit document page. Returns document content with sections containing OIDs needed for updates.',
    parameters: {
        url: {
            type: 'string',
            required: true,
            description: 'ManagementKit document URL (e.g., https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={documentOid})'
        }
    },
    returns: {
        baseUri: 'Base URI for API calls',
        documentOid: 'Document OID',
        'sections[]': 'Array of sections with: oid (section OID), content (UU5 string)'
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
    
    return await loadMngKitPage(url, http);
}

module.exports = { execute, schema, parseMngKitUri };
