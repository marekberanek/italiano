/**
 * Calendar Accept Skill - Accept or reject a meeting from dwg01
 * Calls uuArtifactIfc/activity/elementary/setState on the source business territory.
 */

const schema = {
    name: 'calendar-accept',
    description: 'Accept or reject a meeting from dwg01. Requires fields from the calendar skill output (sourceAppBaseUri, activityRefId, elementaryActivity).',
    parameters: {
        sourceAppBaseUri: {
            type: 'string',
            required: true,
            description: 'Base URI of the source business territory (from calendar skill output)'
        },
        activityRefId: {
            type: 'string',
            required: true,
            description: 'Activity reference ID (from calendar skill output)'
        },
        elementaryActivity: {
            type: 'string',
            required: true,
            description: 'Elementary activity ID (from calendar skill output)'
        },
        state: {
            type: 'string',
            required: true,
            description: 'Target state: "accepted", "attention", or "warning".'
        },
        note: {
            type: 'string',
            required: false,
            description: 'Optional note/comment to attach when changing the meeting state.'
        }
    },
    returns: {
        'success': 'Whether the state change was successful',
        'state': 'The state that was set',
        'response': 'API response'
    }
};

async function execute(params, http) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }

    const { sourceAppBaseUri, activityRefId, elementaryActivity } = params;
    if (!sourceAppBaseUri || !activityRefId || !elementaryActivity) {
        throw new Error('sourceAppBaseUri, activityRefId, and elementaryActivity are all required. Get these from the calendar skill output.');
    }

    const { state } = params;
    if (!state) {
        throw new Error('state is required. Use "accepted", "attention", or "warning".');
    }
    const url = `${sourceAppBaseUri.replace(/\/$/, '')}/uuArtifactIfc/activity/elementary/setState`;

    const body = {
        id: activityRefId,
        elementaryActivity,
        elementaryActivityState: state
    };
    if (params.note) {
        body.desc = params.note;
    }

    const response = await http.post(url, body);

    return {
        success: true,
        state,
        response
    };
}

module.exports = { execute, schema };
