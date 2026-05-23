/**
 * Management Kit Structure Skill
 * Returns document page structure with page OIDs and names.
 */

const path = require('path');
const { parseMngKitUri, getMngKitStructure } = require(path.join(__dirname, '../shared/mngkit.js'));

const schema = {
    name: 'mngkit-structure',
    description: 'Get ManagementKit document structure with page list, OIDs, and names. Use to understand document hierarchy before adding or navigating pages.',
    parameters: {
        url: {
            type: 'string',
            required: true,
            description: 'ManagementKit document URL (e.g., https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={documentOid})'
        }
    },
    returns: {
        documentName: 'Document name',
        documentOid: 'Document OID',
        eccDocumentOid: 'ECC document OID',
        'pageList[]': 'Array of pages with their OIDs and names'
    }
};

async function execute(params, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const { url } = params;
    if (!url) {
        throw new Error('url parameter is required');
    }

    const parsed = parseMngKitUri(url);
    if (!parsed.documentOid) {
        throw new Error('Could not extract documentOid from URL. Ensure URL contains ?oid={documentOid}');
    }

    return await getMngKitStructure(parsed.baseUri, parsed.documentOid, http);
}

module.exports = { execute, schema };
