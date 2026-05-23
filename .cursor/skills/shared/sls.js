/**
 * SLS API utilities
 * 
 * All functions require an authenticated HTTP client injected by the MCP server.
 */

function parseSlsUri(uri) {
    const url = new URL(uri);
    const pathParts = url.pathname.split('/');
    const slsIndex = pathParts.findIndex(p => p === 'uu-sls-maing01');
    const awid = slsIndex >= 0 ? pathParts[slsIndex + 1] : null;

    return {
        baseUri: `${url.protocol}//${url.host}/uu-sls-maing01/${awid}`,
        awid,
        host: url.host
    };
}

/**
 * List SLS issues with filters
 * @param {string} baseUri - SLS base URI (e.g., https://uuapp.plus4u.net/uu-sls-maing01/{awid})
 * @param {Object} filters - Filter parameters
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function listSlsIssues(baseUri, filters, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    const queryString = buildQueryString(filters);
    const url = queryString ? `${baseUri}/issue/list?${queryString}` : `${baseUri}/issue/list`;
    return await http.get(url);
}

/**
 * Build query string for issue/list from simplified filters
 * Format: filterMap.state%5B0%5D=sent&filterMap.state%5B1%5D=inProgress&pageInfo.pageSize=100
 * @param {Object} filters - Simplified filter object
 */
function buildQueryString(filters = {}) {
    const params = [];
    
    // Filter map arrays
    if (filters.states && Array.isArray(filters.states)) {
        filters.states.forEach((state, i) => {
            params.push(`filterMap.state%5B${i}%5D=${encodeURIComponent(state)}`);
        });
    }
    
    if (filters.types && Array.isArray(filters.types)) {
        filters.types.forEach((type, i) => {
            params.push(`filterMap.type%5B${i}%5D=${encodeURIComponent(type)}`);
        });
    }
    
    if (filters.priorities && Array.isArray(filters.priorities)) {
        filters.priorities.forEach((priority, i) => {
            params.push(`filterMap.priority%5B${i}%5D=${encodeURIComponent(priority)}`);
        });
    }
    
    // Topic code filter
    if (filters.topicCode) {
        params.push(`filterMap.topicCode=${encodeURIComponent(filters.topicCode)}`);
    }

    // Filter map scalars
    if (filters.slsProduct) {
        params.push(`filterMap.slsProduct=${encodeURIComponent(filters.slsProduct)}`);
    }
    
    if (filters.slsComponent) {
        params.push(`filterMap.slsComponent=${encodeURIComponent(filters.slsComponent)}`);
    }
    
    if (filters.assignedTo) {
        params.push(`filterMap.assignedTo=${encodeURIComponent(filters.assignedTo)}`);
    }
    
    if (filters.reportedBy) {
        params.push(`filterMap.reportedBy=${encodeURIComponent(filters.reportedBy)}`);
    }
    
    // Page info
    if (filters.pageSize) {
        params.push(`pageInfo.pageSize=${filters.pageSize}`);
    }
    
    if (filters.pageIndex !== undefined) {
        params.push(`pageInfo.pageIndex=${filters.pageIndex}`);
    }
    
    // Sorting
    if (filters.sortBy) {
        params.push(`sortBy=${encodeURIComponent(filters.sortBy)}`);
    }
    
    return params.join('&');
}

/**
 * Load a single SLS issue by ID
 * @param {string} baseUri - SLS base URI
 * @param {string} issueId - Issue ID
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function loadSlsIssue(baseUri, issueId, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    return await http.get(`${baseUri}/issue/load?id=${encodeURIComponent(issueId)}`);
}

/**
 * List SLS products
 * @param {string} baseUri - SLS base URI
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function listSlsProducts(baseUri, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    return await http.get(`${baseUri}/slsProduct/list`);
}

module.exports = {
    parseSlsUri,
    listSlsIssues,
    loadSlsIssue,
    listSlsProducts,
    buildQueryString
};
