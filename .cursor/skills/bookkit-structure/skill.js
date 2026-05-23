/**
 * BookKit Structure Skill
 * Returns book tree structure with indent levels, previous/next links, and page labels.
 */

const path = require('path');
const { parseBookKitUri } = require(path.join(__dirname, '../shared/bookkit.js'));

const schema = {
    name: 'bookkit-structure',
    description: 'Get BookKit book tree structure with indent levels, previous/next links, and page labels. Use to understand book hierarchy before adding or moving pages.',
    parameters: {
        url: {
            type: 'string',
            required: true,
            description: 'Any BookKit URL from the book (e.g., https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code={pageCode})'
        }
    },
    returns: {
        'itemMap': 'Map of page code → { indent, previous, next, label, state, visible }',
        'awid': 'Application workspace ID'
    }
};

async function execute(params, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const { baseUri } = parseBookKitUri(params.url);
    return await http.get(`${baseUri}/getBookStructure`);
}

module.exports = { execute, schema };
