/**
 * SLS Read Skill - MCP Entry Point
 * Lists and loads SLS issues with filters
 */

const path = require('path');
const { parseSlsUri, listSlsIssues, loadSlsIssue } = require(path.join(__dirname, '../shared/sls.js'));

/**
 * Skill parameter schema - used by MCP for tool generation
 */
const schema = {
    name: 'sls-read',
    description: 'List or load SLS issues from uu-sls-maing01. Use url parameter for listing issues with optional filters, or issueId to load a single issue.',
    parameters: {
        url: {
            type: 'string',
            required: false,
            description: 'SLS URL (e.g., https://uuapp.plus4u.net/uu-sls-maing01/{awid}/...). Alias: baseUri'
        },
        baseUri: {
            type: 'string',
            required: false,
            description: 'Alias for url parameter'
        },
        issueId: {
            type: 'string',
            required: false,
            description: 'Load a single issue by ID instead of listing'
        },
        states: {
            type: 'array',
            required: false,
            description: 'Filter by states: initial, sent, inProgress, waitingForInformation, reactivated, resolved, rejected, closed'
        },
        types: {
            type: 'array',
            required: false,
            description: 'Filter by types: request, error'
        },
        priorities: {
            type: 'array',
            required: false,
            description: 'Filter by priorities: low, normal, high, critical'
        },
        topicCode: {
            type: 'string',
            required: false,
            description: 'Filter by topic code (e.g., "entitymanagement", "gateway", "uuappobjectstore"). See assets/sls-catalog.md for known topics per SLS instance.'
        },
        slsProduct: {
            type: 'string',
            required: false,
            description: 'Filter by SLS product code'
        },
        slsComponent: {
            type: 'string',
            required: false,
            description: 'Filter by SLS component code'
        },
        assignedTo: {
            type: 'string',
            required: false,
            description: 'Filter by assigned user uuIdentity'
        },
        reportedBy: {
            type: 'string',
            required: false,
            description: 'Filter by reporter uuIdentity'
        },
        pageSize: {
            type: 'number',
            required: false,
            description: 'Number of results per page (default: 100, max: 10000)'
        },
        pageIndex: {
            type: 'number',
            required: false,
            description: 'Page index (0-based)'
        },
        sortBy: {
            type: 'string',
            required: false,
            description: 'Sort field (e.g., "dateCreated desc")'
        }
    },
    returns: {
        'itemList[]': 'Array of issues with: id, code, type, state, priority, subject, dateCreated, etc.',
        'pageInfo': 'Pagination info: pageIndex, pageSize, total'
    }
};

/**
 * Execute the skill
 * @param {Object} params - Skill parameters
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function execute(params, http) {
    // Accept both 'url' and 'baseUri' as parameter names
    const { url, baseUri, issueId, ...filters } = params;
    const slsUrl = url || baseUri;
    
    if (!slsUrl) {
        throw new Error('url parameter is required (SLS URL like https://uuapp.plus4u.net/uu-sls-maing01/{awid}/)');
    }
    
    const parsed = parseSlsUri(slsUrl);
    
    // Load single issue if issueId provided
    if (issueId) {
        return await loadSlsIssue(parsed.baseUri, issueId, http);
    }
    
    // List issues with filters
    return await listSlsIssues(parsed.baseUri, filters, http);
}

module.exports = { execute, schema, parseSlsUri };
