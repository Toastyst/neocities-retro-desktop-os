// js/apps/notepad/index.js
export function createApp(container) {
    // Style container (white background, full size, flex column)
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
    const toolbar = document.createElement('div');
    toolbar.id = 'toolbar';

    const fileButton = document.createElement('button');
    fileButton.id = 'file-button';
    fileButton.textContent = 'File';
    toolbar.appendChild(fileButton);

    const editButton = document.createElement('button');
    editButton.id = 'edit-button';
    editButton.textContent = 'Edit';
    toolbar.appendChild(editButton);

    container.appendChild(toolbar);

    // Main content
    const mainContent = document.createElement('div');
    mainContent.id = 'main-content';

    const editor = document.createElement('textarea');
    editor.id = 'editor';
    editor.placeholder = 'Type your notes here...';
    mainContent.appendChild(editor);

    container.appendChild(mainContent);

    // Footer
    const footer = document.createElement('div');
    footer.id = 'footer';

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