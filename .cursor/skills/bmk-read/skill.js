/**
 * Business Model Kit Read Skill - MCP Entry Point
 * Lists and loads BMK entities (products, processes, use cases, scenarios, actors).
 */

const BMK_APP_CODE = 'uu-uuappbusinessmodelkit-maing01';

const ENTITY_TYPES = ['product', 'process', 'businessUseCase', 'businessScenario', 'businessActor'];

const schema = {
    name: 'bmk-read',
    description: 'Read data from uuApp Business Model Kit (BMK) — list or load products, processes, business use cases, business scenarios, and business actors. Pass a BMK URL or baseUri + command.',
    parameters: {
        url: {
            type: 'string',
            required: false,
            description: 'Full BMK URL (e.g., https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}/product/list). Extracts baseUri and command automatically.'
        },
        baseUri: {
            type: 'string',
            required: false,
            description: 'BMK base URI (e.g., https://uuapp.plus4u.net/uu-uuappbusinessmodelkit-maing01/{awid}). Use with "command" param.'
        },
        command: {
            type: 'string',
            required: false,
            description: 'Command path (e.g., "product/list", "process/load"). For single entity, use {entity}/load with "id" param.'
        },
        id: {
            type: 'string',
            required: false,
            description: 'Entity ID for load commands (e.g., product/load, process/load)'
        },
        pageSize: {
            type: 'number',
            required: false,
            description: 'Results per page for list commands (default: 1000)'
        },
        pageIndex: {
            type: 'number',
            required: false,
            description: 'Page index for list commands (0-based)'
        }
    },
    returns: {
        'itemList[]': 'Array of entities for list commands (name, state, id, pageCode, desc, ...)',
        'pageInfo': 'Pagination: { pageIndex, pageSize, total }',
        'uuAppBusinessModel': 'Business model metadata (name, bookUri, btBaseUri, ...)'
    }
};

function parseBmkUri(uri) {
    const url = new URL(uri);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const bmkIndex = pathParts.findIndex(p => p === BMK_APP_CODE);

    if (bmkIndex < 0) {
        throw new Error(`URL does not contain ${BMK_APP_CODE}: ${uri}`);
    }

    const awid = pathParts[bmkIndex + 1];
    if (!awid) {
        throw new Error(`Could not extract AWID from URL: ${uri}`);
    }

    const baseUri = `${url.protocol}//${url.host}/${BMK_APP_CODE}/${awid}`;
    const commandParts = pathParts.slice(bmkIndex + 2);
    const command = commandParts.length > 0 ? commandParts.join('/') : null;

    const queryParams = {};
    for (const [key, value] of url.searchParams.entries()) {
        queryParams[key] = value;
    }

    return { baseUri, awid, command, queryParams };
}

function buildQuery(params) {
    const parts = [];
    if (params.id) parts.push(`id=${encodeURIComponent(params.id)}`);
    if (params.pageSize) parts.push(`pageInfo.pageSize=${params.pageSize}`);
    if (params.pageIndex !== undefined) parts.push(`pageInfo.pageIndex=${params.pageIndex}`);
    return parts.length > 0 ? `?${parts.join('&')}` : '';
}

async function execute(params, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const { url, baseUri: paramBaseUri, command: paramCommand, id, pageSize, pageIndex } = params;

    let baseUri, command, extraQueryParams = {};

    if (url) {
        const parsed = parseBmkUri(url);
        baseUri = parsed.baseUri;
        command = paramCommand || parsed.command;
        extraQueryParams = parsed.queryParams;
    } else if (paramBaseUri) {
        baseUri = paramBaseUri.replace(/\/$/, '');
        command = paramCommand;
    } else {
        throw new Error('Either "url" or "baseUri" parameter is required.');
    }

    if (!command) {
        throw new Error(
            'Could not determine command. Provide via URL path or "command" parameter. ' +
            'Available: product/list, process/list, businessUseCase/list, businessScenario/list, businessActor/list, ' +
            '{entity}/load (with id param)'
        );
    }

    // Normalize: "product/get" → "product/load" or "product/list" (get is a frontend route, not API)
    if (command.endsWith('/get')) {
        const entity = command.replace('/get', '');
        command = id ? `${entity}/load` : `${entity}/list`;
    }

    const queryString = buildQuery({ id, pageSize, pageIndex });
    const extraParts = Object.entries(extraQueryParams)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');

    let fullUrl = `${baseUri}/${command}${queryString}`;
    if (extraParts) {
        fullUrl += queryString ? `&${extraParts}` : `?${extraParts}`;
    }

    const response = await http.get(fullUrl);
    const data = response?.data || response;

    if (typeof data === 'string' && data.startsWith('<!DOCTYPE')) {
        throw new Error(
            `Command "${command}" returned HTML instead of JSON. ` +
            'This is likely a frontend page route, not an API endpoint. ' +
            'Use {entity}/list for listing or {entity}/load with "id" for loading a single entity.'
        );
    }

    return data;
}

module.exports = { execute, schema, parseBmkUri, BMK_APP_CODE, ENTITY_TYPES };
