/**
 * JIRA Read Skill
 * Reads JIRA issues using Personal Access Token (PAT)
 */

const path = require('path');
const { parseJiraInput, loadJiraIssue, searchJiraIssues, searchJiraIssuesFormatted, DEFAULT_JIRA_HOST } = require(path.join(__dirname, '../shared/jira.js'));

const schema = {
    name: 'jira-read',
    description: 'Read JIRA issues from jira.unicorn.com. Accepts URL or issue key. Use summary=true for formatted overview with key info (status, time tracking, links, comments). Use summary=false for full raw details.',
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
        jql: {
            type: 'string',
            required: false,
            description: 'JQL query to search for issues'
        },
        host: {
            type: 'string',
            required: false,
            description: `JIRA host (default: ${DEFAULT_JIRA_HOST})`
        },
        maxResults: {
            type: 'number',
            required: false,
            description: 'Max results for JQL search (default: 50)'
        },
        summary: {
            type: 'boolean',
            required: false,
            description: 'Return formatted summary view with key info (default: true for JQL, false for single issue)'
        },
    }
};

async function execute(params, http, context) {
    const { url, issueKey, jql, host, maxResults, summary } = params;
    const progress = context?.progress || (() => {});

    const options = { maxResults };
    const baseUrl = host ? `https://${host}` : `https://${DEFAULT_JIRA_HOST}`;

    // JQL search
    if (jql) {
        await progress(1, 2, 'Searching issues...');
        const useSummary = summary !== false;
        const result = useSummary
            ? await searchJiraIssuesFormatted(baseUrl, jql, http, options)
            : await searchJiraIssues(baseUrl, jql, http, options);
        await progress(2, 2, 'Done');
        return result;
    }

    // Single issue
    const input = url || issueKey;
    if (!input) {
        throw new Error('Either url, issueKey, or jql parameter is required');
    }

    const parsed = parseJiraInput(input);
    const finalBaseUrl = host ? `https://${host}` : parsed.baseUrl;

    await progress(1, 2, `Loading ${parsed.issueKey}...`);
    const issue = await loadJiraIssue(finalBaseUrl, parsed.issueKey, http, options);
    await progress(2, 2, 'Done');

    if (summary === true) {
        return formatIssueSummary(issue);
    }

    return issue;
}

function formatIssueSummary(issue) {
    const logged = issue.timeTracking?.timeSpentSeconds || 0;
    const estimated = issue.timeTracking?.originalEstimateSeconds || 0;
    const progress = estimated > 0 ? Math.round((logged / estimated) * 100) : 0;
    
    return {
        key: issue.key,
        url: issue.url,
        summary: issue.summary,
        status: issue.status?.name,
        statusCategory: issue.status?.category,
        assignee: issue.assignee?.displayName,
        timeTracking: {
            logged: formatSeconds(logged),
            estimated: formatSeconds(estimated),
            remaining: issue.timeTracking?.remainingEstimate || '-',
            progress: `${progress}%`
        },
        labels: issue.labels,
        customFields: issue.customFields || {},
        linkedIssues: (issue.issueLinks || []).map(l => ({
            type: l.type,
            key: l.outward || l.inward
        })),
        recentComments: extractRecentComments(issue.comments, 3),
        priority: issue.priority?.name,
        created: issue.created,
        updated: issue.updated
    };
}

function formatSeconds(seconds) {
    if (!seconds) return '0h';
    const hours = seconds / 3600;
    if (hours >= 8) {
        const days = Math.floor(hours / 8);
        const remainingHours = hours % 8;
        if (remainingHours > 0) {
            return `${days}d ${remainingHours}h`;
        }
        return `${days}d`;
    }
    return `${hours}h`;
}

function extractRecentComments(comments, count) {
    if (!comments || comments.length === 0) return [];
    const recent = comments.slice(-count);
    return recent.map(c => ({
        author: c.author,
        date: c.created?.split('T')[0],
        excerpt: c.body?.substring(0, 200) + (c.body?.length > 200 ? '...' : '')
    }));
}

module.exports = { execute, schema };
