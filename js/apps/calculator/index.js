// js/apps/calculator.js
export function createApp(container) {
    // Set container styles (gray background, center fixed calculator)
    container.style.cssText = `
        background: #C0C0C0;
        margin: 0;
        padding: 10px;
        font-family: 'MS Sans Serif', sans-serif;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        overflow: hidden;
    `;

    // Calculator
    const calculator = document.createElement('div');
    calculator.className = 'calculator';
    calculator.style.cssText = `
        background: #C0C0C0;
        border: 2px outset #FFFFFF;
        padding: 10px;
        width: 200px;
        box-sizing: border-box;
    `;

    // Display
    const display = document.createElement('div');
    display.className = 'display';
    display.id = 'display';
    display.textContent = '0';
    display.style.cssText = `
        background: #000000;
        color: #00FF00;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        text-align: right;
        padding: 5px;
        margin-bottom: 10px;
        border: 2px inset #808080;
        min-height: 24px;
        box-sizing: border-box;
        overflow: hidden;
    `;
    calculator.appendChild(display);

    // Buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'buttons';
    buttonsDiv.style.cssText = `
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5px;
    `;

    const buttonLabels = [
        'C', '/', '*', '⌫',
        '7', '8', '9', '-',
        '4', '5', '6', '+',
        '1', '2', '3', '=',
        '0', '.'
    ];

    const buttonActions = [
        'clearDisplay()', "appendToDisplay('/')", "appendToDisplay('*')", 'backspace()',
        "appendToDisplay('7')", "appendToDisplay('8')", "appendToDisplay('9')", "appendToDisplay('-')",
        "appendToDisplay('4')", "appendToDisplay('5')", "appendToDisplay('6')", "appendToDisplay('+')",
        "appendToDisplay('1')", "appendToDisplay('2')", "appendToDisplay('3')", 'calculate()',
        "appendToDisplay('0')", "appendToDisplay('.')"
    ];

    buttonLabels.forEach((label, index) => {
        const button = document.createElement('button');
        button.textContent = label;
        button.onclick = () => eval(buttonActions[index]);
        button.style.cssText = `
            background: linear-gradient(135deg, #C0C0C0 0%, #D0D0D0 100%);
            border: 2px outset #FFFFFF;
            padding: 8px;
            font-size: 14px;
            cursor: pointer;
            box-sizing: border-box;
        `;
        if (label === '=') {
            button.style.gridColumn = 'span 2';
        }
        button.addEventListener('mousedown', () => {
            button.style.border = '2px inset #808080';
        });
        button.addEventListener('mouseup', () => {
            button.style.border = '2px outset #FFFFFF';
        });
        button.addEventListener('mouseout', () => {
            button.style.border = '2px outset #FFFFFF';
        });
        buttonsDiv.appendChild(button);
    });

    calculator.appendChild(buttonsDiv);
    container.appendChild(calculator);

    // Calculator logic
    let currentInput = '0';
    let operator = null;
    let previousInput = null;

    function updateDisplay() {
        display.textContent = currentInput;
    }

    window.clearDisplay = function() {
        currentInput = '0';
        operator = null;
        previousInput = null;
        updateDisplay();
    };

    window.appendToDisplay = function(value) {
        if (currentInput === '0' && value !== '.') {
            currentInput = value;
        } else {
            currentInput += value;
        }
        updateDisplay();
    };

    window.backspace = function() {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '') currentInput = '0';
        updateDisplay();
    };

    window.calculate = function() {
        try {
            const result = eval(currentInput);
            currentInput = result.toString();
            updateDisplay();
        } catch (error) {
            currentInput = 'Error';
            updateDisplay();
            setTimeout(() => clearDisplay(), 1000);
        }
    };

    function resize(newWidth, newHeight) {
        // Fixed-center: do nothing, calculator stays centered and fixed size
    }

    function destroy() {
        container.innerHTML = '';
    }

    return {
        resize,
        destroy
    };
}