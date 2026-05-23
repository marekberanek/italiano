/**
 * JIRA API utilities
 * Uses Personal Access Token (PAT) for authentication
 */

const DEFAULT_JIRA_HOST = 'jira.unicorn.com';

/**
 * Create JIRA HTTP client with PAT (Bearer token)
 */
function createJiraClient(pat) {
    async function handleResponse(response) {
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${body}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        if (response.status === 204) {
            return { success: true };
        }
        if (contentType.includes('application/json')) {
            return response.json();
        }
        return response.text();
    }
    
    return {
        async get(url) {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/json'
                }
            });
            return handleResponse(response);
        },
        
        async post(url, body) {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return handleResponse(response);
        },
        
        async put(url, body) {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return handleResponse(response);
        },
        
        async delete(url) {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${pat}`,
                    'Accept': 'application/json'
                }
            });
            return handleResponse(response);
        }
    };
}

/**
 * Parse JIRA URL or issue key
 */
function parseJiraInput(input) {
    if (!input) {
        throw new Error('JIRA URL or issue key is required');
    }
    
    const trimmed = input.trim();
    
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        const browseIndex = pathParts.indexOf('browse');
        if (browseIndex >= 0 && pathParts[browseIndex + 1]) {
            return {
                host: url.host,
                issueKey: pathParts[browseIndex + 1],
                baseUrl: `${url.protocol}//${url.host}`
            };
        }
        
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && isValidIssueKey(lastPart)) {
            return {
                host: url.host,
                issueKey: lastPart,
                baseUrl: `${url.protocol}//${url.host}`
            };
        }
        
        throw new Error(`Could not extract issue key from URL: ${trimmed}`);
    }
    
    if (isValidIssueKey(trimmed)) {
        return {
            host: DEFAULT_JIRA_HOST,
            issueKey: trimmed,
            baseUrl: `https://${DEFAULT_JIRA_HOST}`
        };
    }
    
    throw new Error(`Invalid JIRA input. Expected URL or issue key (e.g., PROJ-123), got: ${trimmed}`);
}

/**
 * Validate JIRA issue key format
 */
function isValidIssueKey(key) {
    return /^[A-Z][A-Z0-9_]+-\d+$/i.test(key);
}

/**
 * Get JIRA PAT from params, environment, or OS keychain.
 * Priority: params.jiraToken > JIRA_PAT env > keychain
 *
 * Setup (one-time, pick your platform):
 *   macOS:   security add-generic-password -s "skilled-plus4u-mcp" -a "jira-pat" -w "YOUR_PAT" -U
 *   Linux:   secret-tool store --label="JIRA PAT" service skilled-plus4u-mcp account jira-pat
 *   Windows: cmdkey /generic:skilled-plus4u-mcp:jira-pat /user:jira-pat /pass:YOUR_PAT
 *   Node:    node -e "new(require('@napi-rs/keyring').Entry)('skilled-plus4u-mcp','jira-pat').setPassword('YOUR_PAT')"
 *            (run from skilled-plus4u-mcp dir where @napi-rs/keyring is installed)
 *
 * Secure input (no token in shell history):
 *   macOS/Linux: read -s -p "JIRA PAT: " t && security add-generic-password -s "skilled-plus4u-mcp" -a "jira-pat" -w "$t" -U && unset t
 */
let _cachedJiraPat = null;

function getJiraPat(params) {
    if (params.jiraToken) return params.jiraToken;
    if (process.env.JIRA_PAT) return process.env.JIRA_PAT;

    if (_cachedJiraPat) return _cachedJiraPat;

    // Try OS keychain via @napi-rs/keyring (available when running inside skilled-plus4u-mcp)
    try {
        const { Entry } = require('@napi-rs/keyring');
        const pat = new Entry('skilled-plus4u-mcp', 'jira-pat').getPassword();
        if (pat) {
            _cachedJiraPat = pat;
            return pat;
        }
    } catch (_) {
        // @napi-rs/keyring not available or no entry — fall through
    }

    return null;
}

/**
 * Fetch field metadata from JIRA
 * Returns a map of field ID to field name
 */
async function fetchFieldMetadata(baseUrl, pat) {
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/field`;
    
    try {
        const fields = await client.get(url);
        const fieldMap = {};
        for (const field of fields) {
            fieldMap[field.id] = {
                name: field.name,
                custom: field.custom || false,
                schema: field.schema
            };
        }
        return fieldMap;
    } catch (e) {
        return null;
    }
}

/**
 * Load a JIRA issue by key
 */
async function loadJiraIssue(baseUrl, issueKey, http, options = {}) {
    const pat = getJiraPat(options);
    
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const expand = options.expand || 'changelog,comments,worklog';
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}?expand=${expand}`;
    
    const fieldMetadata = await fetchFieldMetadata(baseUrl, pat);
    const response = await client.get(url);
    return formatJiraIssue(response, baseUrl, fieldMetadata);
}

/**
 * Search JIRA users by query (name, email, displayName)
 * Returns array of matching users
 */
async function searchUsers(baseUrl, query, options = {}) {
    const pat = getJiraPat(options);
    
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const params = new URLSearchParams();
    params.append('username', query);
    params.append('maxResults', options.maxResults || 10);
    
    const url = `${baseUrl}/rest/api/2/user/search?${params.toString()}`;
    const users = await client.get(url);
    
    return users.map(u => ({
        name: u.name,
        displayName: u.displayName,
        email: u.emailAddress,
        active: u.active
    }));
}

/**
 * Resolve a user query to JIRA username
 * Searches by display name, email, or partial match
 * Returns the username (e.g., "6230-4971-1") or null if not found
 */
async function resolveUser(baseUrl, query, options = {}) {
    const users = await searchUsers(baseUrl, query, options);
    
    if (users.length === 0) {
        return null;
    }
    
    if (users.length === 1) {
        return users[0].name;
    }
    
    const queryLower = query.toLowerCase();
    const exactMatch = users.find(u => 
        u.displayName?.toLowerCase() === queryLower ||
        u.email?.toLowerCase() === queryLower ||
        u.name?.toLowerCase() === queryLower
    );
    
    if (exactMatch) {
        return exactMatch.name;
    }
    
    return users[0].name;
}

/**
 * User fields that need resolution in JQL
 */
const USER_FIELDS = ['assignee', 'reporter', 'creator'];

/**
 * Check if a value looks like a JIRA username (e.g., "6-3184-1", "6230-4971-1")
 */
function isJiraUsername(value) {
    return /^\d+-\d+-\d+$/.test(value);
}

/**
 * Resolve user references in JQL query
 * Replaces display names with JIRA usernames for assignee, reporter, creator fields
 */
async function resolveUsersInJql(baseUrl, jql, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    let resolvedJql = jql;
    
    for (const field of USER_FIELDS) {
        const regex = new RegExp(`(${field})\\s*=\\s*"([^"]+)"`, 'gi');
        let match;
        
        while ((match = regex.exec(jql)) !== null) {
            const fieldName = match[1];
            const userValue = match[2];
            
            if (isJiraUsername(userValue)) {
                continue;
            }
            
            const resolvedUsername = await resolveUser(baseUrl, userValue, { ...options, jiraToken: pat });
            
            if (resolvedUsername) {
                resolvedJql = resolvedJql.replace(
                    `${fieldName} = "${userValue}"`,
                    `${fieldName} = "${resolvedUsername}"`
                );
            }
        }
    }
    
    return resolvedJql;
}

/**
 * Search JIRA issues using JQL
 * Automatically resolves user display names to usernames
 */
async function searchJiraIssues(baseUrl, jql, http, options = {}) {
    const pat = getJiraPat(options);
    
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const resolvedJql = await resolveUsersInJql(baseUrl, jql, { ...options, jiraToken: pat });
    
    const client = createJiraClient(pat);
    const params = new URLSearchParams();
    params.append('jql', resolvedJql);
    params.append('maxResults', options.maxResults || 50);
    if (options.startAt) params.append('startAt', options.startAt);
    if (options.fields) params.append('fields', options.fields.join(','));
    
    const url = `${baseUrl}/rest/api/2/search?${params.toString()}`;
    return await client.get(url);
}

/**
 * Search JIRA issues and return formatted summaries
 */
async function searchJiraIssuesFormatted(baseUrl, jql, http, options = {}) {
    const pat = getJiraPat(options);
    
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const resolvedJql = await resolveUsersInJql(baseUrl, jql, { ...options, jiraToken: pat });
    
    const client = createJiraClient(pat);
    const params = new URLSearchParams();
    params.append('jql', resolvedJql);
    params.append('maxResults', options.maxResults || 50);
    params.append('expand', 'comments');
    if (options.startAt) params.append('startAt', options.startAt);
    
    const url = `${baseUrl}/rest/api/2/search?${params.toString()}`;
    const response = await client.get(url);
    
    const fieldMetadata = await fetchFieldMetadata(baseUrl, pat);
    
    const issues = (response.issues || []).map(issue => {
        const fields = issue.fields || {};
        const logged = fields.timespent || 0;
        const estimated = fields.timeoriginalestimate || 0;
        const progress = estimated > 0 ? Math.round((logged / estimated) * 100) : 0;
        
        const customFields = {};
        if (fieldMetadata) {
            for (const [fieldId, value] of Object.entries(fields)) {
                if (fieldId.startsWith('customfield_') && value !== null) {
                    const meta = fieldMetadata[fieldId];
                    const fieldName = meta ? meta.name : fieldId;
                    const extractedValue = extractCustomFieldValue(value);
                    if (extractedValue !== null) {
                        customFields[fieldName] = extractedValue;
                    }
                }
            }
        }
        
        const comments = fields.comment?.comments || [];
        const recentComments = comments.slice(-3).map(c => ({
            author: c.author?.displayName,
            date: c.created?.split('T')[0],
            excerpt: c.body?.substring(0, 200) + (c.body?.length > 200 ? '...' : '')
        }));
        
        const linkedIssues = (fields.issuelinks || []).map(link => ({
            type: link.type?.name,
            key: link.outwardIssue?.key || link.inwardIssue?.key,
            summary: link.outwardIssue?.fields?.summary || link.inwardIssue?.fields?.summary
        })).filter(l => l.key);
        
        return {
            key: issue.key,
            url: `${baseUrl}/browse/${issue.key}`,
            summary: fields.summary,
            status: fields.status?.name,
            statusCategory: fields.status?.statusCategory?.name,
            assignee: fields.assignee?.displayName,
            timeTracking: {
                logged: formatSecondsToTime(logged),
                estimated: formatSecondsToTime(estimated),
                progress: `${progress}%`
            },
            labels: fields.labels || [],
            customFields,
            linkedIssues,
            recentComments,
            priority: fields.priority?.name,
            created: fields.created,
            updated: fields.updated
        };
    });
    
    return {
        total: response.total,
        showing: issues.length,
        jql: resolvedJql,
        issues
    };
}

function formatSecondsToTime(seconds) {
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

/**
 * Extract custom field value
 */
function extractCustomFieldValue(value) {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'object') {
        if (value.value !== undefined) {
            return value.value;
        }
        if (value.name !== undefined) {
            return value.name;
        }
        if (Array.isArray(value)) {
            return value.map(v => extractCustomFieldValue(v));
        }
        return value;
    }
    return value;
}

/**
 * Format JIRA issue response
 */
function formatJiraIssue(issue, baseUrl, fieldMetadata = null) {
    const fields = issue.fields || {};
    
    const result = {
        key: issue.key,
        id: issue.id,
        url: `${baseUrl}/browse/${issue.key}`,
        summary: fields.summary,
        description: fields.description,
        
        issueType: fields.issuetype ? {
            name: fields.issuetype.name,
            description: fields.issuetype.description
        } : null,
        
        status: fields.status ? {
            name: fields.status.name,
            category: fields.status.statusCategory?.name
        } : null,
        
        priority: fields.priority ? { name: fields.priority.name } : null,
        resolution: fields.resolution ? { name: fields.resolution.name } : null,
        
        project: fields.project ? {
            key: fields.project.key,
            name: fields.project.name
        } : null,
        
        reporter: formatUser(fields.reporter),
        assignee: formatUser(fields.assignee),
        creator: formatUser(fields.creator),
        
        created: fields.created,
        updated: fields.updated,
        dueDate: fields.duedate,
        resolutionDate: fields.resolutiondate,
        
        timeTracking: fields.timetracking ? {
            originalEstimate: fields.timetracking.originalEstimate,
            remainingEstimate: fields.timetracking.remainingEstimate,
            timeSpent: fields.timetracking.timeSpent,
            originalEstimateSeconds: fields.timetracking.originalEstimateSeconds,
            remainingEstimateSeconds: fields.timetracking.remainingEstimateSeconds,
            timeSpentSeconds: fields.timetracking.timeSpentSeconds
        } : null,
        
        labels: fields.labels || [],
        components: (fields.components || []).map(c => c.name),
        fixVersions: (fields.fixVersions || []).map(v => v.name),
        affectedVersions: (fields.versions || []).map(v => v.name),
        
        issueLinks: (fields.issuelinks || []).map(link => ({
            type: link.type?.name,
            outward: link.outwardIssue?.key,
            inward: link.inwardIssue?.key
        })).filter(l => l.outward || l.inward),
        
        parent: fields.parent ? {
            key: fields.parent.key,
            summary: fields.parent.fields?.summary
        } : null,
        
        subtasks: (fields.subtasks || []).map(st => ({
            key: st.key,
            summary: st.fields?.summary,
            status: st.fields?.status?.name
        })),
        
        comments: formatComments(fields.comment),
        worklog: formatWorklog(fields.worklog),
        
        attachments: (fields.attachment || []).map(a => ({
            filename: a.filename,
            size: a.size,
            mimeType: a.mimeType,
            created: a.created,
            author: a.author?.displayName
        }))
    };
    
    // Extract custom fields with their display names
    if (fieldMetadata) {
        const customFields = {};
        for (const [fieldId, value] of Object.entries(fields)) {
            if (fieldId.startsWith('customfield_') && value !== null) {
                const meta = fieldMetadata[fieldId];
                const fieldName = meta ? meta.name : fieldId;
                const extractedValue = extractCustomFieldValue(value);
                if (extractedValue !== null) {
                    customFields[fieldName] = extractedValue;
                }
            }
        }
        if (Object.keys(customFields).length > 0) {
            result.customFields = customFields;
        }
    }
    
    return result;
}

function formatUser(user) {
    if (!user) return null;
    return {
        name: user.name,
        displayName: user.displayName,
        email: user.emailAddress
    };
}

function formatComments(commentData) {
    if (!commentData || !commentData.comments) return [];
    return commentData.comments.map(c => ({
        id: c.id,
        author: c.author?.displayName,
        body: c.body,
        created: c.created,
        updated: c.updated
    }));
}

function formatWorklog(worklogData) {
    if (!worklogData || !worklogData.worklogs) return [];
    return worklogData.worklogs.map(w => ({
        id: w.id,
        author: w.author?.displayName,
        timeSpent: w.timeSpent,
        timeSpentSeconds: w.timeSpentSeconds,
        started: w.started,
        comment: w.comment
    }));
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update issue fields
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {Object} fields - Fields to update (description, assignee, labels, priority, etc.)
 * @param {Object} options - Options including jiraToken
 */
async function updateIssue(baseUrl, issueKey, fields, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}`;
    
    const updatePayload = { fields: {} };
    
    if (fields.description !== undefined) {
        updatePayload.fields.description = fields.description;
    }
    
    if (fields.assignee !== undefined) {
        if (fields.assignee === null) {
            updatePayload.fields.assignee = null;
        } else {
            const username = isJiraUsername(fields.assignee) 
                ? fields.assignee 
                : await resolveUser(baseUrl, fields.assignee, options);
            if (!username) {
                throw new Error(`Could not resolve user: ${fields.assignee}`);
            }
            updatePayload.fields.assignee = { name: username };
        }
    }
    
    if (fields.labels !== undefined) {
        updatePayload.fields.labels = fields.labels;
    }
    
    if (fields.priority !== undefined) {
        updatePayload.fields.priority = { name: fields.priority };
    }
    
    if (fields.summary !== undefined) {
        updatePayload.fields.summary = fields.summary;
    }
    
    return await client.put(url, updatePayload);
}

/**
 * Get available link types
 */
async function getLinkTypes(baseUrl, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issueLinkType`;
    const response = await client.get(url);
    
    return (response.issueLinkTypes || []).map(lt => ({
        id: lt.id,
        name: lt.name,
        inward: lt.inward,
        outward: lt.outward
    }));
}

/**
 * Add a link between two issues
 * @param {string} baseUrl - JIRA base URL
 * @param {string} fromIssueKey - Source issue
 * @param {string} toIssueKey - Target issue
 * @param {string} linkTypeName - Link type name (e.g., "Blocks", "relates to")
 * @param {Object} options - Options including jiraToken
 */
async function addIssueLink(baseUrl, fromIssueKey, toIssueKey, linkTypeName, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issueLink`;
    
    const linkTypes = await getLinkTypes(baseUrl, options);
    const linkType = linkTypes.find(lt => 
        lt.name.toLowerCase() === linkTypeName.toLowerCase() ||
        lt.inward.toLowerCase() === linkTypeName.toLowerCase() ||
        lt.outward.toLowerCase() === linkTypeName.toLowerCase()
    );
    
    if (!linkType) {
        throw new Error(`Unknown link type: ${linkTypeName}. Available: ${linkTypes.map(lt => lt.name).join(', ')}`);
    }
    
    const payload = {
        type: { name: linkType.name },
        inwardIssue: { key: fromIssueKey },
        outwardIssue: { key: toIssueKey }
    };
    
    return await client.post(url, payload);
}

/**
 * Remove a link between issues
 * @param {string} baseUrl - JIRA base URL
 * @param {string} linkId - Issue link ID
 * @param {Object} options - Options including jiraToken
 */
async function removeIssueLink(baseUrl, linkId, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issueLink/${linkId}`;
    
    return await client.delete(url);
}

// ============================================================================
// COMMENT OPERATIONS
// ============================================================================

/**
 * Add a comment to an issue
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {string} body - Comment text (JIRA wiki markup)
 * @param {Object} options - Options including jiraToken
 */
async function addComment(baseUrl, issueKey, body, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment`;
    
    const response = await client.post(url, { body });
    
    return {
        id: response.id,
        author: response.author?.displayName,
        body: response.body,
        created: response.created
    };
}

/**
 * Update an existing comment
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {string} commentId - Comment ID
 * @param {string} body - New comment text
 * @param {Object} options - Options including jiraToken
 */
async function updateComment(baseUrl, issueKey, commentId, body, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment/${commentId}`;
    
    const response = await client.put(url, { body });
    
    return {
        id: response.id,
        author: response.author?.displayName,
        body: response.body,
        created: response.created,
        updated: response.updated
    };
}

/**
 * Delete a comment
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {string} commentId - Comment ID
 * @param {Object} options - Options including jiraToken
 */
async function deleteComment(baseUrl, issueKey, commentId, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment/${commentId}`;
    
    return await client.delete(url);
}

// ============================================================================
// WORKLOG OPERATIONS
// ============================================================================

/**
 * Add a worklog entry to an issue
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {Object} worklog - Worklog data { timeSpent, started, comment }
 * @param {Object} options - Options including jiraToken
 */
async function addWorklog(baseUrl, issueKey, worklog, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/worklog`;
    
    const payload = {
        timeSpent: worklog.timeSpent
    };
    
    if (worklog.started) {
        payload.started = worklog.started;
    }
    
    if (worklog.comment) {
        payload.comment = worklog.comment;
    }
    
    const response = await client.post(url, payload);
    
    return {
        id: response.id,
        author: response.author?.displayName,
        timeSpent: response.timeSpent,
        timeSpentSeconds: response.timeSpentSeconds,
        started: response.started,
        comment: response.comment
    };
}

/**
 * Update a worklog entry
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {string} worklogId - Worklog ID
 * @param {Object} worklog - Updated worklog data
 * @param {Object} options - Options including jiraToken
 */
async function updateWorklog(baseUrl, issueKey, worklogId, worklog, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/worklog/${worklogId}`;
    
    const payload = {};
    if (worklog.timeSpent) payload.timeSpent = worklog.timeSpent;
    if (worklog.started) payload.started = worklog.started;
    if (worklog.comment !== undefined) payload.comment = worklog.comment;
    
    const response = await client.put(url, payload);
    
    return {
        id: response.id,
        author: response.author?.displayName,
        timeSpent: response.timeSpent,
        timeSpentSeconds: response.timeSpentSeconds,
        started: response.started,
        comment: response.comment
    };
}

/**
 * Delete a worklog entry
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {string} worklogId - Worklog ID
 * @param {Object} options - Options including jiraToken
 */
async function deleteWorklog(baseUrl, issueKey, worklogId, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/worklog/${worklogId}`;
    
    return await client.delete(url);
}

/**
 * List worklog entries for an issue
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {Object} options - Options including jiraToken
 */
async function listWorklogs(baseUrl, issueKey, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/worklog`;
    
    const response = await client.get(url);
    
    return (response.worklogs || []).map(w => ({
        id: w.id,
        author: w.author?.displayName,
        timeSpent: w.timeSpent,
        timeSpentSeconds: w.timeSpentSeconds,
        started: w.started,
        comment: w.comment
    }));
}

// ============================================================================
// WATCHER OPERATIONS
// ============================================================================

/**
 * Get watchers for an issue
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {Object} options - Options including jiraToken
 */
async function getWatchers(baseUrl, issueKey, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/watchers`;
    
    const response = await client.get(url);
    
    return {
        isWatching: response.isWatching,
        watchCount: response.watchCount,
        watchers: (response.watchers || []).map(w => ({
            name: w.name,
            displayName: w.displayName,
            email: w.emailAddress
        }))
    };
}

/**
 * Add current user as watcher
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {string} username - Optional username (defaults to current user)
 * @param {Object} options - Options including jiraToken
 */
async function addWatcher(baseUrl, issueKey, username, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/watchers`;
    
    if (username) {
        const resolvedUsername = isJiraUsername(username)
            ? username
            : await resolveUser(baseUrl, username, options);
        if (!resolvedUsername) {
            throw new Error(`Could not resolve user: ${username}`);
        }
        return await client.post(url, JSON.stringify(resolvedUsername));
    }
    
    return await client.post(url, null);
}

/**
 * Remove a watcher from an issue
 * @param {string} baseUrl - JIRA base URL
 * @param {string} issueKey - Issue key
 * @param {string} username - Username to remove (required)
 * @param {Object} options - Options including jiraToken
 */
async function removeWatcher(baseUrl, issueKey, username, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const resolvedUsername = isJiraUsername(username)
        ? username
        : await resolveUser(baseUrl, username, options);
    
    if (!resolvedUsername) {
        throw new Error(`Could not resolve user: ${username}`);
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/issue/${encodeURIComponent(issueKey)}/watchers?username=${encodeURIComponent(resolvedUsername)}`;
    
    return await client.delete(url);
}

/**
 * Get current user info
 * @param {string} baseUrl - JIRA base URL
 * @param {Object} options - Options including jiraToken
 */
async function getCurrentUser(baseUrl, options = {}) {
    const pat = getJiraPat(options);
    if (!pat) {
        throw new Error('JIRA PAT required. Set JIRA_PAT in mcp.json env settings.');
    }
    
    const client = createJiraClient(pat);
    const url = `${baseUrl}/rest/api/2/myself`;
    
    const response = await client.get(url);
    
    return {
        name: response.name,
        displayName: response.displayName,
        email: response.emailAddress
    };
}

module.exports = {
    // Core utilities
    parseJiraInput,
    isValidIssueKey,
    createJiraClient,
    getJiraPat,
    fetchFieldMetadata,
    formatSecondsToTime,
    DEFAULT_JIRA_HOST,
    
    // Read operations
    loadJiraIssue,
    searchJiraIssues,
    searchJiraIssuesFormatted,
    formatJiraIssue,
    
    // User operations
    searchUsers,
    resolveUser,
    resolveUsersInJql,
    getCurrentUser,
    
    // Update operations
    updateIssue,
    getLinkTypes,
    addIssueLink,
    removeIssueLink,
    
    // Comment operations
    addComment,
    updateComment,
    deleteComment,
    
    // Worklog operations
    addWorklog,
    updateWorklog,
    deleteWorklog,
    listWorklogs,
    
    // Watcher operations
    getWatchers,
    addWatcher,
    removeWatcher
};
