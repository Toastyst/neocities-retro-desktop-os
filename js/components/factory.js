// Component factory for Win98-style UI elements using 98.css

export function createButton(text, onClick, options = {}) {
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

export function createInput(type = 'text', value = '', onChange) {
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    if (onChange) {
        input.addEventListener('change', onChange);
    }
    return input;
}

export function createCheckbox(label, checked = false, onChange) {
    const container = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    if (onChange) {
        input.addEventListener('change', onChange);
    }
    container.appendChild(input);
    container.appendChild(document.createTextNode(label));
    return container;
}

export function createRadio(name, label, checked = false, onChange) {
    const container = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.checked = checked;
    if (onChange) {
        input.addEventListener('change', onChange);
    }
    container.appendChild(input);
    container.appendChild(document.createTextNode(label));
    return container;
}

export function createSelect(options, value = '', onChange) {
    const select = document.createElement('select');
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (opt.value === value) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    if (onChange) {
        select.addEventListener('change', onChange);
    }
    return select;
}

export function createToolbar(items) {
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

export function createDisplay(lcd = false) {
    const display = document.createElement(lcd ? 'textarea' : 'input');
    display.readOnly = true;
    display.style.width = '100%';
    display.style.boxSizing = 'border-box';
    if (lcd) {
        display.rows = 3;
    }
    return display;
}

export function createGrid(labels, actions, cols = 4) {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gap = '4px';
    labels.forEach((label, index) => {
        const button = createButton(label, actions[index]);
        grid.appendChild(button);
    });
    return grid;
}

export function createFieldset(legend, children) {
    const fieldset = document.createElement('fieldset');
    const legendEl = document.createElement('legend');
    legendEl.textContent = legend;
    fieldset.appendChild(legendEl);
    if (Array.isArray(children)) {
        children.forEach(child => fieldset.appendChild(child));
    } else {
        fieldset.appendChild(children);
    }
    return fieldset;
}