/**
 * find-person — MCP skill entry point.
 * Wraps shared/plus4upeople.js findPerson for name/uuIdentity/email lookups.
 */
const path = require('path');
const { findPerson } = require(path.join(__dirname, '../shared/plus4upeople.js'));

const schema = {
    name: 'find-person',
    description: 'Look up a person in Plus4U People (uu-plus4upeople-maing01). One of name/uuIdentity is required.',
    parameters: {
        name: { type: 'string', required: false, description: 'Full or partial name (fuzzy match)' },
        uuIdentity: { type: 'string', required: false, description: 'Exact uuIdentity (e.g. 2339-1)' },
        privateOnly: { type: 'boolean', required: false, description: 'When searching by name, default false = company-wide. Set true to restrict.' }
    },
    returns: {
        itemList: 'Array of matched persons (name, uuIdentity, mtMainBaseUri, mtDwBaseUri, ...)',
        uuAppErrorMap: 'Error map from the service'
    }
};

async function execute(params, http) {
    const { name, uuIdentity, privateOnly } = params || {};
    if (!name && !uuIdentity) {
        throw new Error('find-person requires one of: name, uuIdentity');
    }
    return await findPerson({ name, uuIdentity, privateOnly }, http);
}

module.exports = { execute, schema };
