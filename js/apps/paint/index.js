/**
 * js/apps/mspaint/index.js
 * Win98-style MSPaint — 32×32 sprite/character editor
 */

export function createApp(container) {

    /* ── STATE ─────────────────────────────────────────────── */
    const COLS = 32, ROWS = 32;
    const pixels = new Uint32Array(COLS * ROWS).fill(0xFFFFFFFF); // ABGR-ish, stored as RGBA
    // We'll store as hex strings for simplicity
    const pixelColors = Array(COLS * ROWS).fill('#ffffff');

    const state = {
        tool: 'pencil',       // pencil | eraser | fill | eyedropper | line | rect | ellipse
        color1: '#000000',    // primary (left)
        color2: '#ffffff',    // secondary (right)
        activeBtn: 1,         // which mouse button is active: 1=left, 3=right
        zoom: 12,             // px per cell
        drawing: false,
        lineStart: null,
        rectStart: null,
        ellipseStart: null,
        history: [],
        historyIndex: -1,
        gridVisible: true,
    };

    /* ── WIN98 PALETTE ─────────────────────────────────────── */
    const palette = [
        '#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080',
        '#C0C0C0','#FFFFFF','#FF0000','#FFFF00','#00FF00','#00FFFF','#0000FF','#FF00FF',
        '#FF8040','#804000','#804040','#408080','#4040FF','#FF40FF','#FF8080','#FFFF80',
        '#80FF80','#80FFFF','#8080FF','#FF80C0','#FF8040','#C0C0FF','#FFD700','#FF6347',
    ];

    /* ── ROOT LAYOUT ───────────────────────────────────────── */
    container.style.cssText = `
        background:#C0C0C0;
        display:flex;flex-direction:column;
        width:100%;height:100%;overflow:hidden;
        font-family:'MS Sans Serif',Arial,sans-serif;font-size:11px;
        user-select:none;
    `;

    /* ── MENU BAR ──────────────────────────────────────────── */
    const menuBar = document.createElement('div');
    menuBar.style.cssText = `
        display:flex;align-items:center;
        background:#C0C0C0;
        border-bottom:1px solid #808080;
        padding:2px 4px;flex-shrink:0;
        gap:2px;
    `;

    let openMenu = null;

    function closeAllMenus() {
        document.querySelectorAll('.win98-dropdown').forEach(d => d.remove());
        openMenu = null;
    }

    function makeMenu(label, items) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            background:transparent;border:none;padding:2px 6px;cursor:pointer;
            font-family:inherit;font-size:11px;color:#000;
        `;
        btn.addEventListener('mouseenter', () => {
            if (openMenu && openMenu !== label) {
                closeAllMenus();
                openMenuDropdown(btn, label, items);
            }
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (openMenu === label) { closeAllMenus(); return; }
            closeAllMenus();
            openMenuDropdown(btn, label, items);
        });
        return btn;
    }

    function openMenuDropdown(btn, label, items) {
        openMenu = label;
        const rect = btn.getBoundingClientRect();
        const drop = document.createElement('div');
        drop.className = 'win98-dropdown';
        drop.style.cssText = `
            position:fixed;z-index:9999;
            background:#C0C0C0;
            border:2px outset #FFFFFF;
            box-shadow:2px 2px 0 #000;
            min-width:140px;
            left:${rect.left}px;top:${rect.bottom}px;
        `;
        items.forEach(item => {
            if (item === '---') {
                const sep = document.createElement('div');
                sep.style.cssText = 'border-top:1px solid #808080;margin:2px 4px;';
                drop.appendChild(sep);
            } else {
                const row = document.createElement('div');
                row.style.cssText = `
                    padding:3px 20px 3px 24px;cursor:pointer;color:#000;
                    white-space:nowrap;
                `;
                row.textContent = item.label;
                if (item.disabled) { row.style.color='#808080'; row.style.cursor='default'; }
                row.addEventListener('mouseenter', () => { if (!item.disabled) row.style.background='#000080'; row.style.color=(!item.disabled)?'#fff':'#808080'; });
                row.addEventListener('mouseleave', () => { row.style.background=''; row.style.color=item.disabled?'#808080':'#000'; });
                row.addEventListener('click', () => { closeAllMenus(); if (item.action) item.action(); });
                drop.appendChild(row);
            }
        });
        document.body.appendChild(drop);
        btn.style.background='#000080';btn.style.color='#fff';
        setTimeout(() => {
            document.addEventListener('click', closeAllMenus, {once:true});
        }, 0);
    }

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey||e.metaKey) && e.key==='z') { e.preventDefault(); undo(); }
        if ((e.ctrlKey||e.metaKey) && e.key==='y') { e.preventDefault(); redo(); }
    });

    function saveHistory() {
        const snap = [...pixelColors];
        state.history = state.history.slice(0, state.historyIndex+1);
        state.history.push(snap);
        if (state.history.length > 50) state.history.shift();
        state.historyIndex = state.history.length - 1;
    }
    function undo() {
        if (state.historyIndex <= 0) return;
        state.historyIndex--;
        pixelColors.splice(0, pixelColors.length, ...state.history[state.historyIndex]);
        renderCanvas();
    }
    function redo() {
        if (state.historyIndex >= state.history.length-1) return;
        state.historyIndex++;
        pixelColors.splice(0, pixelColors.length, ...state.history[state.historyIndex]);
        renderCanvas();
    }

    function clearCanvas() {
        saveHistory();
        pixelColors.fill('#ffffff');
        renderCanvas();
    }

    function downloadPNG() {
        const offscreen = document.createElement('canvas');
        offscreen.width = COLS; offscreen.height = ROWS;
        const ctx = offscreen.getContext('2d');
        for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
            ctx.fillStyle = pixelColors[r*COLS+c];
            ctx.fillRect(c,r,1,1);
        }
        const a = document.createElement('a');
        a.href = offscreen.toDataURL('image/png');
        a.download = 'sprite.png';
        a.click();
    }

    const fileItems = [
        {label:'New',       action: () => { if (confirm('Clear canvas?')) clearCanvas(); }},
        {label:'Save (PNG)',action: downloadPNG},
        '---',
        {label:'Exit',      action: () => { if(window.closeWindow) window.closeWindow(); }},
    ];
    const editItems = [
        {label:'Undo  Ctrl+Z', action: undo},
        {label:'Redo  Ctrl+Y', action: redo},
        '---',
        {label:'Select All',  disabled:true},
        {label:'Clear Image', action: () => { if(confirm('Clear?')) clearCanvas(); }},
    ];
    const viewItems = [
        {label:'Toggle Grid', action: () => { state.gridVisible=!state.gridVisible; renderCanvas(); }},
        {label:'Zoom In  +',  action: () => { state.zoom=Math.min(state.zoom+2,24); updateCanvasSize(); renderCanvas(); }},
        {label:'Zoom Out −', action: () => { state.zoom=Math.max(state.zoom-2,4);  updateCanvasSize(); renderCanvas(); }},
    ];

    menuBar.appendChild(makeMenu('File', fileItems));
    menuBar.appendChild(makeMenu('Edit', editItems));
    menuBar.appendChild(makeMenu('View', viewItems));
    container.appendChild(menuBar);

    /* ── BODY (toolbar + canvas area) ─────────────────────── */
    const body = document.createElement('div');
    body.style.cssText = `display:flex;flex:1;overflow:hidden;`;

    /* ── TOOLBAR ───────────────────────────────────────────── */
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
        width:56px;flex-shrink:0;
        background:#C0C0C0;
        border-right:2px solid #808080;
        display:flex;flex-direction:column;
        align-items:center;
        padding:4px 2px;gap:2px;
        overflow:hidden;
    `;

    const tools = [
        {id:'pencil',     icon:'✏️', tip:'Pencil'},
        {id:'eraser',     icon:'◻',  tip:'Eraser'},
        {id:'fill',       icon:'🪣', tip:'Fill'},
        {id:'eyedropper', icon:'💉', tip:'Pick Color'},
        {id:'line',       icon:'╲',  tip:'Line'},
        {id:'rect',       icon:'▭',  tip:'Rectangle'},
        {id:'ellipse',    icon:'◯',  tip:'Ellipse'},
    ];

    const toolBtns = {};
    // Lay out in a 2-col grid
    const toolGrid = document.createElement('div');
    toolGrid.style.cssText = `display:grid;grid-template-columns:1fr 1fr;gap:2px;width:100%;`;

    tools.forEach(t => {
        const btn = document.createElement('button');
        btn.title = t.tip;
        btn.textContent = t.icon;
        btn.style.cssText = `
            width:24px;height:24px;padding:0;
            font-size:14px;line-height:24px;text-align:center;
            background:#C0C0C0;cursor:pointer;
            border:2px outset #FFFFFF;
            display:flex;align-items:center;justify-content:center;
        `;
        btn.addEventListener('click', () => selectTool(t.id));
        toolGrid.appendChild(btn);
        toolBtns[t.id] = btn;
    });
    toolbar.appendChild(toolGrid);

    // Size selector (brush size) — only for pencil/eraser
    const sizeSep = document.createElement('div');
    sizeSep.style.cssText='border-top:1px solid #808080;width:90%;margin:4px 0;';
    toolbar.appendChild(sizeSep);

    const sizes = [1,2,3,4];
    const sizeBtns = {};
    const sizeGrid = document.createElement('div');
    sizeGrid.style.cssText=`display:flex;flex-direction:column;align-items:center;gap:2px;`;
    sizes.forEach(s => {
        const sb = document.createElement('button');
        sb.title = `Size ${s}`;
        sb.style.cssText=`
            width:44px;height:16px;background:#C0C0C0;cursor:pointer;
            border:2px outset #fff;display:flex;align-items:center;justify-content:center;
        `;
        const dot = document.createElement('div');
        dot.style.cssText=`background:#000;width:${s*3}px;height:${s*3}px;border-radius:50%;`;
        sb.appendChild(dot);
        sb.addEventListener('click', () => {
            state.brushSize = s;
            Object.values(sizeBtns).forEach(b=>b.style.border='2px outset #fff');
            sb.style.border='2px inset #808080';
        });
        sizeGrid.appendChild(sb);
        sizeBtns[s] = sb;
    });
    state.brushSize = 1;
    sizeBtns[1].style.border='2px inset #808080';
    toolbar.appendChild(sizeGrid);

    function selectTool(id) {
        state.tool = id;
        Object.values(toolBtns).forEach(b => {
            b.style.border = '2px outset #FFFFFF';
            b.style.background = '#C0C0C0';
        });
        toolBtns[id].style.border = '2px inset #808080';
        toolBtns[id].style.background = '#A0A0A0';
    }
    selectTool('pencil');

    body.appendChild(toolbar);

    /* ── CANVAS AREA ───────────────────────────────────────── */
    const canvasArea = document.createElement('div');
    canvasArea.style.cssText = `
        flex:1;overflow:auto;
        background:#808080;
        display:flex;align-items:flex-start;justify-content:flex-start;
        padding:8px;
    `;

    // Outer canvas wrapper (raised border like Win98)
    const canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = `
        display:inline-block;
        border:2px inset #808080;
        flex-shrink:0;position:relative;
    `;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = `display:block;cursor:crosshair;image-rendering:pixelated;`;
    canvasWrap.appendChild(canvas);

    // Overlay canvas for shape preview
    const overlay = document.createElement('canvas');
    overlay.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;`;
    canvasWrap.appendChild(overlay);

    canvasArea.appendChild(canvasWrap);
    body.appendChild(canvasArea);

    function updateCanvasSize() {
        const w = COLS * state.zoom, h = ROWS * state.zoom;
        canvas.width = w; canvas.height = h;
        overlay.width = w; overlay.height = h;
        canvas.style.width = w+'px'; canvas.style.height = h+'px';
        overlay.style.width = w+'px'; overlay.style.height = h+'px';
    }
    updateCanvasSize();

    /* ── CANVAS RENDERING ──────────────────────────────────── */
    const ctx = canvas.getContext('2d');
    const octx = overlay.getContext('2d');

    function renderCanvas() {
        const z = state.zoom;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        for (let r=0;r<ROWS;r++) {
            for (let c=0;c<COLS;c++) {
                ctx.fillStyle = pixelColors[r*COLS+c];
                ctx.fillRect(c*z, r*z, z, z);
            }
        }
        if (state.gridVisible && z >= 6) {
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 0.5;
            for (let c=0;c<=COLS;c++) { ctx.beginPath();ctx.moveTo(c*z,0);ctx.lineTo(c*z,canvas.height);ctx.stroke(); }
            for (let r=0;r<=ROWS;r++) { ctx.beginPath();ctx.moveTo(0,r*z);ctx.lineTo(canvas.width,r*z);ctx.stroke(); }
        }
        updatePreview();
    }

    /* ── PREVIEW ───────────────────────────────────────────── */
    const previewWrap = document.createElement('div');
    previewWrap.style.cssText=`display:flex;flex-direction:column;align-items:center;padding:4px;gap:2px;flex-shrink:0;`;
    const previewLabel = document.createElement('div');
    previewLabel.textContent='Preview';
    previewLabel.style.cssText='font-size:10px;color:#000;';
    previewWrap.appendChild(previewLabel);
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width=COLS;previewCanvas.height=ROWS;
    previewCanvas.style.cssText=`width:64px;height:64px;border:2px inset #808080;image-rendering:pixelated;`;
    previewWrap.appendChild(previewCanvas);
    const pctx = previewCanvas.getContext('2d');

    function updatePreview() {
        pctx.clearRect(0,0,COLS,ROWS);
        for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
            pctx.fillStyle = pixelColors[r*COLS+c];
            pctx.fillRect(c,r,1,1);
        }
    }

    /* ── BOTTOM STATUS/COLOR BAR ───────────────────────────── */
    const bottomBar = document.createElement('div');
    bottomBar.style.cssText = `
        display:flex;align-items:center;gap:4px;
        background:#C0C0C0;
        border-top:2px solid #808080;
        padding:3px 6px;flex-shrink:0;
        flex-wrap:wrap;
    `;

    // Active colors display (foreground/background swatch)
    const swatchGroup = document.createElement('div');
    swatchGroup.style.cssText='position:relative;width:36px;height:28px;flex-shrink:0;margin-right:8px;';

    const swatch2 = document.createElement('div'); // bg (back)
    swatch2.style.cssText=`position:absolute;bottom:0;right:0;width:22px;height:18px;border:2px inset #808080;cursor:pointer;`;
    swatch2.title='Right-click color (secondary)';
    const swatch1 = document.createElement('div'); // fg (front)
    swatch1.style.cssText=`position:absolute;top:0;left:0;width:22px;height:18px;border:2px inset #808080;cursor:pointer;`;
    swatch1.title='Left-click color (primary)';

    swatchGroup.appendChild(swatch2);
    swatchGroup.appendChild(swatch1);
    bottomBar.appendChild(swatchGroup);

    function updateSwatches() {
        swatch1.style.background = state.color1;
        swatch2.style.background = state.color2;
    }
    updateSwatches();

    // Palette
    const paletteDiv = document.createElement('div');
    paletteDiv.style.cssText=`display:flex;flex-wrap:wrap;width:${palette.length/2*14}px;`;
    palette.forEach(c => {
        const cell = document.createElement('div');
        cell.style.cssText=`width:13px;height:13px;background:${c};border:1px outset #fff;cursor:pointer;flex-shrink:0;`;
        cell.title=c;
        cell.addEventListener('click',    () => { state.color1=c; updateSwatches(); });
        cell.addEventListener('contextmenu', e => { e.preventDefault(); state.color2=c; updateSwatches(); });
        paletteDiv.appendChild(cell);
    });
    bottomBar.appendChild(paletteDiv);

    // Separator
    const sep2 = document.createElement('div');
    sep2.style.cssText='border-left:2px inset #808080;height:28px;margin:0 4px;';
    bottomBar.appendChild(sep2);

    // Preview in bottom bar
    bottomBar.appendChild(previewWrap);

    // Coordinates label
    const coordLabel = document.createElement('div');
    coordLabel.style.cssText='font-size:10px;color:#000;margin-left:auto;';
    coordLabel.textContent='0, 0';
    bottomBar.appendChild(coordLabel);

    /* ── ASSEMBLE ──────────────────────────────────────────── */
    container.appendChild(body);
    container.appendChild(bottomBar);

    /* ── DRAWING LOGIC ─────────────────────────────────────── */
    function getCellFromEvent(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const c = Math.floor(x / state.zoom), r = Math.floor(y / state.zoom);
        return {c, r, valid: c>=0&&c<COLS&&r>=0&&r<ROWS};
    }

    function getColor(btn) { return btn===2 ? state.color2 : state.color1; }

    function setPixel(c, r, color) {
        if (c<0||c>=COLS||r<0||r>=ROWS) return;
        pixelColors[r*COLS+c] = color;
    }

    function paintBrush(c, r, color) {
        const s = state.brushSize - 1;
        for (let dr=-s;dr<=s;dr++) for (let dc=-s;dc<=s;dc++) setPixel(c+dc, r+dr, color);
    }

    function floodFill(c, r, newColor) {
        const idx = r*COLS+c;
        const oldColor = pixelColors[idx];
        if (oldColor === newColor) return;
        const stack = [[c,r]];
        while (stack.length) {
            const [cc,rr] = stack.pop();
            if (cc<0||cc>=COLS||rr<0||rr>=ROWS) continue;
            if (pixelColors[rr*COLS+cc] !== oldColor) continue;
            pixelColors[rr*COLS+cc] = newColor;
            stack.push([cc+1,rr],[cc-1,rr],[cc,rr+1],[cc,rr-1]);
        }
    }

    // Bresenham line
    function getLinePixels(x0,y0,x1,y1) {
        const pts=[];
        let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0);
        let sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
        while(true){
            pts.push([x0,y0]);
            if(x0===x1&&y0===y1) break;
            const e2=2*err;
            if(e2>-dy){err-=dy;x0+=sx;}
            if(e2<dx){err+=dx;y0+=sy;}
        }
        return pts;
    }

    function getRectPixels(x0,y0,x1,y1) {
        const pts=[];
        const minX=Math.min(x0,x1),maxX=Math.max(x0,x1);
        const minY=Math.min(y0,y1),maxY=Math.max(y0,y1);
        for(let x=minX;x<=maxX;x++){pts.push([x,minY]);pts.push([x,maxY]);}
        for(let y=minY+1;y<maxY;y++){pts.push([minX,y]);pts.push([maxX,y]);}
        return pts;
    }

    function getEllipsePixels(x0,y0,x1,y1) {
        const pts=[];
        const cx=(x0+x1)/2,cy=(y0+y1)/2;
        const rx=Math.abs(x1-x0)/2,ry=Math.abs(y1-y0)/2;
        const steps=Math.ceil(2*Math.PI*Math.max(rx,ry));
        for(let i=0;i<steps;i++){
            const a=2*Math.PI*i/steps;
            pts.push([Math.round(cx+rx*Math.cos(a)),Math.round(cy+ry*Math.sin(a))]);
        }
        return pts;
    }

    function drawOverlay(pts, color) {
        octx.clearRect(0,0,overlay.width,overlay.height);
        const z=state.zoom;
        octx.fillStyle=color;
        const drawn=new Set();
        pts.forEach(([c,r])=>{
            const key=`${c},${r}`;
            if(drawn.has(key)||c<0||c>=COLS||r<0||r>=ROWS) return;
            drawn.add(key);
            octx.fillRect(c*z,r*z,z,z);
        });
    }

    // Mouse handlers
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousemove', e => {
        const {c, r, valid} = getCellFromEvent(e);
        if (valid) coordLabel.textContent = `${c}, ${r}`;

        if (!state.drawing) return;
        const color = getColor(state.activeBtn);

        if (state.tool==='pencil'||state.tool==='eraser') {
            const col = state.tool==='eraser' ? '#ffffff' : color;
            paintBrush(c, r, col);
            renderCanvas();
        }
        if (state.tool==='line' && state.lineStart) {
            const pts = getLinePixels(state.lineStart.c,state.lineStart.r,c,r);
            drawOverlay(pts, color);
        }
        if (state.tool==='rect' && state.rectStart) {
            const pts = getRectPixels(state.rectStart.c,state.rectStart.r,c,r);
            drawOverlay(pts, color);
        }
        if (state.tool==='ellipse' && state.ellipseStart) {
            const pts = getEllipsePixels(state.ellipseStart.c,state.ellipseStart.r,c,r);
            drawOverlay(pts, color);
        }
    });

    canvas.addEventListener('mousedown', e => {
        e.preventDefault();
        state.drawing = true;
        state.activeBtn = e.button===2 ? 2 : 1;
        const {c, r, valid} = getCellFromEvent(e);
        if (!valid) return;
        const color = getColor(state.activeBtn);

        if (state.tool==='pencil') { saveHistory(); paintBrush(c,r,color); renderCanvas(); }
        if (state.tool==='eraser') { saveHistory(); paintBrush(c,r,'#ffffff'); renderCanvas(); }
        if (state.tool==='fill')   { saveHistory(); floodFill(c,r,color); renderCanvas(); }
        if (state.tool==='eyedropper') {
            const picked = pixelColors[r*COLS+c];
            if (state.activeBtn===2) state.color2=picked; else state.color1=picked;
            updateSwatches();
        }
        if (state.tool==='line')    { saveHistory(); state.lineStart={c,r}; }
        if (state.tool==='rect')    { saveHistory(); state.rectStart={c,r}; }
        if (state.tool==='ellipse') { saveHistory(); state.ellipseStart={c,r}; }
    });

    canvas.addEventListener('mouseup', e => {
        if (!state.drawing) return;
        state.drawing = false;
        const {c, r, valid} = getCellFromEvent(e);
        const color = getColor(state.activeBtn);

        if (state.tool==='line' && state.lineStart) {
            if(valid) getLinePixels(state.lineStart.c,state.lineStart.r,c,r).forEach(([cc,rr])=>setPixel(cc,rr,color));
            state.lineStart=null;
            octx.clearRect(0,0,overlay.width,overlay.height);
            renderCanvas();
        }
        if (state.tool==='rect' && state.rectStart) {
            if(valid) getRectPixels(state.rectStart.c,state.rectStart.r,c,r).forEach(([cc,rr])=>setPixel(cc,rr,color));
            state.rectStart=null;
            octx.clearRect(0,0,overlay.width,overlay.height);
            renderCanvas();
        }
        if (state.tool==='ellipse' && state.ellipseStart) {
            if(valid) getEllipsePixels(state.ellipseStart.c,state.ellipseStart.r,c,r).forEach(([cc,rr])=>setPixel(cc,rr,color));
            state.ellipseStart=null;
            octx.clearRect(0,0,overlay.width,overlay.height);
            renderCanvas();
        }
    });

    canvas.addEventListener('mouseleave', () => {
        coordLabel.textContent = '';
    });

    /* ── KEYBOARD SHORTCUTS ────────────────────────────────── */
    container.setAttribute('tabindex','0');
    container.addEventListener('keydown', e => {
        const map = {'p':'pencil','e':'eraser','f':'fill','k':'eyedropper','l':'line','r':'rect','o':'ellipse'};
        if (map[e.key]) selectTool(map[e.key]);
        if (e.key==='+') { state.zoom=Math.min(state.zoom+2,24); updateCanvasSize(); renderCanvas(); }
        if (e.key==='-') { state.zoom=Math.max(state.zoom-2,4);  updateCanvasSize(); renderCanvas(); }
    });

    /* ── INIT ──────────────────────────────────────────────── */
    saveHistory(); // initial blank state
    renderCanvas();

    /* ── RESIZE / DESTROY ──────────────────────────────────── */
    function resize(w, h) {
        // flex layout handles it
    }

    function destroy() {
        container.innerHTML = '';
    }

    return { resize, destroy };
}
