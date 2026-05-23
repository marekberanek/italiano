/**
 * Management Kit API utilities
 * 
 * All functions require an authenticated HTTP client injected by the MCP server.
 */

function parseMngKitUri(uri) {
    const url = new URL(uri);
    const pathParts = url.pathname.split('/');
    const mngkitIndex = pathParts.findIndex(p => p === 'uu-managementkit-maing02');
    const awid = mngkitIndex >= 0 ? pathParts[mngkitIndex + 1] : null;
    const documentOid = url.searchParams.get('oid');
    const pageOid = url.searchParams.get('pageOid');

    return {
        baseUri: `${url.protocol}//${url.host}/uu-managementkit-maing02/${awid}`,
        awid,
        documentOid,
        pageOid,
        host: url.host
    };
}

/**
 * Load a Management Kit page with metadata and content
 * @param {string} uri - MngKit document URL
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function loadMngKitPage(uri, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    const parsed = parseMngKitUri(uri);

    const metaUrl = `${parsed.baseUri}/document/loadByOid?oid=${parsed.documentOid}`;
    const metaData = await http.get(metaUrl);

    const eccDocOid = metaData?.data?.uuEccData?.documentOid;
    if (!eccDocOid) {
        throw new Error('Could not extract ECC document OID from metadata');
    }

    let contentUrl = `${parsed.baseUri}/document/ecc/document/loadByOid?oid=${parsed.documentOid}&uuEccData.documentOid=${eccDocOid}`;
    if (parsed.pageOid) {
        contentUrl += `&uuEccData.pageOid=${parsed.pageOid}`;
    }

    const contentData = await http.get(contentUrl);

    return {
        metadata: metaData,
        content: contentData,
        eccDocumentOid: eccDocOid,
        documentOid: parsed.documentOid,
        pageOid: parsed.pageOid,
        baseUri: parsed.baseUri
    };
}

/**
 * Collect all topSection and bottomSection OIDs across all pages of a document.
 * Writing to these OIDs is forbidden - content does not render visibly.
 */
async function getProtectedSectionOids(baseUri, documentOid, http) {
    const protectedOids = new Set();

    const metaData = await http.get(`${baseUri}/document/loadByOid?oid=${documentOid}`);
    const eccDocOid = metaData?.data?.uuEccData?.documentOid;
    if (!eccDocOid) return protectedOids;

    const eccData = await http.get(
        `${baseUri}/document/ecc/document/loadByOid?oid=${documentOid}&uuEccData.documentOid=${eccDocOid}`
    );

    const pageList = eccData?.pageList || [];
    for (const page of pageList) {
        try {
            const pageData = await http.get(
                `${baseUri}/document/ecc/document/loadByOid?oid=${documentOid}` +
                `&uuEccData.documentOid=${eccDocOid}&uuEccData.pageOid=${page.pageOid}`
            );
            const rp = pageData?.requestedPage;
            if (rp?.topSectionOid) protectedOids.add(rp.topSectionOid);
            if (rp?.bottomSectionOid) protectedOids.add(rp.bottomSectionOid);
        } catch (_) { /* skip pages we cannot load */ }
    }

    return protectedOids;
}

/**
 * Update a Management Kit section
 * @param {string} baseUri - MngKit base URI
 * @param {string} documentOid - Document OID
 * @param {string} sectionOid - Section OID
 * @param {string|Array} content - New content
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function updateMngKitSection(baseUri, documentOid, sectionOid, content, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const protectedOids = await getProtectedSectionOids(baseUri, documentOid, http);
    if (protectedOids.has(sectionOid)) {
        throw new Error(
            `FORBIDDEN: sectionOid "${sectionOid}" is a topSection or bottomSection. ` +
            `These areas do NOT render content visibly in ManagementKit. ` +
            `You MUST use a sectionOid from mainPanel.sectionList[]. ` +
            `If mainPanel.sectionList is empty, use mngkit-update with action="add" and panelOid to create a section first.`
        );
    }
    
    let resolvedContent = content;
    if (typeof resolvedContent === 'string') {
        try {
            const parsed = JSON.parse(resolvedContent);
            if (Array.isArray(parsed)) resolvedContent = parsed;
        } catch (_) { /* treat as uu5string */ }
    }
    const preparedContent = Array.isArray(resolvedContent) ? resolvedContent : [{
        uu5Tag: 'Uu5RichTextBricks.Block',
        props: { uu5String: resolvedContent }
    }];

    await http.post(`${baseUri}/document/ecc/section/lockByOid`, {
        oid: documentOid,
        uuEccData: { sectionOid }
    });

    try {
        const result = await http.post(`${baseUri}/document/ecc/section/updateByOid`, {
            oid: documentOid,
            uuEccData: {
                sectionOid,
                content: preparedContent
            }
        });
        return result;
    } finally {
        await http.post(`${baseUri}/document/ecc/section/unlockByOid`, {
            oid: documentOid,
            uuEccData: { sectionOid }
        });
    }
}

/**
 * Create a new section in a Management Kit panel.
 * Two-step flow matching the browser UI: create an empty section, then lock+update+unlock with content.
 * @param {string} baseUri - MngKit base URI
 * @param {string} documentOid - Document OID
 * @param {string} panelOid - Panel OID
 * @param {string|Array} content - Content for new section
 * @param {number|Object} [orderIndexOrHttp] - Section position, or HTTP client for backward-compatible calls
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function createMngKitSection(baseUri, documentOid, panelOid, content, orderIndexOrHttp, http) {
    let orderIndex = orderIndexOrHttp;
    if (!http && orderIndexOrHttp && typeof orderIndexOrHttp === 'object') {
        http = orderIndexOrHttp;
        orderIndex = undefined;
    }

    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    let resolvedContent = content;
    if (typeof resolvedContent === 'string') {
        try {
            const parsed = JSON.parse(resolvedContent);
            if (Array.isArray(parsed)) resolvedContent = parsed;
        } catch (_) { /* treat as uu5string */ }
    }
    const preparedContent = Array.isArray(resolvedContent) ? resolvedContent : [{
        uu5Tag: 'Uu5RichTextBricks.Block',
        props: { uu5String: resolvedContent }
    }];

    // Step 1: Create empty section
    const createSectionData = { panelOid };
    if (orderIndex !== undefined) {
        createSectionData.orderIndex = orderIndex;
    }

    const createResult = await http.post(`${baseUri}/document/ecc/panel/createSection`, {
        oid: documentOid,
        uuEccData: createSectionData
    });

    const sectionOid = createResult?.createdSection?.oid;
    if (!sectionOid) {
        throw new Error('createSection succeeded but no sectionOid returned');
    }

    // Step 2: Lock the new section
    await http.post(`${baseUri}/document/ecc/section/lockByOid`, {
        oid: documentOid,
        uuEccData: { sectionOid }
    });

    // Step 3: Update with content, then unlock
    try {
        const result = await http.post(`${baseUri}/document/ecc/section/updateByOid`, {
            oid: documentOid,
            uuEccData: {
                sectionOid,
                content: preparedContent
            }
        });
        return result;
    } finally {
        await http.post(`${baseUri}/document/ecc/section/unlockByOid`, {
            oid: documentOid,
            uuEccData: { sectionOid }
        }).catch(() => {});
    }
}

/**
 * List all pages of a Management Kit document
 * Uses the ECC document load to extract the page list.
 * @param {string} baseUri - MngKit base URI
 * @param {string} documentOid - Document OID
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function listMngKitPages(baseUri, documentOid, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const metaData = await http.get(`${baseUri}/document/loadByOid?oid=${documentOid}`);
    const eccDocOid = metaData?.data?.uuEccData?.documentOid;
    if (!eccDocOid) {
        throw new Error('Could not extract ECC document OID from metadata');
    }

    const eccData = await http.get(
        `${baseUri}/document/ecc/document/loadByOid?oid=${documentOid}&uuEccData.documentOid=${eccDocOid}`
    );

    const pageList = eccData?.pageList || [];
    return {
        documentName: eccData?.name || metaData?.data?.name,
        documentOid,
        eccDocumentOid: eccDocOid,
        pageList: pageList.map((p, index) => ({
            pageOid: p.pageOid,
            name: p.name,
            hidden: p.hidden || false,
            order: index
        })),
        pageCount: pageList.length
    };
}

/**
 * Get Management Kit document structure (page hierarchy)
 * @param {string} baseUri - MngKit base URI
 * @param {string} documentOid - Document OID
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function getMngKitStructure(baseUri, documentOid, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const metaData = await http.get(`${baseUri}/document/loadByOid?oid=${documentOid}`);
    const eccDocOid = metaData?.data?.uuEccData?.documentOid;
    if (!eccDocOid) {
        throw new Error('Could not extract ECC document OID from metadata');
    }

    const eccData = await http.get(
        `${baseUri}/document/ecc/document/loadByOid?oid=${documentOid}&uuEccData.documentOid=${eccDocOid}`
    );

    return {
        documentName: eccData?.name || metaData?.data?.name,
        documentOid,
        eccDocumentOid: eccDocOid,
        pageList: eccData?.pageList || [],
        rawData: eccData
    };
}

/**
 * Add a new page to a Management Kit document
 * @param {string} baseUri - MngKit base URI
 * @param {string} documentOid - Document OID
 * @param {Object} pageData - { name, afterPageOid?, hidden? }
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function addMngKitPage(baseUri, documentOid, pageData, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const metaData = await http.get(`${baseUri}/document/loadByOid?oid=${documentOid}`);
    const eccDocOid = metaData?.data?.uuEccData?.documentOid;
    if (!eccDocOid) {
        throw new Error('Could not extract ECC document OID from metadata');
    }

    const data = {
        documentOid: eccDocOid,
        name: pageData.name
    };
    if (pageData.previousPageOid) {
        data.previousPageOid = pageData.previousPageOid;
    }
    if (pageData.hidden !== undefined) {
        data.hidden = pageData.hidden;
    }

    return await http.post(`${baseUri}/document/ecc/document/createPage`, {
        oid: documentOid,
        uuEccData: data
    });
}

/**
 * Upload a binary attachment to a Management Kit document
 * @param {string} baseUri - MngKit base URI
 * @param {string} documentOid - Document OID
 * @param {string} filePath - Local file path to upload
 * @param {Object} [options] - { filename?, mimeType? }
 * @param {Object} http - HTTP client with upload() method
 */
async function uploadMngKitAttachment(baseUri, documentOid, filePath, options, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    if (!http.upload) {
        throw new Error('http.upload() is not available. Update skilled-plus4u-mcp to the latest version.');
    }

    // Load document metadata to get attachments collectionOid
    const metaData = await http.get(`${baseUri}/document/loadByOid?oid=${documentOid}`);
    const collectionOid = metaData?.data?.uuEbcData?.uuBbAttachmentsCollectionOid;
    if (!collectionOid) {
        throw new Error('Could not extract uuBbAttachmentsCollectionOid from document metadata');
    }

    const url = `${baseUri}/document/ebc/collection/createFile`;
    const path = require('path');
    const fileName = options?.filename || path.basename(filePath);
    const metadata = {};
    if (options?.filename) metadata.filename = fileName;
    if (options?.mimeType) metadata.mimeType = options.mimeType;
    // uuApp multipart uses dot-notation for nested objects
    metadata.oid = documentOid;
    metadata['uuEbcData.collectionOid'] = collectionOid;
    metadata['uuEbcData.name'] = fileName;
    // binary goes as 'uuEbcData.data' field
    metadata._binaryFieldName = 'uuEbcData.data';

    return await http.upload(url, filePath, metadata);
}

/**
 * List attachments of a Management Kit document
 * @param {string} baseUri - MngKit base URI
 * @param {string} documentOid - Document OID
 * @param {Object} http - HTTP client
 */
async function listMngKitAttachments(baseUri, documentOid, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const metaData = await http.get(`${baseUri}/document/loadByOid?oid=${documentOid}`);
    const collectionOid = metaData?.data?.uuEbcData?.uuBbAttachmentsCollectionOid;
    if (!collectionOid) {
        throw new Error('Could not extract uuBbAttachmentsCollectionOid from document metadata');
    }

    return await http.get(
        `${baseUri}/document/ebc/collection/listFilesByOid?oid=${documentOid}` +
        `&uuEbcData.collectionOid=${collectionOid}&pageInfo.pageSize=2048`
    );
}

module.exports = {
    parseMngKitUri,
    loadMngKitPage,
    getProtectedSectionOids,
    updateMngKitSection,
    createMngKitSection,
    listMngKitPages,
    getMngKitStructure,
    addMngKitPage,
    uploadMngKitAttachment,
    listMngKitAttachments
};
