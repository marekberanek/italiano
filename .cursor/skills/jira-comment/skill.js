/**
 * JIRA Comment Skill
 * Add, update, or delete comments on JIRA issues
 */

const path = require('path');
const {
    parseJiraInput,
    loadJiraIssue,
    addComment,
    updateComment,
    deleteComment,
    DEFAULT_JIRA_HOST
} = require(path.join(__dirname, '../shared/jira.js'));

const schema = {
    name: 'jira-comment',
    description: 'Add, update, or delete comments on JIRA issues. Requires JIRA_PAT.',
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
        action: {
            type: 'string',
            required: true,
            enum: ['add', 'update', 'delete', 'list'],
            description: 'Action to perform: add, update, delete, or list comments'
        },
        body: {
            type: 'string',
            required: false,
            description: 'Comment text (JIRA wiki markup). Required for add/update.'
        },
        commentId: {
            type: 'string',
            required: false,
            description: 'Comment ID. Required for update/delete.'
        },
        dryRun: {
            type: 'boolean',
            required: false,
            description: 'If true, returns proposed changes without applying them. Use for confirmation workflow.'
        }
    }
};

async function execute(params, http) {
    const { url, issueKey, host, action, body, commentId, dryRun } = params;
    
    const input = url || issueKey;
    if (!input) {
        throw new Error('Either url or issueKey parameter is required');
    }
    
    if (!action) {
        throw new Error('action parameter is required. Valid actions: add, update, delete, list');
    }
    
    const parsed = parseJiraInput(input);
    const baseUrl = host ? `https://${host}` : parsed.baseUrl;
    
    switch (action) {
        case 'list': {
            const issue = await loadJiraIssue(baseUrl, parsed.issueKey, http, params);
            return {
                message: `Comments on ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                comments: issue.comments || []
            };
        }
        
        case 'add': {
            if (!body) {
                throw new Error('body parameter is required for add action');
            }
            
            // Dry run mode - return proposed comment without adding
            if (dryRun) {
                return {
                    dryRun: true,
                    message: `[DRY RUN] Proposed comment for ${parsed.issueKey}`,
                    issueKey: parsed.issueKey,
                    url: `${baseUrl}/browse/${parsed.issueKey}`,
                    proposedComment: body,
                    confirmMessage: 'Review the proposed comment above. Call again with dryRun: false to add it.'
                };
            }
            
            const result = await addComment(baseUrl, parsed.issueKey, body, params);
            
            return {
                message: `Comment added to ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                comment: result
            };
        }
        
        case 'update': {
            if (!commentId) {
                throw new Error('commentId parameter is required for update action');
            }
            if (!body) {
                throw new Error('body parameter is required for update action');
            }
            
            // Dry run mode - return proposed update without applying
            if (dryRun) {
                return {
                    dryRun: true,
                    message: `[DRY RUN] Proposed update for comment ${commentId} on ${parsed.issueKey}`,
                    issueKey: parsed.issueKey,
                    url: `${baseUrl}/browse/${parsed.issueKey}`,
                    commentId: commentId,
                    proposedBody: body,
                    confirmMessage: 'Review the proposed update above. Call again with dryRun: false to apply it.'
                };
            }
            
            const result = await updateComment(baseUrl, parsed.issueKey, commentId, body, params);
            
            return {
                message: `Comment ${commentId} updated on ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                comment: result
            };
        }
        
        case 'delete': {
            if (!commentId) {
                throw new Error('commentId parameter is required for delete action');
            }
            
            // Dry run mode - confirm deletion intent
            if (dryRun) {
                return {
                    dryRun: true,
                    message: `[DRY RUN] Would delete comment ${commentId} from ${parsed.issueKey}`,
                    issueKey: parsed.issueKey,
                    url: `${baseUrl}/browse/${parsed.issueKey}`,
                    commentIdToDelete: commentId,
                    confirmMessage: 'Call again with dryRun: false to delete this comment.'
                };
            }
            
            await deleteComment(baseUrl, parsed.issueKey, commentId, params);
            
            return {
                message: `Comment ${commentId} deleted from ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                deletedCommentId: commentId
            };
        }
        
        default:
            throw new Error(`Unknown action: ${action}. Valid actions: add, update, delete, list`);
    }
}

module.exports = { execute, schema };
