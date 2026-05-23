/**
 * Business Chat Skill - MCP Entry Point
 * Interact with Plus4U Business Chat service directly
 */

const crypto = require('crypto');

const DEFAULT_BASE_URI = 'https://uuapp.plus4u.net/uu-businesschat-maing01/1c3914bd5677248f5e93f2406d4ad5b6/';

const schema = {
    name: 'business-chat',
    description: 'Ask questions to the Plus4U Business Chat service. Maintains conversation context via conversationId. Returns response with conversationId for continuation.',
    parameters: {
        baseUri: {
            type: 'string',
            required: false,
            default: DEFAULT_BASE_URI,
            description: 'uu-businesschat-maing01 base URI. Defaults to Product Hub business chat.'
        },
        message: {
            type: 'string',
            required: true,
            description: 'The question or message to send to the chat assistant'
        },
        conversationId: {
            type: 'string',
            required: false,
            description: '32-character conversation ID to continue an existing conversation. If not provided, a new one is generated.'
        }
    },
    returns: {
        conversationId: 'Conversation ID for continuation',
        response: 'Chat response content'
    }
};

/**
 * Execute the skill
 * @param {Object} params - { baseUri: string, message: string, conversationId?: string }
 * @param {Object} http - HTTP client with token pre-injected by MCP
 */
async function execute(params, http) {
    const { message, conversationId } = params;
    const baseUri = params.baseUri || DEFAULT_BASE_URI;
    
    if (!message) {
        throw new Error('message parameter is required');
    }
    
    if (!http) {
        throw new Error('http parameter is required. Use skilled-plus4u-mcp to execute this skill.');
    }
    
    const normalizedBaseUri = baseUri.endsWith('/') ? baseUri : `${baseUri}/`;
    const endpoint = `${normalizedBaseUri}aiChat`;
    
    const dtoIn = {
        conversationId: conversationId || crypto.randomBytes(16).toString('hex'),
        chatItemEntry: message
    };
    
    const result = await http.post(endpoint, dtoIn);
    
    return {
        conversationId: dtoIn.conversationId,
        ...result
    };
}

module.exports = { execute, schema };
