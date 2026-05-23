/**
 * Elementary Management Update Skill
 * Writes content to a section in an Elementary Management meeting.
 *
 * API contract (discovered via browser network capture):
 *   Lock:   POST meeting/section/lock   { meetingId, id, uuEccDtoIn: { oid, bid }, uuEccData: { oid, bid } }
 *   Update: POST meeting/section/update { meetingId, id, uuEccDtoIn: { oid, bid, content, commitTs }, uuEccData: { oid, bid, content, commitTs } }
 *   Unlock: POST meeting/section/unlock { meetingId, id, uuEccDtoIn: { oid, bid }, uuEccData: { oid, bid } }
 *
 * Content format: uu5String (e.g. '<uu5string/><UU5.RichText.Block uu5string="<uu5string/>text"/>')
 */

const schema = {
    name: 'elemmng-update',
    description: 'Write content to a section in an Elementary Management meeting (preparation or minutes).',
    parameters: {
        url: { type: 'string', required: true, description: 'Meeting URL' },
        content: { type: 'string', required: true, description: 'Content to write (plain text or uu5string when format=uu5string)' },
        target: { type: 'string', required: false, default: 'minutes', description: '"minutes" (default) or "preparation"' },
        format: { type: 'string', required: false, default: 'text', description: '"text" (default, wraps in RichText.Block) or "uu5string" (raw, sent as-is)' },
        action: { type: 'string', required: false, default: 'update', description: '"update" (default) or "inspect"' }
    }
};

function parseMeetingUri(uri) {
    const url = new URL(uri);
    const parts = url.pathname.split('/').filter(Boolean);
    return {
        meetingBaseUri: `${url.origin}/${parts[0]}/${parts[1]}`,
        meetingId: url.searchParams.get('id')
    };
}

async function execute(params, http) {
    const { url, content, target = 'minutes', format = 'text', action = 'update' } = params;
    const { meetingBaseUri, meetingId } = parseMeetingUri(url);

    const response = await http.get(`${meetingBaseUri}/meeting/load?id=${meetingId}`);
    const m = response.data || response;
    const bid = m.uuEccRoot?.bid;
    const pageOid = m.uuEccMainPage;

    const pageResp = await http.get(
        `${meetingBaseUri}/meeting/page/load?meetingId=${meetingId}&id=${meetingId}` +
        `&uuEccPage.oid=${pageOid}&uuEccPage.bid=${bid}&oid=${pageOid}&bid=${bid}`
    );
    const page = pageResp.data || pageResp;
    const sectionRefs = page?.panels?.mainPanel?.sectionList || [];

    if (action === 'inspect') {
        return { meetingId, bid, pageOid, sections: sectionRefs.map(r => ({
            oid: r.section?.oid, bid: r.section?.bid,
            tags: (r.section?.content || []).map(c => c.tag),
            readOnly: r.section?.readOnly, commitTs: r.section?.commitTs
        }))};
    }

    const markerTag = target === 'preparation'
        ? 'UuElementaryManagement.Meeting.DetailPreparation'
        : 'UuElementaryManagement.Meeting.DetailMinutes';

    let markerFound = false;
    let sec = null;
    for (const ref of sectionRefs) {
        const tags = (ref.section?.content || []).map(c => c.tag);
        if (tags.includes(markerTag)) { markerFound = true; continue; }
        if (markerFound && !ref.section?.readOnly) { sec = ref.section; break; }
    }
    if (!sec) throw new Error(`No editable ${target} section found`);

    const eccRef = { oid: sec.oid, bid: sec.bid };
    const baseBody = { meetingId, id: meetingId, uuEccDtoIn: eccRef, uuEccData: eccRef };
    const preparedContent = format === 'uu5string'
        ? (content.startsWith('<uu5string/>') ? content : `<uu5string/>${content}`)
        : `<uu5string/><UU5.RichText.Block uu5string="<uu5string/>${content}"/>`;

    await http.post(`${meetingBaseUri}/meeting/section/lock`, baseBody);

    try {
        const updateEcc = { ...eccRef, content: preparedContent, commitTs: sec.commitTs };
        const result = await http.post(`${meetingBaseUri}/meeting/section/update`, {
            meetingId, id: meetingId, uuEccDtoIn: updateEcc, uuEccData: updateEcc
        });
        return { success: true, sectionOid: sec.oid, target, result };
    } finally {
        try { await http.post(`${meetingBaseUri}/meeting/section/unlock`, baseBody); } catch (_) {}
    }
}

module.exports = { execute, schema };
