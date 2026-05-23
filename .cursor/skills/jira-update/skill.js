/**
 * JIRA Update Skill
 * Update JIRA issue fields using Personal Access Token (PAT)
 */

const path = require('path');
const {
    parseJiraInput,
    loadJiraIssue,
    updateIssue,
    addIssueLink,
    removeIssueLink,
    getLinkTypes,
    DEFAULT_JIRA_HOST
} = require(path.join(__dirname, '../shared/jira.js'));

const schema = {
    name: 'jira-update',
    description: 'Update JIRA issue fields (description, assignee, labels, priority, links). Requires JIRA_PAT.',
    parameters: {
        url: {
            type: 'string',
            required: false,
            description: 'JIRA URL (e.g., https://jira.unicorn.com/browse/AUTOMATION-412)'
        },
        issueKey: {
            type: 'string',
            required: false,
            description: 'JIRA issue key (e.g., AUTOMATION-412)'
        },
        host: {
            type: 'string',
            required: false,
            description: `JIRA host (default: ${DEFAULT_JIRA_HOST})`
        },
        description: {
            type: 'string',
            required: false,
            description: 'New description (JIRA wiki markup)'
        },
        assignee: {
            type: 'string',
            required: false,
            description: 'Assignee display name or username. Use null to unassign.'
        },
        labels: {
            type: 'array',
            required: false,
            description: 'Labels to set (replaces existing labels)'
        },
        addLabels: {
            type: 'array',
            required: false,
            description: 'Labels to add (keeps existing labels)'
        },
        removeLabels: {
            type: 'array',
            required: false,
            description: 'Labels to remove'
        },
        priority: {
            type: 'string',
            required: false,
            description: 'Priority name (e.g., "High", "Medium", "Low")'
        },
        summary: {
            type: 'string',
            required: false,
            description: 'New issue summary/title'
        },
        linkTo: {
            type: 'string',
            required: false,
            description: 'Issue key to link to'
        },
        linkType: {
            type: 'string',
            required: false,
            description: 'Link type (e.g., "Blocks", "relates to", "is blocked by")'
        },
        unlinkId: {
            type: 'string',
            required: false,
            description: 'Issue link ID to remove'
        },
        listLinkTypes: {
            type: 'boolean',
            required: false,
            description: 'List available link types'
        },
        fields: {
            type: 'object',
            required: false,
            description: 'Alternative: wrap all field updates in a fields object'
        },
        dryRun: {
            type: 'boolean',
            required: false,
            description: 'If true, returns proposed changes without applying them. Use for confirmation workflow.'
        }
    }
};

    async function execute(params, http, context) {
    const { url, issueKey, host, listLinkTypes, dryRun } = params;
    const progress = context?.progress || (() => {});
    
    // Flatten fields if provided as nested object (for flexibility)
    if (params.fields && typeof params.fields === 'object') {
        Object.assign(params, params.fields);
    }
    
    const baseUrl = host ? `https://${host}` : `https://${DEFAULT_JIRA_HOST}`;
    
    if (listLinkTypes) {
        const linkTypes = await getLinkTypes(baseUrl, params);
        return {
            message: 'Available link types:',
            linkTypes
        };
    }
    
    const input = url || issueKey;
    if (!input) {
        throw new Error('Either url or issueKey parameter is required');
    }
    
    const parsed = parseJiraInput(input);
    const finalBaseUrl = host ? `https://${host}` : parsed.baseUrl;
    
    // Handle link operations
    if (params.linkTo && params.linkType) {
        if (dryRun) {
            return {
                dryRun: true,
                message: `[DRY RUN] Would link ${parsed.issueKey} to ${params.linkTo} (${params.linkType})`,
                issueKey: parsed.issueKey,
                proposedLink: {
                    targetIssue: params.linkTo,
                    linkType: params.linkType
                },
                confirmMessage: 'Call again with dryRun: false to apply this change.'
            };
        }
        await addIssueLink(finalBaseUrl, parsed.issueKey, params.linkTo, params.linkType, params);
        return {
            message: `Linked ${parsed.issueKey} to ${params.linkTo} (${params.linkType})`,
            issueKey: parsed.issueKey,
            linkedTo: params.linkTo,
            linkType: params.linkType
        };
    }
    
    if (params.unlinkId) {
        if (dryRun) {
            return {
                dryRun: true,
                message: `[DRY RUN] Would remove link ${params.unlinkId}`,
                issueKey: parsed.issueKey,
                proposedRemoval: params.unlinkId,
                confirmMessage: 'Call again with dryRun: false to apply this change.'
            };
        }
        await removeIssueLink(finalBaseUrl, params.unlinkId, params);
        return {
            message: `Removed link ${params.unlinkId}`,
            issueKey: parsed.issueKey,
            removedLinkId: params.unlinkId
        };
    }
    
    // Build update fields
    const updateFields = {};
    let hasUpdates = false;
    
    if (params.description !== undefined) {
        updateFields.description = params.description;
        hasUpdates = true;
    }
    
    if (params.assignee !== undefined) {
        updateFields.assignee = params.assignee;
        hasUpdates = true;
    }
    
    if (params.priority !== undefined) {
        updateFields.priority = params.priority;
        hasUpdates = true;
    }
    
    if (params.summary !== undefined) {
        updateFields.summary = params.summary;
        hasUpdates = true;
    }
    
    // Handle labels
    if (params.labels !== undefined) {
        updateFields.labels = params.labels;
        hasUpdates = true;
    } else if (params.addLabels || params.removeLabels) {
        await progress(1, 3, 'Loading current labels...');
        const currentIssue = await loadJiraIssue(finalBaseUrl, parsed.issueKey, http, params);
        let currentLabels = currentIssue.labels || [];
        
        if (params.addLabels) {
            currentLabels = [...new Set([...currentLabels, ...params.addLabels])];
        }
        
        if (params.removeLabels) {
            currentLabels = currentLabels.filter(l => !params.removeLabels.includes(l));
        }
        
        updateFields.labels = currentLabels;
        hasUpdates = true;
    }
    
    if (!hasUpdates) {
        throw new Error('No update fields provided. Specify at least one of: description, assignee, labels, addLabels, removeLabels, priority, summary, linkTo+linkType, unlinkId, or wrap fields in a "fields" object.');
    }
    
    const updatedFieldNames = Object.keys(updateFields);
    
    // Dry run mode - return proposed changes without applying
    if (dryRun) {
        return {
            dryRun: true,
            message: `[DRY RUN] Proposed changes for ${parsed.issueKey}`,
            issueKey: parsed.issueKey,
            url: `${finalBaseUrl}/browse/${parsed.issueKey}`,
            proposedFields: updatedFieldNames,
            proposedChanges: updateFields,
            confirmMessage: 'Review the proposed changes above. Call again with dryRun: false to apply.'
        };
    }
    
    await progress(2, 3, `Updating ${updatedFieldNames.join(', ')}...`);
    await updateIssue(finalBaseUrl, parsed.issueKey, updateFields, params);
    await progress(3, 3, 'Done');

    return {
        message: `Updated ${parsed.issueKey}`,
        issueKey: parsed.issueKey,
        url: `${finalBaseUrl}/browse/${parsed.issueKey}`,
        updatedFields: updatedFieldNames
    };
}

module.exports = { execute, schema };
