// Game logic inlined so a single file deploys reliably on static hosts.
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' };
const VALUE_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function isRed(card) {
    return card.suit === 'hearts' || card.suit === 'diamonds';
}

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (let value = 1; value <= 13; value++) {
            deck.push({ suit, value, faceUp: false });
        }
    }
    return deck;
}

function shuffle(deck) {
    const cards = [...deck];
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}

function createInitialState(drawCount = 3) {
    const deck = shuffle(createDeck());
    const tableau = [[], [], [], [], [], [], []];
    let index = 0;
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = deck[index++];
            card.faceUp = row === col;
            tableau[col].push(card);
        }
    }
    return {
        tableau,
        foundations: [[], [], [], []],
        stock: deck.slice(index).map(card => ({ ...card, faceUp: false })),
        waste: [],
        drawCount,
        score: 0,
        moves: 0,
        passes: 0,
        won: false,
        history: []
    };
}

function cloneCard(card) {
    return { suit: card.suit, value: card.value, faceUp: card.faceUp };
}

function pushHistory(state) {
    state.history.push({
        tableau: state.tableau.map(col => col.map(cloneCard)),
        foundations: state.foundations.map(col => col.map(cloneCard)),
        stock: state.stock.map(cloneCard),
        waste: state.waste.map(cloneCard),
        score: state.score,
        moves: state.moves,
        passes: state.passes,
        won: state.won
    });
    if (state.history.length > 50) state.history.shift();
}

function undo(state) {
    const snapshot = state.history.pop();
    if (!snapshot) return false;
    state.tableau = snapshot.tableau;
    state.foundations = snapshot.foundations;
    state.stock = snapshot.stock;
    state.waste = snapshot.waste;
    state.score = snapshot.score;
    state.moves = snapshot.moves;
    state.passes = snapshot.passes;
    state.won = snapshot.won;
    return true;
}

function canPlaceOnTableau(card, targetCard) {
    if (!targetCard) return card.value === 13;
    return isRed(card) !== isRed(targetCard) && card.value === targetCard.value - 1;
}

function canPlaceOnFoundation(card, foundationTop) {
    if (!foundationTop) return card.value === 1;
    return card.suit === foundationTop.suit && card.value === foundationTop.value + 1;
}

function checkWin(state) {
    const total = state.foundations.reduce((sum, pile) => sum + pile.length, 0);
    state.won = total === 52;
}

function applyScore(state, delta) {
    state.score = Math.max(0, state.score + delta);
}

function drawFromStock(state) {
    if (state.won) return false;
    pushHistory(state);
    state.moves++;
    if (state.stock.length > 0) {
        const count = Math.min(state.drawCount, state.stock.length);
        for (let i = 0; i < count; i++) {
            const card = state.stock.pop();
            card.faceUp = true;
            state.waste.push(card);
        }
        return true;
    }
    if (state.waste.length === 0) {
        state.history.pop();
        state.moves--;
        return false;
    }
    state.passes++;
    applyScore(state, state.drawCount === 1 ? -100 : -20);
    while (state.waste.length > 0) {
        const card = state.waste.pop();
        card.faceUp = false;
        state.stock.unshift(card);
    }
    return true;
}

function getMovableStack(tableau, col, cardIndex) {
    const column = tableau[col];
    if (!column[cardIndex] || !column[cardIndex].faceUp) return null;
    for (let i = cardIndex; i < column.length; i++) {
        if (!column[i].faceUp) return null;
        if (i > cardIndex) {
            const prev = column[i - 1];
            const curr = column[i];
            if (isRed(prev) === isRed(curr) || curr.value !== prev.value - 1) return null;
        }
    }
    return column.slice(cardIndex);
}

function moveTableauStack(state, fromCol, cardIndex, toCol) {
    const stack = getMovableStack(state.tableau, fromCol, cardIndex);
    if (!stack) return false;
    const targetCol = state.tableau[toCol];
    const targetCard = targetCol[targetCol.length - 1] || null;
    if (!canPlaceOnTableau(stack[0], targetCard) || fromCol === toCol) return false;
    pushHistory(state);
    state.moves++;
    const sourceCol = state.tableau[fromCol];
    sourceCol.splice(cardIndex);
    targetCol.push(...stack);
    const sourceTop = sourceCol[sourceCol.length - 1];
    if (sourceTop && !sourceTop.faceUp) {
        sourceTop.faceUp = true;
        applyScore(state, 5);
    }
    checkWin(state);
    return true;
}

function moveWasteToTableau(state, toCol) {
    const card = state.waste[state.waste.length - 1];
    if (!card) return false;
    const targetCol = state.tableau[toCol];
    const targetCard = targetCol[targetCol.length - 1] || null;
    if (!canPlaceOnTableau(card, targetCard)) return false;
    pushHistory(state);
    state.moves++;
    state.waste.pop();
    targetCol.push(card);
    applyScore(state, 5);
    checkWin(state);
    return true;
}

function moveToFoundation(state, source, fromCol, cardIndex = null) {
    let card;
    if (source === 'waste') {
        card = state.waste[state.waste.length - 1];
        if (!card) return false;
    } else if (source === 'tableau') {
        const column = state.tableau[fromCol];
        if (cardIndex !== column.length - 1) return false;
        card = column[column.length - 1];
        if (!card || !card.faceUp) return false;
    } else {
        return false;
    }
    const foundationIndex = SUITS.indexOf(card.suit);
    const foundationTop = state.foundations[foundationIndex][state.foundations[foundationIndex].length - 1] || null;
    if (!canPlaceOnFoundation(card, foundationTop)) return false;
    pushHistory(state);
    state.moves++;
    if (source === 'waste') {
        state.waste.pop();
        applyScore(state, 10);
    } else {
        state.tableau[fromCol].pop();
        const sourceTop = state.tableau[fromCol][state.tableau[fromCol].length - 1];
        if (sourceTop && !sourceTop.faceUp) {
            sourceTop.faceUp = true;
            applyScore(state, 5);
        }
        applyScore(state, 10);
    }
    state.foundations[foundationIndex].push(card);
    checkWin(state);
    return true;
}

function moveFoundationToTableau(state, foundationIndex, toCol) {
    const foundation = state.foundations[foundationIndex];
    const card = foundation[foundation.length - 1];
    if (!card) return false;
    const targetCol = state.tableau[toCol];
    const targetCard = targetCol[targetCol.length - 1] || null;
    if (!canPlaceOnTableau(card, targetCard)) return false;
    pushHistory(state);
    state.moves++;
    foundation.pop();
    targetCol.push(card);
    applyScore(state, -15);
    state.won = false;
    return true;
}

function canAutoComplete(state) {
    const allFaceUp = state.tableau.every(col => col.every(card => card.faceUp));
    return allFaceUp && state.stock.length === 0 && state.waste.length === 0;
}

function autoCompleteMoves(state) {
    if (!canAutoComplete(state)) return false;
    pushHistory(state);
    state.moves++;
    let progressed = true;
    let anyMoved = false;
    while (progressed && !state.won) {
        progressed = false;
        for (let col = 0; col < 7; col++) {
            const column = state.tableau[col];
            if (column.length === 0) continue;
            const card = column[column.length - 1];
            if (!card.faceUp) continue;
            const foundationIndex = SUITS.indexOf(card.suit);
            const foundationTop = state.foundations[foundationIndex][state.foundations[foundationIndex].length - 1] || null;
            if (canPlaceOnFoundation(card, foundationTop)) {
                column.pop();
                state.foundations[foundationIndex].push(card);
                applyScore(state, 10);
                progressed = true;
                anyMoved = true;
                checkWin(state);
                break;
            }
        }
    }
    if (!anyMoved) {
        const snap = state.history.pop();
        state.moves = snap.moves;
    }
    return anyMoved;
}

function newGame(drawCount = 3) {
    return createInitialState(drawCount);
}

export function createApp(container) {
    const BASE_WIDTH = 640;
    const BASE_HEIGHT = 480;
    const CARD_W = 52;
    const CARD_H = 72;
    const CARD_OVERLAP = 18;
    const MIN_SCALE = 0.65;
    const MAX_SCALE = 1.35;

    let state = createInitialState(3);
    let scale = 1;
    let elapsed = 0;
    let timerRunning = true;
    let timerId = null;
    let drag = null;
    let didDrag = false;
    let lastClick = { time: 0, source: null, col: -1, index: -1 };
    let winAnim = null;
    let animFrameId = null;
    let prevWon = false;

    container.style.cssText = `
        display: flex;
        flex-direction: column;
        background: #008000;
        margin: 0;
        padding: 0;
        font-family: 'MS Sans Serif', Arial, sans-serif;
        box-sizing: border-box;
        overflow: hidden;
        width: 100%;
        height: 100%;
        user-select: none;
    `;

    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: #C0C0C0;
        border-bottom: 2px inset #808080;
        flex-shrink: 0;
    `;

    function makeBtn(label, onClick) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            font-family: inherit;
            font-size: 11px;
            padding: 2px 10px;
            background: #C0C0C0;
            border: 2px outset #FFFFFF;
            cursor: pointer;
        `;
        btn.addEventListener('mousedown', e => e.preventDefault());
        btn.addEventListener('click', onClick);
        return btn;
    }

    const statusBar = document.createElement('div');
    statusBar.style.cssText = `
        margin-left: auto;
        font-size: 11px;
        color: #000;
        display: flex;
        gap: 12px;
    `;

    const scoreEl = document.createElement('span');
    const movesEl = document.createElement('span');
    const timeEl = document.createElement('span');
    statusBar.appendChild(scoreEl);
    statusBar.appendChild(movesEl);
    statusBar.appendChild(timeEl);

    toolbar.appendChild(makeBtn('Game', () => startNewGame()));
    toolbar.appendChild(makeBtn('Undo', () => doUndo()));
    toolbar.appendChild(statusBar);
    container.appendChild(toolbar);

    const canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        min-height: 0;
    `;
    container.appendChild(canvasWrap);

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display: block; border: 2px inset #808080; cursor: default;';
    canvasWrap.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const layout = {
        stock: { x: 10, y: 10 },
        waste: { x: 72, y: 10 },
        foundations: [360, 422, 484, 546].map(x => ({ x, y: 10 })),
        tableau: [10, 92, 174, 256, 338, 420, 502].map(x => ({ x, y: 100 }))
    };

    function s(v) {
        return v * scale;
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    function updateStatus() {
        scoreEl.textContent = `Score: ${state.score}`;
        movesEl.textContent = `Moves: ${state.moves}`;
        timeEl.textContent = `Time: ${formatTime(elapsed)}`;
    }

    function startTimer() {
        if (timerId) clearInterval(timerId);
        timerId = setInterval(() => {
            if (timerRunning && !state.won) {
                elapsed++;
                updateStatus();
            }
        }, 1000);
    }

    function stopWinAnimation() {
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        winAnim = null;
        prevWon = false;
    }

    function startWinAnimation() {
        const particles = [];
        state.foundations.forEach((pile, fi) => {
            const baseX = s(layout.foundations[fi].x);
            const baseY = s(layout.foundations[fi].y);
            pile.forEach((card, ci) => {
                particles.push({
                    card,
                    x: baseX,
                    y: baseY - ci * s(3),
                    vx: (Math.random() - 0.5) * s(7),
                    vy: -s(5) - Math.random() * s(4),
                    active: false,
                    releaseAt: fi * 14 + ci * 2
                });
            });
        });

        winAnim = { particles, frame: 0, bannerAlpha: 0 };
        if (animFrameId) cancelAnimationFrame(animFrameId);

        const loop = () => {
            if (!winAnim) return;
            winAnim.frame++;
            render();
            animFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    function updateWinParticles() {
        const cardW = s(CARD_W);
        const cardH = s(CARD_H);
        const gravity = s(0.35);
        const damp = 0.92;

        winAnim.particles.forEach(p => {
            if (winAnim.frame < p.releaseAt) return;
            if (!p.active) {
                p.active = true;
                p.vx += (Math.random() - 0.5) * s(2);
                p.vy += -s(1);
            }

            p.vy += gravity;
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) {
                p.x = 0;
                p.vx = Math.abs(p.vx) * damp;
            } else if (p.x + cardW > canvas.width) {
                p.x = canvas.width - cardW;
                p.vx = -Math.abs(p.vx) * damp;
            }
            if (p.y < 0) {
                p.y = 0;
                p.vy = Math.abs(p.vy) * damp;
            } else if (p.y + cardH > canvas.height) {
                p.y = canvas.height - cardH;
                p.vy = -Math.abs(p.vy) * damp;
                p.vx *= 0.98;
            }
        });

        if (winAnim.frame > 90) {
            winAnim.bannerAlpha = Math.min(1, winAnim.bannerAlpha + 0.02);
        }
    }

    function renderWinAnimation() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#008000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        updateWinParticles();

        winAnim.particles.forEach(p => {
            if (!p.active) return;
            drawCardFace(p.card, p.x, p.y);
        });

        if (winAnim.bannerAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = winAnim.bannerAlpha * 0.55;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = winAnim.bannerAlpha;
            ctx.fillStyle = '#FFFF00';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.font = `bold ${Math.max(18, 28 * scale)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText('You Win!', canvas.width / 2, canvas.height / 2 - s(10));
            ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2 - s(10));
            ctx.fillStyle = '#FFF';
            ctx.font = `${Math.max(11, 14 * scale)}px Arial`;
            ctx.fillText(`Score: ${state.score}  |  Time: ${formatTime(elapsed)}`, canvas.width / 2, canvas.height / 2 + s(18));
            ctx.restore();
        }
    }

    function startNewGame() {
        stopWinAnimation();
        state = newGame(3);
        elapsed = 0;
        timerRunning = true;
        drag = null;
        updateStatus();
        render();
    }

    function doUndo() {
        if (undo(state)) {
            if (!state.won) stopWinAnimation();
            timerRunning = !state.won;
            updateStatus();
            render();
        }
    }

    function drawCardBack(x, y) {
        const w = s(CARD_W);
        const h = s(CARD_H);
        ctx.fillStyle = '#000080';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = s(1.5);
        const inset = s(6);
        ctx.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
        ctx.beginPath();
        ctx.moveTo(x + inset, y + inset);
        ctx.lineTo(x + w - inset, y + h - inset);
        ctx.moveTo(x + w - inset, y + inset);
        ctx.lineTo(x + inset, y + h - inset);
        ctx.stroke();
    }

    function drawCardFace(card, x, y, highlight = false) {
        const w = s(CARD_W);
        const h = s(CARD_H);
        const color = isRed(card) ? '#CC0000' : '#000000';

        ctx.fillStyle = highlight ? '#FFFFCC' : '#FFFFFF';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = highlight ? '#0000FF' : '#000';
        ctx.lineWidth = highlight ? 2 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

        const label = VALUE_LABELS[card.value - 1];
        const symbol = SUIT_SYMBOLS[card.suit];
        const cornerSize = Math.max(9, 11 * scale);
        const centerSize = Math.max(14, 22 * scale);

        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = `bold ${cornerSize}px Arial`;
        ctx.fillText(label, x + s(4), y + s(3));
        ctx.font = `${cornerSize}px Arial`;
        ctx.fillText(symbol, x + s(4), y + s(14));

        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.font = `bold ${cornerSize}px Arial`;
        ctx.fillText(label, x + w - s(4), y + h - s(14));
        ctx.font = `${cornerSize}px Arial`;
        ctx.fillText(symbol, x + w - s(4), y + h - s(3));

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${centerSize}px Arial`;
        ctx.fillText(symbol, x + w / 2, y + h / 2);
    }

    function drawEmptySlot(x, y, label = '') {
        const w = s(CARD_W);
        const h = s(CARD_H);
        ctx.fillStyle = 'rgba(0, 80, 0, 0.5)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([s(4), s(3)]);
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.setLineDash([]);

        if (label) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = `${Math.max(16, 24 * scale)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x + w / 2, y + h / 2);
        }
    }

    function render() {
        if (state.won && !prevWon) {
            prevWon = true;
            timerRunning = false;
            startWinAnimation();
        }
        if (!state.won) {
            prevWon = false;
        }

        if (winAnim) {
            renderWinAnimation();
            updateStatus();
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#008000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const stockPos = layout.stock;
        if (state.stock.length > 0) {
            drawCardBack(s(stockPos.x), s(stockPos.y));
        } else {
            drawEmptySlot(s(stockPos.x), s(stockPos.y), state.waste.length > 0 ? '↺' : '');
        }

        const wasteStart = Math.max(0, state.waste.length - 3);
        for (let i = wasteStart; i < state.waste.length; i++) {
            const offset = (i - wasteStart) * s(18);
            const card = state.waste[i];
            const isTop = i === state.waste.length - 1;
            drawCardFace(card, s(layout.waste.x) + offset, s(layout.waste.y), isTop && drag?.source === 'waste');
        }
        if (state.waste.length === 0) {
            drawEmptySlot(s(layout.waste.x), s(layout.waste.y));
        }

        state.foundations.forEach((pile, i) => {
            const pos = layout.foundations[i];
            if (pile.length > 0) {
                drawCardFace(pile[pile.length - 1], s(pos.x), s(pos.y));
            } else {
                drawEmptySlot(s(pos.x), s(pos.y), SUIT_SYMBOLS[SUITS[i]]);
            }
        });

        state.tableau.forEach((column, col) => {
            const pos = layout.tableau[col];
            if (column.length === 0) {
                drawEmptySlot(s(pos.x), s(pos.y));
                return;
            }
            column.forEach((card, row) => {
                const cy = s(pos.y) + row * s(CARD_OVERLAP);
                const isDragging = drag?.source === 'tableau' && drag.col === col && row >= drag.index;
                if (!isDragging) {
                    if (card.faceUp) {
                        drawCardFace(card, s(pos.x), cy);
                    } else {
                        drawCardBack(s(pos.x), cy);
                    }
                }
            });
        });

        if (drag) {
            drag.cards.forEach((card, i) => {
                drawCardFace(card, drag.x, drag.y + i * s(CARD_OVERLAP), true);
            });
        }

        if (canAutoComplete(state) && !state.won) {
            ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            const bx = s(150);
            const by = s(14);
            const bw = s(200);
            const bh = s(22);
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
            ctx.fillStyle = '#000';
            ctx.font = `${Math.max(10, 11 * scale)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Double-click here to auto-complete', bx + bw / 2, by + bh / 2);
        }

        updateStatus();
    }

    function canvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function hitTest(x, y) {
        const px = x / scale;
        const py = y / scale;

        if (px >= layout.stock.x && px <= layout.stock.x + CARD_W &&
            py >= layout.stock.y && py <= layout.stock.y + CARD_H) {
            return { type: 'stock' };
        }

        if (state.waste.length > 0) {
            const wasteX = layout.waste.x + Math.min(2, state.waste.length - 1) * 18;
            if (px >= layout.waste.x && px <= wasteX + CARD_W &&
                py >= layout.waste.y && py <= layout.waste.y + CARD_H) {
                return { type: 'waste' };
            }
        }

        for (let i = 0; i < 4; i++) {
            const pos = layout.foundations[i];
            if (px >= pos.x && px <= pos.x + CARD_W && py >= pos.y && py <= pos.y + CARD_H) {
                return { type: 'foundation', index: i };
            }
        }

        for (let col = 0; col < 7; col++) {
            const pos = layout.tableau[col];
            const column = state.tableau[col];
            for (let row = column.length - 1; row >= 0; row--) {
                const cardY = pos.y + row * CARD_OVERLAP;
                if (px >= pos.x && px <= pos.x + CARD_W && py >= cardY && py <= cardY + CARD_H) {
                    return { type: 'tableau', col, index: row };
                }
            }
            if (column.length === 0 &&
                px >= pos.x && px <= pos.x + CARD_W && py >= pos.y && py <= pos.y + CARD_H) {
                return { type: 'tableau', col, index: -1 };
            }
        }

        if (canAutoComplete(state) && !state.won &&
            px >= 150 && px <= 350 && py >= 14 && py <= 36) {
            return { type: 'autocomplete' };
        }

        return null;
    }

    function tryDoubleClick(hit) {
        const now = Date.now();
        const same = lastClick.source === hit.type &&
            lastClick.col === (hit.col ?? -1) &&
            lastClick.index === (hit.index ?? -1);
        const isDouble = same && now - lastClick.time < 400;
        lastClick = { time: now, source: hit.type, col: hit.col ?? -1, index: hit.index ?? -1 };
        return isDouble;
    }

    function handleClick(e) {
        if (state.won || didDrag) {
            didDrag = false;
            return;
        }
        const pos = canvasPos(e);
        const hit = hitTest(pos.x, pos.y);
        if (!hit) return;

        if (hit.type === 'stock') {
            drawFromStock(state);
            render();
            return;
        }

        if (hit.type === 'autocomplete' && tryDoubleClick(hit)) {
            autoCompleteMoves(state);
            render();
            return;
        }

        if (tryDoubleClick(hit)) {
            if (hit.type === 'waste') {
                moveToFoundation(state, 'waste');
            } else if (hit.type === 'tableau' && hit.index >= 0) {
                moveToFoundation(state, 'tableau', hit.col, hit.index);
            }
            render();
        }
    }

    function startDrag(e) {
        if (state.won) return;
        didDrag = false;
        const pos = canvasPos(e);
        const hit = hitTest(pos.x, pos.y);
        if (!hit) return;

        if (hit.type === 'tableau' && hit.index >= 0) {
            const stack = getMovableStack(state.tableau, hit.col, hit.index);
            if (!stack) return;
            drag = {
                source: 'tableau',
                col: hit.col,
                index: hit.index,
                cards: stack,
                offsetX: pos.x - s(layout.tableau[hit.col].x),
                offsetY: pos.y - (s(layout.tableau[hit.col].y) + hit.index * s(CARD_OVERLAP)),
                x: pos.x - (pos.x - s(layout.tableau[hit.col].x)),
                y: pos.y - (pos.y - (s(layout.tableau[hit.col].y) + hit.index * s(CARD_OVERLAP)))
            };
            drag.x = pos.x - drag.offsetX;
            drag.y = pos.y - drag.offsetY;
            render();
        } else if (hit.type === 'waste' && state.waste.length > 0) {
            drag = {
                source: 'waste',
                col: -1,
                index: state.waste.length - 1,
                cards: [state.waste[state.waste.length - 1]],
                offsetX: pos.x - s(layout.waste.x + Math.min(2, state.waste.length - 1) * 18),
                offsetY: pos.y - s(layout.waste.y),
                x: 0,
                y: 0
            };
            drag.x = pos.x - drag.offsetX;
            drag.y = pos.y - drag.offsetY;
            render();
        } else if (hit.type === 'foundation' && state.foundations[hit.index].length > 0) {
            drag = {
                source: 'foundation',
                col: hit.index,
                index: 0,
                cards: [state.foundations[hit.index][state.foundations[hit.index].length - 1]],
                offsetX: pos.x - s(layout.foundations[hit.index].x),
                offsetY: pos.y - s(layout.foundations[hit.index].y),
                x: 0,
                y: 0
            };
            drag.x = pos.x - drag.offsetX;
            drag.y = pos.y - drag.offsetY;
            render();
        }
    }

    function moveDrag(e) {
        if (!drag) return;
        didDrag = true;
        const pos = canvasPos(e);
        drag.x = pos.x - drag.offsetX;
        drag.y = pos.y - drag.offsetY;
        render();
    }

    function endDrag(e) {
        if (!drag) return;
        const pos = canvasPos(e);
        const hit = hitTest(pos.x, pos.y);
        let moved = false;

        if (hit) {
            if (drag.source === 'tableau' && hit.type === 'tableau') {
                moved = moveTableauStack(state, drag.col, drag.index, hit.col);
            } else if (drag.source === 'tableau' && hit.type === 'foundation') {
                if (drag.cards.length === 1) {
                    moved = moveToFoundation(state, 'tableau', drag.col, drag.index);
                }
            } else if (drag.source === 'waste' && hit.type === 'tableau') {
                moved = moveWasteToTableau(state, hit.col);
            } else if (drag.source === 'waste' && hit.type === 'foundation') {
                moved = moveToFoundation(state, 'waste');
            } else if (drag.source === 'foundation' && hit.type === 'tableau') {
                moved = moveFoundationToTableau(state, drag.col, hit.col);
            }
        }

        drag = null;
        render();

        if (!moved && drag === null) {
            // no-op
        }
    }

    function onMouseUp(e) {
        if (drag) endDrag(e);
    }

    canvas.addEventListener('mousedown', e => {
        e.preventDefault();
        startDrag(e);
    });
    canvas.addEventListener('mousemove', moveDrag);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', () => { drag = null; render(); });
    canvas.addEventListener('click', handleClick);
    document.addEventListener('mouseup', onMouseUp);

    function resize(newWidth, newHeight) {
        const content = container.closest('.window-content') || container;
        const w = newWidth || content.clientWidth || BASE_WIDTH;
        const h = newHeight || content.clientHeight || BASE_HEIGHT;
        const availH = h - toolbar.offsetHeight - 8;

        const scaleX = w / BASE_WIDTH;
        const scaleY = availH / BASE_HEIGHT;
        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(scaleX, scaleY)));

        canvas.width = Math.floor(BASE_WIDTH * scale);
        canvas.height = Math.floor(BASE_HEIGHT * scale);
        render();
    }

    startTimer();
    resize();

    function destroy() {
        if (timerId) clearInterval(timerId);
        stopWinAnimation();
        document.removeEventListener('mouseup', onMouseUp);
        container.innerHTML = '';
    }

    return { resize, destroy };
}