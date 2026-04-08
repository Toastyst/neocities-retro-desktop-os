// js/apps/solitaire.js
export function createApp(container) {
    // Set container styles (green felt table, centered)
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        background: #008000;
        margin: 0;
        padding: 10px;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
        overflow: hidden;
    `;

    // Score display
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'solitaire-score';
    scoreDiv.style.cssText = `
        color: white;
        font-size: 14px;
        margin-bottom: 10px;
        width: 100%;
        text-align: center;
    `;
    const scoreSpan = document.createElement('span');
    scoreSpan.id = 'score';
    scoreSpan.textContent = '0';
    const movesSpan = document.createElement('span');
    movesSpan.id = 'moves';
    movesSpan.textContent = '0';
    scoreDiv.appendChild(document.createTextNode('Score: '));
    scoreDiv.appendChild(scoreSpan);
    scoreDiv.appendChild(document.createTextNode(' | Moves: '));
    scoreDiv.appendChild(movesSpan);
    container.appendChild(scoreDiv);

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'solitaire-canvas';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Game state
    let score = 0;
    let moves = 0;
    let currentScale = 1;
    const baseWidth = 600;
    const baseHeight = 400;
    const baseCardWidth = 60;
    const baseCardHeight = 80;
    const minCardSize = 40;
    const maxCardSize = 110;
    const minScale = minCardSize / baseCardWidth;
    const maxScale = maxCardSize / baseCardWidth;

    const scoreEl = scoreDiv.querySelector('#score');
    const movesEl = scoreDiv.querySelector('#moves');

    function updateScore() {
        scoreEl.textContent = score;
        movesEl.textContent = moves;
    }

    function drawCard(x, y, suit, value, faceUp, scale) {
        const cardX = x;
        const cardY = y;
        const cardW = baseCardWidth * scale;
        const cardH = baseCardHeight * scale;

        ctx.fillStyle = faceUp ? '#FFFFFF' : '#000080';
        ctx.fillRect(cardX, cardY, cardW, cardH);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        if (faceUp) {
            ctx.fillStyle = (suit === 'hearts' || suit === 'diamonds') ? '#FF0000' : '#000000';
            ctx.font = `${12 * scale}px Arial`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(value, cardX + 5 * scale, cardY + 15 * scale);

            const symbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
            ctx.textAlign = 'right';
            ctx.fillText(symbols[suit], cardX + (baseCardWidth - 5) * scale, cardY + 15 * scale);
            ctx.textAlign = 'left';
        }
    }

    function initGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw tableau (7 columns)
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        for (let col = 0; col < 7; col++) {
            for (let row = 0; row <= col; row++) {
                const x = (50 + col * 80) * currentScale;
                const y = (50 + row * 20) * currentScale;
                const suit = suits[Math.floor(Math.random() * 4)];
                const value = values[Math.floor(Math.random() * 13)];
                drawCard(x, y, suit, value, row === col, currentScale);
            }
        }

        // Draw foundations (4 piles)
        for (let i = 0; i < 4; i++) {
            const fx = (400 + i * 80) * currentScale;
            const fy = 50 * currentScale;
            const fw = baseCardWidth * currentScale;
            const fh = baseCardHeight * currentScale;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(fx, fy, fw, fh);
        }

        // Draw stock
        const sx = 50 * currentScale;
        const sy = 300 * currentScale;
        drawCard(sx, sy, 'spades', 'K', false, currentScale);

        updateScore();
    }

    // Click handler (simple reset)
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        moves++;
        score += 10;
        initGame();
    });

    function resize(newWidth, newHeight) {
        // Account for score bar (~30px)
        const availableHeight = newHeight - 40; // padding + score + margin
        let scaleX = newWidth / baseWidth;
        let scaleY = availableHeight / baseHeight;
        let scale = Math.min(scaleX, scaleY);
        currentScale = Math.max(minScale, Math.min(scale, maxScale));

        canvas.width = Math.floor(baseWidth * currentScale);
        canvas.height = Math.floor(baseHeight * currentScale);

        // Canvas styles
        canvas.style.border = '2px inset #808080';
        canvas.style.background = '#00AA00';
        canvas.style.display = 'block';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';

        initGame();
    }

    // Initial resize (assume default size)
    resize(600, 400);

    function destroy() {
        container.innerHTML = '';
    }

    return {
        resize,
        destroy
    };
}