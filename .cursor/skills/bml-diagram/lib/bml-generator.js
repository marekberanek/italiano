/**
 * BML Diagram Generator Library
 * 
 * Provides deterministic, reusable functions for generating UuBml diagrams.
 */

// ============================================================================
// ID Generation
// ============================================================================

let idCounter = 0;

/**
 * Generate a unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique identifier
 */
function generateId(prefix = 'elem') {
    idCounter++;
    return `${prefix}_${idCounter.toString(16).padStart(4, '0')}`;
}

/**
 * Generate a random hexadecimal ID (8 characters)
 * Format matches BML native IDs like "74c07a7a", "e4749b9a"
 * @returns {string} Random hex identifier
 */
function generateHexId() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars[Math.floor(Math.random() * 16)];
    }
    return result;
}

/**
 * Generate an array of unique hex IDs
 * @param {number} count - Number of IDs to generate
 * @returns {Array<string>} Array of unique hex identifiers
 */
function generateHexIds(count) {
    const ids = new Set();
    while (ids.size < count) {
        ids.add(generateHexId());
    }
    return Array.from(ids);
}

/**
 * Reset the ID counter (useful for deterministic output)
 */
function resetIdCounter() {
    idCounter = 0;
}

// ============================================================================
// Grid Constants
// ============================================================================

/**
 * BML Grid System:
 * - Tile: 8×8 pixels (one tile side = 8 pixels)
 * - Icon: 8 tiles × 8 tiles = 64×64 pixels
 * - Gap: 8 pixels (one tile side) minimum between icons
 * - Standard spacing: 72 pixels (64 icon + 8 gap) - but often use 128 for visual clarity
 * - Grid has ~50 tiles in each direction
 */
const TILE_SIDE = 8;           // One tile side = 8 pixels
const TILE_AREA = 64;          // One tile = 8×8 = 64 square pixels
const ICON_SIZE_TILES = 8;     // Icon is 8×8 tiles
const ICON_SIZE_PX = 64;       // Icon = 8 tiles × 8 pixels = 64 pixels
const MIN_GAP = 8;             // Minimum gap = 1 tile side = 8 pixels
const MIN_SPACING = 72;        // 64 (icon) + 8 (gap) = 72 pixels
const STANDARD_SPACING = 128;  // Common spacing for visual clarity (64 + 64)

// Legacy aliases for backwards compatibility
const GRID_UNIT = TILE_SIDE;
const TILE_SIZE = TILE_SIDE;

// ============================================================================
// Block Grid Constants
// ============================================================================

/**
 * Block Grid System:
 * Blocks are positioned on a grid that aligns with icon placement.
 * 
 * Key measurements (all in 8px tiles):
 * - Block padding: 40px (5 tiles) from canvas edge
 * - Standard block size: 176×176px (22×22 tiles)
 * - Gap between blocks: 16px (2 tiles)
 * - Step between block positions: 192px (24 tiles)
 * 
 * Corner-to-Icon alignment:
 * - Block corner moved 8px inward aligns with potential icon edge
 * - First icon position inside block: corner + 8px
 * - Icon center at corner + 8 + 32 = corner + 40px
 * 
 * Socket distribution:
 * - Sockets placed every 8px along block edges
 * - Horizontal (top/bottom): (width / 8) + 1 sockets
 * - Vertical (left/right): ((height - 8) / 8) + 1 sockets
 */
const BLOCK_PADDING = 40;           // Starting offset from canvas edge (5 tiles)
const BLOCK_STANDARD_SIZE = 176;    // Standard block = 22 tiles (176px)
const BLOCK_GAP = 16;               // Gap between blocks = 2 tiles (16px)
const BLOCK_STEP = 192;             // Step size = 24 tiles (192px = block + gap)
const BLOCK_CORNER_INSET = 8;       // Corner inset for icon alignment (1 tile)

// ============================================================================
// Position Helpers
// ============================================================================

/**
 * Round position to tile boundary (8-pixel grid)
 * All positions in BML should be multiples of 8 (tile side)
 * @param {number} value - Position value
 * @returns {number} Tile-aligned value (multiple of 8)
 */
function snapToGrid(value) {
    return Math.round(value / TILE_SIDE) * TILE_SIDE;
}

/**
 * Alias for snapToGrid - snaps to 8-pixel tile boundary
 * @param {number} value - Position value
 * @returns {number} Tile-aligned value (multiple of 8)
 */
function snapToTile(value) {
    return snapToGrid(value);
}

/**
 * Snap to icon boundary (64-pixel grid)
 * Use for positioning icons to ensure they align with full icon slots
 * @param {number} value - Position value
 * @returns {number} Icon-aligned value (multiple of 64)
 */
function snapToIconGrid(value) {
    return Math.round(value / ICON_SIZE_PX) * ICON_SIZE_PX;
}

/**
 * Calculate positions for elements in a circle
 * Positions are snapped to 128px grid boundaries for BML
 * @param {number} count - Number of elements
 * @param {Object} options - Configuration options
 * @returns {Array<{x: number, y: number}>} Array of positions
 */
function circleLayout(count, options = {}) {
    const {
        centerX = 960,           // Center of 2048 canvas
        centerY = 896,           // Center of 2048 canvas (accounting for Y starting at 0)
        radius = 384,            // 3 grid cells radius (3 × 128)
        startAngle = -90,        // Start from top
        clockwise = true
    } = options;

    const positions = [];
    const angleStep = (clockwise ? 1 : -1) * (360 / count);

    for (let i = 0; i < count; i++) {
        const angle = (startAngle + i * angleStep) * (Math.PI / 180);
        // Snap to 128px grid positions (64 + n*128 for X, n*128 for Y)
        const rawX = centerX + radius * Math.cos(angle);
        const rawY = centerY + radius * Math.sin(angle);
        positions.push({
            x: snapToGridPosition(rawX),
            y: snapToGridPositionY(rawY)
        });
    }

    return positions;
}

/**
 * Snap X coordinate to BML grid (64 + n*128)
 * @param {number} value - X position value
 * @returns {number} Grid-aligned X value
 */
function snapToGridPosition(value) {
    const n = Math.round((value - 64) / STANDARD_SPACING);
    return 64 + n * STANDARD_SPACING;
}

/**
 * Snap Y coordinate to BML grid (n*128)
 * @param {number} value - Y position value
 * @returns {number} Grid-aligned Y value
 */
function snapToGridPositionY(value) {
    const n = Math.round(value / STANDARD_SPACING);
    return n * STANDARD_SPACING;
}

/**
 * Calculate positions for elements in a grid
 * Uses BML grid positions: X starts at 64, Y starts at 0, spacing 128px
 * @param {number} count - Number of elements
 * @param {Object} options - Configuration options
 * @returns {Array<{x: number, y: number}>} Array of positions
 */
function gridLayout(count, options = {}) {
    const {
        startX = 64,             // BML grid: X starts at 64
        startY = 0,              // BML grid: Y starts at 0
        columns = 3,
        spacingX = STANDARD_SPACING,  // 128px grid spacing
        spacingY = STANDARD_SPACING   // 128px grid spacing
    } = options;

    const positions = [];
    for (let i = 0; i < count; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        positions.push({
            x: snapToTile(startX + col * spacingX),
            y: snapToTile(startY + row * spacingY)
        });
    }

    return positions;
}

/**
 * Calculate positions for elements in a horizontal line
 * Uses BML grid positions: X starts at 64, spacing 128px
 * @param {number} count - Number of elements
 * @param {Object} options - Configuration options
 * @returns {Array<{x: number, y: number}>} Array of positions
 */
function horizontalLayout(count, options = {}) {
    const {
        startX = 64,             // BML grid: X starts at 64
        y = 0,                   // BML grid: Y starts at 0
        spacing = STANDARD_SPACING  // 128px grid spacing
    } = options;

    const positions = [];
    for (let i = 0; i < count; i++) {
        positions.push({
            x: snapToTile(startX + i * spacing),
            y: snapToTile(y)
        });
    }

    return positions;
}

/**
 * Calculate positions for elements in a vertical line
 * Uses BML grid positions: Y starts at 0, spacing 128px
 * @param {number} count - Number of elements
 * @param {Object} options - Configuration options
 * @returns {Array<{x: number, y: number}>} Array of positions
 */
function verticalLayout(count, options = {}) {
    const {
        x = 64,                  // BML grid: X starts at 64
        startY = 0,              // BML grid: Y starts at 0
        spacing = STANDARD_SPACING  // 128px grid spacing
    } = options;

    const positions = [];
    for (let i = 0; i < count; i++) {
        positions.push({
            x: snapToTile(x),
            y: snapToTile(startY + i * spacing)
        });
    }

    return positions;
}

// ============================================================================
// Block Position Helpers
// ============================================================================

/**
 * Calculate block position on the block grid
 * Blocks start at (40, 40) and step by 192px
 * @param {number} col - Column index (0-based)
 * @param {number} row - Row index (0-based)
 * @returns {Object} Position {x, y}
 */
function blockPosition(col, row) {
    return {
        x: BLOCK_PADDING + col * BLOCK_STEP,
        y: BLOCK_PADDING + row * BLOCK_STEP
    };
}

/**
 * Calculate block size from grid units
 * Each unit spans one block step (192px), minus the gap (16px)
 * @param {number} cols - Number of columns to span (1 = 176px, 2 = 368px, etc.)
 * @param {number} rows - Number of rows to span
 * @returns {Object} Size {width, height}
 */
function blockSize(cols, rows) {
    return {
        width: cols * BLOCK_STEP - BLOCK_GAP,  // 176, 368, 560, 752...
        height: rows * BLOCK_STEP - BLOCK_GAP
    };
}

/**
 * Calculate icon position inside a block
 * Icons are placed 8px from the block corner, aligned to icon grid (128px spacing)
 * @param {Object} block - Block element or block position
 * @param {number} col - Column within block (0-based)
 * @param {number} row - Row within block (0-based)
 * @returns {Object} Position {x, y}
 */
function iconPositionInBlock(block, col = 0, row = 0) {
    const blockPos = block.position || block;
    return {
        x: blockPos.x + BLOCK_CORNER_INSET + col * STANDARD_SPACING,
        y: blockPos.y + BLOCK_CORNER_INSET + row * STANDARD_SPACING
    };
}

/**
 * Generate socket lists for block edges
 * Sockets are distributed evenly along each edge at ~8px intervals
 * 
 * Based on actual BML block socket counts:
 * - 176px width → 23 top/bottom sockets
 * - 176px height → 21 left/right sockets
 * - 240px width → 31 top/bottom sockets
 * - 304px height → 37 left/right sockets
 * 
 * @param {Object} size - Block size {width, height}
 * @returns {Object} Socket lists for all four sides
 */
function generateBlockSockets(size) {
    const { width, height } = size;
    
    // Horizontal sides (top/bottom): floor(width / 8) + 1
    // 176/8 + 1 = 22 + 1 = 23 ✓
    // 240/8 + 1 = 30 + 1 = 31 ✓
    const horizontalCount = Math.floor(width / TILE_SIDE) + 1;
    
    // Vertical sides (left/right): floor(height / 8) - 1
    // 176/8 - 1 = 22 - 1 = 21 ✓
    // 304/8 - 1 = 38 - 1 = 37 ✓
    const verticalCount = Math.floor(height / TILE_SIDE) - 1;
    
    return {
        topSocketList: generateHexIds(horizontalCount),
        bottomSocketList: generateHexIds(horizontalCount),
        leftSocketList: generateHexIds(verticalCount),
        rightSocketList: generateHexIds(verticalCount)
    };
}

/**
 * Generate anchor position map for block corners and midpoints
 * Anchors are used for connection routing to specific block positions
 * @returns {Object} Anchor position map with hex IDs
 */
function generateBlockAnchors() {
    return {
        topLeft: generateHexId(),
        topMiddle: generateHexId(),
        topRight: generateHexId(),
        right: generateHexId(),
        bottomRight: generateHexId(),
        bottomMiddle: generateHexId(),
        bottomLeft: generateHexId(),
        left: generateHexId()
    };
}

/**
 * Get socket position on a block edge
 * @param {Object} block - Block element
 * @param {string} side - 'top', 'right', 'bottom', 'left'
 * @param {number} index - Socket index (0-based)
 * @returns {Object} Position {x, y}
 */
function getBlockSocketPosition(block, side, index) {
    const { x, y } = block.position;
    const { width, height } = block.size;
    
    // Sockets are spaced 8px apart starting from the edge
    const offset = index * TILE_SIDE;
    
    switch (side) {
        case 'top':
            return { x: x + offset, y: y };
        case 'bottom':
            return { x: x + offset, y: y + height };
        case 'left':
            return { x: x, y: y + offset };
        case 'right':
            return { x: x + width, y: y + offset };
        default:
            return { x: x + width / 2, y: y + height / 2 };
    }
}

// ============================================================================
// Element Factories
// ============================================================================

/**
 * Common stencils reference
 */
const STENCILS = {
    // Application components (uuappcommon)
    server: { stencil: 'uubmlitstuff', icon: 'applicationServer' },
    command: { stencil: 'uuappcommon', icon: 'command' },
    activity: { stencil: 'uuappcommon', icon: 'activity' },
    activityState: { stencil: 'uuappcommon', icon: 'activityState' },
    activityAction: { stencil: 'uuappcommon', icon: 'activityAction' },
    activityCondition: { stencil: 'uuappcommon', icon: 'activityCondition' },
    uusubapp: { stencil: 'uuappcommon', icon: 'uusubapp' },
    document: { stencil: 'uuappcommon', icon: 'document' },
    folder: { stencil: 'uuappcommon', icon: 'folder' },
    folderOpened: { stencil: 'uuappcommon', icon: 'folderopened' },
    folderInterface: { stencil: 'uuappcommon', icon: 'folderInterface' },
    object: { stencil: 'uuappcommon', icon: 'object' },
    objectTemplate: { stencil: 'uuappcommon', icon: 'objectTemplate' },
    role: { stencil: 'uuappcommon', icon: 'role' },
    useCase: { stencil: 'uuappcommon', icon: 'useCase' },
    useCaseObject: { stencil: 'uuappcommon', icon: 'useCaseObject' },
    businessUseCase: { stencil: 'uuappcommon', icon: 'businessUseCase' },
    elementaryActivity: { stencil: 'uuappcommon', icon: 'elementaryActivity' },
    runScript: { stencil: 'uuappcommon', icon: 'runScript' },
    scheduledCommand: { stencil: 'uuappcommon', icon: 'scheduledAsynchronousCommand' },
    userEntrypoint: { stencil: 'uuappcommon', icon: 'userVisualEntrypoint' },
    activityItem: { stencil: 'uuappcommon', icon: 'uuactivityitem' },
    json: { stencil: 'uuappcommon', icon: 'uujson' },
    vote: { stencil: 'uuappcommon', icon: 'vote' },
    uuappBox: { stencil: 'uuappcommon', icon: 'uuappBox' },
    accessRightUnit: { stencil: 'uuappcommon', icon: 'accessRightUnit' },
    accessRights: { stencil: 'uuappcommon', icon: 'accessRights' },
    accessRole: { stencil: 'uuappcommon', icon: 'accessRole' },
    actor: { stencil: 'uuappcommon', icon: 'actor' },
    artifact: { stencil: 'uuappcommon', icon: 'artifact' },
    artifactInterface: { stencil: 'uuappcommon', icon: 'artifactInterface' },
    artifactState: { stencil: 'uuappcommon', icon: 'artifactState' },
    asynchronousCommand: { stencil: 'uuappcommon', icon: 'asynchronousCommand' },
    attachment: { stencil: 'uuappcommon', icon: 'attachment' },
    businessAccessRole: { stencil: 'uuappcommon', icon: 'businessAccessRole' },
    businessGroup: { stencil: 'uuappcommon', icon: 'businessGroup' },
    businessRole: { stencil: 'uuappcommon', icon: 'businessRole' },
    button: { stencil: 'uuappcommon', icon: 'button' },
    chart1ContentComponent: { stencil: 'uuappcommon', icon: 'chart1ContentComponent' },
    chart2ContentComponent: { stencil: 'uuappcommon', icon: 'chart2ContentComponent' },
    controlPanel: { stencil: 'uuappcommon', icon: 'controlPanel' },
    contentComponent: { stencil: 'uuappcommon', icon: 'contentComponent' },
    comment: { stencil: 'uuappcommon', icon: 'comment' },
    doIt: { stencil: 'uuappcommon', icon: 'doIt' },
    decide: { stencil: 'uuappcommon', icon: 'decide' },
    dataTable: { stencil: 'uuappcommon', icon: 'dataTable' },
    dataRow: { stencil: 'uuappcommon', icon: 'dataRow' },
    emailUser: { stencil: 'uuappcommon', icon: 'emailUser' },
    emailGroup: { stencil: 'uuappcommon', icon: 'emailGroup' },
    emailCompany: { stencil: 'uuappcommon', icon: 'emailCompany' },
    emotionContentComponent: { stencil: 'uuappcommon', icon: 'emotionContentComponent' },
    imageContentComponent: { stencil: 'uuappcommon', icon: 'imageContentComponent' },
    help: { stencil: 'uuappcommon', icon: 'help' },
    guideline: { stencil: 'uuappcommon', icon: 'guideline' },
    group: { stencil: 'uuappcommon', icon: 'group' },
    meeting: { stencil: 'uuappcommon', icon: 'meeting' },
    locationContentComponent: { stencil: 'uuappcommon', icon: 'locationContentComponent' },
    lifeCycle: { stencil: 'uuappcommon', icon: 'lifeCycle' },
    interface: { stencil: 'uuappcommon', icon: 'interface' },
    notice: { stencil: 'uuappcommon', icon: 'notice' },
    message: { stencil: 'uuappcommon', icon: 'message' },
    method: { stencil: 'uuappcommon', icon: 'method' },
    process: { stencil: 'uuappcommon', icon: 'process' },
    personalRoleFolder: { stencil: 'uuappcommon', icon: 'personalRoleFolder' },
    task: { stencil: 'uuappcommon', icon: 'task' },
    visualUseCase2: { stencil: 'uuappcommon', icon: 'visualUseCase2' },
    uuxml: { stencil: 'uuappcommon', icon: 'uuxml' },
    uusubappDataStore: { stencil: 'uuappcommon', icon: 'uusubappdatastore' },
    uuIotNode: { stencil: 'uuappcommon', icon: 'uuIotNode' },
    uuappMetaFolder: { stencil: 'uuappcommon', icon: 'uuappMetaFolder' },
    uuappWorkspace: { stencil: 'uuappcommon', icon: 'uuappWorkspace' },
    uuappBinaryStore: { stencil: 'uuappcommon', icon: 'uuappbinarystore' },
    uubinary: { stencil: 'uuappcommon', icon: 'uubinary' },
    uudigitalOperator: { stencil: 'uuappcommon', icon: 'uudigitaloperator' },
    uuee: { stencil: 'uuappcommon', icon: 'uuee' },
    uunode: { stencil: 'uuappcommon', icon: 'uunode' },
    uuobc: { stencil: 'uuappcommon', icon: 'uuobc' },
    uuelc: { stencil: 'uuappcommon', icon: 'uuelc' },
    
    // External products
    product: { stencil: 'uuplus4umall', icon: 'product' },
    
    // Company icons
    plus4u: { stencil: 'uubmlcompanyicons', icon: 'plus4u' },
    
    // Cloud & Infrastructure
    file: { stencil: 'uubinarycontent', icon: 'file' },
    database: { stencil: 'uucloudmongodboperator', icon: 'database' },
    messageBus: { stencil: 'uucloudoperationregistry', icon: 'messageBus' },
    jobBroker: { stencil: 'uuasyncjob', icon: 'jobBroker' },
    asyncQueue: { stencil: 'uuasyncjob', icon: 'queue' },
    asyncCommand: { stencil: 'uuasyncjob', icon: 'command' },
    
    // BookKit
    book: { stencil: 'uubookkit', icon: 'book' },
    page: { stencil: 'uubookkit', icon: 'page' },
    section: { stencil: 'uubookkit', icon: 'section' },
    bookKit: { stencil: 'uubookkit', icon: 'uuBookKit' },
    caption: { stencil: 'uubookkit', icon: 'caption' },
    trash: { stencil: 'uubookkit', icon: 'trash' },
    
    // Other products
    appModelKit: { stencil: 'uuappmodelkit', icon: 'uuAppModelKit' },
    managementKit: { stencil: 'uumanagementkit', icon: 'managementKit' },
    fls: { stencil: 'uufls', icon: 'uuFls' },
    
    // AI
    businessChat: { stencil: 'uuAiChat', icon: 'uuBusinessChat' },
    uuAi: { stencil: 'uuAiChat', icon: 'uuAi' },
    
    // Testing & Time Series
    testcase: { stencil: 'uutestman', icon: 'testcase' },
    tsStore: { stencil: 'uutsstore', icon: 'tsStore' },
    tsType: { stencil: 'uutsmetamodel', icon: 'tsType' },
    tsMetaModel: { stencil: 'uutsmetamodel', icon: 'tsMetaModel' },
    
    // Energy (domain-specific)
    powerStation: { stencil: 'energyicons', icon: 'powerStation' },
    ecpClient: { stencil: 'energyicons', icon: 'ecpClient' },
    ecpNode: { stencil: 'energyicons', icon: 'ecpNode' },
    trader: { stencil: 'energyicons', icon: 'trader' },
    electricity: { stencil: 'energyicons', icon: 'electricity' },
    dsoB: { stencil: 'energyicons', icon: 'dsoB' },
    fuel: { stencil: 'energyicons', icon: 'fuel' },
    lowVoltageLine: { stencil: 'energyicons', icon: 'lowVoltageLine' },
    res: { stencil: 'energyicons', icon: 'res' },
    
    // Enterprise Platform
    enterpriseUuAppPlatform: { stencil: 'enterpriseuuappplatform', icon: 'enterpriseuuappplatform' },
    
    // Geoinformatics
    geoApplicationProcess: { stencil: 'geoinformatics', icon: 'applicationProcess' },
    geoPlace: { stencil: 'geoinformatics', icon: 'place' },
    geoProduct: { stencil: 'geoinformatics', icon: 'product' },
    geoUser: { stencil: 'geoinformatics', icon: 'user' },
    geoUserVisualEntrypoint: { stencil: 'geoinformatics', icon: 'userVisualEntrypoint' },
    geoWebpage: { stencil: 'geoinformatics', icon: 'webpage' },
    geoTablet: { stencil: 'geoinformatics', icon: 'tablet' },
    geoMobilePhone: { stencil: 'geoinformatics', icon: 'mobilePhone' },
    geoDesktop: { stencil: 'geoinformatics', icon: 'desktop' },
    geoCity: { stencil: 'geoinformatics', icon: 'city' },
    geoBuilding: { stencil: 'geoinformatics', icon: 'building' },
    
    // Pipeline
    uuAppPipeline: { stencil: 'uuapppipeline', icon: 'uuAppPipeline' },
    
    // WebKit
    homepage: { stencil: 'uuwebkit', icon: 'homepage' },
    webkitWebpage: { stencil: 'uuwebkit', icon: 'webpage' },
    website: { stencil: 'uuwebkit', icon: 'website' },
    
    // Territory (uuterritory)
    territoryActivity: { stencil: 'uuterritory', icon: 'activity' },
    territoryElementaryActivity: { stencil: 'uuterritory', icon: 'elementaryActivity' },
    territoryElementaryDecide: { stencil: 'uuterritory', icon: 'elementaryDecide' },
    territoryElementaryChat: { stencil: 'uuterritory', icon: 'elementaryChat' },
    territoryInfo: { stencil: 'uuterritory', icon: 'info' },
    territoryUuai: { stencil: 'uuterritory', icon: 'uuai' },
    territoryUuappTypeProfile: { stencil: 'uuterritory', icon: 'uuappTypeProfile' },
    territoryUuartifact: { stencil: 'uuterritory', icon: 'uuartifact' },
    territoryUubusinessAccessRole: { stencil: 'uuterritory', icon: 'uubusinessAccessRole' },
    territoryUugroup: { stencil: 'uuterritory', icon: 'uugroup' },
    territoryUuobject: { stencil: 'uuterritory', icon: 'uuobject' },
    territoryUuunit: { stencil: 'uuterritory', icon: 'uuunit' },
    territoryUuwhiteList: { stencil: 'uuterritory', icon: 'uuwhiteList' },
    territoryUuthing: { stencil: 'uuterritory', icon: 'uuthing' },
    territoryUurole: { stencil: 'uuterritory', icon: 'uurole' },
    territoryUuObjectRoleProfile: { stencil: 'uuterritory', icon: 'uuObjectRoleProfile' },
    territoryUupermission: { stencil: 'uuterritory', icon: 'uupermission' },
    territoryUumyTerritory: { stencil: 'uuterritory', icon: 'uumyTerritory' },
    territoryUuAtcRoleProfile: { stencil: 'uuterritory', icon: 'uuAtcRoleProfile' },
    territoryUuawidee: { stencil: 'uuterritory', icon: 'uuawidee' },
    
    // Cloud Log Store
    log: { stencil: 'uucloudlogstore', icon: 'log' },
    logRecord: { stencil: 'uucloudlogstore', icon: 'logRecord' },
    uuCloudLogstore: { stencil: 'uucloudlogstore', icon: 'uuCloudLogstore' },
    
    // OS Common
    controller: { stencil: 'uuoscommon', icon: 'controller' },
    systemMessage: { stencil: 'uuoscommon', icon: 'systemMessage' },
    uuBusinessClub: { stencil: 'uuoscommon', icon: 'uuBusinessClub' },
    uuclub: { stencil: 'uuoscommon', icon: 'uuclub' },
    uuconsole: { stencil: 'uuoscommon', icon: 'uuconsole' },
    club: { stencil: 'uuoscommon', icon: 'club' },
    
    // Script Engine
    uuScriptEngine: { stencil: 'uuscriptengine', icon: 'uuScriptEngine' },
    
    // Booking Engine
    uuBookingEngine: { stencil: 'uubookingengine', icon: 'uuBookingEngine' },
    
    // Console
    uuConsole: { stencil: 'uuconsole', icon: 'uuConsole' },
    
    // Software Development (uupproductionsoftwaredevelopement)
    swComponent: { stencil: 'uupproductionsoftwaredevelopement', icon: 'component' },
    swFile: { stencil: 'uupproductionsoftwaredevelopement', icon: 'file' },
    nonVisualComponent: { stencil: 'uupproductionsoftwaredevelopement', icon: 'nonVisualComponent' },
    swModule: { stencil: 'uupproductionsoftwaredevelopement', icon: 'module' },
    subsystem: { stencil: 'uupproductionsoftwaredevelopement', icon: 'subsystem' },
    userPolicy: { stencil: 'uupproductionsoftwaredevelopement', icon: 'userPolicy' },
    visualComponent: { stencil: 'uupproductionsoftwaredevelopement', icon: 'visualComponent' },
    swUserVisualEntrypoint: { stencil: 'uupproductionsoftwaredevelopement', icon: 'userVisualEntrypoint' },
    thread: { stencil: 'uupproductionsoftwaredevelopement', icon: 'thread' },
    methodology2: { stencil: 'uupproductionsoftwaredevelopement', icon: 'methodology2' },
    directoryTree: { stencil: 'uupproductionsoftwaredevelopement', icon: 'directoryTree' },
    dataStructure: { stencil: 'uupproductionsoftwaredevelopement', icon: 'dataStructure' },
    browser: { stencil: 'uupproductionsoftwaredevelopement', icon: 'browser' },
    cache: { stencil: 'uupproductionsoftwaredevelopement', icon: 'cache' },
    swDatabase: { stencil: 'uupproductionsoftwaredevelopement', icon: 'database' },
    
    // Transport (uubmltransport)
    airplane: { stencil: 'uubmltransport', icon: 'airplane' },
    bus: { stencil: 'uubmltransport', icon: 'bus' },
    car: { stencil: 'uubmltransport', icon: 'car' },
    offRoad: { stencil: 'uubmltransport', icon: 'offRoad' },
    roadster: { stencil: 'uubmltransport', icon: 'roadster' },
    sailboat: { stencil: 'uubmltransport', icon: 'sailboat' },
    smallMotorBoat: { stencil: 'uubmltransport', icon: 'smallMotorBoat' },
    tanker: { stencil: 'uubmltransport', icon: 'tanker' },
    tractor: { stencil: 'uubmltransport', icon: 'tractor' },
    train: { stencil: 'uubmltransport', icon: 'train' },
    truck: { stencil: 'uubmltransport', icon: 'truck' },
    truckLoaded: { stencil: 'uubmltransport', icon: 'truckLoaded' },
    
    // Electronic stuff (uubmlelectronicstuff)
    antenna: { stencil: 'uubmlelectronicstuff', icon: 'antenna' },
    audio: { stencil: 'uubmlelectronicstuff', icon: 'audio' },
    audioFile: { stencil: 'uubmlelectronicstuff', icon: 'audioFile' },
    camera: { stencil: 'uubmlelectronicstuff', icon: 'camera' },
    camera2: { stencil: 'uubmlelectronicstuff', icon: 'camera2' },
    compass: { stencil: 'uubmlelectronicstuff', icon: 'compass' },
    flashDisc: { stencil: 'uubmlelectronicstuff', icon: 'flashDisc' },
    gps: { stencil: 'uubmlelectronicstuff', icon: 'gps' },
    handycam: { stencil: 'uubmlelectronicstuff', icon: 'handycam' },
    headphones: { stencil: 'uubmlelectronicstuff', icon: 'headphones' },
    microphone: { stencil: 'uubmlelectronicstuff', icon: 'microphone' },
    movie: { stencil: 'uubmlelectronicstuff', icon: 'movie' },
    notebook: { stencil: 'uubmlelectronicstuff', icon: 'notebook' },
    photo: { stencil: 'uubmlelectronicstuff', icon: 'photo' },
    tablet: { stencil: 'uubmlelectronicstuff', icon: 'tablet' },
    television: { stencil: 'uubmlelectronicstuff', icon: 'television' },
    video: { stencil: 'uubmlelectronicstuff', icon: 'video' },
    videoFile: { stencil: 'uubmlelectronicstuff', icon: 'videoFile' },
    
    // Buildings & Equipment (uubmlbuildingsandequipment)
    appliance: { stencil: 'uubmlbuildingsandequipment', icon: 'appliance' },
    building: { stencil: 'uubmlbuildingsandequipment', icon: 'building' },
    city: { stencil: 'uubmlbuildingsandequipment', icon: 'city' },
    hotel: { stencil: 'uubmlbuildingsandequipment', icon: 'hotel' },
    house: { stencil: 'uubmlbuildingsandequipment', icon: 'house' },
    houseAndCar: { stencil: 'uubmlbuildingsandequipment', icon: 'houseAndCar' },
    houseAndSun: { stencil: 'uubmlbuildingsandequipment', icon: 'houseAndSun' },
    restaurant: { stencil: 'uubmlbuildingsandequipment', icon: 'restaurant' },
    key: { stencil: 'uubmlbuildingsandequipment', icon: 'key' },
    machine: { stencil: 'uubmlbuildingsandequipment', icon: 'machine' },
    
    // Office stuff (uubmlofficestuff)
    calendar: { stencil: 'uubmlofficestuff', icon: 'calendar' },
    clipboard: { stencil: 'uubmlofficestuff', icon: 'clipboard' },
    clock: { stencil: 'uubmlofficestuff', icon: 'clock' },
    desktop: { stencil: 'uubmlofficestuff', icon: 'desktop' },
    fax: { stencil: 'uubmlofficestuff', icon: 'fax' },
    officeFile: { stencil: 'uubmlofficestuff', icon: 'file' },
    fileFolder: { stencil: 'uubmlofficestuff', icon: 'fileFolder' },
    ipPhone: { stencil: 'uubmlofficestuff', icon: 'ipPhone' },
    monitor: { stencil: 'uubmlofficestuff', icon: 'monitor' },
    office: { stencil: 'uubmlofficestuff', icon: 'office' },
    printer: { stencil: 'uubmlofficestuff', icon: 'printer' },
    
    // Miscellaneous (uubmlmiscellaneous)
    exclamation: { stencil: 'uubmlmiscellaneous', icon: 'exclamation' },
    infoMisc: { stencil: 'uubmlmiscellaneous', icon: 'info' },
    okMisc: { stencil: 'uubmlmiscellaneous', icon: 'ok' },
    questionMisc: { stencil: 'uubmlmiscellaneous', icon: 'question' },
    stopMisc: { stencil: 'uubmlmiscellaneous', icon: 'stop' },
    universe: { stencil: 'uubmlmiscellaneous', icon: 'universe' },
    
    // ChargeUp / eMobility (uuchargeup)
    aggregator: { stencil: 'uuchargeup', icon: 'aggregator' },
    chargingApp: { stencil: 'uuchargeup', icon: 'application' },
    chargingStation: { stencil: 'uuchargeup', icon: 'chargingStation' },
    evDriver: { stencil: 'uuchargeup', icon: 'evDriver' },
    invoice: { stencil: 'uuchargeup', icon: 'invoice' },
    report: { stencil: 'uuchargeup', icon: 'report' },
    reservation: { stencil: 'uuchargeup', icon: 'reservation' },
    chargingSystem: { stencil: 'uuchargeup', icon: 'system' },
    tariff: { stencil: 'uuchargeup', icon: 'tariff' },
    transaction: { stencil: 'uuchargeup', icon: 'transaction' }
};

/**
 * Create an Icon element
 * Icons are 64x64 pixels and should be positioned on the BML grid
 * X positions: 64 + n*128 (64, 192, 320, 448...)
 * Y positions: n*128 (0, 128, 256, 384...)
 * @param {Object} config - Icon configuration
 * @returns {Object} Icon element
 */
function createIcon(config) {
    const {
        id = generateId('icon'),
        type = 'activityState', // Key from STENCILS or custom {stencil, icon}
        position = { x: 64, y: 0 },  // Default at first grid position
        text = '',
        importance = 'normal',
        textWidth = 128,
        plural = false,
        state = {},
        link = null
    } = config;

    // Resolve stencil
    let stencilConfig;
    if (typeof type === 'string' && STENCILS[type]) {
        stencilConfig = STENCILS[type];
    } else if (typeof type === 'object') {
        stencilConfig = type;
    } else {
        stencilConfig = STENCILS.activityState;
    }

    // Snap position to 8-pixel tile grid for proper alignment
    // Icons should ideally be at multiples of 64 for clean layout, but must be at least multiples of 8
    const snappedPosition = {
        x: snapToGrid(position.x),
        y: snapToGrid(position.y)
    };

    // Generate socket IDs for all sides using random hex IDs (8-9 sockets per side like native BML)
    // Top/bottom have 9 sockets (wider), left/right have 8 sockets
    const topPointList = generateHexIds(9);
    const bottomPointList = generateHexIds(9);
    const leftPointList = generateHexIds(8);
    const rightPointList = generateHexIds(8);

    const icon = {
        id,
        elementType: 'Icon',
        sourceUuBmlStencil: stencilConfig.stencil,
        uuBmlIconCode: stencilConfig.icon,
        position: snappedPosition,
        uuIdentity: null,
        text,
        searchKey: '',
        textHidden: false,
        textWidth,
        importance,
        plural,
        state,
        label: {},
        topPointList,
        rightPointList,
        bottomPointList,
        leftPointList,
        textBackgroundVisible: false,
        pluggedSocketsMap: {}
    };

    // Add link if provided
    if (link) {
        icon.link = {
            type: link.type || 'uu5string',
            link: link.link || '',
            target: link.target || 'modal'
        };
    }

    return icon;
}

/**
 * Create a Block element
 * Blocks are positioned on the block grid (starting at 40,40, step 192px)
 * Standard block size is 176×176 (22×22 tiles)
 * 
 * Block Grid Positioning:
 * - Use blockPosition(col, row) for grid-aligned placement
 * - Use blockSize(cols, rows) for grid-aligned sizing
 * - Blocks have sockets every 8px along edges for connections
 * 
 * @param {Object} config - Block configuration
 * @param {string} config.id - Unique identifier (auto-generated if not provided)
 * @param {Object} config.position - Position {x, y} (default: first grid position at 40,40)
 * @param {Object} config.size - Size {width, height} (default: 176×176)
 * @param {string} config.text - Block title text
 * @param {string} config.textLocation - Text position: 'top', 'bottom', 'left', 'right'
 * @param {string} config.importance - Visual importance level
 * @returns {Object} Block element
 */
function createBlock(config) {
    const {
        id = generateHexId(),
        position = { x: BLOCK_PADDING, y: BLOCK_PADDING },
        size = { width: BLOCK_STANDARD_SIZE, height: BLOCK_STANDARD_SIZE },
        text = '<uu5string/>Block',
        textLocation = 'top',
        importance = 'normal'
    } = config;

    // Snap position and size to 8px tile grid
    const snappedPosition = {
        x: snapToGrid(position.x),
        y: snapToGrid(position.y)
    };
    const snappedSize = {
        width: snapToGrid(size.width),
        height: snapToGrid(size.height)
    };

    // Generate socket lists based on block size
    const sockets = generateBlockSockets(snappedSize);
    
    // Generate anchor positions for corners and midpoints
    const anchors = generateBlockAnchors();

    return {
        id,
        elementType: 'Block',
        searchKey: '',
        size: snappedSize,
        position: snappedPosition,
        importance,
        text,
        textLocation,
        topSocketList: sockets.topSocketList,
        bottomSocketList: sockets.bottomSocketList,
        leftSocketList: sockets.leftSocketList,
        rightSocketList: sockets.rightSocketList,
        anchorPositionMap: anchors,
        pluggedSocketsMap: {}
    };
}

/**
 * Create a Uu5Component element (embedded UU5 content)
 * @param {Object} config - Component configuration
 * @returns {Object} Uu5Component element
 */
function createUu5Component(config) {
    const {
        id = generateId('uu5comp'),
        position = { x: 64, y: 0 },       // Default at first grid position
        size = { width: 256, height: 128 }, // 2x1 grid cells
        text = '<uu5string/><UU5.Bricks.P>Content</UU5.Bricks.P>',
        textLocation = 'top',
        importance = 'normal'
    } = config;

    // Generate socket IDs using hex IDs (more sockets than icons due to larger size)
    const socketCount = Math.max(9, Math.floor(size.width / 16));
    const topSocketList = generateHexIds(socketCount);
    const bottomSocketList = generateHexIds(socketCount);
    const leftSocketList = generateHexIds(8);
    const rightSocketList = generateHexIds(8);

    return {
        id,
        elementType: 'Uu5Component',
        searchKey: '',
        size,
        position: { x: snapToGrid(position.x), y: snapToGrid(position.y) },
        importance,
        text,
        textLocation,
        topSocketList,
        bottomSocketList,
        leftSocketList,
        rightSocketList,
        anchorPositionMap: {
            bottomMiddle: generateHexId(),
            topLeft: generateHexId(),
            topMiddle: generateHexId(),
            topRight: generateHexId(),
            right: generateHexId(),
            bottomRight: generateHexId(),
            bottomLeft: generateHexId(),
            left: generateHexId()
        },
        pluggedSocketsMap: {}
    };
}

/**
 * Create an Annotation element (speech bubble with pointer)
 * Annotations are callout boxes with text that point to other elements.
 * 
 * Pointer sides (orderInPolygon mapping):
 * - 1: top
 * - 2: right
 * - 3: bottom
 * - 4: left
 * 
 * @param {Object} config - Annotation configuration
 * @param {Object} config.position - Position {x, y} of the annotation box
 * @param {Object} config.size - Size {width, height} of the annotation box
 * @param {string} config.text - Text content (UU5 string format)
 * @param {Object} config.targetIcon - Target icon to point to (optional)
 * @param {string} config.pointerSide - Side to start pointer from: 'top', 'right', 'bottom', 'left'
 * @param {string} config.targetSide - Side of target icon to point to (auto-detected if not provided)
 * @returns {Object} Annotation element
 */
function createAnnotation(config) {
    const {
        id = generateId('annot'),
        position = { x: 64, y: 0 },
        size = { width: 200, height: 72 },
        text = '<uu5string/><div>Annotation text</div>',
        targetIcon = null,
        pointerSide = 'right',
        targetSide = null,
        importance = 'normal',
        pointerHidden = false,
        link = null
    } = config;

    // Snap position and size to grid
    const snappedPosition = {
        x: snapToGrid(position.x),
        y: snapToGrid(position.y)
    };
    const snappedSize = {
        width: snapToGrid(size.width),
        height: snapToGrid(size.height)
    };

    // Generate anchor position map
    const anchorPositionMap = {
        topLeft: generateHexId(),
        topMiddle: generateHexId(),
        topRight: generateHexId(),
        right: generateHexId(),
        bottomRight: generateHexId(),
        bottomMiddle: generateHexId(),
        bottomLeft: generateHexId(),
        left: generateHexId()
    };

    // Map side names to orderInPolygon values
    const sideToOrder = {
        top: 1,
        right: 2,
        bottom: 3,
        left: 4
    };

    // Calculate pointer start position (edge of annotation box)
    const getPointerStartPos = (side) => {
        const { x, y } = snappedPosition;
        const { width, height } = snappedSize;
        switch (side) {
            case 'top':
                return { x: x + width / 2, y: y };
            case 'bottom':
                return { x: x + width / 2, y: y + height };
            case 'left':
                return { x: x, y: y + height / 2 };
            case 'right':
            default:
                return { x: x + width, y: y + height / 2 };
        }
    };

    // Build the annotation element
    // NOTE: Annotation does NOT support 'importance' or 'pointerHidden' — these
    // properties are Callout-only. Including them breaks the BML renderer.
    const annotation = {
        id,
        elementType: 'Annotation',
        searchKey: '',
        size: snappedSize,
        position: snappedPosition,
        text,
        pointerStart: {
            positionOnAnnotation: ['bottom', 'left', 'top', 'right'],
            pointList: [],
            orderInPolygon: sideToOrder[pointerSide] || 2
        },
        pointerEnd: {},
        plugMap: {},
        anchorPositionMap
    };

    // Add link if provided
    if (link) {
        annotation.link = {
            type: link.type || 'uu5string',
            link: link.link || '',
            target: link.target || 'modal'
        };
    }

    // Annotation plugs are FREE-FLOATING (only id + position, no elementId/socketId).
    if (targetIcon) {
        const pointerPlugId = generateHexId();

        // Auto-detect which side of the TARGET ICON to anchor to
        const annotCX = snappedPosition.x + snappedSize.width / 2;
        const annotCY = snappedPosition.y + snappedSize.height / 2;
        const iconCX = targetIcon.position.x + 32;
        const iconCY = targetIcon.position.y + 40;
        const dx = annotCX - iconCX;
        const dy = annotCY - iconCY;

        let targetSideActual;
        if (Math.abs(dx) > Math.abs(dy)) {
            targetSideActual = dx > 0 ? 'right' : 'left';
        } else {
            targetSideActual = dy > 0 ? 'bottom' : 'top';
        }

        // Plug position at the TARGET ICON's edge
        const ix = targetIcon.position.x;
        const iy = targetIcon.position.y;
        let plugPos;
        switch (targetSideActual) {
            case 'top':    plugPos = { x: ix + 32, y: iy };       break;
            case 'bottom': plugPos = { x: ix + 32, y: iy + 80 };  break;
            case 'left':   plugPos = { x: ix,      y: iy + 40 };  break;
            case 'right':  plugPos = { x: ix + 64, y: iy + 40 };  break;
        }

        // Pointer base points on the annotation edge
        const { x: ax, y: ay } = snappedPosition;
        const { width: aw, height: ah } = snappedSize;
        const GAP = 8;

        let basePoints;
        switch (pointerSide) {
            case 'top':
                basePoints = [
                    { x: ax + Math.floor(aw / 2) + GAP, y: ay },
                    { x: ax + Math.floor(aw / 2) - GAP, y: ay }
                ];
                break;
            case 'bottom':
                basePoints = [
                    { x: ax + Math.floor(aw / 2) - GAP, y: ay + ah },
                    { x: ax + Math.floor(aw / 2) + GAP, y: ay + ah }
                ];
                break;
            case 'left':
                basePoints = [
                    { x: ax, y: ay + Math.floor(ah / 2) - GAP },
                    { x: ax, y: ay + Math.floor(ah / 2) + GAP }
                ];
                break;
            case 'right':
            default:
                basePoints = [
                    { x: ax + aw, y: ay + Math.floor(ah / 2) + GAP },
                    { x: ax + aw, y: ay + Math.floor(ah / 2) - GAP }
                ];
                break;
        }

        annotation.pointerStart.pointList = basePoints;
        annotation.pointerEnd = { pointType: 'Plug', id: pointerPlugId };
        annotation.plugMap[pointerPlugId] = {
            id: pointerPlugId,
            position: { x: snapToGrid(plugPos.x), y: snapToGrid(plugPos.y) }
        };
    }

    return annotation;
}

/**
 * Create a standalone annotation without pointer (floating callout)
 * Use addAnnotation with targetIcon for connected annotations
 * @param {Object} config - Annotation configuration
 * @returns {Object} Annotation element
 */
function createFloatingAnnotation(config) {
    const {
        id = generateId('annot'),
        position = { x: 64, y: 0 },
        size = { width: 200, height: 72 },
        text = '<uu5string/><div>Annotation text</div>',
        importance = 'normal',
        link = null
    } = config;

    const snappedPosition = {
        x: snapToGrid(position.x),
        y: snapToGrid(position.y)
    };
    const snappedSize = {
        width: snapToGrid(size.width),
        height: snapToGrid(size.height)
    };

    const annotation = {
        id,
        elementType: 'Annotation',
        searchKey: '',
        size: snappedSize,
        position: snappedPosition,
        text,
        pointerStart: {
            positionOnAnnotation: []
        },
        pointerEnd: {},
        plugMap: {},
        anchorPositionMap: {
            topLeft: generateHexId(),
            topMiddle: generateHexId(),
            topRight: generateHexId(),
            right: generateHexId(),
            bottomRight: generateHexId(),
            bottomMiddle: generateHexId(),
            bottomLeft: generateHexId(),
            left: generateHexId()
        }
    };

    // Add link if provided
    if (link) {
        annotation.link = {
            type: link.type || 'uu5string',
            link: link.link || '',
            target: link.target || 'modal'
        };
    }

    return annotation;
}

/**
 * Create a Callout element (speech bubble with pointer and importance-based styling)
 * Callouts are visually distinct from Annotations — they render as colored speech bubbles
 * whose color follows the importance level (highest=red, high=orange, normal=blue, low=gray).
 * 
 * The schema is similar to Annotation but uses:
 * - elementType: "Callout" (not "Annotation")
 * - positionOnCallout (not positionOnAnnotation)
 * - importance directly affects visual appearance
 * 
 * @param {Object} config - Callout configuration
 * @param {Object} config.position - Position {x, y} of the callout box
 * @param {Object} config.size - Size {width, height} of the callout box
 * @param {string} config.text - Text content (UU5 string format)
 * @param {string} config.importance - Visual importance: 'objective'|'highest'|'high'|'normal'|'low'|'problem'
 * @param {Object} config.targetIcon - Target icon to point to (optional)
 * @param {string} config.pointerSide - Side to start pointer from: 'top', 'right', 'bottom', 'left'
 * @param {string} config.targetSide - Side of target icon to point to (auto-detected if not provided)
 * @param {Object} config.link - Optional link {type, link, target}
 * @returns {Object} Callout element
 */
function createCallout(config) {
    const {
        id = generateId('callout'),
        position = { x: 64, y: 0 },
        size = { width: 200, height: 72 },
        text = '<uu5string/>Callout text',
        importance = 'normal',
        targetIcon = null,
        pointerSide = 'right',
        targetSide = null,
        link = null
    } = config;

    // Snap position and size to grid
    const snappedPosition = {
        x: snapToGrid(position.x),
        y: snapToGrid(position.y)
    };
    const snappedSize = {
        width: snapToGrid(size.width),
        height: snapToGrid(size.height)
    };

    // Generate anchor position map
    const anchorPositionMap = {
        topLeft: generateHexId(),
        topMiddle: generateHexId(),
        topRight: generateHexId(),
        right: generateHexId(),
        bottomRight: generateHexId(),
        bottomMiddle: generateHexId(),
        bottomLeft: generateHexId(),
        left: generateHexId()
    };

    // Map side names to orderInPolygon values
    const sideToOrder = {
        top: 1,
        right: 2,
        bottom: 3,
        left: 4
    };

    // Calculate pointer start position (edge of callout box)
    const getPointerStartPos = (side) => {
        const { x, y } = snappedPosition;
        const { width, height } = snappedSize;
        switch (side) {
            case 'top':
                return { x: x + width / 2, y: y };
            case 'bottom':
                return { x: x + width / 2, y: y + height };
            case 'left':
                return { x: x, y: y + height / 2 };
            case 'right':
            default:
                return { x: x + width, y: y + height / 2 };
        }
    };

    // Build the callout element
    const callout = {
        id,
        elementType: 'Callout',
        searchKey: '',
        size: snappedSize,
        position: snappedPosition,
        importance,
        text,
        pointerStart: {
            positionOnCallout: ['bottom', 'left', 'top', 'right'],
            pointList: [],
            orderInPolygon: sideToOrder[pointerSide] || 2
        },
        pointerEnd: null,
        plugMap: {},
        anchorPositionMap
    };

    // Add link if provided
    if (link) {
        callout.link = {
            type: link.type || 'uu5string',
            link: link.link || '',
            target: link.target || 'modal'
        };
    }

    // Create pointer — plugs are FREE-FLOATING (only id + position).
    const pointerPlugId = generateHexId();

    if (targetIcon) {
        // Auto-detect which side of the TARGET ICON to anchor to
        const calloutCX = snappedPosition.x + snappedSize.width / 2;
        const calloutCY = snappedPosition.y + snappedSize.height / 2;
        const iconCX = targetIcon.position.x + 32;
        const iconCY = targetIcon.position.y + 40;
        const dx = calloutCX - iconCX;
        const dy = calloutCY - iconCY;

        // Pick icon side closest to the callout
        let targetSideActual;
        if (Math.abs(dx) > Math.abs(dy)) {
            targetSideActual = dx > 0 ? 'right' : 'left';
        } else {
            targetSideActual = dy > 0 ? 'bottom' : 'top';
        }

        // Calculate plug position at the TARGET ICON's edge (not center!)
        const ix = targetIcon.position.x;
        const iy = targetIcon.position.y;
        let plugPos;
        switch (targetSideActual) {
            case 'top':    plugPos = { x: ix + 32, y: iy };       break;
            case 'bottom': plugPos = { x: ix + 32, y: iy + 80 };  break;
            case 'left':   plugPos = { x: ix,      y: iy + 40 };  break;
            case 'right':  plugPos = { x: ix + 64, y: iy + 40 };  break;
        }

        // Pointer base points on the callout edge
        const { x: cx, y: cy } = snappedPosition;
        const { width: cw, height: ch } = snappedSize;
        const GAP = 8;

        let basePoints;
        switch (pointerSide) {
            case 'top':
                basePoints = [
                    { x: cx + Math.floor(cw / 2) + GAP, y: cy },
                    { x: cx + Math.floor(cw / 2) - GAP, y: cy }
                ];
                break;
            case 'bottom':
                basePoints = [
                    { x: cx + Math.floor(cw / 2) - GAP, y: cy + ch },
                    { x: cx + Math.floor(cw / 2) + GAP, y: cy + ch }
                ];
                break;
            case 'left':
                basePoints = [
                    { x: cx, y: cy + Math.floor(ch / 2) - GAP },
                    { x: cx, y: cy + Math.floor(ch / 2) + GAP }
                ];
                break;
            case 'right':
            default:
                basePoints = [
                    { x: cx + cw, y: cy + Math.floor(ch / 2) + GAP },
                    { x: cx + cw, y: cy + Math.floor(ch / 2) - GAP }
                ];
                break;
        }

        callout.pointerStart.pointList = basePoints;
        callout.pointerEnd = { pointType: 'Plug', id: pointerPlugId };
        callout.plugMap[pointerPlugId] = {
            id: pointerPlugId,
            position: { x: snapToGrid(plugPos.x), y: snapToGrid(plugPos.y) }
        };
    } else {
        // No target — minimal valid pointer structure
        const edgeCenter = getPointerStartPos(pointerSide);
        callout.pointerEnd = { pointType: 'Plug', id: pointerPlugId };
        callout.pointerStart.pointList = [
            { x: snapToGrid(edgeCenter.x - 8), y: snapToGrid(edgeCenter.y) },
            { x: snapToGrid(edgeCenter.x + 8), y: snapToGrid(edgeCenter.y) }
        ];
        callout.plugMap[pointerPlugId] = {
            id: pointerPlugId,
            position: { x: snapToGrid(edgeCenter.x), y: snapToGrid(edgeCenter.y + 32) }
        };
    }

    return callout;
}

/**
 * Create a floating Callout (no pointer) — a colored speech bubble without connection.
 * @param {Object} config - Callout configuration
 * @returns {Object} Callout element
 */
function createFloatingCallout(config) {
    const {
        id = generateId('callout'),
        position = { x: 64, y: 0 },
        size = { width: 200, height: 72 },
        text = '<uu5string/>Callout text',
        importance = 'normal',
        link = null
    } = config;

    const snappedPosition = {
        x: snapToGrid(position.x),
        y: snapToGrid(position.y)
    };
    const snappedSize = {
        width: snapToGrid(size.width),
        height: snapToGrid(size.height)
    };

    // Even floating callouts need a valid pointerEnd with a plug — the BML
    // renderer reads pointerEnd.id unconditionally and crashes on null.
    const pointerPlugId = generateHexId();

    const callout = {
        id,
        elementType: 'Callout',
        searchKey: '',
        size: snappedSize,
        position: snappedPosition,
        importance,
        text,
        pointerStart: {
            positionOnCallout: [],
            pointList: [],
            orderInPolygon: 0
        },
        pointerEnd: {
            pointType: 'Plug',
            id: pointerPlugId
        },
        plugMap: {
            [pointerPlugId]: {
                id: pointerPlugId,
                position: { x: snappedPosition.x + Math.floor(snappedSize.width / 2), y: snappedPosition.y + snappedSize.height }
            }
        },
        anchorPositionMap: {
            topLeft: generateHexId(),
            topMiddle: generateHexId(),
            topRight: generateHexId(),
            right: generateHexId(),
            bottomRight: generateHexId(),
            bottomMiddle: generateHexId(),
            bottomLeft: generateHexId(),
            left: generateHexId()
        }
    };

    if (link) {
        callout.link = {
            type: link.type || 'uu5string',
            link: link.link || '',
            target: link.target || 'modal'
        };
    }

    return callout;
}

/**
 * Create a Starburst element (star-shaped highlight/callout)
 * Starbursts are star-shaped elements used for drawing attention or marking important items.
 * They have configurable spike count and shape.
 * 
 * @param {Object} config - Starburst configuration
 * @param {Object} config.position - Position {x, y}
 * @param {Object} config.size - Size {width, height}
 * @param {string} config.text - Text content (UU5 string format)
 * @param {string} config.importance - Visual importance level
 * @param {number} config.spikesNumber - Number of spikes (default: 12)
 * @param {string} config.spikesShape - Shape of spikes: 'normal', 'rounded' (default: 'normal')
 * @param {Object} config.link - Optional link {type, link, target}
 * @returns {Object} Starburst element
 */
function createStarburst(config) {
    const {
        id = generateId('starburst'),
        position = { x: 64, y: 0 },
        size = { width: 128, height: 128 },
        text = '<uu5string/>!',
        importance = 'highest',
        spikesNumber = 12,
        spikesShape = 'normal',
        link = null
    } = config;

    const snappedPosition = {
        x: snapToGrid(position.x),
        y: snapToGrid(position.y)
    };
    const snappedSize = {
        width: snapToGrid(size.width),
        height: snapToGrid(size.height)
    };

    const starburst = {
        id,
        elementType: 'Starburst',
        searchKey: '',
        size: snappedSize,
        position: snappedPosition,
        importance,
        text,
        spikesNumber,
        spikesShape,
        anchorPositionMap: {
            topLeft: generateHexId(),
            topMiddle: generateHexId(),
            topRight: generateHexId(),
            right: generateHexId(),
            bottomRight: generateHexId(),
            bottomMiddle: generateHexId(),
            bottomLeft: generateHexId(),
            left: generateHexId()
        }
    };

    if (link) {
        starburst.link = {
            type: link.type || 'uu5string',
            link: link.link || '',
            target: link.target || 'modal'
        };
    }

    return starburst;
}

// ============================================================================
// Connection Helpers
// ============================================================================

/**
 * Relation Types
 * Define the visual style of connection endpoints (arrows, diamonds, etc.)
 * 
 * Usage patterns:
 * - 'general': Standard arrow (→). Use for: method calls, data flow, general dependencies
 * - 'association1': Association with "1" multiplicity (◇—1). Use for: parent-child, containment
 * - 'associationN': Association with "N" multiplicity. Use for: one-to-many relationships
 * - 'aggregation1': Aggregation (hollow diamond ◇). Use for: "has-a" relationships
 * - 'aggregationN': Aggregation with N multiplicity
 * - 'composition1': Composition (filled diamond ◆). Use for: strong ownership
 * - 'compositionN': Composition with N multiplicity  
 * - 'inheritance': Inheritance arrow (△). Use for: extends/implements
 */
const RELATION_TYPES = {
    general: 'general',
    association1: 'association1',
    associationN: 'associationN',
    aggregation1: 'aggregation1',
    aggregationN: 'aggregationN',
    composition1: 'composition1',
    compositionN: 'compositionN',
    inheritance: 'inheritance'
};

/**
 * Pointer Types
 * Define what appears at each end of a connector
 * 
 * - null: No decoration (plain line end)
 * - 'general': Standard arrow pointer (→)
 * - 'one': Multiplicity "1" marker
 * - 'association': Association diamond marker (◇)
 * - 'aggregation': Aggregation hollow diamond (◇)
 * - 'composition': Composition filled diamond (◆)
 * - 'inheritance': Inheritance triangle (△)
 */
const POINTER_TYPES = {
    none: null,
    general: 'general',
    one: 'one',
    association: 'association',
    aggregation: 'aggregation',
    composition: 'composition',
    inheritance: 'inheritance'
};

/**
 * Line Styles
 * 
 * - 'solid': Continuous line. Use for: direct relationships, standard connections
 * - 'dashed': Dashed line (- - -). Use for: indirect/skip relationships, optional paths
 * - 'dotted': Dotted line (···). Use for: weak dependencies, references
 */
const LINE_STYLES = {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted'
};

/**
 * Predefined connection presets for common diagram patterns
 * These combine relationType, lineStyle, and pointer settings
 */
const CONNECTION_PRESETS = {
    // General arrow (→): standard dependency, method call
    arrow: {
        relationType: 'general',
        lineStyle: 'solid',
        startPointer: null,
        endPointer: 'general'
    },
    // Association (◇—1): parent-child, containment
    association: {
        relationType: 'association1',
        lineStyle: 'solid',
        startPointer: 'one',
        endPointer: 'association'
    },
    // Skip/indirect association (dashed): components between
    skip: {
        relationType: 'association1',
        lineStyle: 'dashed',
        startPointer: 'one',
        endPointer: 'association'
    },
    // Aggregation (has-a): hollow diamond
    aggregation: {
        relationType: 'aggregation1',
        lineStyle: 'solid',
        startPointer: null,
        endPointer: 'aggregation'
    },
    // Composition (owns): filled diamond
    composition: {
        relationType: 'composition1',
        lineStyle: 'solid',
        startPointer: null,
        endPointer: 'composition'
    },
    // Inheritance (extends): triangle
    inheritance: {
        relationType: 'inheritance',
        lineStyle: 'solid',
        startPointer: null,
        endPointer: 'inheritance'
    },
    // Dashed general arrow: optional/conditional
    optional: {
        relationType: 'general',
        lineStyle: 'dashed',
        startPointer: null,
        endPointer: 'general'
    },
    // Dotted line: weak reference
    reference: {
        relationType: 'general',
        lineStyle: 'dotted',
        startPointer: null,
        endPointer: 'general'
    },
    // Plain line (no arrows): neutral connection
    line: {
        relationType: 'general',
        lineStyle: 'solid',
        startPointer: null,
        endPointer: null
    }
};

/**
 * Icon dimensions (standard BML icon size)
 */
const ICON_SIZE = 64;

/**
 * Padding around icons for collision detection
 * Connectors should not pass within this distance of icon edges
 */
const ICON_COLLISION_PADDING = 16;

/**
 * Spacing to route around obstacles
 */
const ROUTE_AROUND_SPACING = 24;

/**
 * BML Socket Position Offsets
 * These values determine where connectors visually attach to icons.
 * Icons are 64x64 pixels but connectors attach at specific offsets
 * that account for the icon's visual center and label space.
 * 
 * All values are multiples of 8 (tile boundaries).
 */
const SOCKET_OFFSET_HORIZONTAL_CENTER = 32;  // x offset for top/bottom sockets (icon center)
const SOCKET_OFFSET_LEFT_RIGHT_Y = 40;       // y offset for left/right sockets (visual center)
const SOCKET_OFFSET_BOTTOM_Y = 80;           // y offset for bottom socket (accounts for label space)

// ============================================================================
// Collision Detection and Obstacle-Aware Routing
// ============================================================================

/**
 * Get the bounding box of an icon including padding for connectors
 * @param {Object} icon - Icon element
 * @param {number} padding - Extra padding around icon
 * @returns {Object} Bounding box {minX, minY, maxX, maxY}
 */
function getIconBounds(icon, padding = ICON_COLLISION_PADDING) {
    const x = snapToGrid(icon.position.x);
    const y = snapToGrid(icon.position.y);
    return {
        minX: x - padding,
        minY: y - padding,
        maxX: x + ICON_SIZE + padding,
        maxY: y + ICON_SIZE + SOCKET_OFFSET_BOTTOM_Y - ICON_SIZE + padding  // Account for label space
    };
}

/**
 * Check if a point is inside an icon's bounding box
 * @param {Object} point - Point {x, y}
 * @param {Object} bounds - Bounding box from getIconBounds
 * @returns {boolean} True if point is inside bounds
 */
function pointInBounds(point, bounds) {
    return point.x > bounds.minX && point.x < bounds.maxX &&
           point.y > bounds.minY && point.y < bounds.maxY;
}

/**
 * Check if a line segment intersects with a bounding box
 * Uses a simplified approach checking if the line passes through the rectangle
 * @param {Object} p1 - Start point {x, y}
 * @param {Object} p2 - End point {x, y}
 * @param {Object} bounds - Bounding box {minX, minY, maxX, maxY}
 * @returns {boolean} True if line intersects bounds
 */
function lineIntersectsBounds(p1, p2, bounds) {
    // Check if either endpoint is inside
    if (pointInBounds(p1, bounds) || pointInBounds(p2, bounds)) {
        return true;
    }
    
    // Check if line is entirely outside on any axis
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    
    if (maxX < bounds.minX || minX > bounds.maxX ||
        maxY < bounds.minY || minY > bounds.maxY) {
        return false;
    }
    
    // For orthogonal lines (which is what we use), check intersection more precisely
    // Horizontal line
    if (p1.y === p2.y) {
        return p1.y > bounds.minY && p1.y < bounds.maxY &&
               minX < bounds.maxX && maxX > bounds.minX;
    }
    // Vertical line
    if (p1.x === p2.x) {
        return p1.x > bounds.minX && p1.x < bounds.maxX &&
               minY < bounds.maxY && maxY > bounds.minY;
    }
    
    // For diagonal lines (used in component hierarchy diagrams)
    // Use simple bounding box overlap
    return !(maxX < bounds.minX || minX > bounds.maxX ||
             maxY < bounds.minY || minY > bounds.maxY);
}

/**
 * Check if a connector path would collide with any icons
 * @param {Array<Object>} path - Array of points forming the path
 * @param {Array<Object>} icons - Array of icon elements to check against
 * @param {Set<string>} excludeIds - Icon IDs to exclude (source and target)
 * @returns {Object|null} First icon that would be hit, or null if path is clear
 */
function findPathCollision(path, icons, excludeIds = new Set()) {
    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        
        for (const icon of icons) {
            if (excludeIds.has(icon.id)) continue;
            if (icon.elementType !== 'Icon') continue;
            
            const bounds = getIconBounds(icon);
            if (lineIntersectsBounds(p1, p2, bounds)) {
                return icon;
            }
        }
    }
    return null;
}

/**
 * Calculate a route around an obstacle icon
 * @param {Object} fromPos - Start position
 * @param {Object} toPos - End position  
 * @param {Object} obstacle - Icon to route around
 * @param {string} fromSide - Exit side from source
 * @param {string} toSide - Entry side to target
 * @returns {Array<Object>} Array of middle points for routing around obstacle
 */
function routeAroundObstacle(fromPos, toPos, obstacle, fromSide, toSide) {
    const bounds = getIconBounds(obstacle, ROUTE_AROUND_SPACING);
    const middlePoints = [];
    
    // Determine best way to go around the obstacle
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    // Determine if we should go around left/right or top/bottom
    const goHorizontal = Math.abs(fromPos.y - toPos.y) < Math.abs(fromPos.x - toPos.x);
    
    if (goHorizontal) {
        // Route around top or bottom
        const goTop = fromPos.y < centerY && toPos.y < centerY;
        const routeY = goTop ? bounds.minY : bounds.maxY;
        
        if (fromSide === 'right' || fromSide === 'left') {
            // Horizontal exit: go to obstacle edge Y, then across, then to target
            middlePoints.push({ x: fromPos.x, y: snapToGrid(routeY) });
            middlePoints.push({ x: toPos.x, y: snapToGrid(routeY) });
        } else {
            // Vertical exit: go down/up, around, then to target
            const exitX = fromPos.x < centerX ? bounds.minX : bounds.maxX;
            middlePoints.push({ x: snapToGrid(exitX), y: fromPos.y });
            middlePoints.push({ x: snapToGrid(exitX), y: snapToGrid(routeY) });
            middlePoints.push({ x: toPos.x, y: snapToGrid(routeY) });
        }
    } else {
        // Route around left or right
        const goLeft = fromPos.x < centerX && toPos.x < centerX;
        const routeX = goLeft ? bounds.minX : bounds.maxX;
        
        if (fromSide === 'top' || fromSide === 'bottom') {
            // Vertical exit: go to obstacle edge X, then down/up, then to target
            middlePoints.push({ x: snapToGrid(routeX), y: fromPos.y });
            middlePoints.push({ x: snapToGrid(routeX), y: toPos.y });
        } else {
            // Horizontal exit: go across, around, then to target
            const exitY = fromPos.y < centerY ? bounds.minY : bounds.maxY;
            middlePoints.push({ x: fromPos.x, y: snapToGrid(exitY) });
            middlePoints.push({ x: snapToGrid(routeX), y: snapToGrid(exitY) });
            middlePoints.push({ x: snapToGrid(routeX), y: toPos.y });
        }
    }
    
    return middlePoints.map(p => ({ x: snapToGrid(p.x), y: snapToGrid(p.y) }));
}

/**
 * Get available socket index based on which sockets are already in use
 * @param {Object} icon - Icon element
 * @param {string} side - Side of icon ('top', 'right', 'bottom', 'left')
 * @param {number} preferredIndex - Preferred socket index
 * @returns {number} Best available socket index
 */
function getAvailableSocketIndex(icon, side, preferredIndex = 4) {
    const sideToList = {
        top: 'topPointList',
        right: 'rightPointList',
        bottom: 'bottomPointList',
        left: 'leftPointList'
    };
    
    const pointList = icon[sideToList[side]];
    const pluggedMap = icon.pluggedSocketsMap || {};
    
    // Check if preferred index is available
    const preferredSocket = pointList[preferredIndex];
    if (!pluggedMap[preferredSocket] || pluggedMap[preferredSocket].length === 0) {
        return preferredIndex;
    }
    
    // Find nearest available socket
    const maxIndex = pointList.length - 1;
    for (let offset = 1; offset <= maxIndex; offset++) {
        // Try lower index
        const lowerIdx = preferredIndex - offset;
        if (lowerIdx >= 0) {
            const lowerSocket = pointList[lowerIdx];
            if (!pluggedMap[lowerSocket] || pluggedMap[lowerSocket].length === 0) {
                return lowerIdx;
            }
        }
        // Try higher index
        const higherIdx = preferredIndex + offset;
        if (higherIdx <= maxIndex) {
            const higherSocket = pointList[higherIdx];
            if (!pluggedMap[higherSocket] || pluggedMap[higherSocket].length === 0) {
                return higherIdx;
            }
        }
    }
    
    // All sockets used, return preferred anyway
    return preferredIndex;
}

/**
 * Get socket position with specific index offset (for spreading connections)
 * @param {Object} icon - Icon element
 * @param {string} side - Side of icon
 * @param {number} index - Socket index (0-8 for top/bottom, 0-7 for left/right)
 * @returns {Object} Position {x, y}
 */
function getSocketPositionAtIndex(icon, side, index) {
    const x = snapToGrid(icon.position.x);
    const y = snapToGrid(icon.position.y);
    
    // Calculate offset based on index
    // Sockets are spaced evenly across the icon edge
    const topBottomSpacing = ICON_SIZE / 8;  // ~8px per socket for 9 sockets
    const leftRightSpacing = ICON_SIZE / 7;  // ~9px per socket for 8 sockets
    
    switch (side) {
        case 'top':
            return { 
                x: snapToGrid(x + index * topBottomSpacing), 
                y: y 
            };
        case 'bottom':
            return { 
                x: snapToGrid(x + index * topBottomSpacing), 
                y: y + SOCKET_OFFSET_BOTTOM_Y 
            };
        case 'left':
            return { 
                x: x, 
                y: snapToGrid(y + index * leftRightSpacing) 
            };
        case 'right':
            return { 
                x: x + ICON_SIZE, 
                y: snapToGrid(y + index * leftRightSpacing) 
            };
        default:
            return { x: x + SOCKET_OFFSET_HORIZONTAL_CENTER, y: y + SOCKET_OFFSET_LEFT_RIGHT_Y };
    }
}

/**
 * Get the position where a connector attaches to an icon's socket.
 * Icons are 64x64 pixels. Socket positions MUST be on 8-pixel grid.
 * 
 * BML socket attachment positions (all multiples of 8):
 * - Top: x + 32 (horizontal center), y (icon top edge)
 * - Bottom: x + 32 (horizontal center), y + 80 (below icon + label)
 * - Left: x (icon left edge), y + 40 (visual center)
 * - Right: x + 64 (icon right edge), y + 40 (visual center)
 * 
 * @param {Object} icon - Icon element
 * @param {string} side - 'top', 'right', 'bottom', 'left'
 * @param {number} index - Socket index (not used, kept for API compatibility)
 * @returns {Object} Position {x, y} - always grid-aligned (multiples of 8)
 */
function getSocketPosition(icon, side, index = 2) {
    // Icon positions should already be grid-aligned, but ensure it
    const x = snapToGrid(icon.position.x);
    const y = snapToGrid(icon.position.y);
    
    // All offsets are multiples of 8 to maintain grid alignment
    switch (side) {
        case 'top':
            return { x: x + SOCKET_OFFSET_HORIZONTAL_CENTER, y: y };
        case 'bottom':
            return { x: x + SOCKET_OFFSET_HORIZONTAL_CENTER, y: y + SOCKET_OFFSET_BOTTOM_Y };
        case 'left':
            return { x: x, y: y + SOCKET_OFFSET_LEFT_RIGHT_Y };
        case 'right':
            return { x: x + ICON_SIZE, y: y + SOCKET_OFFSET_LEFT_RIGHT_Y };
        default:
            return { x: x + SOCKET_OFFSET_HORIZONTAL_CENTER, y: y + SOCKET_OFFSET_LEFT_RIGHT_Y };
    }
}

/**
 * Get the correct socket index for a given side (0-based)
 * Uses middle socket for centered connections
 * - Top/bottom have 9 sockets: middle is index 4
 * - Left/right have 8 sockets: middle is index 3 or 4
 * 
 * @param {string} side - 'top', 'right', 'bottom', 'left'
 * @returns {number} Socket index (0-based)
 */
function getSocketIndex(side) {
    // For top/bottom (9 sockets): middle is index 4
    // For left/right (8 sockets): middle is index 4 (visual center)
    if (side === 'left' || side === 'right') {
        return 4; // Middle of 8 sockets
    }
    return 4; // Middle of 9 sockets
}

/**
 * Determine the best connection sides and create routing between two icons.
 * 
 * Routing modes:
 * - Orthogonal (default): All segments are strictly horizontal or vertical.
 *   Breakpoints form L-shaped or S-shaped routes. Routes around obstacles.
 * - Diagonal (opt-in via `diagonal: true`): Direct straight line from socket to socket.
 *   No breakpoints. This is standard in official uuBml component hierarchy diagrams
 *   where children connect from their top-center to the parent's bottom-center.
 * 
 * @param {Object} fromIcon - Source icon element
 * @param {Object} toIcon - Target icon element
 * @param {Array<Object>} allIcons - All icons for collision detection (optional, orthogonal only)
 * @param {Object} routingOptions - Routing options
 * @param {boolean} routingOptions.diagonal - Use direct diagonal line (no breakpoints)
 * @returns {Object} Connection info with sockets, positions, and breakpoints
 */
function determineConnectionPoints(fromIcon, toIcon, allIcons = [], routingOptions = {}) {
    // Ensure icon positions are grid-aligned
    const fx = snapToGrid(fromIcon.position.x) + 32; // Icon center X
    const fy = snapToGrid(fromIcon.position.y) + 32; // Icon center Y
    const tx = snapToGrid(toIcon.position.x) + 32;
    const ty = snapToGrid(toIcon.position.y) + 32;

    const dx = tx - fx;
    const dy = ty - fy;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let fromSide, toSide;

    // Allow forced sides (e.g., fromSide:'right', toSide:'right' for C-shaped feedback loops)
    if (routingOptions.fromSide && routingOptions.toSide) {
        fromSide = routingOptions.fromSide;
        toSide = routingOptions.toSide;
    } else {
        // Determine optimal connection sides based on relative positions.
        // VERTICAL BIAS: For near-diagonal connections (angle > ~33° from horizontal),
        // prefer vertical routing. Vertical-first routes are cleaner because their
        // horizontal breakpoint segments land between rows (empty space), whereas
        // horizontal-first routes create S-shapes that cut through occupied icon rows.
        // Threshold: use vertical when absDy >= 0.65 * absDx (angle >= ~33°).
        const VERTICAL_BIAS = 0.65;
        
        if (absDx === 0) {
            if (dy > 0) { fromSide = 'bottom'; toSide = 'top'; }
            else { fromSide = 'top'; toSide = 'bottom'; }
        } else if (absDy === 0) {
            if (dx > 0) { fromSide = 'right'; toSide = 'left'; }
            else { fromSide = 'left'; toSide = 'right'; }
        } else if (absDy >= absDx * VERTICAL_BIAS) {
            if (dy > 0) { fromSide = 'bottom'; toSide = 'top'; }
            else { fromSide = 'top'; toSide = 'bottom'; }
        } else {
            if (dx > 0) { fromSide = 'right'; toSide = 'left'; }
            else { fromSide = 'left'; toSide = 'right'; }
        }
    }

    // Get available socket indices (avoiding already used sockets)
    const preferredFromIndex = getSocketIndex(fromSide);
    const preferredToIndex = getSocketIndex(toSide);
    const fromSocketIndex = getAvailableSocketIndex(fromIcon, fromSide, preferredFromIndex);
    const toSocketIndex = getAvailableSocketIndex(toIcon, toSide, preferredToIndex);

    // Get socket positions with specific index
    const fromPos = getSocketPositionAtIndex(fromIcon, fromSide, fromSocketIndex);
    const toPos = getSocketPositionAtIndex(toIcon, toSide, toSocketIndex);

    // Diagonal mode: direct line with no breakpoints (standard for component hierarchies)
    if (routingOptions.diagonal) {
        const sideToList = {
            top: 'topPointList',
            right: 'rightPointList',
            bottom: 'bottomPointList',
            left: 'leftPointList'
        };
        return {
            fromSocket: fromIcon[sideToList[fromSide]][fromSocketIndex],
            toSocket: toIcon[sideToList[toSide]][toSocketIndex],
            fromSide,
            toSide,
            fromSocketIndex,
            toSocketIndex,
            fromPosition: fromPos,
            toPosition: toPos,
            middlePoints: []
        };
    }

    // Orthogonal mode: breakpoints for strict horizontal/vertical routing
    let middlePoints = [];

    const isHorizontalExit = (fromSide === 'right' || fromSide === 'left');
    const isVerticalExit = (fromSide === 'top' || fromSide === 'bottom');
    const isHorizontalEntry = (toSide === 'right' || toSide === 'left');
    const isVerticalEntry = (toSide === 'top' || toSide === 'bottom');

    // Same-side routing: C-shaped path that routes OUTSIDE both icons.
    // Used for feedback loops (e.g., fromSide:'right', toSide:'right')
    const SAME_SIDE_OFFSET = 48; // Offset beyond the outermost socket
    
    if (fromSide === toSide) {
        // Same-side: route out, across, and back in
        if (fromSide === 'right') {
            const routeX = snapToGrid(Math.max(fromPos.x, toPos.x) + SAME_SIDE_OFFSET);
            middlePoints = [
                { x: routeX, y: fromPos.y },
                { x: routeX, y: toPos.y }
            ];
        } else if (fromSide === 'left') {
            const routeX = snapToGrid(Math.min(fromPos.x, toPos.x) - SAME_SIDE_OFFSET);
            middlePoints = [
                { x: routeX, y: fromPos.y },
                { x: routeX, y: toPos.y }
            ];
        } else if (fromSide === 'bottom') {
            const routeY = snapToGrid(Math.max(fromPos.y, toPos.y) + SAME_SIDE_OFFSET);
            middlePoints = [
                { x: fromPos.x, y: routeY },
                { x: toPos.x, y: routeY }
            ];
        } else if (fromSide === 'top') {
            const routeY = snapToGrid(Math.min(fromPos.y, toPos.y) - SAME_SIDE_OFFSET);
            middlePoints = [
                { x: fromPos.x, y: routeY },
                { x: toPos.x, y: routeY }
            ];
        }

    } else if (isHorizontalExit && isHorizontalEntry) {
        // H -> H (opposing): S-shaped route (H -> V -> H)
        if (fromPos.y !== toPos.y) {
            const midX = snapToGrid((fromPos.x + toPos.x) / 2);
            middlePoints = [
                { x: midX, y: fromPos.y },
                { x: midX, y: toPos.y }
            ];
        }
        
    } else if (isVerticalExit && isVerticalEntry) {
        // V -> V (opposing): S-shaped route (V -> H -> V)
        if (fromPos.x !== toPos.x) {
            const midY = snapToGrid((fromPos.y + toPos.y) / 2);
            middlePoints = [
                { x: fromPos.x, y: midY },
                { x: toPos.x, y: midY }
            ];
        }
        
    } else if (isHorizontalExit && isVerticalEntry) {
        // H -> V: L-shaped route
        middlePoints = [
            { x: toPos.x, y: fromPos.y }
        ];
        
    } else if (isVerticalExit && isHorizontalEntry) {
        // V -> H: L-shaped route
        middlePoints = [
            { x: fromPos.x, y: toPos.y }
        ];
    }

    // Ensure all breakpoints are strictly grid-aligned
    middlePoints = middlePoints.map(p => ({
        x: snapToGrid(p.x),
        y: snapToGrid(p.y)
    }));

    // Check for collisions with other icons and adjust route if needed
    if (allIcons.length > 0) {
        const excludeIds = new Set([fromIcon.id, toIcon.id]);
        const fullPath = [fromPos, ...middlePoints, toPos];
        
        let collision = findPathCollision(fullPath, allIcons, excludeIds);
        let attempts = 0;
        const maxAttempts = 5; // Prevent infinite loops
        
        while (collision && attempts < maxAttempts) {
            // Route around the obstacle
            const adjustedMiddlePoints = routeAroundObstacle(
                fromPos, toPos, collision, fromSide, toSide
            );
            
            if (adjustedMiddlePoints.length > 0) {
                middlePoints = adjustedMiddlePoints;
            }
            
            // Check if new route still has collisions
            const newPath = [fromPos, ...middlePoints, toPos];
            collision = findPathCollision(newPath, allIcons, excludeIds);
            attempts++;
        }
    }

    // Get socket IDs from the point lists
    const sideToList = {
        top: 'topPointList',
        right: 'rightPointList',
        bottom: 'bottomPointList',
        left: 'leftPointList'
    };

    const fromSocket = fromIcon[sideToList[fromSide]][fromSocketIndex];
    const toSocket = toIcon[sideToList[toSide]][toSocketIndex];

    return {
        fromSocket,
        toSocket,
        fromSide,
        toSide,
        fromSocketIndex,
        toSocketIndex,
        fromPosition: fromPos,
        toPosition: toPos,
        middlePoints
    };
}

/**
 * Create a Connector between two icons.
 * All positions are guaranteed to be on the 8-pixel grid.
 * 
 * Routing:
 * - Default (orthogonal): strict horizontal/vertical segments with collision-aware routing.
 * - `diagonal: true`: direct straight line (no breakpoints). Standard for component
 *   hierarchy diagrams where children connect to parent with straight lines.
 * 
 * Connection Types (use `preset` for common patterns):
 * - 'arrow': Standard arrow (→) - default
 * - 'association': Parent-child with multiplicity (◇—1)
 * - 'skip': Dashed association for indirect relationships
 * - 'aggregation': Has-a relationship (hollow diamond)
 * - 'composition': Owns relationship (filled diamond)
 * - 'inheritance': Extends/implements (triangle)
 * - 'optional': Dashed arrow for optional paths
 * - 'reference': Dotted line for weak references
 * - 'line': Plain line without arrows
 * 
 * @param {Object} fromIcon - Source icon element
 * @param {Object} toIcon - Target icon element
 * @param {Object} options - Connector options
 * @param {string} options.preset - Connection preset name (see CONNECTION_PRESETS)
 * @param {string} options.label - Text label to display on the connector
 * @param {number} options.labelPosition - Position of label along connector (1, 2, 3, etc.)
 * @param {string} options.lineStyle - Line style: 'solid', 'dashed', 'dotted'
 * @param {string} options.relationType - Relation type: 'general', 'association1', etc.
 * @param {string|null} options.startPointer - Start point decoration: null, 'one', 'general', etc.
 * @param {string|null} options.endPointer - End point decoration: null, 'general', 'association', etc.
 * @param {boolean} options.diagonal - Use direct diagonal line instead of orthogonal routing
 * @param {Array<Object>} options.allIcons - All icons for collision detection (orthogonal only)
 * @returns {Object} Connector element
 */
function createConnector(fromIcon, toIcon, options = {}) {
    const {
        id = generateId('conn'),
        importance = 'normal',
        preset,
        lineStyle: explicitLineStyle,
        relationType: explicitRelationType,
        startPointer: explicitStartPointer,
        endPointer: explicitEndPointer,
        label = null,
        labelPosition = null,
        diagonal = false,
        allIcons = [],
        fromSide: forcedFromSide,
        toSide: forcedToSide
    } = options;

    // Apply preset if specified, then allow explicit overrides.
    // Structural relationType without preset: use pointer defaults matching UuBml conventions.
    // Convention: connect(child/part, parent/owner) — symbol at endPoint (parent), multiplicity at startPoint.
    // "*1" variants: startPointer='one'; "*N" variants: startPointer=null (N rendered by relationType).
    const STRUCTURAL_POINTER_DEFAULTS = {
        composition1:  { lineStyle: 'solid', startPointer: 'one', endPointer: 'composition' },
        compositionN:  { lineStyle: 'solid', startPointer: null, endPointer: 'composition' },
        aggregation1:  { lineStyle: 'solid', startPointer: 'one', endPointer: 'aggregation' },
        aggregationN:  { lineStyle: 'solid', startPointer: null, endPointer: 'aggregation' },
        association1:  { lineStyle: 'solid', startPointer: 'one', endPointer: 'association' },
        associationN:  { lineStyle: 'solid', startPointer: null, endPointer: 'association' },
        inheritance:   { lineStyle: 'solid', startPointer: null, endPointer: 'inheritance' }
    };
    const presetConfig = preset && CONNECTION_PRESETS[preset]
        ? CONNECTION_PRESETS[preset]
        : (explicitRelationType && STRUCTURAL_POINTER_DEFAULTS[explicitRelationType]
            ? STRUCTURAL_POINTER_DEFAULTS[explicitRelationType]
            : CONNECTION_PRESETS.arrow);
    
    const lineStyle = explicitLineStyle !== undefined ? explicitLineStyle : presetConfig.lineStyle;
    const relationType = explicitRelationType !== undefined ? explicitRelationType : presetConfig.relationType;
    const startPointer = explicitStartPointer !== undefined ? explicitStartPointer : presetConfig.startPointer;
    const endPointer = explicitEndPointer !== undefined ? explicitEndPointer : presetConfig.endPointer;

    const conn = determineConnectionPoints(fromIcon, toIcon, allIcons, { diagonal, fromSide: forcedFromSide, toSide: forcedToSide });
    const plugA = `${id}_pa`;
    const plugB = `${id}_pb`;

    // Ensure all positions are grid-aligned (defensive - should already be aligned)
    const fromPosition = {
        x: snapToGrid(conn.fromPosition.x),
        y: snapToGrid(conn.fromPosition.y)
    };
    const toPosition = {
        x: snapToGrid(conn.toPosition.x),
        y: snapToGrid(conn.toPosition.y)
    };

    // Create socket map for middle points (breakpoints) using hex IDs
    // All breakpoints must be grid-aligned
    const socketMap = {};
    const middlePointList = [];
    
    conn.middlePoints.forEach((point, index) => {
        const socketId = generateHexId();
        const snappedPoint = {
            x: snapToGrid(point.x),
            y: snapToGrid(point.y)
        };
        socketMap[socketId] = {
            id: socketId,
            position: snappedPoint,
            plugList: []
        };
        middlePointList.push(socketId);
    });

    // Update pluggedSocketsMap on icons (optional - for tracking)
    if (!fromIcon.pluggedSocketsMap[conn.fromSocket]) {
        fromIcon.pluggedSocketsMap[conn.fromSocket] = [];
    }
    fromIcon.pluggedSocketsMap[conn.fromSocket].push({ elementId: id, plugId: plugA });

    if (!toIcon.pluggedSocketsMap[conn.toSocket]) {
        toIcon.pluggedSocketsMap[conn.toSocket] = [];
    }
    toIcon.pluggedSocketsMap[conn.toSocket].push({ elementId: id, plugId: plugB });

    return {
        id,
        elementType: 'Connector',
        searchKey: '',
        plugMap: {
            [plugA]: {
                id: plugA,
                position: fromPosition,  // Use grid-snapped position
                elementId: fromIcon.id,
                socketId: conn.fromSocket
            },
            [plugB]: {
                id: plugB,
                position: toPosition,  // Use grid-snapped position
                elementId: toIcon.id,
                socketId: conn.toSocket
            }
        },
        socketMap,
        middlePointList,
        importance,
        lineStyle,
        relationType,
        startPoint: { pointType: 'Plug', id: plugA, pointer: startPointer },
        endPoint: { pointType: 'Plug', id: plugB, pointer: endPointer },
        label,
        labelPosition
    };
}

/**
 * Create a MultiConnector for fan-out/fan-in patterns (one source to multiple targets)
 * 
 * MultiConnector creates a branching connection from one icon to multiple icons.
 * The connector uses an anchor point where the lines branch.
 * 
 * Direction determines the primary axis:
 * - 'vertical': Source above/below targets, lines branch horizontally
 * - 'horizontal': Source left/right of targets, lines branch vertically
 * 
 * Connection Types (use `preset` for common patterns):
 * - 'arrow': Standard arrows to all targets
 * - 'association': Parent-child with multiplicity (for component hierarchies)
 * - 'skip': Dashed association for indirect relationships
 * 
 * @param {Object} fromIcon - Source icon element
 * @param {Array<Object>} toIcons - Target icon elements
 * @param {Object} options - MultiConnector options
 * @param {string} options.preset - Connection preset name (see CONNECTION_PRESETS)
 * @param {string} options.direction - 'vertical' or 'horizontal' (default: auto-detected)
 * @param {boolean} options.inverted - Reverse arrow direction (default: false)
 * @param {boolean} options.bidirectional - Arrows on both ends (default: false)
 * @param {string} options.lineStyle - Line style: 'solid', 'dashed', 'dotted'
 * @param {string} options.relationType - Relation type: 'general', 'association1', etc.
 * @param {string|null} options.startPointer - Start point decoration
 * @param {string|null} options.endPointer - End point decoration (applied to all endpoints)
 * @returns {Object} MultiConnector element
 */
function createMultiConnector(fromIcon, toIcons, options = {}) {
    const {
        id = generateId('mconn'),
        importance = 'normal',
        preset,
        lineStyle: explicitLineStyle,
        relationType: explicitRelationType,
        startPointer: explicitStartPointer,
        endPointer: explicitEndPointer,
        direction: explicitDirection,
        inverted = false,
        bidirectional = false,
        labels = []
    } = options;

    // Apply preset if specified, then allow explicit overrides.
    // Structural relationType without preset: use pointer defaults matching UuBml conventions.
    const STRUCTURAL_POINTER_DEFAULTS = {
        composition1:  { lineStyle: 'solid', startPointer: 'one', endPointer: 'composition' },
        compositionN:  { lineStyle: 'solid', startPointer: null, endPointer: 'composition' },
        aggregation1:  { lineStyle: 'solid', startPointer: 'one', endPointer: 'aggregation' },
        aggregationN:  { lineStyle: 'solid', startPointer: null, endPointer: 'aggregation' },
        association1:  { lineStyle: 'solid', startPointer: 'one', endPointer: 'association' },
        associationN:  { lineStyle: 'solid', startPointer: null, endPointer: 'association' },
        inheritance:   { lineStyle: 'solid', startPointer: null, endPointer: 'inheritance' }
    };
    const presetConfig = preset && CONNECTION_PRESETS[preset]
        ? CONNECTION_PRESETS[preset]
        : (explicitRelationType && STRUCTURAL_POINTER_DEFAULTS[explicitRelationType]
            ? STRUCTURAL_POINTER_DEFAULTS[explicitRelationType]
            : CONNECTION_PRESETS.arrow);
    
    const lineStyle = explicitLineStyle !== undefined ? explicitLineStyle : presetConfig.lineStyle;
    const relationType = explicitRelationType !== undefined ? explicitRelationType : presetConfig.relationType;
    const startPointer = explicitStartPointer !== undefined ? explicitStartPointer : presetConfig.startPointer;
    const endPointer = explicitEndPointer !== undefined ? explicitEndPointer : presetConfig.endPointer;

    // Calculate positions for auto-detecting direction
    const fromX = snapToGrid(fromIcon.position.x) + 32; // Icon center
    const fromY = snapToGrid(fromIcon.position.y) + 32;
    const avgTargetX = toIcons.reduce((sum, icon) => sum + snapToGrid(icon.position.x) + 32, 0) / toIcons.length;
    const avgTargetY = toIcons.reduce((sum, icon) => sum + snapToGrid(icon.position.y) + 32, 0) / toIcons.length;
    
    const dx = avgTargetX - fromX;
    const dy = avgTargetY - fromY;
    
    // Auto-detect direction based on relative positions.
    // Vertical bias: prefer vertical when angle >= ~33° from horizontal (same
    // threshold as single-connector routing in determineConnectionPoints).
    // 'vertical' = source above/below targets (branching on horizontal axis)
    // 'horizontal' = source left/right of targets (branching on vertical axis)
    const VERTICAL_BIAS = 0.65;
    const direction = explicitDirection || (Math.abs(dy) >= Math.abs(dx) * VERTICAL_BIAS ? 'vertical' : 'horizontal');
    
    // Determine connection sides based on direction and positions
    let fromSide, toSide;
    if (direction === 'vertical') {
        fromSide = dy > 0 ? 'bottom' : 'top';
        toSide = dy > 0 ? 'top' : 'bottom';
    } else {
        fromSide = dx > 0 ? 'right' : 'left';
        toSide = dx > 0 ? 'left' : 'right';
    }

    // Get socket list name for the side
    const sideToList = {
        top: 'topPointList',
        right: 'rightPointList',
        bottom: 'bottomPointList',
        left: 'leftPointList'
    };

    // Get source socket (use middle socket)
    const fromSocketIndex = getSocketIndex(fromSide);
    const fromSocketId = fromIcon[sideToList[fromSide]][fromSocketIndex];
    const fromPos = getSocketPositionAtIndex(fromIcon, fromSide, fromSocketIndex);
    const startPlugId = generateHexId();

    // Snap source position to grid
    const snappedFromPos = {
        x: snapToGrid(fromPos.x),
        y: snapToGrid(fromPos.y)
    };

    // Create plug for source icon
    const plugMap = {
        [startPlugId]: {
            id: startPlugId,
            position: snappedFromPos,
            elementId: fromIcon.id,
            socketId: fromSocketId
        }
    };

    // Update source icon's pluggedSocketsMap
    if (!fromIcon.pluggedSocketsMap[fromSocketId]) {
        fromIcon.pluggedSocketsMap[fromSocketId] = [];
    }
    fromIcon.pluggedSocketsMap[fromSocketId].push({ elementId: id, plugId: startPlugId });

    // Create plugs for all target icons
    const endPointList = toIcons.map((toIcon, index) => {
        // Socket selection strategy:
        // - If this is the ONLY connector on this side → use CENTER socket
        // - If the icon ALREADY has connectors on this side → push to the EDGE
        //   toward the hub icon, maximizing gap between sockets.
        //   (First connector gets center; second gets pushed to the edge on the hub side)
        const sidePointList = toIcon[sideToList[toSide]];
        const pluggedMap = toIcon.pluggedSocketsMap || {};
        const hasExistingOnSide = sidePointList.some(socketId =>
            pluggedMap[socketId] && pluggedMap[socketId].length > 0
        );
        
        let preferredSocketIndex;
        if (hasExistingOnSide) {
            // Multiple connectors on same side: push to EDGE toward hub
            // This maximizes the gap from existing center socket
            const hubCenterX = snapToGrid(fromIcon.position.x) + 32;
            const hubCenterY = snapToGrid(fromIcon.position.y) + 32;
            const toIconCenterX = snapToGrid(toIcon.position.x) + 32;
            const toIconCenterY = snapToGrid(toIcon.position.y) + 32;
            
            if (direction === 'vertical') {
                // Top/bottom sockets (0-8): push to edge on hub side
                const dx = hubCenterX - toIconCenterX;
                preferredSocketIndex = dx >= 0 ? 8 : 0;
            } else {
                // Left/right sockets (0-7): push to edge on hub side
                const dy = hubCenterY - toIconCenterY;
                preferredSocketIndex = dy >= 0 ? 7 : 0;
            }
        } else {
            // Single connector on this side: use center socket
            preferredSocketIndex = getSocketIndex(toSide);
        }
        
        const toSocketIndex = getAvailableSocketIndex(toIcon, toSide, preferredSocketIndex);
        const toSocketId = toIcon[sideToList[toSide]][toSocketIndex];
        const toPos = getSocketPositionAtIndex(toIcon, toSide, toSocketIndex);
        const plugId = generateHexId();
        
        // Snap target position to grid
        const snappedToPos = {
            x: snapToGrid(toPos.x),
            y: snapToGrid(toPos.y)
        };
        
        plugMap[plugId] = {
            id: plugId,
            position: snappedToPos,
            elementId: toIcon.id,
            socketId: toSocketId
        };

        // Update target icon's pluggedSocketsMap
        if (!toIcon.pluggedSocketsMap[toSocketId]) {
            toIcon.pluggedSocketsMap[toSocketId] = [];
        }
        toIcon.pluggedSocketsMap[toSocketId].push({ elementId: id, plugId: plugId });

        return {
            pointType: 'Plug',
            id: plugId,
            label: labels[index] || '',
            pointer: inverted ? startPointer : endPointer
        };
    });

    // Calculate anchor position (branching point)
    // For vertical: anchor is between source Y and closest target Y, at midpoint X of targets
    // For horizontal: anchor is between source X and closest target X, at midpoint Y of targets
    const anchorId = generateHexId();
    let anchorX, anchorY;

    if (direction === 'vertical') {
        // Vertical: branch point between source and targets on Y axis
        const targetYs = toIcons.map(i => snapToGrid(i.position.y) + (toSide === 'top' ? 0 : 80));
        const closestTargetY = dy > 0 ? Math.min(...targetYs) : Math.max(...targetYs);
        anchorY = snapToGrid((snappedFromPos.y + closestTargetY) / 2);
        // X position at midpoint of target range
        const targetXs = toIcons.map(i => snapToGrid(i.position.x) + 32);
        anchorX = snapToGrid((Math.min(...targetXs) + Math.max(...targetXs)) / 2);
    } else {
        // Horizontal: branch point between source and targets on X axis
        const targetXs = toIcons.map(i => snapToGrid(i.position.x) + (toSide === 'left' ? 0 : 64));
        const closestTargetX = dx > 0 ? Math.min(...targetXs) : Math.max(...targetXs);
        anchorX = snapToGrid((snappedFromPos.x + closestTargetX) / 2);
        // Y position at midpoint of target range
        const targetYs = toIcons.map(i => snapToGrid(i.position.y) + 40);
        anchorY = snapToGrid((Math.min(...targetYs) + Math.max(...targetYs)) / 2);
    }

    return {
        id,
        elementType: 'MultiConnector',
        plugMap,
        socketMap: {},
        anchorMap: {
            [anchorId]: {
                id: anchorId,
                positionOnMultiConnector: direction,
                position: { x: anchorX, y: anchorY }
            }
        },
        importance,
        direction,
        bidirectional,
        inverted,
        lineStyle,
        searchKey: '',
        relationType,
        startPoint: {
            pointType: 'Plug',
            id: startPlugId,
            pointer: inverted ? endPointer : startPointer
        },
        endPointList
    };
}

/**
 * Connect icons in a chain (A → B → C → ...)
 * @param {Array<Object>} icons - Array of icon elements
 * @param {Object} options - Connector options
 * @returns {Array<Object>} Array of connector elements
 */
function connectChain(icons, options = {}) {
    const connectors = [];
    for (let i = 0; i < icons.length - 1; i++) {
        connectors.push(createConnector(icons[i], icons[i + 1], options));
    }
    return connectors;
}

/**
 * Connect icons in a cycle (A → B → C → ... → A)
 * @param {Array<Object>} icons - Array of icon elements
 * @param {Object} options - Connector options
 * @returns {Array<Object>} Array of connector elements
 */
function connectCycle(icons, options = {}) {
    const connectors = connectChain(icons, options);
    // Connect last to first
    connectors.push(createConnector(icons[icons.length - 1], icons[0], options));
    return connectors;
}

/**
 * Connect one icon to multiple icons (fan-out) using individual connectors
 * @param {Object} fromIcon - Source icon
 * @param {Array<Object>} toIcons - Target icons
 * @param {Object} options - Connector options
 * @returns {Array<Object>} Array of connector elements
 */
function connectFanOut(fromIcon, toIcons, options = {}) {
    return toIcons.map(toIcon => createConnector(fromIcon, toIcon, options));
}

/**
 * Connect one icon to multiple icons (fan-out) using MultiConnector
 * Creates cleaner one-to-many connections with a single branching element
 * @param {Object} fromIcon - Source icon
 * @param {Array<Object>} toIcons - Target icons
 * @param {Object} options - MultiConnector options
 * @returns {Object} MultiConnector element
 */
function connectFanOutMulti(fromIcon, toIcons, options = {}) {
    return createMultiConnector(fromIcon, toIcons, options);
}

/**
 * Connect multiple icons to one icon (fan-in) using MultiConnector
 * Creates a many-to-one connection with inverted arrow direction
 * @param {Array<Object>} fromIcons - Source icons
 * @param {Object} toIcon - Target icon
 * @param {Object} options - MultiConnector options
 * @returns {Object} MultiConnector element
 */
function connectFanInMulti(fromIcons, toIcon, options = {}) {
    // For fan-in, we create the MultiConnector from target to sources with inverted=true
    return createMultiConnector(toIcon, fromIcons, { ...options, inverted: true });
}

// ============================================================================
// Content Bounds and Auto-Fit Helpers
// ============================================================================

/**
 * Create an empty bounds structure.
 * @returns {Object} Bounds object
 */
function createEmptyBounds() {
    return {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY
    };
}

/**
 * Check if bounds contain any points.
 * @param {Object} bounds - Bounds object
 * @returns {boolean} True if bounds are valid
 */
function hasValidBounds(bounds) {
    return Number.isFinite(bounds.minX) &&
        Number.isFinite(bounds.minY) &&
        Number.isFinite(bounds.maxX) &&
        Number.isFinite(bounds.maxY);
}

/**
 * Expand bounds with a point.
 * @param {Object} bounds - Bounds object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function addPointToBounds(bounds, x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
}

/**
 * Expand bounds with a rectangle.
 * @param {Object} bounds - Bounds object
 * @param {number} x - Left coordinate
 * @param {number} y - Top coordinate
 * @param {number} width - Width
 * @param {number} height - Height
 */
function addRectToBounds(bounds, x, y, width, height) {
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    addPointToBounds(bounds, x, y);
    addPointToBounds(bounds, x + width, y + height);
}

/**
 * Recursively collect all coordinate-like points (objects with numeric x/y).
 * @param {*} value - Any value
 * @param {Object} bounds - Bounds accumulator
 */
function collectCoordinatePoints(value, bounds) {
    if (!value) return;

    if (Array.isArray(value)) {
        value.forEach((entry) => collectCoordinatePoints(entry, bounds));
        return;
    }

    if (typeof value !== "object") return;

    if (typeof value.x === "number" && typeof value.y === "number") {
        addPointToBounds(bounds, value.x, value.y);
    }

    Object.values(value).forEach((entry) => collectCoordinatePoints(entry, bounds));
}

/**
 * Add a single diagram element bounds into the accumulator.
 * @param {Object} element - Diagram element
 * @param {Object} bounds - Bounds accumulator
 */
function collectElementBounds(element, bounds) {
    if (!element || typeof element !== "object") return;

    // Include all explicit point coordinates (plugs, sockets, anchors, pointers).
    collectCoordinatePoints(element, bounds);

    // Include element rectangular extents where available.
    if (element.position && element.size) {
        addRectToBounds(
            bounds,
            element.position.x,
            element.position.y,
            element.size.width,
            element.size.height
        );
    }

    if (element.elementType === "Icon" && element.position) {
        const x = element.position.x;
        const y = element.position.y;
        const textWidth = Number.isFinite(element.textWidth) ? element.textWidth : 128;

        // Icon shape + connector attachment area.
        addRectToBounds(bounds, x, y, ICON_SIZE, SOCKET_OFFSET_BOTTOM_Y);

        // Label area below icon (roughly 2 lines max, enough for most generated labels).
        const labelX = x + SOCKET_OFFSET_HORIZONTAL_CENTER - textWidth / 2;
        const labelY = y + SOCKET_OFFSET_BOTTOM_Y;
        addRectToBounds(bounds, labelX, labelY, textWidth, 48);
    }

    if (element.elementType === "Block" && element.position && element.size) {
        // Keep room for block caption and border stroke.
        addRectToBounds(
            bounds,
            element.position.x - 8,
            element.position.y - 24,
            element.size.width + 16,
            element.size.height + 32
        );
    }
}

/**
 * Calculate content bounds of all elements.
 * @param {Object<string, Object>} elementMap - Diagram element map
 * @param {Object} fallbackSize - Size used if no elements exist
 * @returns {Object} Bounds {minX, minY, maxX, maxY}
 */
function calculateContentBounds(elementMap, fallbackSize = { width: 2048, height: 2048 }) {
    const bounds = createEmptyBounds();

    Object.values(elementMap || {}).forEach((element) => collectElementBounds(element, bounds));

    if (!hasValidBounds(bounds)) {
        return {
            minX: 0,
            minY: 0,
            maxX: fallbackSize.width,
            maxY: fallbackSize.height
        };
    }

    return bounds;
}

/**
 * Shift all coordinate-like points in place.
 * @param {*} value - Any value
 * @param {number} dx - X offset
 * @param {number} dy - Y offset
 */
function shiftCoordinatesInPlace(value, dx, dy) {
    if (!value) return;

    if (Array.isArray(value)) {
        value.forEach((entry) => shiftCoordinatesInPlace(entry, dx, dy));
        return;
    }

    if (typeof value !== "object") return;

    if (typeof value.x === "number" && typeof value.y === "number") {
        value.x = snapToGrid(value.x + dx);
        value.y = snapToGrid(value.y + dy);
    }

    Object.values(value).forEach((entry) => shiftCoordinatesInPlace(entry, dx, dy));
}

/**
 * Create a fitted snapshot of elementMap and diagram size.
 * Crops excessive whitespace and keeps a consistent outer padding.
 *
 * @param {Object<string, Object>} elementMap - Original element map
 * @param {Object} currentSize - Current diagram size {width, height}
 * @param {Object} options - Fit options
 * @returns {Object} { elementMap, size }
 */
function fitDiagramContent(elementMap, currentSize, options = {}) {
    const {
        padding = 64,
        minWidth = 768,
        minHeight = 512,
        maxWidth = 2048,
        maxHeight = 2048
    } = options;

    const clonedElements = JSON.parse(JSON.stringify(elementMap || {}));
    const initialBounds = calculateContentBounds(clonedElements, currentSize);

    const shiftX = snapToGrid(padding - initialBounds.minX);
    const shiftY = snapToGrid(padding - initialBounds.minY);

    Object.values(clonedElements).forEach((element) => {
        shiftCoordinatesInPlace(element, shiftX, shiftY);
    });

    const fittedBounds = calculateContentBounds(clonedElements, currentSize);
    const normalizedMinWidth = snapToGrid(minWidth);
    const normalizedMinHeight = snapToGrid(minHeight);
    const normalizedMaxWidth = Number.isFinite(maxWidth) ? snapToGrid(maxWidth) : Number.POSITIVE_INFINITY;
    const normalizedMaxHeight = Number.isFinite(maxHeight) ? snapToGrid(maxHeight) : Number.POSITIVE_INFINITY;

    let width = snapToGrid(fittedBounds.maxX + padding);
    let height = snapToGrid(fittedBounds.maxY + padding);

    width = Math.max(normalizedMinWidth, width);
    height = Math.max(normalizedMinHeight, height);
    width = Math.min(normalizedMaxWidth, width);
    height = Math.min(normalizedMaxHeight, height);

    return {
        elementMap: clonedElements,
        size: { width, height }
    };
}

// ============================================================================
// Diagram Builder
// ============================================================================

/**
 * BML Diagram Builder class
 * Provides a fluent API for building diagrams
 */
class DiagramBuilder {
    constructor(options = {}) {
        if (options.resetIds) {
            resetIdCounter();
        }

        this.options = {
            id: options.id || generateId('diagram'),
            author: options.author || '15-0000-1',
            width: options.width || 2048,
            height: options.height || 2048,
            autoFit: options.autoFit || false,
            fitOptions: options.fitOptions ? { ...options.fitOptions } : {}
        };
        this.elements = {};
        this.zOrder = [];
    }

    /**
     * Enable auto-fit mode with optional configuration.
     * @param {Object} options - Auto-fit options
     * @returns {DiagramBuilder} Builder instance
     */
    fitToContent(options = {}) {
        this.options.autoFit = true;
        this.options.fitOptions = { ...this.options.fitOptions, ...options };
        return this;
    }

    /**
     * Toggle auto-fit mode.
     * @param {boolean} enabled - Enable or disable auto-fit
     * @param {Object} options - Optional fit options to merge
     * @returns {DiagramBuilder} Builder instance
     */
    setAutoFit(enabled = true, options = {}) {
        this.options.autoFit = Boolean(enabled);
        if (options && typeof options === "object") {
            this.options.fitOptions = { ...this.options.fitOptions, ...options };
        }
        return this;
    }

    /**
     * Add an icon to the diagram.
     * If textWidth is not provided, it is auto-calculated from the text length.
     * @param {Object} config - Icon configuration
     * @returns {Object} The created icon element
     */
    addIcon(config) {
        // Auto-calculate textWidth from text if not explicitly provided
        if (config.text && config.textWidth === undefined) {
            config = { ...config, textWidth: Math.max(96, Math.ceil(config.text.length * 7.5)) };
        }
        const icon = createIcon(config);
        this.elements[icon.id] = icon;
        this.zOrder.push(icon.id);
        return icon;
    }

    /**
     * Add a text label icon — a low-importance icon optimized for readable text.
     * Uses 'document' type by default (neutral rectangular shape, less visually noisy
     * than activityCondition diamonds). Auto-calculates textWidth.
     *
     * @param {Object} config - Label configuration
     * @param {string} config.text - Label text (required)
     * @param {Object} config.position - Position {x, y}
     * @param {string} [config.type='document'] - Icon type (document, activityCondition, etc.)
     * @param {string} [config.importance='low'] - Visual importance
     * @returns {Object} The created icon element
     */
    addLabel(config) {
        const {
            text,
            position,
            type = 'document',
            importance = 'low',
            ...rest
        } = config;
        return this.addIcon({
            text,
            position,
            type,
            importance,
            textWidth: Math.max(96, Math.ceil(text.length * 7.5)),
            ...rest
        });
    }

    /**
     * Add a horizontal lane (swim lane) — a labeled block row containing icons.
     *
     * Creates a Block with a title, then centers the strategy icons horizontally
     * inside the block. Optionally adds a question label on the left and a
     * result label on the right.
     *
     * Icon centering: icons are distributed evenly across the block width,
     * with 2-column (256px) spacing between them, centered in the available space.
     *
     * @param {Object} config - Lane configuration
     * @param {string} config.title - Block title (e.g., "Level 1: Workspace Authorization")
     * @param {number} config.row - Grid row for the lane top edge (each row = 128px)
     * @param {string} [config.question] - Question label for the left side
     * @param {string} [config.result] - Result label for the right side
     * @param {Array<Object>} [config.items] - Icons to place inside the lane
     *   Each item: { text, type, importance } — positioned automatically
     * @param {Object} [config.blockOptions] - Extra block options (width, height, x, importance)
     * @returns {Object} { block, questionLabel, resultLabel, icons: [...] }
     */
    addLane(config) {
        const {
            title,
            row,
            question,
            result,
            items = [],
            blockOptions = {}
        } = config;

        const laneY = row * STANDARD_SPACING;
        const blockHeight = blockOptions.height || 192;
        const blockWidth = blockOptions.width || 1400;
        const blockX = blockOptions.x || 80;
        const iconSpacing = blockOptions.iconSpacing || (STANDARD_SPACING * 2); // 256px between icons

        // Create the block
        const block = this.addBlock({
            position: { x: blockX, y: laneY },
            size: { width: blockWidth, height: blockHeight },
            text: `<uu5string/>${title}`,
            importance: blockOptions.importance || 'normal'
        });

        const iconY = laneY + Math.floor(blockHeight / 2) - 32;

        // Center items in the block: calculate total span and offset
        const itemCount = items.length;
        const totalItemSpan = (itemCount - 1) * iconSpacing; // distance from first to last icon center
        const centerX = blockX + Math.floor(blockWidth / 2);
        const firstIconX = snapToGrid(centerX - Math.floor(totalItemSpan / 2));

        // Add content icons — centered in the block
        const icons = items.map((item, i) => {
            const iconX = snapToGrid(firstIconX + i * iconSpacing);
            return this.addIcon({
                text: item.text,
                type: item.type || 'activityState',
                importance: item.importance || 'high',
                position: { x: iconX, y: iconY },
                ...(item.textWidth ? { textWidth: item.textWidth } : {})
            });
        });

        // Add question label on the left (inside the block, left-aligned)
        let questionLabel = null;
        if (question) {
            questionLabel = this.addLabel({
                text: question,
                position: { x: blockX + 16, y: iconY },
                type: 'help',
                importance: 'low'
            });
        }

        // Add result label on the right (inside the block, right-aligned)
        let resultLabel = null;
        if (result) {
            const tw = Math.max(96, Math.ceil(result.length * 7.5));
            resultLabel = this.addLabel({
                text: result,
                position: { x: blockX + blockWidth - tw - 40, y: iconY },
                type: 'activityState',
                importance: 'low'
            });
        }

        return { block, questionLabel, resultLabel, icons };
    }

    /**
     * Add multiple icons with automatic layout
     * @param {Array<Object>} configs - Array of icon configurations (without positions)
     * @param {string} layout - Layout type: 'circle', 'grid', 'horizontal', 'vertical'
     * @param {Object} layoutOptions - Layout options
     * @returns {Array<Object>} Array of created icon elements
     */
    addIcons(configs, layout = 'horizontal', layoutOptions = {}) {
        let positions;
        switch (layout) {
            case 'circle':
                positions = circleLayout(configs.length, layoutOptions);
                break;
            case 'grid':
                positions = gridLayout(configs.length, layoutOptions);
                break;
            case 'vertical':
                positions = verticalLayout(configs.length, layoutOptions);
                break;
            case 'horizontal':
            default:
                positions = horizontalLayout(configs.length, layoutOptions);
        }

        return configs.map((config, i) => {
            return this.addIcon({ ...config, position: positions[i] });
        });
    }

    /**
     * Add a block to the diagram
     * @param {Object} config - Block configuration
     * @returns {Object} The created block element
     */
    addBlock(config) {
        const block = createBlock(config);
        this.elements[block.id] = block;
        // Blocks should be at the bottom of z-order
        this.zOrder.unshift(block.id);
        return block;
    }

    /**
     * Add a Uu5Component to the diagram (embedded UU5 content)
     * @param {Object} config - Component configuration
     * @returns {Object} The created Uu5Component element
     */
    addUu5Component(config) {
        const component = createUu5Component(config);
        this.elements[component.id] = component;
        this.zOrder.push(component.id);
        return component;
    }

    /**
     * Add an Annotation (speech bubble/callout) to the diagram
     * Annotations are text boxes with optional pointers to other elements.
     * 
     * @param {Object} config - Annotation configuration
     * @param {Object} config.position - Position {x, y} of the annotation
     * @param {Object} config.size - Size {width, height} of the annotation box
     * @param {string} config.text - Text content (UU5 string format)
     * @param {Object} config.targetIcon - Target icon to point to (optional)
     * @param {string} config.pointerSide - Side to start pointer: 'top', 'right', 'bottom', 'left'
     * @returns {Object} The created Annotation element
     * 
     * @example
     * // Annotation pointing to an icon
     * const icon = builder.addIcon({ type: 'command', position: {x: 192, y: 128} });
     * builder.addAnnotation({
     *     position: { x: 300, y: 100 },
     *     size: { width: 200, height: 72 },
     *     text: '<uu5string/><div>This command handles user requests</div>',
     *     targetIcon: icon,
     *     pointerSide: 'left'
     * });
     */
    addAnnotation(config) {
        const annotation = createAnnotation(config);
        this.elements[annotation.id] = annotation;
        // Annotations should be near the top of z-order (above icons, below connectors)
        this.zOrder.push(annotation.id);
        return annotation;
    }

    /**
     * Add a floating annotation (no pointer) to the diagram
     * Use for labels or notes that don't point to specific elements.
     * 
     * @param {Object} config - Annotation configuration
     * @param {Object} config.position - Position {x, y}
     * @param {Object} config.size - Size {width, height}
     * @param {string} config.text - Text content (UU5 string format)
     * @returns {Object} The created Annotation element
     */
    addFloatingAnnotation(config) {
        const annotation = createFloatingAnnotation(config);
        this.elements[annotation.id] = annotation;
        this.zOrder.push(annotation.id);
        return annotation;
    }

    /**
     * Add a Callout (colored speech bubble) to the diagram.
     * Callouts are visually styled by importance (highest=red, high=orange, normal=blue, low=gray).
     * They render as rounded speech bubbles with optional pointers to target icons.
     * 
     * @param {Object} config - Callout configuration
     * @param {Object} config.position - Position {x, y} of the callout
     * @param {Object} config.size - Size {width, height} of the callout box
     * @param {string} config.text - Text content (UU5 string format)
     * @param {string} config.importance - Visual importance: 'objective'|'highest'|'high'|'normal'|'low'|'problem'
     * @param {Object} config.targetIcon - Target icon to point to (optional)
     * @param {string} config.pointerSide - Side to start pointer: 'top', 'right', 'bottom', 'left'
     * @param {Object} config.link - Optional clickable link {type, link, target}
     * @returns {Object} The created Callout element
     * 
     * @example
     * // Callout pointing to an icon
     * const icon = builder.addIcon({ type: 'command', position: {x: 192, y: 128} });
     * builder.addCallout({
     *     position: { x: 350, y: 100 },
     *     size: { width: 200, height: 80 },
     *     text: '<uu5string/>This explains the command',
     *     importance: 'normal',
     *     targetIcon: icon,
     *     pointerSide: 'left'
     * });
     */
    addCallout(config) {
        const callout = createCallout(config);
        this.elements[callout.id] = callout;
        // Callouts should be near the top of z-order (above icons)
        this.zOrder.push(callout.id);
        return callout;
    }

    /**
     * Add a floating callout (no pointer) to the diagram.
     * Use for standalone colored text boxes without connections.
     * 
     * @param {Object} config - Callout configuration
     * @param {Object} config.position - Position {x, y}
     * @param {Object} config.size - Size {width, height}
     * @param {string} config.text - Text content
     * @param {string} config.importance - Visual importance level
     * @returns {Object} The created Callout element
     */
    addFloatingCallout(config) {
        const callout = createFloatingCallout(config);
        this.elements[callout.id] = callout;
        this.zOrder.push(callout.id);
        return callout;
    }

    /**
     * Add a Starburst (star-shaped highlight) to the diagram.
     * Starbursts are attention-grabbing star shapes for marking important items,
     * new features, warnings, or any content that needs visual emphasis.
     * 
     * @param {Object} config - Starburst configuration
     * @param {Object} config.position - Position {x, y}
     * @param {Object} config.size - Size {width, height} (default: 128x128)
     * @param {string} config.text - Text content
     * @param {string} config.importance - Visual importance level (default: 'highest')
     * @param {number} config.spikesNumber - Number of spikes (default: 12)
     * @param {string} config.spikesShape - 'normal' or 'rounded' (default: 'normal')
     * @returns {Object} The created Starburst element
     * 
     * @example
     * builder.addStarburst({
     *     position: { x: 192, y: 128 },
     *     size: { width: 128, height: 128 },
     *     text: '<uu5string/>NEW!',
     *     importance: 'highest',
     *     spikesNumber: 12
     * });
     */
    addStarburst(config) {
        const starburst = createStarburst(config);
        this.elements[starburst.id] = starburst;
        this.zOrder.push(starburst.id);
        return starburst;
    }

    /**
     * Get all icon elements from the diagram
     * @returns {Array<Object>} Array of icon elements
     */
    getAllIcons() {
        return Object.values(this.elements).filter(el => el.elementType === 'Icon');
    }

    /**
     * Connect two icons
     * @param {Object} fromIcon - Source icon
     * @param {Object} toIcon - Target icon
     * @param {Object} options - Connector options (including `diagonal: true` for direct lines)
     * @returns {Object} The created connector element
     */
    connect(fromIcon, toIcon, options = {}) {
        // Automatically include all icons for collision detection (orthogonal mode only)
        const allIcons = options.diagonal ? [] : this.getAllIcons();
        const connector = createConnector(fromIcon, toIcon, { ...options, allIcons });
        this.elements[connector.id] = connector;
        this.zOrder.push(connector.id);
        return connector;
    }

    /**
     * Connect with association style (◇—1): parent-child containment
     * Used for visual component hierarchies, containment relationships
     * @param {Object} fromIcon - Child icon
     * @param {Object} toIcon - Parent icon
     * @param {Object} options - Additional connector options
     * @returns {Object} The created connector element
     */
    connectAssociation(fromIcon, toIcon, options = {}) {
        return this.connect(fromIcon, toIcon, { preset: 'association', ...options });
    }

    /**
     * Connect with skip/dashed association: indirect relationship
     * Used when there are intermediate components between source and target
     * @param {Object} fromIcon - Source icon
     * @param {Object} toIcon - Target icon (with intermediate components between)
     * @param {Object} options - Additional connector options
     * @returns {Object} The created connector element
     */
    connectSkip(fromIcon, toIcon, options = {}) {
        return this.connect(fromIcon, toIcon, { preset: 'skip', ...options });
    }

    /**
     * Connect with aggregation style (◇): has-a relationship
     * @param {Object} fromIcon - Part icon
     * @param {Object} toIcon - Whole icon
     * @param {Object} options - Additional connector options
     * @returns {Object} The created connector element
     */
    connectAggregation(fromIcon, toIcon, options = {}) {
        return this.connect(fromIcon, toIcon, { preset: 'aggregation', ...options });
    }

    /**
     * Connect with composition style (◆): owns relationship
     * @param {Object} fromIcon - Owned icon
     * @param {Object} toIcon - Owner icon
     * @param {Object} options - Additional connector options
     * @returns {Object} The created connector element
     */
    connectComposition(fromIcon, toIcon, options = {}) {
        return this.connect(fromIcon, toIcon, { preset: 'composition', ...options });
    }

    /**
     * Connect with inheritance style (△): extends/implements
     * @param {Object} fromIcon - Subclass/implementer icon
     * @param {Object} toIcon - Superclass/interface icon
     * @param {Object} options - Additional connector options
     * @returns {Object} The created connector element
     */
    connectInheritance(fromIcon, toIcon, options = {}) {
        return this.connect(fromIcon, toIcon, { preset: 'inheritance', ...options });
    }

    /**
     * Connect with plain line (no arrows): neutral connection
     * @param {Object} fromIcon - First icon
     * @param {Object} toIcon - Second icon
     * @param {Object} options - Additional connector options
     * @returns {Object} The created connector element
     */
    connectLine(fromIcon, toIcon, options = {}) {
        return this.connect(fromIcon, toIcon, { preset: 'line', ...options });
    }

    /**
     * Connect icons in a chain with collision-aware routing
     * @param {Array<Object>} icons - Icons to connect
     * @param {Object} options - Connector options
     * @returns {Array<Object>} Created connectors
     */
    connectChain(icons, options = {}) {
        const allIcons = this.getAllIcons();
        const connectors = [];
        for (let i = 0; i < icons.length - 1; i++) {
            const connector = createConnector(icons[i], icons[i + 1], { ...options, allIcons });
            this.elements[connector.id] = connector;
            this.zOrder.push(connector.id);
            connectors.push(connector);
        }
        return connectors;
    }

    /**
     * Connect icons in a cycle with collision-aware routing
     * @param {Array<Object>} icons - Icons to connect
     * @param {Object} options - Connector options
     * @returns {Array<Object>} Created connectors
     */
    connectCycle(icons, options = {}) {
        const connectors = this.connectChain(icons, options);
        // Connect last to first
        const allIcons = this.getAllIcons();
        const lastConnector = createConnector(icons[icons.length - 1], icons[0], { ...options, allIcons });
        this.elements[lastConnector.id] = lastConnector;
        this.zOrder.push(lastConnector.id);
        connectors.push(lastConnector);
        return connectors;
    }

    /**
     * Connect one icon to multiple icons using MultiConnector (fan-out)
     * Creates a branching connection from one source to multiple targets.
     * 
     * @param {Object} fromIcon - Source icon
     * @param {Array<Object>} toIcons - Target icons
     * @param {Object} options - MultiConnector options
     * @param {string} options.preset - Connection preset: 'arrow', 'association', 'skip', etc.
     * @param {string} options.direction - 'vertical' or 'horizontal' (auto-detected if omitted)
     * @param {boolean} options.bidirectional - Arrows on both ends (default: false)
     * @param {Array<string>} options.labels - Per-endpoint labels (one per target icon)
     * @returns {Object} Created MultiConnector
     */
    connectMulti(fromIcon, toIcons, options = {}) {
        const multiConn = createMultiConnector(fromIcon, toIcons, options);
        this.elements[multiConn.id] = multiConn;
        this.zOrder.push(multiConn.id);
        return multiConn;
    }

    /**
     * Connect one icon to multiple icons using association MultiConnector
     * Used for parent-child hierarchies with selection (one-of-many)
     * 
     * @param {Object} fromIcon - Parent icon
     * @param {Array<Object>} toIcons - Child icons
     * @param {Object} options - Additional MultiConnector options
     * @returns {Object} Created MultiConnector
     */
    connectMultiAssociation(fromIcon, toIcons, options = {}) {
        return this.connectMulti(fromIcon, toIcons, { preset: 'association', ...options });
    }

    /**
     * Connect multiple icons to one icon using MultiConnector (fan-in)
     * Creates a branching connection from multiple sources to one target.
     * Arrows point toward the target.
     * 
     * @param {Array<Object>} fromIcons - Source icons
     * @param {Object} toIcon - Target icon
     * @param {Object} options - MultiConnector options
     * @param {string} options.preset - Connection preset: 'arrow', 'association', etc.
     * @param {string} options.direction - 'vertical' or 'horizontal' (auto-detected if omitted)
     * @param {boolean} options.bidirectional - Arrows on both ends (default: false)
     * @param {Array<string>} options.labels - Per-endpoint labels (one per source icon)
     * @returns {Object} Created MultiConnector
     */
    connectMultiIn(fromIcons, toIcon, options = {}) {
        const multiConn = connectFanInMulti(fromIcons, toIcon, options);
        this.elements[multiConn.id] = multiConn;
        this.zOrder.push(multiConn.id);
        return multiConn;
    }

    /**
     * Classify a list of planned connections and return the optimal API calls.
     * Prevents the most common mistake: using connect() for fan-in/fan-out.
     *
     * Usage:
     *   const plan = builder.classifyConnections([
     *     { from: user, to: strategyA },
     *     { from: user, to: strategyB },
     *     { from: strategyA, to: definition },
     *     { from: strategyB, to: definition },
     *     { from: definition, to: result }
     *   ]);
     *   // Returns:
     *   // [
     *   //   { type: 'fan-out', method: 'connectMulti', from: user, to: [strategyA, strategyB] },
     *   //   { type: 'fan-in', method: 'connectMultiIn', from: [strategyA, strategyB], to: definition },
     *   //   { type: '1:1', method: 'connect', from: definition, to: result }
     *   // ]
     *
     * @param {Array<{from: Object, to: Object}>} connections - Planned connections
     * @returns {Array<Object>} Classified connection recommendations
     */
    classifyConnections(connections) {
        const fromCounts = {};
        const toCounts = {};

        connections.forEach(({ from, to }) => {
            fromCounts[from.id] = (fromCounts[from.id] || 0) + 1;
            toCounts[to.id] = (toCounts[to.id] || 0) + 1;
        });

        const result = [];
        const processed = new Set();

        // Group fan-outs (same source → multiple targets)
        for (const [sourceId, count] of Object.entries(fromCounts)) {
            if (count > 1) {
                const matching = connections.filter(c => c.from.id === sourceId);
                const source = matching[0].from;
                const targets = matching.map(c => c.to);
                result.push({ type: 'fan-out', method: 'connectMulti', from: source, to: targets });
                matching.forEach(c => processed.add(c));
            }
        }

        // Group fan-ins (multiple sources → same target)
        for (const [targetId, count] of Object.entries(toCounts)) {
            if (count > 1) {
                const remaining = connections.filter(c => c.to.id === targetId && !processed.has(c));
                if (remaining.length > 1) {
                    const sources = remaining.map(c => c.from);
                    const target = remaining[0].to;
                    result.push({ type: 'fan-in', method: 'connectMultiIn', from: sources, to: target });
                    remaining.forEach(c => processed.add(c));
                }
            }
        }

        // Remaining are 1:1
        connections.filter(c => !processed.has(c)).forEach(c => {
            result.push({ type: '1:1', method: 'connect', from: c.from, to: c.to });
        });

        return result;
    }

    /**
     * Execute a classified connection plan. Takes the output of classifyConnections()
     * and calls the appropriate connect methods.
     *
     * @param {Array<Object>} plan - Output from classifyConnections()
     * @param {Object} [options] - Options applied to all connections (lineStyle, etc.)
     * @returns {Array<Object>} Created connector elements
     */
    executeConnectionPlan(plan, options = {}) {
        const results = [];
        for (const step of plan) {
            switch (step.method) {
                case 'connectMulti':
                    results.push(this.connectMulti(step.from, step.to, options));
                    break;
                case 'connectMultiIn':
                    results.push(this.connectMultiIn(step.from, step.to, options));
                    break;
                case 'connect':
                    results.push(this.connect(step.from, step.to, options));
                    break;
            }
        }
        return results;
    }

    /**
     * Build the diagram JSON
     * @returns {Object} Complete diagram object
     */
    build(options = {}) {
        const autoFit = options.autoFit !== undefined ? options.autoFit : this.options.autoFit;
        const fitOptions = { ...this.options.fitOptions, ...(options.fitOptions || {}) };

        let elementMap = this.elements;
        let size = { width: this.options.width, height: this.options.height };

        if (autoFit) {
            const fitted = fitDiagramContent(this.elements, size, fitOptions);
            elementMap = fitted.elementMap;
            size = fitted.size;
        }

        return {
            id: this.options.id,
            author: this.options.author,
            size,
            editMode: {
                frameVisible: true,
                gridVisible: true,
                socketsVisible: false,
                plugsVisible: false,
                anchorsVisible: false,
                consoleVisible: false
            },
            presentationMode: {
                frameVisible: false,
                gridVisible: false,
                socketsVisible: false,
                plugsVisible: false,
                anchorsVisible: false
            },
            elementMap,
            elementZOrderList: this.zOrder
        };
    }

    /**
     * Build and return as UU5 string
     * @returns {string} UU5 string with diagram component
     */
    toUu5String(options = {}) {
        const diagram = this.build(options);
        const json = JSON.stringify(diagram);
        // Escape for UU5 embedding: first backslashes, then quotes
        const escaped = json
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
        return `<uu5string/><UuBml.Draw.Diagram value="<uu5json/>${escaped}"/>`;
    }

    /**
     * Build and return as escaped JSON for embedding
     * @returns {string} Escaped JSON string
     */
    toEscapedJson(options = {}) {
        const json = JSON.stringify(this.build(options));
        // Escape for UU5 embedding: first backslashes, then quotes
        return json
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"');
    }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    // Grid constants
    TILE_SIDE,
    TILE_AREA,
    ICON_SIZE_TILES,
    ICON_SIZE_PX,
    MIN_GAP,
    MIN_SPACING,
    STANDARD_SPACING,
    // Block grid constants
    BLOCK_PADDING,
    BLOCK_STANDARD_SIZE,
    BLOCK_GAP,
    BLOCK_STEP,
    BLOCK_CORNER_INSET,
    // Socket position offsets
    SOCKET_OFFSET_HORIZONTAL_CENTER,
    SOCKET_OFFSET_LEFT_RIGHT_Y,
    SOCKET_OFFSET_BOTTOM_Y,
    // Collision detection constants
    ICON_COLLISION_PADDING,
    ROUTE_AROUND_SPACING,
    // Connection type constants
    RELATION_TYPES,
    POINTER_TYPES,
    LINE_STYLES,
    CONNECTION_PRESETS,
    // Legacy aliases
    GRID_UNIT,
    TILE_SIZE,
    
    // ID generation
    generateId,
    generateHexId,
    generateHexIds,
    resetIdCounter,
    
    // Position helpers
    snapToGrid,
    snapToTile,
    snapToIconGrid,
    snapToGridPosition,
    snapToGridPositionY,
    circleLayout,
    gridLayout,
    horizontalLayout,
    verticalLayout,
    
    // Block position helpers
    blockPosition,
    blockSize,
    iconPositionInBlock,
    generateBlockSockets,
    generateBlockAnchors,
    getBlockSocketPosition,
    
    // Element factories
    STENCILS,
    createIcon,
    createBlock,
    createUu5Component,
    createAnnotation,
    createFloatingAnnotation,
    createCallout,
    createFloatingCallout,
    createStarburst,
    
    // Collision detection and routing
    getIconBounds,
    pointInBounds,
    lineIntersectsBounds,
    findPathCollision,
    routeAroundObstacle,
    getAvailableSocketIndex,
    getSocketPositionAtIndex,
    
    // Connection helpers
    ICON_SIZE,
    getSocketIndex,
    getSocketPosition,
    determineConnectionPoints,
    createConnector,
    createMultiConnector,
    connectChain,
    connectCycle,
    connectFanOut,
    connectFanOutMulti,
    connectFanInMulti,
    // Auto-fit helpers
    createEmptyBounds,
    calculateContentBounds,
    fitDiagramContent,
    
    // Builder
    DiagramBuilder
};
