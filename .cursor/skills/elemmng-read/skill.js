/**
 * Elementary Management Read Skill - MCP Entry Point
 * Loads full meeting detail including preparation notes, minutes, and participants.
 */

const path = require('path');
const { convertUu5JsonToMarkdown } = require(path.join(__dirname, '../uu5json-to-markdown/lib/convert.js'));

const schema = {
    name: 'elemmng-read',
    description: 'Load full meeting content from Elementary Management — preparation notes, minutes, and participants. Pass the meeting URL from calendar skill (meetingUrl field).',
    parameters: {
        url: {
            type: 'string',
            required: true,
            description: 'Meeting URL, e.g. https://uuapp.plus4u.net/uu-elementarymanagement-maing01/{awid}/meetingDetail?id={meetingId}. Available as meetingUrl in calendar skill output.'
        }
    },
    returns: {
        name: 'Meeting name',
        place: 'Meeting location (plain text, UU5 tags stripped)',
        coordinator: 'Coordinator name (person who organized the meeting)',
        start: 'ISO 8601 start time (UTC)',
        end: 'ISO 8601 end time (UTC)',
        state: 'Meeting state (e.g. scheduled, cancelled)',
        'participants[]': 'Array of participant names',
        preparationText: 'Preparation notes as Markdown (empty string if none)',
        minutesText: 'Meeting minutes as Markdown (empty string if none)',
        hasPreparation: 'true if preparation notes exist',
        hasMinutes: 'true if minutes exist'
    }
};

function parseMeetingUri(uri) {
    const url = new URL(uri);
    const parts = url.pathname.split('/').filter(Boolean);
    const meetingBaseUri = `${url.origin}/${parts[0]}/${parts[1]}`;
    const meetingId = url.searchParams.get('id');
    return { meetingBaseUri, meetingId };
}

async function loadMeetingContent(meetingDetail, meetingId, baseUri, http) {
    const bid = meetingDetail.uuEccRoot?.bid;
    const pageOid = meetingDetail.uuEccMainPage;
    if (!bid || !pageOid) return { preparationSections: [], minutesSections: [] };

    const pageResp = await http.get(`${baseUri}/meeting/page/load?meetingId=${meetingId}&id=${meetingId}&uuEccPage.oid=${pageOid}&uuEccPage.bid=${bid}&oid=${pageOid}&bid=${bid}`);
    const page = pageResp.data || pageResp;

    // meeting/page/load returns sections inline in panels.mainPanel.sectionList
    const sectionRefs = page?.panels?.mainPanel?.sectionList || [];
    if (sectionRefs.length === 0) return { preparationSections: [], minutesSections: [] };

    // Sections are embedded directly as .section objects, no extra API calls needed
    const allSections = sectionRefs.map(ref => ref.section).filter(Boolean);

    let region = 'before';
    const preparationSections = [];
    const minutesSections = [];

    for (const section of allSections) {
        const content = section.content || [];
        const isSystem = content.some(c =>
            c.tag === 'UuElementaryManagement.Meeting.DetailPreparation' ||
            c.tag === 'UuElementaryManagement.Meeting.DetailTop' ||
            c.tag === 'UuElementaryManagement.Meeting.DetailMinutes' ||
            c.tag === 'UuElementaryManagement.Meeting.DetailBottom'
        );
        if (isSystem) {
            if (content.some(c => c.tag === 'UuElementaryManagement.Meeting.DetailPreparation')) region = 'preparation';
            else if (content.some(c => c.tag === 'UuElementaryManagement.Meeting.DetailMinutes')) region = 'minutes';
            continue;
        }
        if (region === 'preparation') preparationSections.push(section);
        else if (region === 'minutes') minutesSections.push(section);
    }

    return { preparationSections, minutesSections };
}

async function execute(params, http) {
    const { url } = params;
    if (!url) throw new Error('url is required');

    const { meetingBaseUri, meetingId } = parseMeetingUri(url);
    if (!meetingId) throw new Error('Could not extract meetingId from url');

    const response = await http.get(`${meetingBaseUri}/meeting/load?id=${meetingId}`);
    // meeting/load wraps data in a .data property
    const meetingDetail = response.data || response;
    const { preparationSections, minutesSections } = await loadMeetingContent(meetingDetail, meetingId, meetingBaseUri, http);

    const prepContent = preparationSections.flatMap(s => s?.content || []);
    const minContent = minutesSections.flatMap(s => s?.content || []);

    const preparationText = convertUu5JsonToMarkdown(prepContent).trim();
    const minutesText = convertUu5JsonToMarkdown(minContent).trim();
    const participants = (meetingDetail?.participantList || []).map(p => p.mainUuIdentityName);
    const place = (meetingDetail.place || '')
        .replace(/<uu5string\s*\/?>/gi, '')
        .replace(/<uu5json\s*\/>[^"]*"/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        name: meetingDetail.name,
        place,
        coordinator: meetingDetail.coordinator?.mainUuIdentityName || null,
        start: meetingDetail.start || null,
        end: meetingDetail.end || null,
        state: meetingDetail.state || null,
        participants,
        preparationText,
        minutesText,
        hasPreparation: preparationText.length > 0,
        hasMinutes: minutesText.length > 0
    };
}

module.exports = { execute, schema };
