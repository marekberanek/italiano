/**
 * JIRA Watch Skill
 * Start/stop watching JIRA issues
 */

const path = require('path');
const {
    parseJiraInput,
    getWatchers,
    addWatcher,
    removeWatcher,
    getCurrentUser,
    DEFAULT_JIRA_HOST
} = require(path.join(__dirname, '../shared/jira.js'));

const schema = {
    name: 'jira-watch',
    description: 'Start or stop watching JIRA issues. List current watchers. Requires JIRA_PAT.',
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
            enum: ['watch', 'unwatch', 'list'],
            description: 'Action to perform: watch, unwatch, or list watchers'
        },
        user: {
            type: 'string',
            required: false,
            description: 'User display name or username. Defaults to current user for watch/unwatch.'
        }
    }
};

async function execute(params, http) {
    const { url, issueKey, host, action, user } = params;
    
    const input = url || issueKey;
    if (!input) {
        throw new Error('Either url or issueKey parameter is required');
    }
    
    if (!action) {
        throw new Error('action parameter is required. Valid actions: watch, unwatch, list');
    }
    
    const parsed = parseJiraInput(input);
    const baseUrl = host ? `https://${host}` : parsed.baseUrl;
    
    switch (action) {
        case 'list': {
            const result = await getWatchers(baseUrl, parsed.issueKey, params);
            
            return {
                message: `Watchers for ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                isWatching: result.isWatching,
                watchCount: result.watchCount,
                watchers: result.watchers
            };
        }
        
        case 'watch': {
            await addWatcher(baseUrl, parsed.issueKey, user, params);
            
            const currentUser = user || (await getCurrentUser(baseUrl, params)).displayName;
            
            return {
                message: `${currentUser} is now watching ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                watching: true
            };
        }
        
        case 'unwatch': {
            let targetUser = user;
            if (!targetUser) {
                const me = await getCurrentUser(baseUrl, params);
                targetUser = me.name;
            }
            
            await removeWatcher(baseUrl, parsed.issueKey, targetUser, params);
            
            return {
                message: `${targetUser} stopped watching ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                watching: false
            };
        }
        
        default:
            throw new Error(`Unknown action: ${action}. Valid actions: watch, unwatch, list`);
    }
}

module.exports = { execute, schema };
