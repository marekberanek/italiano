/**
 * Calendar Skill - List meetings from dwg01 (Digital Workspace)
 * Fetches the user's dwg01 URI via plus4upeople and lists diary records for a date range.
 */

const path = require('path');
const { toLocalTime } = require(path.join(__dirname, '../shared/common.js'));
const { findDwUri } = require(path.join(__dirname, '../shared/plus4upeople.js'));

const schema = {
    name: 'calendar',
    description: 'List my meetings from dwg01 (Digital Workspace). Looks up the dwg01 URI via plus4upeople findPerson and fetches diary records for a date range.',
    parameters: {
        uuIdentity: {
            type: 'string',
            required: false,
            description: 'uuIdentity of the user'
        },
        dateFrom: {
            type: 'string',
            required: false,
            description: 'Start date in ISO format (default: Monday of the current week)'
        },
        dateTo: {
            type: 'string',
            required: false,
            description: 'End date in ISO format (default: Sunday of the current week)'
        }
    },
    returns: {
        'dwUri': 'The resolved dwg01 workspace URI',
        'dateRange': 'The date range used for the query',
        'meetingCount': 'Total number of meetings across all categories',
        'meetings[]': 'Active meetings — rejected === false AND artifactState !== cancelled',
        'rejected[]': 'Rejected meetings — rejected === true AND artifactState !== cancelled',
        'cancelled[]': 'Cancelled meetings — artifactState === cancelled'
    }
};

function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
        dateFrom: monday.toISOString().split('T')[0],
        dateTo: sunday.toISOString().split('T')[0]
    };
}

/**
 * True when the HTTP client rejected the request with 403 Forbidden.
 * Matches errors from fetch wrappers that throw `HTTP ${status}: …` (see shared/uuapp.js).
 */
function isHttpForbiddenError(err) {
    if (!err) return false;
    if (err.status === 403 || err.statusCode === 403) return true;
    const msg = typeof err.message === 'string' ? err.message : String(err);
    return /^HTTP\s+403\b/.test(msg);
}

async function execute(params, http, context) {
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    const progress = context?.progress || (() => {});

    const uuIdentity = params.uuIdentity;
    if (!uuIdentity) {
        throw new Error('uuIdentity is required.');
    }
    const weekRange = getWeekRange();
    const dateFrom = params.dateFrom || weekRange.dateFrom;
    const dateTo = params.dateTo || weekRange.dateTo;

    // Step 1: Find the user's dwg01 URI
    await progress(1, 3, 'Looking up workspace...');
    const dwUri = await findDwUri(uuIdentity, http);

    // Step 2: Fetch meetings — single day uses listMyDiaryRecords (includes rejected/cancelled),
    //         multi-day uses listMyActiveDiaryRecords (active only, better performance)
    const baseUrl = dwUri.replace(/\/$/, '');
    const isSingleDay = dateFrom === dateTo;

    await progress(2, 3, `Fetching meetings ${dateFrom} – ${dateTo}...`);
    let allItems;
    try {
        if (isSingleDay) {
            const response = await http.get(`${baseUrl}/uuDwRecord/listMyDiaryRecords?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&pageInfo.pageSize=1000`);
            allItems = [...(response.uuDwrActiveList || []), ...(response.uuDwrFinalList || [])];
        } else {
            const response = await http.get(`${baseUrl}/uuDwRecord/listMyActiveDiaryRecords?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&pageInfo.pageSize=1000`);
            allItems = response.itemList || [];
        }
    } catch (e) {
        if (!isHttpForbiddenError(e)) {
            throw e;
        }
        const response = await http.get(`${baseUrl}/uuDwRecord/listDiaryRecords?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&pageInfo.pageSize=1000`);
        allItems = [...(response.uuDwrActiveList || []), ...(response.uuDwrFinalList || [])];
    }
    allItems.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const allMeetings = allItems.map(r => {
        const appUriStr = r.tileProps?.appUri;
        const appUri = appUriStr ? new URL(appUriStr) : null;
        const artifactState = r.tileProps?.artifactStateCode || r.tileProps?.artifact?.stateName || null;
        const rejected = r.rejected === true;
        const meetingId = appUri ? appUri.searchParams.get('id') : null;
        const startLocal = toLocalTime(r.startTime);
        const endLocal = toLocalTime(r.endTime);

        // Parse routeUri to extract activity id for setState
        let activityRefId = null;
        try {
            const url = new URL(r.routeUri);
            activityRefId = url.searchParams.get('id');
        } catch (e) { /* ignore parse errors */ }

        return {
            id: r.id,
            name: (r.name || '').trim(),
            startTime: r.startTime,
            endTime: r.endTime,
            timeLocal: `${startLocal.timeStr}–${endLocal.timeStr} ${startLocal.zone}`,
            location: (r.desc || '').replace(/<uu5string\s*\/?>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
            organizer: r.tileProps?.submitterMainUuIdentityName || null,
            activityState: r.tileProps?.activityStateCode || r.tileProps?.activity?.stateName || null,
            artifactState,
            rejected,
            category: artifactState === 'cancelled' ? 'cancelled' : rejected ? 'rejected' : 'active',
            meetingId,
            isLegacy: !meetingId,
            meetingBaseUri: appUri ? appUri.origin + '/' + appUri.pathname.split('/').slice(1, 3).join('/') : null,
            meetingUrl: appUriStr || r.routeUri || null,
            elementaryActivityStateCode: r.tileProps?.elementaryActivityStateCode || null,
            sourceAppBaseUri: r.sourceAppBaseUri || null,
            activityRefId,
            elementaryActivity: r.tileProps?.elementaryActivity || null
        };
    });

    await progress(3, 3, `Found ${allMeetings.length} meetings`);

    return {
        dwUri,
        dateRange: { dateFrom, dateTo },
        meetingCount: allMeetings.length,
        meetings: allMeetings.filter(m => !m.rejected && m.artifactState !== 'cancelled'),
        rejected: allMeetings.filter(m => m.rejected && m.artifactState !== 'cancelled'),
        cancelled: allMeetings.filter(m => m.artifactState === 'cancelled')
    };
}

module.exports = { execute, schema };
