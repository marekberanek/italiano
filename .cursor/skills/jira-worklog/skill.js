/**
 * JIRA Worklog Skill
 * Log, update, or delete work time on JIRA issues
 */

const path = require('path');
const {
    parseJiraInput,
    addWorklog,
    updateWorklog,
    deleteWorklog,
    listWorklogs,
    formatSecondsToTime,
    DEFAULT_JIRA_HOST
} = require(path.join(__dirname, '../shared/jira.js'));

const schema = {
    name: 'jira-worklog',
    description: 'Log work time on JIRA issues. Add, update, delete, or list worklog entries. Requires JIRA_PAT.',
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
            description: 'Action to perform: add, update, delete, or list worklogs'
        },
        timeSpent: {
            type: 'string',
            required: false,
            description: 'Time spent in JIRA format (e.g., "2h", "1d 4h", "30m"). Required for add.'
        },
        started: {
            type: 'string',
            required: false,
            description: 'Start datetime in ISO 8601 format (e.g., "2026-02-07T09:00:00.000+0100"). Defaults to now.'
        },
        comment: {
            type: 'string',
            required: false,
            description: 'Work description/comment'
        },
        worklogId: {
            type: 'string',
            required: false,
            description: 'Worklog ID. Required for update/delete.'
        }
    }
};

async function execute(params, http) {
    const { url, issueKey, host, action, timeSpent, started, comment, worklogId } = params;
    
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
            const worklogs = await listWorklogs(baseUrl, parsed.issueKey, params);
            
            const totalSeconds = worklogs.reduce((sum, w) => sum + (w.timeSpentSeconds || 0), 0);
            
            return {
                message: `Worklogs for ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                totalTime: formatSecondsToTime(totalSeconds),
                worklogs
            };
        }
        
        case 'add': {
            if (!timeSpent) {
                throw new Error('timeSpent parameter is required for add action (e.g., "2h", "1d", "30m")');
            }
            
            const worklog = {
                timeSpent,
                started: started || new Date().toISOString(),
                comment
            };
            
            const result = await addWorklog(baseUrl, parsed.issueKey, worklog, params);
            
            return {
                message: `Logged ${timeSpent} on ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                worklog: result
            };
        }
        
        case 'update': {
            if (!worklogId) {
                throw new Error('worklogId parameter is required for update action');
            }
            
            const worklog = {};
            if (timeSpent) worklog.timeSpent = timeSpent;
            if (started) worklog.started = started;
            if (comment !== undefined) worklog.comment = comment;
            
            if (Object.keys(worklog).length === 0) {
                throw new Error('At least one field (timeSpent, started, comment) is required for update');
            }
            
            const result = await updateWorklog(baseUrl, parsed.issueKey, worklogId, worklog, params);
            
            return {
                message: `Updated worklog ${worklogId} on ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                worklog: result
            };
        }
        
        case 'delete': {
            if (!worklogId) {
                throw new Error('worklogId parameter is required for delete action');
            }
            
            await deleteWorklog(baseUrl, parsed.issueKey, worklogId, params);
            
            return {
                message: `Deleted worklog ${worklogId} from ${parsed.issueKey}`,
                issueKey: parsed.issueKey,
                url: `${baseUrl}/browse/${parsed.issueKey}`,
                deletedWorklogId: worklogId
            };
        }
        
        default:
            throw new Error(`Unknown action: ${action}. Valid actions: add, update, delete, list`);
    }
}

module.exports = { execute, schema };
