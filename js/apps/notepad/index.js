// js/apps/notepad/index.js

function createButton(text, onClick, options = {}) {
    const { default: isDefault = false, disabled = false } = options;
    const button = document.createElement('button');
    button.textContent = text;
    button.className = isDefault ? 'default' : '';
    button.disabled = disabled;
    if (onClick) {
        button.addEventListener('click', onClick);
    }
    return button;
}

function createToolbar(items) {
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.gap = '4px';
    toolbar.style.padding = '4px';
    items.forEach(item => {
        if (typeof item === 'string') {
            const button = createButton(item, null);
            toolbar.appendChild(button);
        } else {
            toolbar.appendChild(item);
        }
    });
    return toolbar;
}

function createDisplay(lcd = false) {
    const display = document.createElement(lcd ? 'textarea' : 'input');
    display.readOnly = true;
    display.style.width = '100%';
    display.style.boxSizing = 'border-box';
    if (lcd) {
        display.rows = 3;
    }
    return display;
}

export function createApp(container) {
    // Style container (white background, full size, flex column)
    container.className = 'window-content'; // Use 98.css class
    container.style.cssText = `
        background: #FFFFFF;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow: hidden;
    `;

    // Toolbar
    const toolbar = createToolbar(['File', 'Edit']);
    toolbar.id = 'toolbar';
    container.appendChild(toolbar);

    // Main content
    const mainContent = document.createElement('div');
    mainContent.id = 'main-content';
    mainContent.style.flex = '1';
    mainContent.style.overflow = 'hidden';

    const editor = createDisplay(true); // textarea
    editor.id = 'editor';
    editor.placeholder = 'Type your notes here...';
    editor.readOnly = false; // Make editable
    mainContent.appendChild(editor);

    container.appendChild(mainContent);

    // Footer
    const footer = document.createElement('div');
    footer.id = 'footer';
    footer.style.padding = '4px';
    footer.style.background = '#C0C0C0';
    footer.style.borderTop = '1px inset #808080';

    const wordCount = document.createElement('span');
    wordCount.id = 'word-count';
    wordCount.textContent = 'Words: 0';
    footer.appendChild(wordCount);

    container.appendChild(footer);

    // Word count logic
    function updateWordCount() {
        const text = editor.value;
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        wordCount.textContent = `Words: ${words}`;
    }

    editor.addEventListener('input', updateWordCount);

    // Resize function
    function resize(newWidth, newHeight) {
        // Flex layout handles resizing automatically
    }

    function destroy() {
        container.innerHTML = '';
    }

    return { resize, destroy };
}