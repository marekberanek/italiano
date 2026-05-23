/**
 * Management Kit Add Page Skill - MCP Entry Point
 * Adds a new page to a Management Kit document
 */

const path = require('path');
const { parseMngKitUri, addMngKitPage, listMngKitPages } = require(path.join(__dirname, '../shared/mngkit.js'));

const schema = {
    name: 'mngkit-add-page',
    description: 'Add a new page to a ManagementKit document. Supports placement after an existing page.',
    parameters: {
        url: {
            type: 'string',
            required: false,
            description: 'ManagementKit document URL (alternative to baseUri + documentOid). Will extract baseUri and documentOid from URL.'
        },
        baseUri: {
            type: 'string',
            required: false,
            description: 'Base URI for API calls (get from mngkit-read response). Required if url not provided.'
        },
        documentOid: {
            type: 'string',
            required: false,
            description: 'Document OID (get from mngkit-read response). Required if url not provided.'
        },
        name: {
            type: 'string',
            required: true,
            description: 'Page name (display name for the new page)'
        },
        previousPageOid: {
            type: 'string',
            required: false,
            description: 'OID of the page after which to insert the new page. If omitted, page is added at the end.'
        },
        hidden: {
            type: 'boolean',
            required: false,
            default: false,
            description: 'Whether the page should be hidden in navigation. Default: false.'
        }
    }
};

async function execute(params, http, context) {
    const { url, name, previousPageOid, hidden } = params;
    let { baseUri, documentOid } = params;
    const progress = context?.progress || (() => {});

    if (!name) {
        throw new Error('name parameter is required');
    }

    // Resolve baseUri and documentOid from URL if provided
    if (url && (!baseUri || !documentOid)) {
        const parsed = parseMngKitUri(url);
        baseUri = baseUri || parsed.baseUri;
        documentOid = documentOid || parsed.documentOid;
    }

    if (!baseUri || !documentOid) {
        throw new Error(
            'Either url or both baseUri + documentOid are required. ' +
            'Get them from mngkit-read response or provide the document URL.'
        );
    }

    await progress(1, 2, 'Adding new page...');
    const result = await addMngKitPage(baseUri, documentOid, { name, previousPageOid, hidden }, http);
    await progress(2, 2, 'Done');
    return result;
}

module.exports = { execute, schema };
