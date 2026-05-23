/**
 * BookKit Add Page Skill
 * Adds a new page to a BookKit book with auto-indent and camelCase code generation.
 */

const path = require('path');
const { addBookKitPage } = require(path.join(__dirname, '../shared/bookkit.js'));

const schema = {
    name: 'bookkit-add-page',
    description: 'Add a new page to a BookKit book. Supports "child" (subpage) and "after" (same level) placement relative to a reference page. Auto-generates camelCase code from the page name.',
    parameters: {
        baseUri: {
            type: 'string',
            required: true,
            description: 'Base URI of the BookKit app (e.g., https://uuapp.plus4u.net/uu-bookkit-maing01/{awid})'
        },
        after: {
            type: 'string',
            required: false,
            description: 'Page code to place the new page AFTER on the same level (sibling). Mutually exclusive with "under".'
        },
        under: {
            type: 'string',
            required: false,
            description: 'Page code to place the new page UNDER as a child (subpage). Mutually exclusive with "after".'
        },
        previous: {
            type: 'string',
            required: false,
            description: 'Raw previous page code (advanced). Prefer "after" or "under" instead.'
        },
        indent: {
            type: 'number',
            required: false,
            description: 'Raw absolute indent level (advanced). Auto-calculated when using "after" or "under".'
        },
        visible: {
            type: 'boolean',
            required: false,
            default: true,
            description: 'Whether the page is visible in navigation'
        },
        code: {
            type: 'string',
            required: false,
            description: 'Page code. Auto-generated as camelCase from name if omitted.'
        },
        name: {
            type: 'object',
            required: true,
            description: 'Page name object with language keys (e.g., {"en": "My Page"})'
        },
        desc: {
            type: 'string',
            required: false,
            default: '<uu5string/>',
            description: 'Page description as UU5 string'
        }
    }
};

function toCamelCaseCode(name) {
    const text = typeof name === 'object' ? (name.en || name.cs || Object.values(name)[0]) : name;
    if (!text) return null;
    return text
        .replace(/[^a-zA-Z\s]/g, '')
        .trim()
        .split(/\s+/)
        .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('') || null;
}

async function getBookStructure(baseUri, http) {
    return await http.get(`${baseUri}/getBookStructure`);
}

function findLastDescendant(itemMap, pageCode) {
    // Walk the DFS-linearized tree to find the last descendant of pageCode.
    // The last descendant is the page right before the next sibling or ancestor's next.
    const page = itemMap[pageCode];
    if (!page) return pageCode;
    const parentIndent = page.indent;

    let current = pageCode;
    while (true) {
        const node = itemMap[current];
        if (!node || !node.next) return current;
        const nextNode = itemMap[node.next];
        if (!nextNode || nextNode.indent <= parentIndent) return current;
        current = node.next;
    }
}

async function execute(params, http, context) {
    const { baseUri, after, under, name, desc, visible } = params;
    let { previous, indent, code } = params;
    const progress = context?.progress || (() => {});

    if (!baseUri) throw new Error('baseUri is required');
    if (!name || typeof name !== 'object' || Object.keys(name).length === 0) {
        throw new Error('name must be an object with language keys (e.g., {"en": "Page Name"})');
    }
    if (after && under) throw new Error('"after" and "under" are mutually exclusive — use one or the other');

    // Auto-generate code from name if not provided
    if (!code) {
        code = toCamelCaseCode(name);
    }

    // Resolve "after" or "under" to previous + indent using book structure
    if (after || under) {
        await progress(1, 3, 'Loading book structure...');
        const structure = await getBookStructure(baseUri, http);
        const { itemMap } = structure;
        const refCode = after || under;
        const refPage = itemMap[refCode];

        if (!refPage) throw new Error(`Page "${refCode}" not found in book structure`);

        if (under) {
            previous = findLastDescendant(itemMap, refCode);
            indent = refPage.indent + 1;
        } else {
            previous = findLastDescendant(itemMap, refCode);
            indent = refPage.indent;
        }
        await progress(2, 3, 'Calculated placement, creating page...');
    } else {
        await progress(1, 2, 'Creating page...');
    }

    const result = await addBookKitPage(baseUri, { previous, indent, visible, code, name, desc }, http);
    await progress(after || under ? 3 : 2, after || under ? 3 : 2, 'Done');
    return result;
}

module.exports = { execute, schema };
