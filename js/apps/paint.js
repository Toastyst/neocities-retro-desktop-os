// js/apps/paint.js
export function createApp(container) {
    // Set container styles (gray background, fill area)
    container.style.cssText = `
        background: #C0C0C0;
        margin: 0;
        padding: 10px;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    `;
    container.style.paddingTop = '40px';

    // Tools
    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'tools';
    toolsDiv.style.cssText = `
        margin-bottom: 10px;
        flex-shrink: 0;
    `;

    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear';
    clearBtn.textContent = 'Clear';
    clearBtn.style.cssText = `
        margin: 0 5px;
        padding: 4px 8px;
        background: #C0C0C0;
        border: 2px outset #FFFFFF;
        cursor: pointer;
    `;
    toolsDiv.appendChild(clearBtn);

    const colors = ['#000000', '#FF0000', '#0000FF', '#00FF00'];
    const colorPickers = [];
    colors.forEach(color => {
        const picker = document.createElement('div');
        picker.className = 'color-picker';
        picker.style.cssText = `
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 1px solid #000;
            margin: 0 5px;
            cursor: pointer;
            background: ${color};
        `;
        toolsDiv.appendChild(picker);
        colorPickers.push(picker);
    });

    container.appendChild(toolsDiv);

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'paint-canvas';
    canvas.style.cssText = `
        border: 2px inset #808080;
        background: #FFFFFF;
        cursor: crosshair;
        flex: 1;
        width: 100%;
        height: 100%;
    `;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let isDrawing = false;
    let currentColor = '#000000';

    // Color pickers
    colorPickers.forEach((picker, index) => {
        picker.addEventListener('click', () => {
            currentColor = colors[index];
            colorPickers.forEach(p => p.style.border = '1px solid #000');
            picker.style.border = '2px solid #FFF';
        });
    });

    // Drawing
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }

    function draw(e) {
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.fillStyle = currentColor;
        ctx.fillRect(x - 2, y - 2, 4, 4);
    }

    function stopDrawing() {
        isDrawing = false;
    }

    // Clear canvas
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    function resize(newWidth, newHeight) {
        // Stretch canvas to fill entire content area
        canvas.width = newWidth;
        canvas.height = newHeight;
        // Reinitialize white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Initial setup
    colorPickers[0].style.border = '2px solid #FFF'; // Black selected
    resize(400, 300); // Default

    function destroy() {
        container.innerHTML = '';
    }

    return {
        resize,
        destroy
    };
}