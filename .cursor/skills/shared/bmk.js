/**
 * uuApp Business Model Kit (BMK) shared helpers.
 *
 * Owns product-specific relationship semantics for product structure diagrams
 * and delegates low-level uuBml rendering to the generic DiagramBuilder
 * (skills/bml-diagram/lib/bml-generator).
 */

const PRODUCT_STRUCTURE_RELATION_TYPES = Object.freeze({
    nestedSingle: 'composition1',
    nestedList: 'compositionN',
    masterDataReference: 'associationN',
    productReference: 'associationN'
});

function describeOption(name, value) {
    return `${name}: ${JSON.stringify(value)}`;
}

function validateProductStructureOptions(options = {}) {
    if (options.preset !== undefined) {
        throw new Error(`Product structure diagrams must not use ${describeOption('preset', options.preset)}.`);
    }

    if (options.relationType !== undefined) {
        throw new Error(`Product structure relationType is controlled by the helper; received ${describeOption('relationType', options.relationType)}.`);
    }

    if (options.lineStyle !== undefined && options.lineStyle !== 'solid') {
        throw new Error(`Product structure diagrams must not use ${describeOption('lineStyle', options.lineStyle)}.`);
    }
}

function connectProductStructure(builder, from, to, relationKind, options = {}) {
    const relationType = PRODUCT_STRUCTURE_RELATION_TYPES[relationKind];
    if (!relationType) {
        throw new Error(`Unsupported product structure relation kind: ${relationKind}`);
    }

    validateProductStructureOptions(options);

    return builder.connect(from, to, {
        ...options,
        relationType,
        lineStyle: 'solid',
        diagonal: true
    });
}

function connectNestedSingle(builder, nestedPart, mainObject, options = {}) {
    return connectProductStructure(builder, nestedPart, mainObject, 'nestedSingle', options);
}

function connectNestedList(builder, nestedPart, mainObject, options = {}) {
    return connectProductStructure(builder, nestedPart, mainObject, 'nestedList', options);
}

function connectMasterDataReference(builder, sourceObject, masterDataObject, options = {}) {
    return connectProductStructure(builder, sourceObject, masterDataObject, 'masterDataReference', options);
}

function connectProductReference(builder, sourceObject, referencedProduct, options = {}) {
    return connectProductStructure(builder, sourceObject, referencedProduct, 'productReference', options);
}

module.exports = {
    PRODUCT_STRUCTURE_RELATION_TYPES,
    connectProductStructure,
    connectNestedSingle,
    connectNestedList,
    connectMasterDataReference,
    connectProductReference
};
