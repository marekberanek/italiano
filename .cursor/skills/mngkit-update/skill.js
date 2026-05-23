/**
 * Management Kit Update Skill - MCP Entry Point
 * Updates or creates a section in a Management Kit document
 */

const path = require('path');
const fs = require('fs');
const { updateMngKitSection, createMngKitSection } = require(path.join(__dirname, '../shared/mngkit.js'));

/**
 * Skill parameter schema - used by MCP for tool generation
 */
const schema = {
    name: 'mngkit-update',
    description: 'Update an existing section or add a new section (including the first one in an empty panel) to a ManagementKit document page. Use action="add" with panelOid to create/insert a new section.',
    parameters: {
        baseUri: {
            type: 'string',
            required: true,
            description: 'Base URI for API calls (get from mngkit-read response)'
        },
        documentOid: {
            type: 'string',
            required: true,
            description: 'Document OID (get from mngkit-read response)'
        },
        action: {
            type: 'string',
            required: false,
            enum: ['update', 'add'],
            default: 'update',
            description: 'Action to perform: "update" (default) updates existing section, "add" creates new section'
        },
        sectionOid: {
            type: 'string',
            required: false,
            description: 'Section OID to update (required for action="update", get from mngkit-read sections[].oid)'
        },
        panelOid: {
            type: 'string',
            required: false,
            description: 'Panel OID for creating new section (required for action="add", get from mngkit-read mainPanel.oid or mainPanelOid)'
        },
        orderIndex: {
            type: 'number',
            required: false,
            description: 'Position where to insert a new section for action="add" (1-based, defaults to 1)'
        },
        content: {
            type: 'string',
            required: false,
            description: 'ECC content array as JSON string, or UU5 string. Either content or contentFilePath is required.'
        },
        contentFilePath: {
            type: 'string',
            required: false,
            description: 'Path to file containing content (alternative to content parameter, avoids loading large content into chat context)'
        }
    }
};

/**
 * Execute the skill
 * @param {Object} params - Skill parameters
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function execute(params, http, context) {
    const { baseUri, documentOid, action = 'update', sectionOid, panelOid, orderIndex = 1, content, contentFilePath } = params;
    const progress = context?.progress || (() => {});

    // Validate required params
    const missing = [];
    if (!baseUri) missing.push('baseUri');
    if (!documentOid) missing.push('documentOid');

    if (missing.length > 0) {
        throw new Error(
            `Missing required parameters: ${missing.join(', ')}. ` +
            `WORKFLOW: 1) First call mngkit-read with the page URL to get document info. ` +
            `2) Extract baseUri, documentOid from the response. ` +
            `3) Then call mngkit-update with those values plus your content.`
        );
    }

    // Resolve content from either content or contentFilePath
    await progress(1, 4, 'Resolving content...');
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

    if (action === 'add') {
        if (!panelOid) {
            throw new Error(
                'Missing required parameter: panelOid (required for action="add"). ' +
                'Get it from mngkit-read response: content.requestedPage.mainPanelOid or content.requestedPage.mainPanel.oid'
            );
        }

        await progress(2, 4, 'Creating new section...');
        const result = await createMngKitSection(baseUri, documentOid, panelOid, actualContent, orderIndex, http);
        await progress(4, 4, 'Done');
        return result;
    } else {
        if (!sectionOid) {
            throw new Error(
                'Missing required parameter: sectionOid (required for action="update"). ' +
                'Get it from mngkit-read response: content.requestedPage.mainPanel.sectionList[].sectionOid. ' +
                'TIP: For adding new sections, use action="add" with panelOid parameter.'
            );
        }

        await progress(2, 4, 'Updating section...');
        const result = await updateMngKitSection(baseUri, documentOid, sectionOid, actualContent, http);
        await progress(4, 4, 'Done');
        return result;
    }
}

module.exports = { execute, schema };
