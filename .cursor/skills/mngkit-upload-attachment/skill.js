/**
 * Management Kit Upload Attachment Skill
 * Uploads a binary file to a ManagementKit document as an EBC attachment
 */

const path = require('path');
const fs = require('fs');
const { parseMngKitUri, uploadMngKitAttachment, listMngKitAttachments } = require(path.join(__dirname, '../shared/mngkit.js'));

const schema = {
    name: 'mngkit-upload-attachment',
    description: 'Upload a binary file to a ManagementKit document, or list existing attachments. Returns file link tag for embedding in page content.',
    parameters: {
        action: {
            type: 'string',
            required: false,
            enum: ['upload', 'list'],
            default: 'upload',
            description: 'Action: "upload" (default) uploads a file, "list" lists existing attachments'
        },
        url: {
            type: 'string',
            required: false,
            description: 'ManagementKit document URL (alternative to baseUri + documentOid)'
        },
        baseUri: {
            type: 'string',
            required: false,
            description: 'Base URI for API calls (from mngkit-read response). Required if url not provided.'
        },
        documentOid: {
            type: 'string',
            required: false,
            description: 'Document OID (from mngkit-read response). Required if url not provided.'
        },
        filePath: {
            type: 'string',
            required: false,
            description: 'Local file path of the file to upload (required for action="upload")'
        },
        filename: {
            type: 'string',
            required: false,
            description: 'Override filename (defaults to basename of filePath)'
        },
        mimeType: {
            type: 'string',
            required: false,
            description: 'Override MIME type (auto-detected from extension if omitted)'
        }
    }
};

// type: "boxLink" (file box with icon), "button" (download button), or omit for inline link
function buildFileLink(baseUri, documentOid, fileOid, type) {
    const src = `${baseUri}/document/ebc/file/getDataByOid?bid&oid=${documentOid}&uuEbcData.fileOid=${fileOid}`;
    if (type) {
        return `<UuEbc.File.Link src="${src}" type="${type}"/>`;
    }
    return `<UuEbc.File.Link src="${src}"/>`;
}

function buildFileLinkEcc(baseUri, documentOid, fileOid, type) {
    const src = `${baseUri}/document/ebc/file/getDataByOid?bid&oid=${documentOid}&uuEbcData.fileOid=${fileOid}`;
    const props = { src };
    if (type) props.type = type;
    return { uu5Tag: 'UuEbc.File.Link', props };
}

async function execute(params, http, context) {
    const { action = 'upload', url, filePath, filename, mimeType } = params;
    let { baseUri, documentOid } = params;
    const progress = context?.progress || (() => {});

    if (url && (!baseUri || !documentOid)) {
        const parsed = parseMngKitUri(url);
        baseUri = baseUri || parsed.baseUri;
        documentOid = documentOid || parsed.documentOid;
    }

    if (!baseUri || !documentOid) {
        throw new Error(
            'Either url or both baseUri + documentOid are required. ' +
            'Get them from mngkit-read response or provide the document URL.'
        );
    }

    if (action === 'list') {
        await progress(1, 2, 'Listing attachments...');
        const result = await listMngKitAttachments(baseUri, documentOid, http);
        // Enrich with file link tags in all variants
        result.itemList = (result.itemList || []).map(file => ({
            ...file,
            links: {
                inline: buildFileLink(baseUri, documentOid, file.oid),
                boxLink: buildFileLink(baseUri, documentOid, file.oid, 'boxLink'),
                button: buildFileLink(baseUri, documentOid, file.oid, 'button'),
            },
            eccComponent: buildFileLinkEcc(baseUri, documentOid, file.oid),
        }));
        await progress(2, 2, 'Done');
        return result;
    }

    // Upload
    if (!filePath) {
        throw new Error('filePath parameter is required for action="upload"');
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const options = {};
    if (filename) options.filename = filename;
    if (mimeType) options.mimeType = mimeType;

    await progress(1, 2, 'Uploading attachment...');
    const result = await uploadMngKitAttachment(baseUri, documentOid, filePath, options, http);

    // Enrich response with file link tags in all variants
    const fileOid = result?.createdFile?.oid;
    if (fileOid) {
        result.links = {
            inline: buildFileLink(baseUri, documentOid, fileOid),
            boxLink: buildFileLink(baseUri, documentOid, fileOid, 'boxLink'),
            button: buildFileLink(baseUri, documentOid, fileOid, 'button'),
        };
        result.eccComponent = buildFileLinkEcc(baseUri, documentOid, fileOid);
        result.linksDescription = 'inline = text link, boxLink = file box with icon, button = download button. Use as ECC component in mngkit-update content array.';
    }

    await progress(2, 2, 'Done');
    return result;
}

module.exports = { execute, schema };
