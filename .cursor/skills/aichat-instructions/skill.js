/**
 * uuAiChat Instructions Skill
 * Create, list, get, update, delete instruction sets and instructions in uuAiChat.
 */

const schema = {
  name: 'aichat-instructions',
  description: 'Manage uuAiChat instruction sets and instructions (tools). Create, list, get, update instruction sets, instructions, and instruction set environments.',
  parameters: {
    action: {
      type: 'string',
      required: true,
      description: 'Action to perform: createInstructionSet, listInstructionSets, getInstructionSet, updateInstructionSet, deleteInstructionSet, createInstruction, listInstructions, getInstruction, updateInstruction, deleteInstruction, createEnvironment, getEnvironment, updateEnvironment'
    },
    baseUri: {
      type: 'string',
      required: true,
      description: 'uuAiChat base URI (e.g. https://uuapp.plus4u.net/uu-aichat-maing01/{awid})'
    },
    dtoIn: {
      type: 'object',
      required: false,
      description: 'Input data for the command (dtoIn). Structure depends on the action.'
    }
  }
};

// Map action names to use cases and HTTP methods
const ACTION_MAP = {
  // Instruction Set
  createInstructionSet:  { useCase: 'uuAssistantInstructionSet/create', method: 'POST' },
  listInstructionSets:   { useCase: 'uuAssistantInstructionSet/list',   method: 'GET' },
  getInstructionSet:     { useCase: 'uuAssistantInstructionSet/get',    method: 'GET' },
  updateInstructionSet:  { useCase: 'uuAssistantInstructionSet/update', method: 'POST' },
  deleteInstructionSet:  { useCase: 'uuAssistantInstructionSet/delete', method: 'POST' },
  learnInstructionSet:   { useCase: 'uuAssistantInstructionSet/learn',  method: 'POST' },
  // Instruction
  createInstruction:     { useCase: 'uuAssistantInstruction/create',    method: 'POST' },
  listInstructions:      { useCase: 'uuAssistantInstruction/list',      method: 'GET' },
  getInstruction:        { useCase: 'uuAssistantInstruction/get',       method: 'GET' },
  updateInstruction:     { useCase: 'uuAssistantInstruction/update',    method: 'POST' },
  deleteInstruction:     { useCase: 'uuAssistantInstruction/delete',    method: 'POST' },
  // Instruction Set Environment
  createEnvironment:     { useCase: 'uuAssistantInstructionSetEnvironment/create',    method: 'POST' },
  getEnvironment:        { useCase: 'uuAssistantInstructionSetEnvironment/get',       method: 'GET' },
  getEnvironmentByUser:  { useCase: 'uuAssistantInstructionSetEnvironment/getByUser', method: 'GET' },
  updateEnvironment:     { useCase: 'uuAssistantInstructionSetEnvironment/update',    method: 'POST' },
  listEnvironments:      { useCase: 'uuAssistantInstructionSetEnvironment/list',      method: 'GET' },
  deleteEnvironment:     { useCase: 'uuAssistantInstructionSetEnvironment/delete',    method: 'POST' },
};

// ─── OpenAI Tool Schema Validation ──────────────────────────────────────────
// uuAiChat transforms instructions into OpenAI function schemas.
// OpenAI is strict — these rules prevent runtime "invalidParameter" errors.

function validateDtoInAttributes(attrList) {
  if (!attrList || !Array.isArray(attrList)) return;

  const errors = [];
  for (const attr of attrList) {
    // Rule 1: array type MUST have items
    if (attr.type === 'array' && !attr.items) {
      errors.push(
        `Parameter "${attr.name}" has type "array" but is missing "items". ` +
        `Add "items": { "type": "string" } (or the appropriate element type). ` +
        `OpenAI rejects array parameters without items definition.`
      );
    }
    // Rule 2: items must have a type
    if (attr.items && !attr.items.type) {
      errors.push(
        `Parameter "${attr.name}" has "items" but items.type is missing. ` +
        `Add a type (e.g. "string", "number", "integer", "boolean", "object").`
      );
    }
    // Rule 3: object type with properties — each property must have type
    if (attr.type === 'object' && attr.properties) {
      for (const [propName, propDef] of Object.entries(attr.properties)) {
        if (!propDef.type) {
          errors.push(
            `Parameter "${attr.name}.${propName}" is missing "type". ` +
            `Every property in an object must have a type.`
          );
        }
      }
    }
    // Rule 4: uuCommandMethod must be uppercase
  }

  if (errors.length > 0) {
    throw new Error(
      `OpenAI tool schema validation failed:\n` +
      errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n') +
      `\n\nFix these issues before creating/updating the instruction.`
    );
  }
}

function validateInstruction(dtoIn) {
  if (!dtoIn) return;

  // Validate dtoIn attributes (both create and update)
  if (dtoIn.uuAssistantDtoInAttributesDefinitionList) {
    validateDtoInAttributes(dtoIn.uuAssistantDtoInAttributesDefinitionList);
  }

  // Validate uuCommandMethod is uppercase
  if (dtoIn.uuCommandMethod && !['GET', 'POST'].includes(dtoIn.uuCommandMethod)) {
    throw new Error(
      `uuCommandMethod must be "GET" or "POST" (uppercase). Got: "${dtoIn.uuCommandMethod}".`
    );
  }
}

// ─── Execute ────────────────────────────────────────────────────────────────

async function execute(params, http) {
  if (!http) {
    throw new Error('HTTP client not available. Call login on skilled-plus4u-mcp first.');
  }

  const { action, baseUri, dtoIn } = params;

  if (!action) throw new Error('Parameter "action" is required.');
  if (!baseUri) throw new Error('Parameter "baseUri" is required.');

  const actionDef = ACTION_MAP[action];
  if (!actionDef) {
    const available = Object.keys(ACTION_MAP).join(', ');
    throw new Error(`Unknown action "${action}". Available: ${available}`);
  }

  // Pre-flight validation for instruction mutations
  if (['createInstruction', 'updateInstruction'].includes(action)) {
    validateInstruction(dtoIn);
  }

  const base = baseUri.endsWith('/') ? baseUri : baseUri + '/';
  const url = new URL(actionDef.useCase, base).toString();

  let response;
  if (actionDef.method === 'GET') {
    let getUrl = url;
    if (dtoIn && Object.keys(dtoIn).length > 0) {
      const u = new URL(url);
      for (const [key, value] of Object.entries(dtoIn)) {
        if (typeof value === 'object') {
          u.searchParams.set(key, JSON.stringify(value));
        } else {
          u.searchParams.set(key, String(value));
        }
      }
      getUrl = u.toString();
    }
    response = await http.get(getUrl);
  } else {
    response = await http.post(url, dtoIn || {});
  }

  return response;
}

module.exports = { execute, schema };
