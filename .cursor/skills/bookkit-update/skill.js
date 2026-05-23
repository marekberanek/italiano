/**
 * BookKit Update Skill - MCP Entry Point
 * Updates or adds a section in a BookKit page
 */

const path = require('path');
const fs = require('fs');
const { parseBookKitUri, updateBookKitSection, addBookKitSection } = require(path.join(__dirname, '../shared/bookkit.js'));

/**
 * Skill parameter schema - used by MCP for tool generation
 */
const schema = {
    name: 'bookkit-update',
    description: 'Update an existing section or add a new section to a BookKit page',
    parameters: {
        url: {
            type: 'string',
            required: true,
            description: 'BookKit page URL (e.g., https://uuapp.plus4u.net/uu-bookkit-maing01/{awid}/book/page?code={pageCode})'
        },
        action: {
            type: 'string',
            required: false,
            enum: ['update', 'add'],
            default: 'update',
            description: 'Action to perform: "update" (default) updates existing section, "add" creates new section'
        },
        sectionCode: {
            type: 'string',
            required: false,
            description: 'Section code to update (required for action="update", get from bookkit-read response body[].code)'
        },
        content: {
            type: 'string',
            required: false,
            description: 'UU5 string content (must start with <uu5string/>). Either content or contentFilePath is required.'
        },
        contentFilePath: {
            type: 'string',
            required: false,
            description: 'Path to file containing UU5 string content (alternative to content parameter, avoids loading large content into chat context)'
        },
        rev: {
            type: 'number',
            required: false,
            description: 'Section revision for optimistic locking (required for action="update", get from body[].sys.rev)'
        },
        order: {
            type: 'number',
            required: false,
            description: 'For action="add": position where to insert section (0 = first, 1 = after first section, etc.). Defaults to 0.'
        }
    }
};

/**
 * Execute the skill
 * @param {Object} params - Skill parameters
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function execute(params, http, context) {
    const { url, action = 'update', sectionCode, content, contentFilePath, rev, order } = params;
    const progress = context?.progress || (() => {});

    if (!url) {
        throw new Error('url parameter is required');
    }

    // Resolve content from either content or contentFilePath
    await progress(1, 3, 'Resolving content...');
    let actualContent = content;
    if (contentFilePath && !content) {
        if (!fs.existsSync(contentFilePath)) {
            throw new Error(`contentFilePath file not found: ${contentFilePath}`);
        }
        actualContent = fs.readFileSync(contentFilePath, 'utf-8');
    }

    if (!actualContent) {
        throw new Error('Either content or contentFilePath parameter is required');
    }

    const parsed = parseBookKitUri(url);

    if (action === 'add') {
        await progress(2, 3, 'Adding new section...');
        const options = { order: order ?? 0 };
        const result = await addBookKitSection(parsed.baseUri, parsed.pageCode, actualContent, options, http);
        await progress(3, 3, 'Done');
        return result;
    } else {
        if (!sectionCode || rev === undefined) {
            const missing = [];
            if (!sectionCode) missing.push('sectionCode');
            if (rev === undefined) missing.push('rev');

            throw new Error(
                `Missing required parameters for update action: ${missing.join(', ')}. ` +
                `WORKFLOW: 1) First call bookkit-read with url="${url}" to get the page content. ` +
                `2) Extract sectionCode from body[].code and rev from body[].sys.rev. ` +
                `3) Then call bookkit-update with those values. ` +
                `TIP: For adding new sections, use action="add" with order parameter (still call bookkit-read first to determine correct order position).`
            );
        }

        await progress(2, 3, 'Updating section...');
        const result = await updateBookKitSection(parsed.baseUri, parsed.pageCode, sectionCode, actualContent, rev, http);
        await progress(3, 3, 'Done');
        return result;
    }
}

module.exports = { execute, schema, parseBookKitUri };
