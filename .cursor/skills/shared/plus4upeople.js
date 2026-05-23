/**
 * Plus4U People (uu-plus4upeople-maing01) helpers.
 *
 * One entry point: findPerson(query, http) — resolves uuIdentity, name,
 * or myTerritory URIs by querying findPerson with the appropriate parameter.
 *
 * The backend accepts these query parameters (verified, all GET):
 *   - name        → fuzzy name search. Default `private=false` (company-wide); pass `privateOnly=true` to restrict.
 *   - uuIdentity  → exact uuIdentity lookup
 *
 * Note: the service does NOT accept `email` — look up by name instead.
 *
 * Response shape: { itemList: [{ name, uuIdentity, p4u_id, mtMainBaseUri, mtDwBaseUri, ... }], uuAppErrorMap }
 */

const PLUS4U_PEOPLE_BASE_URI = "https://uuapp.plus4u.net/uu-plus4upeople-maing01/56ac93ddb0034de8b8e4f4b829ff7d0f";

function buildFindPersonUrl({ name, uuIdentity, privateOnly = false }) {
    const params = new URLSearchParams();
    if (uuIdentity) {
        params.set('uuIdentity', uuIdentity);
    } else if (name) {
        params.set('private', privateOnly ? 'true' : 'false');
        params.set('name', name);
    } else {
        throw new Error('findPerson requires one of: name, uuIdentity');
    }
    return `${PLUS4U_PEOPLE_BASE_URI}/findPerson?${params.toString()}`;
}

/**
 * Query Plus4U People service.
 * @param {Object} query - { name?, uuIdentity?, privateOnly? }
 * @param {Object} http - authenticated HTTP client from skilled-plus4u-mcp
 * @returns {Promise<{ itemList: Array, uuAppErrorMap: Object }>}
 */
async function findPerson(query, http) {
    if (!http) throw new Error('http client required');
    const url = buildFindPersonUrl(query);
    return await http.get(url);
}

/**
 * Convenience — return the first matching person or null.
 */
async function findFirstPerson(query, http) {
    const response = await findPerson(query, http);
    const list = response?.itemList || [];
    return list[0] || null;
}

/**
 * Find the Digital Workspace (dwg01) URI for a given uuIdentity.
 * Used by the calendar skill. Returns the dwg01 base URI string.
 */
async function findDwUri(uuIdentity, http) {
    const person = await findFirstPerson({ uuIdentity }, http);
    if (!person) {
        throw new Error(`No person found for uuIdentity ${uuIdentity}.`);
    }
    const direct = person.digitalWorkspaceUri
        || person.dwUri
        || person.mtDwBaseUri
        || person.myTerritoryUri
        || person.diaryWorkspaceUri;
    if (direct) return direct;
    for (const value of Object.values(person)) {
        if (typeof value === 'string' && value.includes('dwg01')) return value;
    }
    throw new Error(
        `Could not find dwg01 URI in person record for ${uuIdentity}. Keys: ${Object.keys(person).join(', ')}`
    );
}

module.exports = {
    PLUS4U_PEOPLE_BASE_URI,
    buildFindPersonUrl,
    findPerson,
    findFirstPerson,
    findDwUri
};
