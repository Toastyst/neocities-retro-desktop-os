// js/apps/paint.js - Win98 Style 32x32 Pixel Sprite Editor
export function createApp(container) {
    // Constants
    const WIDTH = 32;
    const HEIGHT = 32;
    const INITIAL_PIXEL_SIZE = 18;
    const MIN_PIXEL_SIZE = 8;
    const MAX_PIXEL_SIZE = 32;
    const CHECKER_SIZE = 8;
    const TOOLBAR_WIDTH = 80;
    const PREVIEW_SIZE = 100;
    const BUTTON_SIZE = 34;
    const COLOR_CELL_SIZE = 16;
    const SWATCH_SIZE = 24;
    const PALETTE_HEIGHT = 48;

    // Win98 palette (16 colors)
    const palette16 = [
        '#000000', '#FF0000', '#00FF00', '#FFFF00',
        '#0000FF', '#FF00FF', '#00FFFF', '#FFFFFF',
        '#808080', '#C0C0C0', '#800000', '#008000',
        '#808000', '#800080', '#008080', '#000080'
    ];

    // Extended palette (24 colors)
    const palette24 = [
        ...palette16,
        '#A52A2A', '#90EE90', '#DAA520', '#4682B4',
        '#DDA0DD', '#98FB98', '#F0E68C', '#B0C4DE'
    ];

    // State
    let imageData = new ImageData(WIDTH, HEIGHT);
    let pixelSize = INITIAL_PIXEL_SIZE;
    let showGrid = true;
    let currentTool = 'pencil';
    let eraserSize = 1;
    let paletteMode = 16;
    let palette = palette16;
    let primary = { r: 0, g: 0, b: 0, a: 255 }; // Black
    let secondary = { r: 255, g: 255, b: 255, a: 255 }; // White
    let history = [];
    let redoStack = [];
    let drawing = false;

    // Create sprite canvas (offscreen)
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = WIDTH;
    spriteCanvas.height = HEIGHT;
    const spriteCtx = spriteCanvas.getContext('2d');
    spriteCtx.imageSmoothingEnabled = false;

    // Style container
    container.style.cssText = `
        position: relative;
        background: #C0C0C0;
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 8px;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    `;

    // Middle row
    const middleRow = document.createElement('div');
    middleRow.id = 'paint-middle-row';
    middleRow.style.cssText = `
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: row;
    `;

    // Tools panel (2-column grid)
    const toolsDiv = document.createElement('div');
    toolsDiv.style.cssText = `
        width: ${TOOLBAR_WIDTH}px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2px;
        overflow-y: auto;
    `;

    // Button style helper
    const buttonStyle = `
        width: ${BUTTON_SIZE}px;
        height: ${BUTTON_SIZE}px;
        margin: 0;
        background: #C0C0C0;
        border-top: 2px solid #FFFFFF;
        border-left: 2px solid #FFFFFF;
        border-bottom: 2px solid #808080;
        border-right: 2px solid #808080;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        line-height: ${BUTTON_SIZE}px;
        box-sizing: border-box;
        user-select: none;
    `;

    // Toolbar buttons
    const tools = [
        { id: 'new', label: 'N', action: () => newFile() },
        { id: 'save', label: 'S', action: () => saveFile() },
        { id: 'pencil', label: 'P', action: () => setTool('pencil') },
        { id: 'brush', label: 'B', action: () => setTool('brush') },
        { id: 'eraser', label: 'E', action: () => setTool('eraser') },
        { id: 'eraserSize', label: eraserSize === 1 ? '1×1' : '2×2', action: () => toggleEraserSize() },
        { id: 'grid', label: 'G', action: () => toggleGrid() },
        { id: 'zoomIn', label: '+', action: () => zoomIn() },
        { id: 'zoomOut', label: '-', action: () => zoomOut() },
        { id: 'paletteToggle', label: '16', action: () => togglePalette() },
        // TODO placeholders
        { id: 'line', label: 'Line\nTODO', action: () => console.log('TODO: Line tool'), disabled: true },
        { id: 'rect', label: 'Rect\nTODO', action: () => console.log('TODO: Rectangle tool'), disabled: true },
        { id: 'ellipse', label: 'Ellipse\nTODO', action: () => console.log('TODO: Ellipse tool'), disabled: true },
        { id: 'fill', label: 'Fill\nTODO', action: () => console.log('TODO: Fill tool'), disabled: true },
        { id: 'select', label: 'Select\nTODO', action: () => console.log('TODO: Select tool'), disabled: true },
        { id: 'text', label: 'Text\nTODO', action: () => console.log('TODO: Text tool'), disabled: true }
    ];

    const toolButtons = {};
    tools.forEach(tool => {
        const btn = document.createElement('button');
        btn.textContent = tool.label;
        btn.style.cssText = buttonStyle;
        if (tool.disabled) {
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
        }
        btn.addEventListener('click', tool.action);
        toolsDiv.appendChild(btn);
        toolButtons[tool.id] = btn;
    });

    // Preview container
    const previewCont = document.createElement('div');
    previewCont.style.cssText = `
        width: ${PREVIEW_SIZE}px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    // Preview canvas
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = WIDTH;
    previewCanvas.height = HEIGHT;
    previewCanvas.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        border: 2px inset #808080;
        background: #FFFFFF;
        image-rendering: pixelated;
    `;
    const previewCtx = previewCanvas.getContext('2d');
    previewCtx.imageSmoothingEnabled = false;
    previewCont.appendChild(previewCanvas);

    // Main canvas wrapper
    const mainArea = document.createElement('div');
    mainArea.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    `;

    const mainCanvas = document.createElement('canvas');
    mainCanvas.style.cssText = `
        border: 2px inset #808080;
        background: #FFFFFF;
        cursor: crosshair;
        image-rendering: pixelated;
    `;
    const mainCtx = mainCanvas.getContext('2d');
    mainCtx.imageSmoothingEnabled = false;
    mainArea.appendChild(mainCanvas);

    // Palette
    const paletteDiv = document.createElement('div');
    paletteDiv.style.cssText = `
        flex: 0 0 ${PALETTE_HEIGHT}px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px;
        margin: 0;
        box-sizing: border-box;
    `;

    // Color swatches
    const primarySwatch = document.createElement('div');
    primarySwatch.style.cssText = `
        width: ${SWATCH_SIZE}px;
        height: ${SWATCH_SIZE}px;
        border: 2px inset #808080;
        cursor: pointer;
        background: rgb(${primary.r}, ${primary.g}, ${primary.b});
    `;
    primarySwatch.title = 'Primary Color';

    const secondarySwatch = document.createElement('div');
    secondarySwatch.style.cssText = `
        width: ${SWATCH_SIZE}px;
        height: ${SWATCH_SIZE}px;
        border: 2px inset #808080;
        cursor: pointer;
        background: rgb(${secondary.r}, ${secondary.g}, ${secondary.b});
    `;
    secondarySwatch.title = 'Secondary Color';

    const swapBtn = document.createElement('button');
    swapBtn.textContent = '↔';
    swapBtn.style.cssText = buttonStyle.replace('width: 36px; height: 36px;', 'width: 24px; height: 24px;').replace('line-height: 36px;', 'line-height: 24px;');
    swapBtn.addEventListener('click', () => {
        [primary, secondary] = [secondary, primary];
        updateSwatches();
    });

    // Color grid
    const colorGrid = document.createElement('div');
    colorGrid.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 1px;
        flex: 1;
    `;

    paletteDiv.appendChild(primarySwatch);
    paletteDiv.appendChild(secondarySwatch);
    paletteDiv.appendChild(swapBtn);
    paletteDiv.appendChild(colorGrid);

    // Append to container
    container.appendChild(middleRow);
    middleRow.appendChild(toolsDiv);
    middleRow.appendChild(mainArea);
    middleRow.appendChild(previewCont);
    container.appendChild(paletteDiv);

    // Helper functions
    function hexToRgba(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b, a: 255 };
    }

    function setPixel(x, y, color) {
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
        const index = (y * WIDTH + x) * 4;
        imageData.data[index] = color.r;
        imageData.data[index + 1] = color.g;
        imageData.data[index + 2] = color.b;
        imageData.data[index + 3] = color.a;
    }

    function getPixelPos(e) {
        const rect = mainCanvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / pixelSize);
        const y = Math.floor((e.clientY - rect.top) / pixelSize);
        return { x, y };
    }

    function drawChecker(ctx, w, h, cellSize) {
        for (let y = 0; y < h; y += cellSize) {
            for (let x = 0; x < w; x += cellSize) {
                ctx.fillStyle = ((x / cellSize + y / cellSize) & 1) ? '#E8E8E8' : '#F8F8F8';
                ctx.fillRect(x, y, cellSize, cellSize);
            }
        }
    }

    function redrawMain() {
        const w = mainCanvas.width;
        const h = mainCanvas.height;
        mainCtx.clearRect(0, 0, w, h);
        drawChecker(mainCtx, w, h, pixelSize * 2);
        mainCtx.drawImage(spriteCanvas, 0, 0, w, h);
        if (showGrid) {
            mainCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            mainCtx.lineWidth = 1;
            for (let i = 0; i <= WIDTH; i++) {
                const px = i * pixelSize;
                mainCtx.beginPath();
                mainCtx.moveTo(px, 0);
                mainCtx.lineTo(px, h);
                mainCtx.stroke();
                mainCtx.beginPath();
                mainCtx.moveTo(0, px);
                mainCtx.lineTo(w, px);
                mainCtx.stroke();
            }
        }
    }

    function redrawPreview() {
        previewCtx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        drawChecker(previewCtx, PREVIEW_SIZE, PREVIEW_SIZE, CHECKER_SIZE);
        previewCtx.drawImage(spriteCanvas, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    }

    function updateSwatches() {
        primarySwatch.style.background = `rgb(${primary.r}, ${primary.g}, ${primary.b})`;
        secondarySwatch.style.background = `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`;
    }

    function redrawPalette() {
        colorGrid.innerHTML = '';
        palette.forEach(hex => {
            const cell = document.createElement('div');
            cell.style.cssText = `
                width: ${COLOR_CELL_SIZE}px;
                height: ${COLOR_CELL_SIZE}px;
                background: ${hex};
                border: 1px solid #000;
                cursor: pointer;
            `;
            cell.addEventListener('mousedown', e => {
                e.preventDefault();
                const color = hexToRgba(hex);
                if (e.button === 0) primary = color;
                else secondary = color;
                updateSwatches();
            });
            colorGrid.appendChild(cell);
        });
    }

    function setTool(tool) {
        currentTool = tool;
        // Update button styles (simple active state)
        Object.values(toolButtons).forEach(btn => btn.style.borderColor = '#FFFFFF #FFFFFF #808080 #808080');
        if (toolButtons[tool]) {
            toolButtons[tool].style.borderColor = '#808080 #808080 #FFFFFF #FFFFFF';
        }
    }

    function toggleEraserSize() {
        eraserSize = eraserSize === 1 ? 2 : 1;
        toolButtons.eraserSize.textContent = eraserSize === 1 ? '1×1' : '2×2';
    }

    function toggleGrid() {
        showGrid = !showGrid;
        redrawMain();
    }

    function zoomIn() {
        pixelSize = Math.min(MAX_PIXEL_SIZE, pixelSize + 1);
        updateDisplay();
    }

    function zoomOut() {
        pixelSize = Math.max(MIN_PIXEL_SIZE, pixelSize - 1);
        updateDisplay();
    }

    function updateDisplay() {
        mainCanvas.width = WIDTH * pixelSize;
        mainCanvas.height = HEIGHT * pixelSize;
        mainCanvas.style.width = `${mainCanvas.width}px`;
        mainCanvas.style.height = `${mainCanvas.height}px`;
        redrawMain();
    }

    function togglePalette() {
        paletteMode = paletteMode === 16 ? 24 : 16;
        palette = paletteMode === 16 ? palette16 : palette24;
        toolButtons.paletteToggle.textContent = paletteMode.toString();
        redrawPalette();
    }

    function saveState() {
        history.push(new ImageData(new Uint8ClampedArray(imageData.data), WIDTH, HEIGHT));
        if (history.length > 10) history.shift();
        redoStack = [];
    }

    function undo() {
        if (history.length) {
            redoStack.push(new ImageData(new Uint8ClampedArray(imageData.data), WIDTH, HEIGHT));
            imageData = history.pop();
            spriteCtx.putImageData(imageData, 0, 0);
            redrawMain();
            redrawPreview();
        }
    }

    function redo() {
        if (redoStack.length) {
            history.push(new ImageData(new Uint8ClampedArray(imageData.data), WIDTH, HEIGHT));
            imageData = redoStack.pop();
            spriteCtx.putImageData(imageData, 0, 0);
            redrawMain();
            redrawPreview();
        }
    }

    function newFile() {
        saveState();
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255; // R
            imageData.data[i + 1] = 255; // G
            imageData.data[i + 2] = 255; // B
            imageData.data[i + 3] = 255; // A
        }
        spriteCtx.putImageData(imageData, 0, 0);
        redrawMain();
        redrawPreview();
    }

    function saveFile() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = WIDTH;
        tempCanvas.height = HEIGHT;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);
        tempCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sprite.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Event handlers
    container.tabIndex = 0;
    container.focus();
    container.addEventListener('keydown', e => {
        if (e.ctrlKey) {
            if (e.key === 'z') undo();
            else if (e.key === 'y') redo();
            else if (e.key === 'n') newFile();
            e.preventDefault();
        }
    });

    mainCanvas.addEventListener('mousedown', e => {
        e.preventDefault();
        saveState();
        drawing = true;
        draw(e);
    });

    mainCanvas.addEventListener('mousemove', e => {
        if (drawing) draw(e);
    });

    mainCanvas.addEventListener('mouseup', () => {
        drawing = false;
    });

    mainCanvas.addEventListener('mouseout', () => {
        drawing = false;
    });

    mainCanvas.addEventListener('wheel', e => {
        e.preventDefault();
        pixelSize += e.deltaY > 0 ? -1 : 1;
        pixelSize = Math.max(MIN_PIXEL_SIZE, Math.min(MAX_PIXEL_SIZE, pixelSize));
        updateDisplay();
    });

    function draw(e) {
        const { x, y } = getPixelPos(e);
        const color = e.button === 0 ? primary : secondary;
        if (currentTool === 'pencil') {
            setPixel(x, y, color);
        } else if (currentTool === 'brush') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx * dx + dy * dy <= 1.4) setPixel(x + dx, y + dy, color);
                }
            }
        } else if (currentTool === 'eraser') {
            for (let dx = 0; dx < eraserSize; dx++) {
                for (let dy = 0; dy < eraserSize; dy++) {
                    setPixel(x + dx, y + dy, { r: 255, g: 255, b: 255, a: 255 });
                }
            }
        }
        spriteCtx.putImageData(imageData, 0, 0);
        redrawMain();
        redrawPreview();
    }

    // Initial setup
    setTool('pencil');
    newFile();
    redrawPalette();
    updateDisplay();
    redrawPreview();

    function resize(newWidth, newHeight) {
        // Compute available space for main canvas
        const availW = newWidth - TOOLBAR_WIDTH - PREVIEW_SIZE - 32; // padding/gaps
        const availH = newHeight - PALETTE_HEIGHT - 16; // palette + padding
        const maxPS = Math.floor(Math.min(availW / WIDTH, availH / HEIGHT));
        pixelSize = Math.max(MIN_PIXEL_SIZE, Math.min(INITIAL_PIXEL_SIZE, maxPS));
        updateDisplay();
    }

    function destroy() {
        container.innerHTML = '';
    }

    return { resize, destroy };
}