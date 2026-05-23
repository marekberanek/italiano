/**
 * Converts a UTC ISO timestamp to local CET/CEST time string.
 * Uses European DST rules: last Sunday in March (→ CEST) / last Sunday in October (→ CET).
 *
 * @param {string} isoUtc - ISO 8601 UTC datetime string
 * @returns {{ timeStr: string, zone: string }} e.g. { timeStr: '14:30', zone: 'CEST' }
 */
function toLocalTime(isoUtc) {
    const date = new Date(isoUtc);
    const year = date.getUTCFullYear();
    const lastSundayMarch = new Date(Date.UTC(year, 2, 31));
    lastSundayMarch.setUTCDate(31 - lastSundayMarch.getUTCDay());
    const lastSundayOctober = new Date(Date.UTC(year, 9, 31));
    lastSundayOctober.setUTCDate(31 - lastSundayOctober.getUTCDay());
    const cestStart = new Date(lastSundayMarch.getTime() + 3600000);
    const cestEnd = new Date(lastSundayOctober.getTime() + 3600000);
    const isCEST = date >= cestStart && date < cestEnd;
    const local = new Date(date.getTime() + (isCEST ? 2 : 1) * 3600000);
    const hh = String(local.getUTCHours()).padStart(2, '0');
    const mm = String(local.getUTCMinutes()).padStart(2, '0');
    return { timeStr: `${hh}:${mm}`, zone: isCEST ? 'CEST' : 'CET' };
}

module.exports = { toLocalTime };
