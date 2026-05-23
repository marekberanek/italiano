#!/usr/bin/env node
/**
 * BML Diagram Generator - Usage Examples
 * 
 * Demonstrates how to use the bml-generator library to create various diagrams.
 * 
 * IMPORTANT: BML canvas is standard 2048×2048 pixels with 64×64 pixel icons.
 * All positions must fit within this constraint.
 */

const { DiagramBuilder, STENCILS } = require('./bml-generator');
const fs = require("fs");

function createBuilder(fitOptions = {}) {
    return new DiagramBuilder({
        width: 2048,
        height: 2048,
        autoFit: true,
        fitOptions: {
            padding: 96,
            minWidth: 1024,
            minHeight: 640,
            ...fitOptions
        }
    });
}

// ============================================================================
// Example 1: SDLC Lifecycle (Circular Flow)
// ============================================================================

function createSdlcDiagram() {
    const builder = createBuilder();
    
    // Define phases
    const phases = [
        { text: '1. Planning', type: 'activityState', importance: 'highest' },
        { text: '2. Analysis', type: 'activityState', importance: 'high' },
        { text: '3. Design', type: 'activityState', importance: 'high' },
        { text: '4. Development', type: 'activityState', importance: 'high' },
        { text: '5. Testing', type: 'activityState', importance: 'high' },
        { text: '6. Deployment', type: 'activityState', importance: 'high' }
    ];
    
    // Add icons in circular layout (centered in 2048×2048 canvas)
    const icons = builder.addIcons(phases, 'circle', {
        centerX: 960,
        centerY: 896,
        radius: 384
    });
    
    // Connect in cycle
    builder.connectCycle(icons);
    
    return builder;
}

// ============================================================================
// Example 2: Client-Server Architecture (Horizontal Flow)
// ============================================================================

function createClientServerDiagram() {
    const builder = createBuilder({ minWidth: 960, minHeight: 512 });
    
    const components = [
        { text: 'Browser', type: 'product', importance: 'high' },
        { text: 'Server', type: 'server', importance: 'highest' },
        { text: 'DB', type: 'document', importance: 'high' }
    ];
    
    const icons = builder.addIcons(components, 'horizontal', {
        startX: 64,
        y: 896,
        spacing: 384
    });
    
    // Connect in chain
    builder.connectChain(icons);
    
    return builder;
}

// ============================================================================
// Example 3: Microservices Architecture (Grid Layout)
// ============================================================================

function createMicroservicesDiagram() {
    const builder = createBuilder({ minWidth: 1280, minHeight: 896 });
    
    // Add API Gateway at top
    const gateway = builder.addIcon({
        text: 'API GW',
        type: 'server',
        importance: 'highest',
        position: { x: 832, y: 128 }
    });
    
    // Add services in a grid
    const services = [
        { text: 'Users', type: 'command', importance: 'high' },
        { text: 'Orders', type: 'command', importance: 'high' },
        { text: 'Products', type: 'command', importance: 'high' },
        { text: 'Payments', type: 'command', importance: 'high' }
    ];
    
    const serviceIcons = builder.addIcons(services, 'grid', {
        startX: 448,
        startY: 512,
        columns: 2,
        spacingX: 768,
        spacingY: 384
    });
    
    // Connect gateway to all services
    serviceIcons.forEach(service => {
        builder.connect(gateway, service);
    });
    
    return builder;
}

// ============================================================================
// Example 4: CI/CD Pipeline (Vertical Flow)
// ============================================================================

function createCiCdDiagram() {
    const builder = createBuilder({ minWidth: 960, minHeight: 768 });
    
    const stages = [
        { text: 'Source', type: 'document', importance: 'normal' },
        { text: 'Build', type: 'activity', importance: 'high' },
        { text: 'Test', type: 'activity', importance: 'high' },
        { text: 'Deploy', type: 'activity', importance: 'highest' }
    ];
    
    const icons = builder.addIcons(stages, 'vertical', {
        x: 960,
        startY: 128,
        spacing: 256
    });
    
    builder.connectChain(icons);
    
    return builder;
}

// ============================================================================
// Example 5: MCP Architecture with Blocks
// ============================================================================

function createMcpArchitectureDiagram() {
    const builder = createBuilder({ minWidth: 1440, minHeight: 960 });
    
    // Add containing block for server
    builder.addBlock({
        text: 'Server',
        position: { x: 832, y: 128 },
        size: { width: 512, height: 768 }
    });
    
    // Client
    const cursor = builder.addIcon({
        text: 'IDE',
        type: 'product',
        importance: 'objective',
        position: { x: 320, y: 512 }
    });
    
    // MCP Server
    const mcpServer = builder.addIcon({
        text: 'MCP',
        type: 'server',
        importance: 'high',
        position: { x: 960, y: 512 }
    });
    
    // Commands
    const commands = [
        { text: 'read', type: 'command', importance: 'highest' },
        { text: 'find', type: 'command', importance: 'highest' }
    ];
    
    const commandIcons = builder.addIcons(commands, 'vertical', {
        x: 1088,
        startY: 256,
        spacing: 512
    });
    
    // Connect
    builder.connect(cursor, mcpServer);
    commandIcons.forEach(cmd => builder.connect(mcpServer, cmd));
    
    return builder;
}

// ============================================================================
// CLI
// ============================================================================

function main() {
    const examples = {
        sdlc: createSdlcDiagram,
        'client-server': createClientServerDiagram,
        microservices: createMicroservicesDiagram,
        cicd: createCiCdDiagram,
        mcp: createMcpArchitectureDiagram
    };
    
    const exampleName = process.argv[2];
    const format = process.argv[3] || 'json';
    const outputFilePath = process.argv[4] || "/tmp/diagram_output.txt";
    
    if (!exampleName || !examples[exampleName]) {
        console.log('Usage: node examples.js <example> [format]');
        console.log('');
        console.log('Examples:');
        Object.keys(examples).forEach(name => console.log(`  - ${name}`));
        console.log('');
        console.log('Formats:');
        console.log('  - json (default): Raw JSON');
        console.log('  - uu5: UU5 string format (written to file)');
        console.log('');
        console.log('Note: BML canvas is 2048×2048 pixels, icons are 64×64 pixels.');
        console.log('For uu5 output, optional arg 4 is output file path (default: /tmp/diagram_output.txt).');
        process.exit(0);
    }
    
    const builder = examples[exampleName]();
    
    if (format === 'uu5') {
        const uu5 = builder.toUu5String();
        fs.writeFileSync(outputFilePath, uu5);
        console.log("Diagram saved to", outputFilePath);
        console.log("Size:", uu5.length, "bytes");
    } else {
        console.log(JSON.stringify(builder.build(), null, 2));
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    createSdlcDiagram,
    createClientServerDiagram,
    createMicroservicesDiagram,
    createCiCdDiagram,
    createMcpArchitectureDiagram
};
