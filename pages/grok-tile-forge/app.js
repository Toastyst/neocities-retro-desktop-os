// Constants
const TILE_SIZE = 32;
const MAX_ATLAS_SIZE = 1024;

// Core Types (using JS objects/classes)
class Tile {
    constructor(id, x, y, type, neighbors = [], data = null, collision = [], maskAlpha = null, bitmask = 0, walkableRatio = 0, physics = {}, tileId = '', contiguousWalkable = false, animationFrames = []) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type; // TileType enum
        this.neighbors = neighbors; // bitmask array or number
        this.data = data; // ImageData
        this.collision = collision; // boolean[] 32x32
        this.maskAlpha = maskAlpha; // Uint8Array 32x32
        this.bitmask = bitmask; // number (0-47 neighbor code)
        this.walkableRatio = walkableRatio; // number 0-1
        this.physics = physics; // {slopeAngle?: number, oneWay?: boolean}
        this.tileId = tileId; // string e.g. 'grass_path_corner_TR'
        this.contiguousWalkable = contiguousWalkable; // boolean
        this.animationFrames = animationFrames; // number[] indices of frames
    }
}

// Enums
const TileType = {
    SOLID: 'solid',
    SLOPE_UP_RIGHT: 'slope_up_right',
    SLOPE_UP_LEFT: 'slope_up_left',
    SLOPE_DOWN_RIGHT: 'slope_down_right',
    SLOPE_DOWN_LEFT: 'slope_down_left',
    EDGE_BOTTOM: 'edge_bottom',
    EDGE_LEFT: 'edge_left',
    EDGE_TOP: 'edge_top',
    EDGE_RIGHT: 'edge_right',
    CORNER_INNER_BL: 'corner_inner_BL',
    CORNER_INNER_BR: 'corner_inner_BR',
    CORNER_INNER_TL: 'corner_inner_TL',
    CORNER_INNER_TR: 'corner_inner_TR',
    CORNER_OUTER_BL: 'corner_outer_BL',
    CORNER_OUTER_BR: 'corner_outer_BR',
    CORNER_OUTER_TL: 'corner_outer_TL',
    CORNER_OUTER_TR: 'corner_outer_TR',
    EMPTY: 'empty',
    CLIFF: 'cliff',
    CLIFF_LEFT: 'cliff_left',
    CLIFF_RIGHT: 'cliff_right'
};

const AutotilePattern = Array.from({length: 48}, (_, i) => i); // 0-47

class TilesetManifest {
    constructor(tileSize = TILE_SIZE, atlasSize = {w: MAX_ATLAS_SIZE, h: MAX_ATLAS_SIZE}, tiles = [], collisionMap = null, layerMapping = {0:'collision',1:'bg',2:'mid',3:'fg'}, tileMapping = {}, tileIdMapping = {}, collisionEncoding = {black: 'solid', white: 'passable', gray: 'slope'}, animationMapping = {}) {
        this.tileSize = tileSize;
        this.atlasSize = atlasSize;
        this.tiles = tiles;
        this.collisionMap = collisionMap; // Uint8Array
        this.layerMapping = layerMapping;
        this.tileMapping = tileMapping; // Record<string, {id: number, x: number, y: number, physics: object}>
        this.tileIdMapping = tileIdMapping; // Record<string, number> bitmask to index
        this.collisionEncoding = collisionEncoding;
        this.animationMapping = animationMapping; // Record<string, number[]> tileId to frame indices
    }
}

class SourceInput {
    constructor(texture, edgeMask = null, featureMasks = {}, tilesheet = null, promptInputs = {}) {
        this.texture = texture; // HTMLImageElement
        this.edgeMask = edgeMask; // HTMLImageElement
        this.walkableMask = null; // ImageData derived from edgeMask
        this.featureMasks = featureMasks; // Record<string, HTMLImageElement>
        this.tilesheet = tilesheet; // HTMLImageElement for V2
        this.promptInputs = promptInputs; // Record<string, string> for V2
    }
}

// AutotilePattern: number (0-47 bitmask)
// BlendRule: { pattern: number, blendFn: (tile1: Tile, tile2: Tile) => Tile }

// Global variables
let apiKey = localStorage.getItem('tileForgeApiKey') || '';
let sourceInput = null;
let tiles = [];
let autotileSheet = null;
let maskSheet = null;
let manifest = null;

// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKey');
const generateForm = document.getElementById('generateForm');
const generateBtn = document.getElementById('generateBtn');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resizedCanvas = document.getElementById('resizedCanvas');
const segmentedCanvas = document.getElementById('segmentedCanvas');
const chosenTileCanvas = document.getElementById('chosenTileCanvas');
const inputCanvas = document.getElementById('inputCanvas');
const autotileCanvas = document.getElementById('autotileCanvas');
const maskCanvas = document.getElementById('maskCanvas');
const generateBtnToolbar = document.getElementById('generateBtnToolbar');
const exportSheetBtn = document.getElementById('exportSheetBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCollisionBtn = document.getElementById('exportCollisionBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const themeInput = document.getElementById('themeInput');
const specificTilesInput = document.getElementById('specificTilesInput');
const materialsInput = document.getElementById('materialsInput');

// Add click handler for tile selection
resizedCanvas.addEventListener('click', (e) => {
    const rect = resizedCanvas.getBoundingClientRect();
    const scaleX = resizedCanvas.width / rect.width;
    const scaleY = resizedCanvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    const tileX = Math.floor(canvasX / 32);
    const tileY = Math.floor(canvasY / 32);
    const index = tileY * 8 + tileX;
    if (tiles[index]) {
        const ctx = chosenTileCanvas.getContext('2d');
        chosenTileCanvas.width = 38;
        chosenTileCanvas.height = 38;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 38, 38);
        ctx.putImageData(tiles[index].data, 3, 3); // 3px padding
    }
});

// Initialize
apiKeyInput.value = apiKey;

// Event listeners
toggleKeyBtn.addEventListener('click', toggleApiKeyVisibility);
apiKeyInput.addEventListener('input', saveApiKey);
generateForm.addEventListener('submit', handleGenerate);
generateBtnToolbar.addEventListener('click', handleGenerate);
exportSheetBtn.addEventListener('click', exportSheet);
exportJsonBtn.addEventListener('click', exportJson);
exportCollisionBtn.addEventListener('click', exportCollision);
downloadAllBtn.addEventListener('click', downloadAll);

function toggleApiKeyVisibility() {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
    toggleKeyBtn.textContent = type === 'password' ? '👁️' : '🙈';
}

function saveApiKey() {
    apiKey = apiKeyInput.value;
    localStorage.setItem('tileForgeApiKey', apiKey);
}

function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = text;
}

function enableToolbar() {
    generateBtnToolbar.disabled = false;
    exportSheetBtn.disabled = false;
    exportJsonBtn.disabled = false;
    exportCollisionBtn.disabled = false;
    downloadAllBtn.disabled = false;
}

async function handleGenerate(e) {
    if (e) e.preventDefault();
    generateBtn.disabled = true;
    progress.classList.remove('hidden');
    updateProgress(10, 'Loading source texture...');

    try {
        // V2: Generate tilesheet with Grok
        const template = await loadTemplate();
        const inputs = {
            theme: themeInput.value || '',
            specific_tiles: specificTilesInput.value || '',
            materials: materialsInput.value || ''
        };
        const prompt = generateTilesheetPrompt(template, inputs);
        console.log('Generated prompt:', prompt);
        updateProgress(15, 'Generating tilesheet with Grok...');
        const response = await callGrokAPI(prompt);
        const tilesheetImg = await loadImageFromB64(response.data[0].b64_json);
        updateProgress(30, 'Processing tilesheet...');
        tiles = processTilesheet(tilesheetImg);
        // Display processed with grid
        const resizedCtx = resizedCanvas.getContext('2d');
        resizedCanvas.width = 256;
        resizedCanvas.height = 256;
        resizedCtx.imageSmoothingEnabled = false;
        resizedCtx.drawImage(tilesheetImg, 0, 0, 256, 256);
        // Add grid overlay
        resizedCtx.strokeStyle = 'rgba(255,255,255,0.5)';
        resizedCtx.lineWidth = 1;
        for (let x = 0; x <= 256; x += 32) {
            resizedCtx.beginPath();
            resizedCtx.moveTo(x, 0);
            resizedCtx.lineTo(x, 256);
            resizedCtx.stroke();
        }
        for (let y = 0; y <= 256; y += 32) {
            resizedCtx.beginPath();
            resizedCtx.moveTo(0, y);
            resizedCtx.lineTo(256, y);
            resizedCtx.stroke();
        }
        // Display chosen tile (empty initially)
        const chosenCtx = chosenTileCanvas.getContext('2d');
        chosenCtx.imageSmoothingEnabled = false;
        chosenCtx.clearRect(0, 0, 38, 38);
        // Display input
        const ctx = inputCanvas.getContext('2d');
        inputCanvas.width = tilesheetImg.width;
        inputCanvas.height = tilesheetImg.height;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tilesheetImg, 0, 0);
        // Set sourceInput
        sourceInput = new SourceInput(tilesheetImg, null, {}, tilesheetImg, inputs);
        updateProgress(50, 'Classifying tiles...');
        tiles.forEach(tile => TileClassifier.classifyTile(tile));
        updateProgress(70, 'Generating autotile variants...');
        tiles = AutotileGenerator.generateAutotileVariants(tiles);
        updateProgress(80, 'Generating foreground masks...');
        const maskMethod = 'procedural';
        ForegroundMaskGenerator.generateMasks(tiles, maskMethod, sourceInput);
        console.log('Masks generated for method:', maskMethod);
        // displayAutotileSheet();
        // displayMaskSheet();
        updateProgress(100, 'Ready for processing!');
        enableToolbar();
    } catch (error) {
        alert('Error: ' + error.message);
        console.error(error);
    } finally {
        generateBtn.disabled = false;
        setTimeout(() => progress.classList.add('hidden'), 2000);
    }
}



function loadImageFromB64(b64) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:image/png;base64,${b64}`;
    });
}

function computeNeighborBitmask(grid, x, y) {
    let bitmask = 0;
    const directions = [
        {dx: 0, dy: -1, bit: 1}, // N
        {dx: 1, dy: 0, bit: 2},  // E
        {dx: 0, dy: 1, bit: 4},  // S
        {dx: -1, dy: 0, bit: 8}  // W
    ];
    directions.forEach(({dx, dy, bit}) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
            const neighbor = grid[ny][nx];
            if (neighbor.walkableRatio > 0.5) { // Walkable if >50% walkable
                bitmask |= bit;
            }
        }
    });
    return bitmask;
}



function generateTileId(type, bitmask) {
    return 'grass_path_' + type + '_bit' + bitmask;
}

function isContiguousWalkable(tile) {
    const width = TILE_SIZE;
    const height = TILE_SIZE;
    const visited = new Array(width * height).fill(false);
    const queue = [];
    const startX = Math.floor(width / 2);
    const startY = height - 1;
    const startIdx = startY * width + startX;
    if (!tile.collision[startIdx]) return false;
    queue.push(startIdx);
    visited[startIdx] = true;
    let connected = 1;
    const directions = [[0,1],[1,0],[0,-1],[-1,0]];
    while (queue.length) {
        const idx = queue.shift();
        const x = idx % width;
        const y = Math.floor(idx / width);
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nidx = ny * width + nx;
                if (tile.collision[nidx] && !visited[nidx]) {
                    visited[nidx] = true;
                    queue.push(nidx);
                    connected++;
                }
            }
        }
    }
    let totalWalkable = 0;
    for (let i = 0; i < tile.collision.length; i++) {
        if (tile.collision[i]) totalWalkable++;
    }
    return connected === totalWalkable;
}

function linearSlopeFit(tile) {
    const width = TILE_SIZE;
    const height = TILE_SIZE;
    const points = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            if (tile.data.data[idx + 3] > 10) {
                points.push([x, y]);
            }
        }
    }
    if (points.length < 2) return {angle: 0, direction: 'flat'};
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (const [x, y] of points) {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const angle = Math.atan(m) * 180 / Math.PI;
    const direction = angle > 0 ? 'up_right' : 'up_left';
    return {angle: Math.abs(angle), direction};
}

function blendMultiple(nearestTiles, weights) {
    if (nearestTiles.length === 0) return new ImageData(TILE_SIZE, TILE_SIZE);
    const blended = new ImageData(TILE_SIZE, TILE_SIZE);
    const data = blended.data;
    for (let i = 0; i < data.length; i += 4) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let j = 0; j < nearestTiles.length; j++) {
            const tile = nearestTiles[j];
            const w = weights[j];
            r += tile.data.data[i] * w;
            g += tile.data.data[i+1] * w;
            b += tile.data.data[i+2] * w;
            a += tile.data.data[i+3] * w;
        }
        data[i] = r;
        data[i+1] = g;
        data[i+2] = b;
        data[i+3] = a;
    }
    return blended;
}

function generateTilesheetPrompt(template, inputs) {
    let prompt = template;
    const combined = [inputs.theme, inputs.specific_tiles, inputs.materials].filter(s => s).join(' ');
    if (combined) {
        prompt = prompt.replace('appended texture tag', combined);
    }
    return prompt;
}

function processTilesheet(tilesheetImg) {
    // Scale to 256x256 no blur
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d', {willReadFrequently: true});
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tilesheetImg, 0, 0, 256, 256);

    // Copy and shift down 2 pixels
    const shifted = ctx.getImageData(0, 0, 256, 256);
    const newData = new ImageData(256, 256);
    for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 256; x++) {
            const srcY = y - 2;
            if (srcY >= 0) {
                const srcIdx = (srcY * 256 + x) * 4;
                const dstIdx = (y * 256 + x) * 4;
                newData.data[dstIdx] = shifted.data[srcIdx];
                newData.data[dstIdx+1] = shifted.data[srcIdx+1];
                newData.data[dstIdx+2] = shifted.data[srcIdx+2];
                newData.data[dstIdx+3] = shifted.data[srcIdx+3];
            } else {
                // Fill with transparent
                const dstIdx = (y * 256 + x) * 4;
                newData.data[dstIdx] = 0;
                newData.data[dstIdx+1] = 0;
                newData.data[dstIdx+2] = 0;
                newData.data[dstIdx+3] = 0;
            }
        }
    }
    ctx.putImageData(newData, 0, 0);

    // Segment to 8x8 tiles
    const tiles = [];
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const imageData = ctx.getImageData(x * 32, y * 32, 32, 32);
            const tile = new Tile(
                `tile_${x}_${y}`,
                x * 32,
                y * 32,
                'unknown',
                [],
                imageData,
                new Array(32 * 32).fill(false),
                new Uint8Array(32 * 32)
            );
            tiles.push(tile);
        }
    }

    // Compute bitmasks for 8x8 grid
    const grid = [];
    for (let y = 0; y < 8; y++) {
        grid[y] = [];
        for (let x = 0; x < 8; x++) {
            grid[y][x] = tiles[y * 8 + x];
        }
    }
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            grid[y][x].bitmask = computeNeighborBitmask(grid, x, y);
        }
    }

    return tiles;
}

function extractAnimationFrames(tileId, tiles) {
    // Assume door in top row, 4 frames
    const frames = tiles.filter(t => t.tileId.startsWith(tileId));
    return frames;
}

const TILE_PROMPT_TEMPLATE = `Generate a single 256x256 pixel art image. This image contains an exactly 8x8 grid of 32x32 pixel tiles. The grid is a tilesheet for a 2D platformer game. Each tile is a separate, self-contained graphic. No transparency. No anti-aliasing. No smoothing.

Palette and mood determined by appended texture tag. No inherent lighting direction or contrast enforced.

Layout (row by row from top to bottom, left to right):

Row 0 (top): [sky_base, sky_base, cloud_left, cloud_mid, cloud_right, sky_base, sky_base]
Row 1: [hill_slope_left, hill_flat, hill_flat, hill_slope_right, decoration_a, decoration_a, sky_base]
Row 2: [ground_top_left, ground_top, ground_top, ground_top_right, ground_top, ground_top, ground_top]
Row 3: [ground_solid, ground_solid, ground_solid, ground_solid, brick_block, brick_block, brick_block]
Row 4: [ground_solid, ground_solid, ground_solid, ground_solid, decoration_b, decoration_c, decoration_d]
Row 5: [stone_marker_left, stone_marker_center, stone_marker_right, crack_vent, crack_vent, crack_vent, crack_vent]
Row 6 (bottom): [dirt, dirt, dirt, dirt, dirt, dirt, dirt]

Tile definitions (each 32x32):
- sky_base: solid blue-gray, no detail.
- cloud_left: fluffy cloud shape, left edge flat for tiling.
- cloud_mid: fluffy cloud, middle segment.
- cloud_right: fluffy cloud, right edge flat.
- hill_slope_left: slope curving up from left to right.
- hill_flat: flat top of hill.
- hill_slope_right: slope curving down from left to right.
- decoration_a: abstract small ground detail (e.g., patch of variation, pebbles, or low growth). No specific shape.
- ground_top_left: stone top edge with left corner.
- ground_top: stone top edge, flat.
- ground_top_right: stone top edge with right corner.
- ground_solid: solid stone block with subtle cracks and wear.
- brick_block: rectangular brick pattern (4x4 pixel grid), weathered.
- decoration_b: abstract ground prop, low silhouette, no distinct identity.
- decoration_c: abstract ground prop, slightly taller than decoration_b, no distinct identity.
- decoration_d: abstract ground prop, dense or dark, no distinct identity.
- stone_marker_left: left half of a low stone structure, symmetrical.
- stone_marker_center: center of stone structure, flat top.
- stone_marker_right: right half of stone structure.
- crack_vent: vertical crack in ground emitting thin fog or steam upward (abstract).
- dirt: loose soil with small pebbles.

All tiles must be abstract and geometric or atmospheric. No faces, eyes, characters, text, symbols, or glowing elements. Each tile stays within its 32x32 boundary. Output is a single PNG.`;

async function loadTemplate() {
    return TILE_PROMPT_TEMPLATE;
}

// TileClassifier class
class TileClassifier {
    static classifyTile(tile) {
        const data = tile.data.data;
        const width = TILE_SIZE;
        const height = TILE_SIZE;

        // Calculate walkableRatio from opaque pixels
        let opaqueCount = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 10) opaqueCount++;
        }
        tile.walkableRatio = opaqueCount / (width * height);
        // Collision from alpha
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                tile.collision[y * width + x] = data[idx + 3] > 10;
            }
        }

        tile.contiguousWalkable = isContiguousWalkable(tile);

        if (tile.walkableRatio < 0.1) {
            tile.type = TileType.EMPTY;
            tile.tileId = generateTileId(tile.type, tile.bitmask);
            return;
        }

        // Check for cliff (vertical drop)
        if (this.detectCliff(tile)) {
            tile.type = TileType.CLIFF;
            tile.tileId = generateTileId(tile.type, tile.bitmask);
            return;
        }

        // Check for slope
        const slopeInfo = this.detectSlope(tile);
        if (slopeInfo.isSlope) {
            tile.type = slopeInfo.direction === 'up_right' ? TileType.SLOPE_UP_RIGHT : TileType.SLOPE_UP_LEFT;
            tile.physics.slopeAngle = slopeInfo.angle;
            tile.tileId = generateTileId(tile.type, tile.bitmask);
            return;
        }

        // Check for edge
        if (this.detectEdge(tile)) {
            tile.type = TileType.EDGE_BOTTOM; // Assume bottom for now
            tile.tileId = generateTileId(tile.type, tile.bitmask);
            return;
        }

        // Check for corner
        if (this.detectCorner(tile)) {
            tile.type = TileType.CORNER_INNER_BL; // Assume BL for now
            tile.tileId = generateTileId(tile.type, tile.bitmask);
            return;
        }

        // Default to solid
        tile.type = TileType.SOLID;
        tile.tileId = generateTileId(tile.type, tile.bitmask);
    }

    static detectSlope(tile) {
        const fit = linearSlopeFit(tile);
        const isSlope = fit.angle <= 45 && fit.angle > 0;
        return {isSlope, direction: fit.direction, angle: fit.angle};
    }

    static detectCliff(tile) {
        const data = tile.data.data;
        const width = TILE_SIZE;
        const height = TILE_SIZE;

        // Check for vertical drop >90% on left or right side
        let leftWalkable = 0;
        let rightWalkable = 0;

        for (let y = 0; y < height; y++) {
            // Left edge
            for (let x = 0; x < 4; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > 10) leftWalkable++;
            }
            // Right edge
            for (let x = width - 4; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > 10) rightWalkable++;
            }
        }

        const leftRatio = leftWalkable / (height * 4);
        const rightRatio = rightWalkable / (height * 4);

        return leftRatio < 0.1 || rightRatio < 0.1; // Cliff if one side mostly empty
    }

    static detectEdge(tile) {
        const data = tile.data.data;
        const width = TILE_SIZE;
        const height = TILE_SIZE;
        const totalPixels = width * height;

        // Check for abrupt vertical edge
        let leftOpaque = 0;
        let rightOpaque = 0;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width / 2; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > 10) leftOpaque++;
            }
            for (let x = width / 2; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > 10) rightOpaque++;
            }
        }

        const diff = Math.abs(leftOpaque - rightOpaque);
        return diff > (totalPixels / 4); // Significant difference
    }

    static detectCorner(tile) {
        const data = tile.data.data;
        const width = TILE_SIZE;
        const height = TILE_SIZE;

        // Check if opaque pixels occupy only one quadrant
        const quadrants = [0, 0, 0, 0]; // TL, TR, BL, BR

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > 10) {
                    const qx = x < width / 2 ? 0 : 1;
                    const qy = y < height / 2 ? 0 : 1;
                    quadrants[qy * 2 + qx]++;
                }
            }
        }

        const maxQuad = Math.max(...quadrants);
        const totalOpaque = quadrants.reduce((a, b) => a + b, 0);
        return maxQuad > totalOpaque * 0.8; // 80% in one quadrant
    }

    static setCollisionForSolid(tile) {
        tile.collision.fill(true);
    }

    static setCollisionForSlope(tile) {
        const data = tile.data.data;
        const width = TILE_SIZE;
        const height = TILE_SIZE;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                tile.collision[y * width + x] = data[idx + 3] > 10;
            }
        }
    }

    static setCollisionForEdge(tile) {
        // Similar to slope, but more vertical
        this.setCollisionForSlope(tile);
    }

    static setCollisionForCorner(tile) {
        this.setCollisionForSlope(tile);
    }
}

// AutotileGenerator class
class AutotileGenerator {
    static generateAutotileVariants(tiles) {
        // Collect base patterns from input tiles
        const basePatterns = new Map();
        tiles.forEach(tile => {
            if (!basePatterns.has(tile.bitmask)) {
                basePatterns.set(tile.bitmask, tile);
            }
        });

        // Generate all 47 patterns
        const allTiles = [];
        for (let pattern = 0; pattern < 47; pattern++) {
            if (basePatterns.has(pattern)) {
                const tile = basePatterns.get(pattern);
                tile.tileId = generateTileId(tile.type, pattern);
                allTiles.push(tile);
            } else {
                // Synthesize missing pattern
                const nearestTiles = this.findNearestPatterns(pattern, basePatterns, 2);
                const weights = nearestTiles.length === 1 ? [1] : [0.5, 0.5];
                const blendedData = blendMultiple(nearestTiles, weights);
                const baseTile = nearestTiles[0];
                const newTile = new Tile(
                    `synthesized_${pattern}`,
                    baseTile.x,
                    baseTile.y,
                    baseTile.type,
                    pattern,
                    blendedData,
                    [...baseTile.collision],
                    new Uint8Array(baseTile.maskAlpha)
                );
                newTile.tileId = generateTileId(baseTile.type, pattern);
                allTiles.push(newTile);
            }
        }
        return allTiles;
    }

    static findNearestPatterns(targetPattern, basePatterns, count) {
        const distances = Array.from(basePatterns.keys()).map(pattern => ({pattern, dist: this.hammingDistance(targetPattern, pattern)}));
        distances.sort((a,b) => a.dist - b.dist);
        return distances.slice(0, count).map(d => basePatterns.get(d.pattern));
    }

    static findNearestPattern(targetPattern, basePatterns) {
        let minDistance = Infinity;
        let nearest = 0;
        for (const pattern of basePatterns.keys()) {
            const distance = this.hammingDistance(targetPattern, pattern);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = pattern;
            }
        }
        return nearest;
    }

    static hammingDistance(a, b) {
        let xor = a ^ b;
        let distance = 0;
        while (xor) {
            distance += xor & 1;
            xor >>= 1;
        }
        return distance;
    }

    static copyImageData(imageData) {
        const newData = new Uint8ClampedArray(imageData.data);
        return new ImageData(newData, imageData.width, imageData.height);
    }

    static blendTiles(tile1, tile2, pattern) {
        // Simple dither blend: checkerboard mix
        const blended = this.copyImageData(tile1.data);
        const data = blended.data;
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % TILE_SIZE;
            const y = Math.floor((i / 4) / TILE_SIZE);
            const checker = ((x + y) % 2 === 0);
            if (checker) {
                // Take from tile2
                const idx2 = i;
                data[i] = tile2.data.data[idx2];
                data[i + 1] = tile2.data.data[idx2 + 1];
                data[i + 2] = tile2.data.data[idx2 + 2];
                data[i + 3] = tile2.data.data[idx2 + 3];
            }
        }
        return blended;
    }
}

// ForegroundMaskGenerator class
class ForegroundMaskGenerator {
    static generateMasks(tiles, method, sourceInput) {
        const fgData = sourceInput.featureMasks.fg ? this.getFgData(sourceInput.featureMasks.fg, tiles) : null;
        tiles.forEach((tile, index) => {
            const fg = fgData ? fgData[index] : null;
            if (method === 'colorKey') {
                this.colorKey(tile, '#FF00FF', fg); // Magenta key
            } else if (method === 'edgeDetect') {
                this.edgeDetect(tile, fg);
            } else if (method === 'procedural') {
                this.procedural(tile, 0.4);
            }
        });
    }

    static getFgData(fgImg, tiles) {
        // Assume fgImg is same size as texture, return array of ImageData for each tile
        const fgDatas = [];
        const canvas = document.createElement('canvas');
        canvas.width = fgImg.width;
        canvas.height = fgImg.height;
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        ctx.drawImage(fgImg, 0, 0);
        tiles.forEach(tile => {
            const tx = tile.x / TILE_SIZE;
            const ty = tile.y / TILE_SIZE;
            const fgData = ctx.getImageData(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            fgDatas.push(fgData);
        });
        return fgDatas;
    }

    static colorKey(tile, keyColor, fgData) {
        const data = fgData ? fgData.data : tile.data.data;
        const keyR = parseInt(keyColor.slice(1, 3), 16);
        const keyG = parseInt(keyColor.slice(3, 5), 16);
        const keyB = parseInt(keyColor.slice(5, 7), 16);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const dist = Math.sqrt((r - keyR) ** 2 + (g - keyG) ** 2 + (b - keyB) ** 2);
            if (dist < 20) { // Tolerance
                tile.maskAlpha[Math.floor(i / 4)] = 0; // Transparent
            } else {
                tile.maskAlpha[Math.floor(i / 4)] = Math.min(255, data[i + 3] * 1.5); // Boost alpha
            }
        }
    }

    static edgeDetect(tile, fgData) {
        const data = fgData ? fgData.data : tile.data.data;
        const width = TILE_SIZE;
        const height = TILE_SIZE;
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        const gray = new Uint8Array(width * height);
        for (let i = 0; i < data.length; i += 4) {
            gray[Math.floor(i / 4)] = (data[i] + data[i + 1] + data[i + 2]) / 3;
        }

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (y + ky) * width + (x + kx);
                        const kidx = (ky + 1) * 3 + (kx + 1);
                        gx += gray[idx] * sobelX[kidx];
                        gy += gray[idx] * sobelY[kidx];
                    }
                }
                const mag = Math.sqrt(gx * gx + gy * gy);
                tile.maskAlpha[y * width + x] = mag > 50 ? 255 : Math.max(40, mag * 5); // Threshold >=40%
            }
        }
    }

    static procedural(tile, density) {
        const width = TILE_SIZE;
        const height = TILE_SIZE;

        // Simple vine: sinusoidal stem + random leaves
        for (let x = 0; x < width; x++) {
            const y = Math.floor(8 + 4 * Math.sin(x / 6));
            if (y >= 0 && y < height) {
                tile.maskAlpha[y * width + x] = 255;
            }
        }

        // Random leaves
        const leafCount = Math.floor(width * height * density / 100);
        for (let i = 0; i < leafCount; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            if (x >= 0 && x < width && y >= 0 && y < height) {
                tile.maskAlpha[y * width + x] = Math.max(40, Math.random() * 255); // Dither
            }
        }
    }
}

function displayAutotileSheet() {
    const cols = Math.ceil(Math.sqrt(tiles.length));
    const rows = Math.ceil(tiles.length / cols);
    const sheetWidth = cols * TILE_SIZE;
    const sheetHeight = rows * TILE_SIZE;

    autotileSheet = document.createElement('canvas');
    autotileSheet.width = sheetWidth;
    autotileSheet.height = sheetHeight;
    const ctx = autotileSheet.getContext('2d', {willReadFrequently: true});
    ctx.imageSmoothingEnabled = false;

    tiles.forEach((tile, i) => {
        const x = (i % cols) * TILE_SIZE;
        const y = Math.floor(i / cols) * TILE_SIZE;
        ctx.putImageData(tile.data, x, y);
    });

    autotileCanvas.width = sheetWidth;
    autotileCanvas.height = sheetHeight;
    const displayCtx = autotileCanvas.getContext('2d');
    displayCtx.imageSmoothingEnabled = false;
    displayCtx.drawImage(autotileSheet, 0, 0);
}

function displayMaskSheet() {
    const cols = Math.ceil(Math.sqrt(tiles.length));
    const rows = Math.ceil(tiles.length / cols);
    const sheetWidth = cols * TILE_SIZE;
    const sheetHeight = rows * TILE_SIZE;

    maskSheet = document.createElement('canvas');
    maskSheet.width = sheetWidth;
    maskSheet.height = sheetHeight;
    const ctx = maskSheet.getContext('2d', {willReadFrequently: true});
    ctx.imageSmoothingEnabled = false;

    tiles.forEach((tile, i) => {
        const x = (i % cols) * TILE_SIZE;
        const y = Math.floor(i / cols) * TILE_SIZE;
        const maskData = new ImageData(TILE_SIZE, TILE_SIZE);
        for (let j = 0; j < tile.maskAlpha.length; j++) {
            maskData.data[j * 4] = 255; // White
            maskData.data[j * 4 + 1] = 255;
            maskData.data[j * 4 + 2] = 255;
            maskData.data[j * 4 + 3] = tile.maskAlpha[j];
        }
        ctx.putImageData(maskData, x, y);
    });

    maskCanvas.width = sheetWidth;
    maskCanvas.height = sheetHeight;
    const displayCtx = maskCanvas.getContext('2d');
    displayCtx.imageSmoothingEnabled = false;
    displayCtx.drawImage(maskSheet, 0, 0);
}

// TilesetExporter class
class TilesetExporter {
    static packAtlas(tiles, maxSize = MAX_ATLAS_SIZE) {
        const cols = Math.min(Math.ceil(Math.sqrt(tiles.length)), Math.floor(maxSize / TILE_SIZE));
        const rows = Math.ceil(tiles.length / cols);
        const width = cols * TILE_SIZE;
        const height = rows * TILE_SIZE;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        ctx.imageSmoothingEnabled = false;

        tiles.forEach((tile, i) => {
            const x = (i % cols) * TILE_SIZE;
            const y = Math.floor(i / cols) * TILE_SIZE;
            ctx.putImageData(tile.data, x, y);
        });

        return canvas;
    }

    static encodeCollisionSheet(tiles) {
        const cols = Math.ceil(Math.sqrt(tiles.length));
        const rows = Math.ceil(tiles.length / cols);
        const width = cols * TILE_SIZE;
        const height = rows * TILE_SIZE;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        ctx.imageSmoothingEnabled = false;

        tiles.forEach((tile, i) => {
            const x = (i % cols) * TILE_SIZE;
            const y = Math.floor(i / cols) * TILE_SIZE;
            let color = [0, 0, 0, 255]; // Black for solid
            if (tile.type === TileType.EMPTY) {
                color = [255, 255, 255, 255]; // White for passable
            } else if (tile.type.includes('slope') || tile.type.includes('edge')) {
                color = [128, 128, 128, 255]; // Gray for slope/edge
            }
            ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${color[3]/255})`;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        });

        return canvas;
    }

    static exportTileset(tiles) {
        const atlas = this.packAtlas(tiles);
        const collision = this.encodeCollisionSheet(tiles);
        const tileMapping = {};
        const tileIdMapping = {};
        tiles.forEach((tile, i) => {
            tileMapping[tile.id] = {
                id: i,
                x: (i % Math.ceil(Math.sqrt(tiles.length))) * TILE_SIZE,
                y: Math.floor(i / Math.ceil(Math.sqrt(tiles.length))) * TILE_SIZE,
                physics: tile.physics
            };
            tileIdMapping[tile.tileId] = i;
        });
        const manifest = new TilesetManifest(TILE_SIZE, {w: atlas.width, h: atlas.height}, tiles.map(t => ({
            id: t.id,
            x: t.x,
            y: t.y,
            type: t.type,
            neighbors: t.neighbors
        })), null, {0:'collision',1:'bg',2:'mid',3:'fg'}, tileMapping, tileIdMapping);

        return { atlas, collision, manifest };
    }
}

function exportSheet() {
    if (!autotileSheet) return;
    autotileSheet.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tileset_sheet.png';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function exportJson() {
    if (!tiles.length) return;
    const exported = TilesetExporter.exportTileset(tiles);
    const json = JSON.stringify(exported.manifest, null, 2);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tileset_manifest.json';
    a.click();
    URL.revokeObjectURL(url);
}

function exportCollision() {
    if (!tiles.length) return;
    const collisionCanvas = TilesetExporter.encodeCollisionSheet(tiles);
    collisionCanvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tileset_collision.png';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function downloadAll() {
    exportSheet();
    setTimeout(exportJson, 500);
    setTimeout(exportCollision, 1000);
    // Also mask sheet
    if (maskSheet) {
        setTimeout(() => {
            maskSheet.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tileset_masks.png';
                a.click();
                URL.revokeObjectURL(url);
            });
        }, 1500);
    }
}

async function callGrokAPI(prompt) {
    // Append tags for better tile generation outcomes
    const enhancedPrompt = prompt + ', pixel art, 32x32 tile size, suitable for autotiling';
    const response = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'grok-imagine-image-pro', // Default to pro
            prompt: enhancedPrompt,
            n: 1,
            response_format: 'b64_json',
            aspect_ratio: "1:1" // Square for tiles
        })
    });

    if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}
