/**
 * BookKit API utilities
 * 
 * All functions require an authenticated HTTP client injected by the MCP server.
 */

function parseBookKitUri(uri) {
    const url = new URL(uri);
    const pathParts = url.pathname.split('/');
    const bookkitIndex = pathParts.findIndex(p => p === 'uu-bookkit-maing01');
    const awid = bookkitIndex >= 0 ? pathParts[bookkitIndex + 1] : null;
    const pageCode = url.searchParams.get('code');

    return {
        baseUri: `${url.protocol}//${url.host}/uu-bookkit-maing01/${awid}`,
        awid,
        pageCode,
        host: url.host
    };
}

/**
 * Load a BookKit page
 * @param {string} uri - BookKit page URL
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function loadBookKitPage(uri, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    const parsed = parseBookKitUri(uri);
    const apiUrl = `${parsed.baseUri}/loadPage?code=${encodeURIComponent(parsed.pageCode)}`;
    
    return await http.get(apiUrl);
}

/**
 * Load BookKit book structure
 * @param {string} baseUri - BookKit base URI
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function loadBookKitStructure(baseUri, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    const apiUrl = `${baseUri}/book/listStructure`;
    return await http.get(apiUrl);
}

/**
 * Update a BookKit section
 * @param {string} baseUri - BookKit base URI
 * @param {string} pageCode - Page code
 * @param {string} sectionCode - Section code
 * @param {string} content - New content
 * @param {number} rev - Revision number for optimistic locking
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function updateBookKitSection(baseUri, pageCode, sectionCode, content, rev, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    await http.post(`${baseUri}/lockPageSection`, {
        page: pageCode,
        code: sectionCode
    });

    try {
        const result = await http.post(`${baseUri}/updatePageSection`, {
            page: pageCode,
            code: sectionCode,
            content,
            sys: { rev }
        });
        return result;
    } finally {
        await http.post(`${baseUri}/unlockPageSection`, {
            page: pageCode,
            code: sectionCode
        });
    }
}

/**
 * Add a new section to a BookKit page
 * @param {string} baseUri - BookKit base URI
 * @param {string} pageCode - Page code
 * @param {string} content - Section content (UU5 string)
 * @param {Object} options - Optional: { order } - position where to insert (0 = first, 1 = second, etc.)
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function addBookKitSection(baseUri, pageCode, content, options, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    const body = {
        page: pageCode,
        content,
        order: options?.order ?? 0  // Default to 0 (first position) if not specified
    };
    
    return await http.post(`${baseUri}/addPageSection`, body);
}

/**
 * Add a new page to a BookKit book
 * @param {string} baseUri - BookKit base URI
 * @param {Object} pageData - Page data: { previous?, indent?, visible?, code?, name, desc? }
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function addBookKitPage(baseUri, pageData, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    const dtoIn = {
        indent: pageData.indent ?? 0,
        visible: pageData.visible ?? true,
        code: pageData.code ?? null,
        name: pageData.name,
        desc: pageData.desc ?? '<uu5string/>'
    };
    
    if (pageData.previous) {
        dtoIn.previous = pageData.previous;
    }
    
    return await http.post(`${baseUri}/addPage`, dtoIn);
}

/**
 * List all pages in a BookKit book
 * @param {string} baseUri - BookKit base URI
 * @param {Object} http - HTTP client with token pre-injected by MCP
 * @returns {Object} - { itemList: [...], pageInfo: {...} }
 */
async function listBookKitPages(baseUri, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    const apiUrl = `${baseUri}/listPages`;
    return await http.get(apiUrl);
}

/**
 * Load BookKit alias map. Aliases are primarily migration/backward-compat data.
 * @param {string} baseUri - BookKit base URI
 * @param {Object} http - HTTP client with token pre-injected by MCP
 * @returns {Object} Raw alias map returned by BookKit
 */
async function getBookKitAliasesMap(baseUri, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    return await http.get(`${baseUri}/getAliasesMap`);
}

/**
 * Resolve alias chains in a raw alias map.
 * @param {Object} rawMap - Map-like object of alias -> target
 * @returns {Object} { resolved, chains, circular }
 */
function resolveAliasChains(rawMap) {
    const resolved = {};
    const circular = [];
    let chains = 0;

    for (const code of Object.keys(rawMap || {})) {
        const seen = new Set([code]);
        let target = rawMap[code];
        let depth = 0;

        while (target && rawMap[target]) {
            if (seen.has(target)) {
                circular.push(code);
                break;
            }
            seen.add(target);
            target = rawMap[target];
            depth++;
        }

        if (depth > 0) chains++;
        resolved[code] = target || rawMap[code];
    }

    return { resolved, chains, circular };
}

module.exports = {
    parseBookKitUri,
    loadBookKitPage,
    loadBookKitStructure,
    updateBookKitSection,
    addBookKitSection,
    addBookKitPage,
    listBookKitPages,
    getBookKitAliasesMap,
    resolveAliasChains
};
