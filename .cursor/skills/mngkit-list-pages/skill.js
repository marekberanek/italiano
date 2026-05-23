/**
 * Management Kit List Pages Skill - MCP Entry Point
 * Lists all pages in a Management Kit document
 */

const path = require('path');
const fs = require('fs');
const { parseMngKitUri, listMngKitPages } = require(path.join(__dirname, '../shared/mngkit.js'));

const schema = {
    name: 'mngkit-list-pages',
    description: 'List all pages in a ManagementKit document. Returns page OIDs, names, and order.',
    parameters: {
        url: {
            type: 'string',
            required: true,
            description: 'ManagementKit document URL (e.g., https://uuapp.plus4u.net/uu-managementkit-maing02/{awid}/document?oid={documentOid})'
        },
        outputFile: {
            type: 'string',
            required: false,
            description: 'Optional path to save the output as JSON file for later grep/search'
        }
    },
    returns: {
        'pageList[]': 'Array of pages with: pageOid, name, hidden, order',
        pageCount: 'Total number of pages'
    }
};

async function execute(params, http) {
    const { url, outputFile } = params;

    if (!url) {
        throw new Error('url parameter is required');
    }

    const parsed = parseMngKitUri(url);
    if (!parsed.documentOid) {
        throw new Error('Could not extract documentOid from URL. Ensure URL contains ?oid={documentOid}');
    }

    const result = await listMngKitPages(parsed.baseUri, parsed.documentOid, http);

    if (outputFile) {
        const outputPath = path.resolve(outputFile);
        const lines = result.pageList.map((p, i) => {
            const hidden = p.hidden ? ' [HIDDEN]' : '';
            return `  ${i + 1}. [${p.pageOid}] ${p.name}${hidden}`;
        });
        const output = {
            summary: `${result.documentName}\n${lines.join('\n')}`,
            pages: result.pageList,
            pageCount: result.pageCount,
            documentOid: result.documentOid,
            eccDocumentOid: result.eccDocumentOid
        };
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        return {
            message: `Saved ${result.pageCount} pages to ${outputPath}`,
            pageCount: result.pageCount,
            outputFile: outputPath
        };
    }

    return result;
}

module.exports = { execute, schema, parseMngKitUri };
