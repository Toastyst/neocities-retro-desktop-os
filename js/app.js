// ==========================================
// RETRO DESKTOP OS - MAIN JAVASCRIPT
// Complete single-file implementation
// ==========================================
import {registry} from './apps/registry.js';

// Window Management System
let windows = [];           // Array of all open windows
let activeWindow = null;    // Currently focused window
let zIndexCounter = 1;      // Z-index counter for window stacking

// Desktop drag system
let draggedIcon = null;     // Currently dragged desktop icon
let isDraggingIcon = false; // Whether an icon is being dragged
let dragStartX, dragStartY, dragStartLeft, dragStartTop;
let lastMouseX = 0;
let lastMouseY = 0;
let clickOffsetX, clickOffsetY;
let justDragged = false;
let hasDragged = false;

function snapToGridCursor(element) {
    const desktop = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();
    const targetLeft = parseInt(element.style.left);
    const targetTop = parseInt(element.style.top);
    const gridSize = 128;
    const snappedLeft = Math.round((targetLeft - 30) / gridSize) * gridSize + 30;
    const snappedTop = Math.round((targetTop - 30) / gridSize) * gridSize + 30;
    const clampedLeft = Math.max(30, Math.min(snappedLeft, desktopRect.width - 103));
    const clampedTop = Math.max(30, Math.min(snappedTop, desktopRect.height - 95));
    element.style.left = clampedLeft + 'px';
    element.style.top = clampedTop + 'px';
}

// Browser System
let browserHistory = ['home'];  // Browser navigation history
let historyIndex = 0;           // Current position in history

// Boot Sequence Configuration
const BOOT_SEQUENCE_CONFIG = {
    // Timing constants for different types of operations
    TIMINGS: {
        FAST: 200,
        NORMAL: 400,
        SLOW: 800,
        BIOS_HEADER: 300,
        POST_START: 500,
        COMPONENT_CHECK: 350,
        FINAL_LOAD: 1500
    },

    // Sound effects for different boot phases
    SOUNDS: {
        BIOS_BEEP: 'bios-beep.wav',
        POST_COMPLETE: 'post-complete.wav',
        HDD_ACCESS: 'hdd-access.wav',
        BOOT_SUCCESS: 'boot.wav'
    }
};

// Boot Sequence Factory - Creates different boot sequences based on configuration
function createBootSequence(options = {}) {
    const config = {
        speed: options.speed || 'normal', // 'fast', 'normal', 'detailed'
        os: options.os || 'windows95', // 'windows95', 'windows98', 'dos'
        hardware: options.hardware || 'standard', // 'standard', 'gaming', 'minimal'
        ...options
    };

    // Speed multipliers
    const speedMultipliers = {
        fast: 0.5,
        normal: 1.0,
        detailed: 1.5
    };
    const multiplier = speedMultipliers[config.speed];

    // Base hardware configurations
    const hardwareConfigs = {
        standard: {
            cpu: "Intel Pentium III 500MHz",
            ram: "128MB RAM",
            hdd: "6GB IDE",
            cdrom: "52x",
            video: "VGA Compatible"
        },
        gaming: {
            cpu: "Intel Pentium III 600MHz",
            ram: "256MB RAM",
            hdd: "20GB IDE",
            cdrom: "56x",
            video: "VESA Compatible"
        },
        minimal: {
            cpu: "Intel 486DX 66MHz",
            ram: "16MB RAM",
            hdd: "500MB IDE",
            cdrom: "4x",
            video: "CGA Compatible"
        }
    };

    const hw = hardwareConfigs[config.hardware];

    // OS-specific configurations
    const osConfigs = {
        windows95: {
            bios: "IBM Personal Computer AT\nVersion A04  01/10/86\n\n",
            osLoad: "Loading Windows 95...\n\n"
        },
        windows98: {
            bios: "Award Modular BIOS v4.51PG\n04/07/98\n\n",
            osLoad: "Loading Windows 98...\n\n"
        },
        dos: {
            bios: "Phoenix 80386 ROM BIOS PLUS Version 1.10\n\n",
            osLoad: "Loading MS-DOS 6.22...\n\n"
        }
    };

    const os = osConfigs[config.os];

    // Create the sequence with applied timing multipliers
    return [
        {
            text: os.bios,
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.BIOS_HEADER * multiplier),
            sound: BOOT_SEQUENCE_CONFIG.SOUNDS.BIOS_BEEP,
            description: "BIOS header display"
        },
        {
            text: "Performing Power-On Self Test (POST)...\n",
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.POST_START * multiplier),
            sound: '',
            description: "POST initialization"
        },
        {
            text: `CPU: ${hw.cpu} - OK\n`,
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.COMPONENT_CHECK * multiplier),
            sound: '',
            description: "CPU detection and test"
        },
        {
            text: `Memory Test: ${hw.ram} - OK\n`,
            timing: Math.round((BOOT_SEQUENCE_CONFIG.TIMINGS.COMPONENT_CHECK + 100) * multiplier),
            sound: '',
            description: "RAM testing"
        },
        {
            text: `Hard Drive: ${hw.hdd} - OK\n`,
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.COMPONENT_CHECK * multiplier),
            sound: BOOT_SEQUENCE_CONFIG.SOUNDS.HDD_ACCESS,
            description: "Primary storage detection"
        },
        {
            text: "Floppy Drive: 1.44MB - OK\n",
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.COMPONENT_CHECK * multiplier),
            sound: '',
            description: "Floppy drive detection"
        },
        {
            text: `CD-ROM: ${hw.cdrom} - OK\n`,
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.COMPONENT_CHECK * multiplier),
            sound: '',
            description: "Optical drive detection"
        },
        {
            text: `Video: ${hw.video} - OK\n`,
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.COMPONENT_CHECK * multiplier),
            sound: '',
            description: "Graphics adapter test"
        },
        {
            text: "Keyboard: Detected\n",
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.FAST * multiplier),
            sound: '',
            description: "Input device detection"
        },
        {
            text: "Mouse: Detected\n",
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.FAST * multiplier),
            sound: '',
            description: "Pointing device detection"
        },
        {
            text: "Serial Ports: COM1, COM2 - OK\n",
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.COMPONENT_CHECK * multiplier),
            sound: '',
            description: "Serial port enumeration"
        },
        {
            text: "Parallel Ports: LPT1 - OK\n\n",
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.COMPONENT_CHECK * multiplier),
            sound: BOOT_SEQUENCE_CONFIG.SOUNDS.POST_COMPLETE,
            description: "Parallel port detection"
        },
        {
            text: os.osLoad,
            timing: Math.round(BOOT_SEQUENCE_CONFIG.TIMINGS.FINAL_LOAD * multiplier),
            sound: BOOT_SEQUENCE_CONFIG.SOUNDS.BOOT_SUCCESS,
            description: "OS kernel loading"
        }
    ];
}

// Default boot sequence - can be customized
let bootSequence = createBootSequence();

// Function to change boot sequence configuration (can be called from console or other code)
window.setBootSequence = function(options) {
    bootSequence = createBootSequence(options);
    console.log('Boot sequence updated:', options);
};

// Example usage functions for different boot styles
window.setFastBoot = function() {
    window.setBootSequence({ speed: 'fast' });
};

window.setDetailedBoot = function() {
    window.setBootSequence({ speed: 'detailed' });
};

window.setGamingPC = function() {
    window.setBootSequence({ hardware: 'gaming', os: 'windows98' });
};

window.setRetroPC = function() {
    window.setBootSequence({ hardware: 'minimal', os: 'dos' });
};

// AOL Connection
let aolConnection = {isConnected: false, speed: 0, status: 'Disconnected'};
window.aolConnection = aolConnection;

// Start menu actions
window.startMenuActions = {
    'Notepad': () => openWindow('Notepad', '<textarea style="width: 100%; height: 300px; border: 1px inset #808080;" placeholder="Type your notes here..."></textarea>'),
    'Calculator': () => openApp('Calculator'),
    'Solitaire': () => openApp('Solitaire'),
    'Solmerica Online': () => openApp('solmerica'),
    'Paint': () => openApp('Paint'),
    'Minesweeper': () => alert('Minesweeper coming soon!'),
    'Documents': () => alert('Documents'),
    'Settings': () => alert('Settings'),
    'Find': () => alert('Find'),
    'Help': () => alert('Help'),
    'Run...': () => alert('Run'),
    'Shut Down...': () => alert('Shut Down')
};

// Start menu items
let startMenuItems = [
    {name: 'Programs', submenu: [
        {name: 'Accessories', submenu: [
            {name: 'Notepad', action: 'Notepad'},
            {name: 'Calculator', action: 'Calculator'}
        ]},
        {name: 'Games', submenu: [
            {name: 'Solitaire', action: 'Solitaire'},
            {name: 'Solmerica Online', action: 'Solmerica Online'},
            {name: 'Minesweeper', action: 'Minesweeper'}
        ]}
    ]},
    {name: 'Documents', action: 'Documents'},
    {name: 'Settings', action: 'Settings'},
    {name: 'Find', action: 'Find'},
    {name: 'Help', action: 'Help'},
    {name: 'Run...', action: 'Run...'},
    {name: '-', action: null},
    {name: 'Shut Down...', action: 'Shut Down...'}
];



// Open app function
async function openApp(appName) {
    const sizes = { Solitaire: [640, 460], Paint: [440, 360], Calculator: [240, 320], solmerica: [500, 400] };
    const [width, height] = sizes[appName] || [400, 300];
    const className = appName.toLowerCase() + '-window';
    const windowEl = openWindow(appName, '', null, null, width, height, className);
    const contentDiv = windowEl.querySelector('.window-content');
    const createApp = await registry[appName.toLowerCase()]();
    const appInstance = createApp(contentDiv);
    windowEl._app = appInstance;
    // Add resize observer
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            appInstance.resize(width, height);
        }
    });
    resizeObserver.observe(contentDiv);
    windowEl._resizeObserver = resizeObserver;
}

// Audio manager
function playSound(file) {
    const audioId = file.replace(/\..*/, '-audio');
    const audio = document.getElementById(audioId);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {}); // Ignore play errors
    }
}
window.playSound = playSound;

// Boot sequence - Updated to work with new array structure
function initBootSequence() {
    const bootScreen = document.getElementById('boot-screen');
    const biosText = bootScreen.querySelector('.bios-text');
    const textbox = document.createElement('div');
    textbox.className = 'boot-textbox';
    textbox.appendChild(biosText);
    bootScreen.appendChild(textbox);
    bootScreen.style.display = 'flex';
    let stepIndex = 0;
    let text = '';

    const nextStep = () => {
        if (stepIndex < bootSequence.length) {
            const currentStep = bootSequence[stepIndex];
            text += currentStep.text;
            biosText.textContent = text;
            const textbox = bootScreen.querySelector('.boot-textbox');
            textbox.scrollTop = textbox.scrollHeight;

            // Play sound if specified
            if (currentStep.sound) {
                playSound(currentStep.sound);
            }

            stepIndex++;
            setTimeout(nextStep, currentStep.timing);
        } else {
            setTimeout(() => {
                bootScreen.style.display = 'none';
                playSound('hdd-fan-loop.mp3'); // Ambient loop
                initDesktop();
            }, 1000);
        }
    };
    nextStep();
}

// Update clock
function updateClock() {
    const clockEl = document.getElementById('taskbar-clock');
    if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    }
}

// Toggle start menu
function toggleStartMenu() {
    const existing = document.querySelector('.start-menu');
    if (existing) {
        existing.remove();
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'start-menu';

    function buildMenu(items, level = 0) {
        let html = '';
        items.forEach(item => {
            if (item.name === '-') {
                html += '<hr>';
            } else if (item.submenu) {
                html += `<div class="menu-item has-submenu" data-level="${level}">${item.name} ▶</div>`;
            } else {
                html += `<div class="menu-item" onclick="window.startMenuActions['${item.action}']()">${item.name}</div>`;
            }
        });
        return html;
    }

    menu.innerHTML = buildMenu(startMenuItems);
    document.body.appendChild(menu);

    // Position below start button
    const startBtn = document.querySelector('.start-button');
    const rect = startBtn.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = rect.bottom + 'px';

    // Handle submenu clicks
    menu.addEventListener('click', (e) => {
        if (e.target.classList.contains('has-submenu')) {
            e.stopPropagation();
            const level = parseInt(e.target.dataset.level);
            const itemIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
            const submenu = startMenuItems[itemIndex]?.submenu;
            if (submenu) {
                const itemRect = e.target.getBoundingClientRect();
                const submenuEl = document.createElement('div');
                submenuEl.className = 'start-menu submenu';
                submenuEl.style.left = (rect.left + 150) + 'px';
                submenuEl.style.top = itemRect.top + 'px';
                submenuEl.innerHTML = buildMenu(submenu, level + 1);
                document.body.appendChild(submenuEl);
            }
        }
    });

    // Close on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                document.querySelectorAll('.start-menu').forEach(m => m.remove());
                document.removeEventListener('click, closeMenu');
            }
        });
    }, 10);
}

// Load app with delay
function loadAppWithDelay(title, content) {
    const delay = Math.random() * 600 + 400; // 400-1000ms
    playSound('floppy-read.wav');
    setTimeout(() => {
        openWindow(title, content);
    }, delay);
}

// Open app window with specific size and class
function openAppWindow(title, content, width, height, className) {
    openWindow(title, content, null, null, width, height, className);
}

// Maximize window
function maximizeWindow(windowEl) {
    if (windowEl.style.width === '100vw') {
        // Restore
        windowEl.style.left = '100px';
        windowEl.style.top = '100px';
        windowEl.style.width = '400px';
        windowEl.style.height = '300px';
    } else {
        // Maximize
        windowEl.style.left = '0';
        windowEl.style.top = '0';
        windowEl.style.width = '100vw';
        windowEl.style.height = 'calc(100vh - 40px)';
    }
}

// Easter egg BSOD
function easterEggBSOD() {
    const bsod = document.createElement('div');
    bsod.style.position = 'fixed';
    bsod.style.top = '0';
    bsod.style.left = '0';
    bsod.style.width = '100vw';
    bsod.style.height = '100vh';
    bsod.style.background = '#0000AA';
    bsod.style.color = '#FFFFFF';
    bsod.style.fontFamily = 'Courier New, monospace';
    bsod.style.fontSize = '14px';
    bsod.style.padding = '20px';
    bsod.style.zIndex = '10000';
    bsod.innerHTML = `
        <h1>A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) + 00010E36. The current application will be terminated.</h1>
        <p>* Press any key to terminate the current application.</p>
        <p>* Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.</p>
        <br>
        <p>Press any key to continue _</p>
    `;
    document.body.appendChild(bsod);

    const removeBSOD = () => {
        bsod.remove();
        document.removeEventListener('keydown', removeBSOD);
    };
    document.addEventListener('keydown', removeBSOD);
}

// Desktop icons configuration
const desktopIcons = [
    {name: 'Home', col: 0, row: 0, action: () => openBrowser('home'), icon: 'desktop/1browser.jpg'},
    {name: 'About Me', col: 0, row: 1, action: () => openBrowser('about'), icon: 'desktop/aboutme.jpg'},
    {name: 'Retro Gaming', col: 0, row: 2, action: () => openBrowser('gaming'), icon: 'desktop/1games.jpg'},
    {name: 'My Jeep XJ', col: 0, row: 3, action: () => openBrowser('jeep'), icon: 'desktop/1jeep.jpg'},
    {name: '1996 Camry', col: 0, row: 4, action: () => openBrowser('camry'), icon: 'desktop/1camry.jpg'},
    {name: 'Cool Links', col: 0, row: 5, action: () => openBrowser('links'), icon: 'desktop/1links.jpg'},
    {name: 'Meme Generator', col: 0, row: 6, action: () => openBrowser('meme'), icon: 'desktop/1meme.jpg'},
    {name: 'Chat Room', col: 1, row: 0, action: () => openBrowser('chat'), icon: 'desktop/1chat.jpg'},
    {name: 'Music Player', col: 1, row: 1, action: () => openBrowser('music'), icon: 'desktop/1music.jpg'},
    {name: 'My Computer', col: 1, row: 2, action: () => openWindow('My Computer', '<h2>My Computer</h2><p>System: Windows Toasty5</p><p>Processor: Intel Pentium III 500MHz</p><p>Memory: 128MB RAM</p><p>Hard Drive: 6GB</p><p>Connection: ' + (aolConnection.isConnected ? 'Online (56K)' : 'Offline') + '</p>'), icon: 'desktop/1mypc.jpg'},
    {name: 'Recycle Bin', col: 1, row: 3, action: () => openWindow('Recycle Bin', '<h2>Recycle Bin</h2><p>Empty</p>'), icon: 'desktop/1recycle.jpg'},
    {name: 'Notepad', col: 1, row: 4, action: () => openWindow('Notepad', '<textarea style="width: 100%; height: 300px; border: 1px inset #808080;" placeholder="Type your notes here..."></textarea>'), icon: 'desktop/notepad.jpg'},
    {name: 'Calculator', col: 1, row: 5, action: () => openApp('Calculator'), icon: 'desktop/calc.jpg'},
    {name: 'Paint', col: 1, row: 6, action: () => openApp('Paint'), icon: 'desktop/paint.jpg'},
    {name: 'Solitaire', col: 2, row: 0, action: () => openApp('Solitaire'), icon: 'desktop/solitair.jpg'},
    {name: 'Solmerica Online', col: 2, row: 1, action: () => openApp('solmerica'), icon: 'AOL/Logo_login.png'},
    {name: 'Guestbook', col: 2, row: 2, action: () => openBrowser('guestbook'), icon: 'desktop/1guestbook.jpg'},
    {name: 'Downloads', col: 2, row: 3, action: () => openBrowser('downloads'), icon: 'desktop/downloads.jpg'},
    {name: 'News', col: 2, row: 4, action: () => openBrowser('news'), icon: 'desktop/news.jpg'}
];

// Initialize the desktop
function initDesktop() {
    // Add desktop icons for all pages and applications with complete icon integration (128px grid center-aligned)
    desktopIcons.forEach(icon => {
        const x = 30 + icon.col * 128;
        const y = 30 + icon.row * 128;
        createDesktopIcon(icon.name, x, y, icon.action, icon.icon);
    });

    // Add desktop right-click context menu
    document.getElementById('desktop').addEventListener('contextmenu', showContextMenu);

// Show desktop context menu
function showContextMenu(e) {
    e.preventDefault();
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
        position: absolute;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: #C0C0C0;
        border: 2px outset #FFFFFF;
        z-index: 1000;
        min-width: 120px;
    `;
    menu.innerHTML = `
        <div class="menu-item" onclick="alert('New Folder')">New Folder</div>
        <div class="menu-item" onclick="alert('Refresh')">Refresh</div>
    `;
    document.body.appendChild(menu);
    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', function close() {
            menu.remove();
            document.removeEventListener('click', close);
        });
    }, 10);
}

    // Add global desktop drag listeners
    document.addEventListener('mousemove', (e) => {
        if (isDraggingIcon && draggedIcon) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasDragged = true;
                let newLeft = dragStartLeft + dx;
                let newTop = dragStartTop + dy;
                // Clamp to desktop bounds during drag (match snap/icon 103x95 taskbar40)
                const desktop = document.getElementById('desktop');
                const desktopRect = desktop.getBoundingClientRect();
                newLeft = Math.max(0, Math.min(newLeft, desktopRect.width - 103));
                newTop = Math.max(0, Math.min(newTop, desktopRect.height - 95));
                draggedIcon.style.left = newLeft + 'px';
                draggedIcon.style.top = newTop + 'px';
            }
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDraggingIcon && draggedIcon) {
            if (hasDragged) {
                snapToGridCursor(draggedIcon);
                justDragged = true;
            }
            draggedIcon = null;
            isDraggingIcon = false;
        }
    });

    // Add start button click
    document.querySelector('.start-button').addEventListener('click', toggleStartMenu);

    // Start clock updates
    setInterval(updateClock, 1000);

    // Add BSOD easter egg
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'Delete') {
            easterEggBSOD();
        }
    });

    // Add window controls
    document.querySelectorAll('.window-control.minimize').forEach(btn => {
        btn.addEventListener('click', (e) => minimizeWindow(e.target.closest('.window')));
    });
    document.querySelectorAll('.window-control.close').forEach(btn => {
        btn.addEventListener('click', (e) => closeWindow(e.target.closest('.window')));
    });
}

// Create a desktop icon
function createDesktopIcon(name, x, y, action, iconPath = null) {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.style.position = 'absolute';
    icon.style.left = x + 'px';
    icon.style.top = y + 'px';
    const iconStyle = iconPath ? `background-image: url(icons/${iconPath}); background-size: cover; background-position: center;` : '';
    icon.innerHTML = `
        <div class="icon-image" style="${iconStyle}">${iconPath ? '' : name.charAt(0)}</div>
        <div class="icon-label">${name}</div>
    `;
    icon.addEventListener('click', (e) => { if (justDragged) { justDragged = false; return; } action(); });

    // Make draggable with global system
    icon.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            draggedIcon = icon;
            isDraggingIcon = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartLeft = parseInt(icon.style.left || '0');
            dragStartTop = parseInt(icon.style.top || '0');
            clickOffsetX = e.clientX - dragStartLeft;
            clickOffsetY = e.clientY - dragStartTop;
            hasDragged = false;
            icon.style.zIndex = ++zIndexCounter;
            e.preventDefault();
        }
    });

    document.getElementById('desktop').appendChild(icon);
}

// Open a new window
function openWindow(title, content, x = null, y = null, width = 400, height = 300, className = '') {
    if (x === null) x = Math.max(100, (window.innerWidth - width) / 2);
    if (y === null) y = Math.max(100, (window.innerHeight - height) / 2);
    const windowEl = document.createElement('div');
    windowEl.className = 'window';
    if (className) windowEl.classList.add(className);
    windowEl.style.left = x + 'px';
    windowEl.style.top = y + 'px';
    windowEl.style.width = width + 'px';
    windowEl.style.height = height + 'px';
    windowEl.style.zIndex = ++zIndexCounter;
    windowEl.innerHTML = `
        <div class="window-titlebar">
            <span style="flex: 1;">${title}</span>
            <div class="window-controls">
                <div class="window-control minimize">_</div>
                <div class="window-control maximize">□</div>
                <div class="window-control close">×</div>
            </div>
        </div>
        <div class="window-content">
            ${content}
        </div>
    `;

    document.getElementById('desktop').appendChild(windowEl);
    makeDraggable(windowEl);
    if (className !== 'calculator-window') {
        makeResizable(windowEl);
    }

    // Add event listeners for controls
    windowEl.querySelector('.minimize').addEventListener('click', () => minimizeWindow(windowEl));
    windowEl.querySelector('.maximize').addEventListener('click', () => maximizeWindow(windowEl));
    windowEl.querySelector('.close').addEventListener('click', () => closeWindow(windowEl));

    windows.push(windowEl);
    focusWindow(windowEl);
    updateTaskbar();
    return windowEl;
}

// Make a window draggable
function makeDraggable(element) {
    const titlebar = element.querySelector('.window-titlebar');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    titlebar.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(element.style.left);
        startTop = parseInt(element.style.top);
        element.style.zIndex = ++zIndexCounter;
        focusWindow(element);
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = (startLeft + dx) + 'px';
            element.style.top = (startTop + dy) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Make a window resizable
function makeResizable(element) {
    const resizeHandle = document.createElement('div');
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.right = '0';
    resizeHandle.style.width = '16px';
    resizeHandle.style.height = '16px';
    resizeHandle.style.cursor = 'nw-resize';
    resizeHandle.style.background = 'linear-gradient(-45deg, transparent 0%, transparent 50%, #C0C0C0 50%, #C0C0C0 100%)';
    element.appendChild(resizeHandle);

    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(element.style.width);
        startHeight = parseInt(element.style.height);
        element.classList.add('resizing');
        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.width = Math.max(200, startWidth + dx) + 'px';
            element.style.height = Math.max(100, startHeight + dy) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        element.classList.remove('resizing');
    });
}

// Focus a window
function focusWindow(windowEl) {
    activeWindow = windowEl;
    windowEl.style.zIndex = ++zIndexCounter;
    updateTaskbar();
}

// Minimize a window
function minimizeWindow(windowEl) {
    windowEl.style.display = 'none';
    updateTaskbar();
}

// Close a window
function closeWindow(windowEl) {
    if (windowEl._app) {
        windowEl._app.destroy();
        if (windowEl._resizeObserver) {
            windowEl._resizeObserver.disconnect();
        }
    }
    windowEl.remove();
    windows = windows.filter(w => w !== windowEl);
    updateTaskbar();
}
window.closeWindow = closeWindow;

// Update taskbar
function updateTaskbar() {
    const taskbarWindows = document.getElementById('taskbar-windows');
    taskbarWindows.innerHTML = '';

    windows.forEach(windowEl => {
        const title = windowEl.querySelector('.window-titlebar span').textContent;
        const btn = document.createElement('div');
        btn.className = 'taskbar-window' + (windowEl === activeWindow ? ' active' : '');
        btn.textContent = title;
        btn.addEventListener('click', () => {
            if (windowEl.style.display === 'none') {
                windowEl.style.display = 'flex';
                focusWindow(windowEl);
            } else if (windowEl === activeWindow) {
                minimizeWindow(windowEl);
            } else {
                focusWindow(windowEl);
            }
        });
        taskbarWindows.appendChild(btn);
    });
}

// Open browser
function openBrowser(url) {
    let browserWindow = document.getElementById('browser-window');
    if (!browserWindow) {
        browserWindow = document.createElement('div');
        browserWindow.id = 'browser-window';
        browserWindow.className = 'window';
        browserWindow.innerHTML = `
            <div class="window-titlebar">
                <span style="flex: 1;">Web Browser</span>
                <div class="window-controls">
                    <div class="window-control minimize">_</div>
                    <div class="window-control maximize">□</div>
                    <div class="window-control close">×</div>
                </div>
            </div>
            <div class="window-content">
                <div class="browser-toolbar">
                    <button id="back-btn">←</button>
                    <button id="forward-btn">→</button>
                    <button id="refresh-btn">↻</button>
                    <button id="home-btn">🏠</button>
                    <input type="text" id="address-bar" placeholder="Enter URL or page name">
                    <button id="go-btn">Go</button>
                </div>
                <div id="browser-content" class="browser-content">
                    <!-- Page content will be loaded here -->
                </div>
            </div>
        `;
        document.getElementById('desktop').appendChild(browserWindow);
        browserWindow.style.left = '50px';
        browserWindow.style.top = '50px';
        browserWindow.style.width = '800px';
        browserWindow.style.height = '600px';
        browserWindow.style.zIndex = ++zIndexCounter;
        makeDraggable(browserWindow);
        makeResizable(browserWindow);

        // Add event listeners
        browserWindow.querySelector('#back-btn').addEventListener('click', () => navigateBack());
        browserWindow.querySelector('#forward-btn').addEventListener('click', () => navigateForward());
        browserWindow.querySelector('#refresh-btn').addEventListener('click', () => loadPage(browserWindow.querySelector('#address-bar').value));
        browserWindow.querySelector('#home-btn').addEventListener('click', () => openBrowser('home'));
        browserWindow.querySelector('#go-btn').addEventListener('click', () => loadPage(browserWindow.querySelector('#address-bar').value));
        browserWindow.querySelector('#address-bar').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadPage(e.target.value);
            }
        });

        // Add window controls
        browserWindow.querySelector('.minimize').addEventListener('click', () => minimizeWindow(browserWindow));
        browserWindow.querySelector('.maximize').addEventListener('click', () => maximizeWindow(browserWindow));
        browserWindow.querySelector('.close').addEventListener('click', () => closeWindow(browserWindow));
    }
    browserWindow.style.display = 'flex';
    focusWindow(browserWindow);
    loadPage(url);
}

// Load a page
async function loadPage(pageName) {
    let browserWindow = document.getElementById('browser-window');
    if (!browserWindow || browserWindow.style.display === 'none') {
        openBrowser(pageName);
        return;
    }
    const content = browserWindow.querySelector('#browser-content');
    const addressBar = browserWindow.querySelector('#address-bar');

    addressBar.value = pageName;

    // Check AOL connection
    if (!aolConnection.isConnected && pageName !== 'home') {
        content.innerHTML = '<h1>The page cannot be displayed</h1><p>The page you are trying to view cannot be shown because the authenticity of the received data could not be verified.</p><p>URL: ' + addressBar.value + '</p><button onclick="openApp(\'solmerica\')">Connect to Solmerica Online</button>';
        return;
    }

    try {
        const resp = await fetch(`pages/${pageName}/index.html`);
        if (resp.ok) {
            content.innerHTML = await resp.text();
            return;
        }
    } catch (e) {
        // Fetch failed or 404, fallback to inline
    }

    // Comprehensive Geocities-style pages
    const pages = {
        'home': `
            <div class="geocities-page">
                <div class="geocities-header">🏠 Welcome to Toastyst's Retro Homepage! 🏠</div>
                <div class="geocities-marquee">★★★ UNDER CONSTRUCTION ★★★ Welcome to my awesome 90s-style homepage! ★★★ UNDER CONSTRUCTION ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <img src="https://i.imgur.com/placeholder.gif" alt="Under Construction" style="border: 3px outset #FFFFFF;">
                                <br><br>
                                <font size="+2" color="#FF0000"><b>🚧 This site is always under construction! 🚧</b></font>
                                <br><br>
                                <font size="+1">Welcome to my corner of the World Wide Web!</font>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="60%">
                            <h2>✨ What's New ✨</h2>
                            <ul>
                                <li>🆕 New retro gaming gallery!</li>
                                <li>🆕 Meme generator added!</li>
                                <li>🆕 Guestbook is now live!</li>
                                <li>🎵 Listen to my MIDI collection!</li>
                            </ul>

                            <h2>🌐 Navigate My Site 🌐</h2>
                            <p>Click the desktop icons to explore my digital world! Each icon opens a new adventure in cyberspace.</p>
                        </td>
                        <td width="40%">
                            <div class="geocities-sidebar">
                                <center><b>Site Navigation</b></center>
                                <hr>
                                <a href="#" onclick="loadPage('about')">📖 About Me</a><br>
                                <a href="#" onclick="loadPage('gaming')">🎮 Retro Gaming</a><br>
                                <a href="#" onclick="loadPage('jeep')">🚗 Jeep XJ</a><br>
                                <a href="#" onclick="loadPage('camry')">🚙 1996 Camry</a><br>
                                <a href="#" onclick="loadPage('links')">🔗 Cool Links</a><br>
                                <a href="#" onclick="loadPage('guestbook')">📝 Guestbook</a><br>
                                <a href="#" onclick="loadPage('downloads')">📥 Downloads</a><br>
                                <a href="#" onclick="loadPage('news')">📰 News</a><br>
                                <a href="#" onclick="loadPage('chat')">💬 Chat</a><br>
                                <a href="#" onclick="loadPage('music')">🎵 Music</a><br>
                            </div>
                        </td>
                    </tr>
                </table>

                <div class="geocities-guestbook">
                    <center><b>Latest Guestbook Entry</b></center>
                    <hr>
                    <i>"This site is totally radical! Keep up the awesome work!" - WebSurfer99</i>
                </div>

                <center>
                    <font size="-1" color="#808080">
                        This site best viewed with Netscape Navigator 4.0+<br>
                        Last updated: Today! | You are visitor number: <b>1337</b>
                    </font>
                </center>
            </div>
        `,

        'about': `
            <div class="geocities-page">
                <div class="geocities-header">📖 About Me - Toastyst's Digital Den 📖</div>
                <div class="geocities-marquee">★★★ Learn all about me and my adventures in cyberspace! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <img src="https://i.imgur.com/placeholder.gif" alt="My Photo" style="border: 3px outset #FFFFFF;">
                                <br><br>
                                <font size="+2"><b>Hello, World Wide Web!</b></font>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="70%">
                            <h2>👋 Who Am I?</h2>
                            <p>I'm Toastyst, a digital explorer who loves all things retro! From classic video games to vintage computers, I spend my time preserving the golden age of computing.</p>

                            <h2>💻 My Interests</h2>
                            <ul>
                                <li>🎮 Retro gaming (SNES, Genesis, arcade)</li>
                                <li>🚗 Classic cars and off-roading</li>
                                <li>💾 Vintage computing and software</li>
                                <li>🎵 90s MIDI music and chiptune</li>
                                <li>🌐 Web design from the Geocities era</li>
                            </ul>

                            <h2>🚀 My Mission</h2>
                            <p>To keep the spirit of the 90s internet alive! This site is my digital time capsule, preserving the wild and wonderful world of early web design.</p>
                        </td>
                        <td width="30%">
                            <div class="geocities-sidebar">
                                <center><b>Quick Facts</b></center>
                                <hr>
                                <b>Location:</b> Cyberspace<br>
                                <b>Occupation:</b> Retro Enthusiast<br>
                                <b>Favorite OS:</b> Windows 95<br>
                                <b>Favorite Game:</b> Super Mario World<br>
                                <b>Favorite Car:</b> Jeep XJ<br>
                                <b>Member since:</b> 1996<br>
                            </div>
                        </td>
                    </tr>
                </table>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('guestbook')">Sign Guestbook</a> |
                        <a href="#" onclick="loadPage('links')">Cool Links</a>
                    </font>
                </center>
            </div>
        `,

        'gaming': `
            <div class="geocities-page">
                <div class="geocities-header">🎮 Retro Gaming Gallery - Level Up! 🎮</div>
                <div class="geocities-marquee">★★★ INSERT COIN TO CONTINUE ★★★ Welcome to my gaming paradise! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="3">
                            <center>
                                <font size="+2" color="#FF0000"><b>🎯 My Retro Gaming Collection 🎯</b></font>
                                <br><br>
                                <i>"The best way to predict the future is to create it with pixels!"</i>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="33%">
                            <center>
                                <h3>🕹️ Console Gaming</h3>
                                <img src="https://i.imgur.com/placeholder.gif" alt="SNES" style="border: 2px outset #FFFFFF;"><br>
                                <b>Super Nintendo Entertainment System</b><br>
                                <font size="-1">My favorite console ever! Mario, Zelda, Mega Man...</font>
                            </center>
                        </td>
                        <td width="33%">
                            <center>
                                <h3>🕹️ Handheld Gaming</h3>
                                <img src="https://i.imgur.com/placeholder.gif" alt="Game Boy" style="border: 2px outset #FFFFFF;"><br>
                                <b>Game Boy & Game Boy Color</b><br>
                                <font size="-1">Portable gaming revolution!</font>
                            </center>
                        </td>
                        <td width="34%">
                            <center>
                                <h3>🕹️ Arcade Gaming</h3>
                                <img src="https://i.imgur.com/placeholder.gif" alt="Arcade" style="border: 2px outset #FFFFFF;"><br>
                                <b>Arcade Classics</b><br>
                                <font size="-1">Street Fighter, Pac-Man, Galaga!</font>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="3">
                            <h2>🏆 Favorite Games</h2>
                            <table class="geocities-table" style="width: 100%;">
                                <tr>
                                    <th>Game</th>
                                    <th>Platform</th>
                                    <th>Why I Love It</th>
                                </tr>
                                <tr>
                                    <td>Super Mario World</td>
                                    <td>SNES</td>
                                    <td>Perfect platforming!</td>
                                </tr>
                                <tr>
                                    <td>The Legend of Zelda: A Link to the Past</td>
                                    <td>SNES</td>
                                    <td>Epic adventure!</td>
                                </tr>
                                <tr>
                                    <td>Sonic the Hedgehog</td>
                                    <td>Genesis</td>
                                    <td>Speed and fun!</td>
                                </tr>
                                <tr>
                                    <td>Street Fighter II</td>
                                    <td>Arcade</td>
                                    <td>Best fighting game ever!</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('downloads')">Download Emulators</a>
                    </font>
                </center>
            </div>
        `,

        'jeep': `
            <div class="geocities-page">
                <div class="geocities-header">🚗 My Jeep XJ - Trail Blazer! 🚗</div>
                <div class="geocities-marquee">★★★ 4x4 ACTION! ★★★ Off-road adventures await! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <img src="https://i.imgur.com/placeholder.gif" alt="Jeep XJ" style="border: 3px outset #FFFFFF;">
                                <br><br>
                                <font size="+2"><b>My 1999 Jeep Cherokee XJ</b></font>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="60%">
                            <h2>📋 Vehicle Specs</h2>
                            <ul>
                                <li><b>Year:</b> 1999</li>
                                <li><b>Model:</b> Cherokee XJ</li>
                                <li><b>Engine:</b> 4.0L I6</li>
                                <li><b>Transmission:</b> AX-15 Manual</li>
                                <li><b>Drivetrain:</b> 4x4</li>
                                <li><b>Mileage:</b> Too many to count!</li>
                            </ul>

                            <h2>🔧 Modifications</h2>
                            <ul>
                                <li>3" Lift Kit</li>
                                <li>31" Tires</li>
                                <li>Aftermarket Bumper</li>
                                <li>Rock Sliders</li>
                                <li>Custom Exhaust</li>
                            </ul>

                            <h2>🏔️ Favorite Trails</h2>
                            <p>I love taking my XJ on challenging off-road trails. Nothing beats the feeling of conquering a tough obstacle in a capable vehicle!</p>
                        </td>
                        <td width="40%">
                            <div class="geocities-sidebar">
                                <center><b>Trail Rating</b></center>
                                <hr>
                                ⭐⭐⭐⭐⭐<br>
                                <i>"This Jeep can handle anything!"</i><br><br>
                                <b>Best Features:</b><br>
                                • Reliable 4.0L engine<br>
                                • Excellent ground clearance<br>
                                • Easy to work on<br>
                                • Parts are everywhere<br>
                            </div>
                        </td>
                    </tr>
                </table>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('camry')">Compare to Camry</a>
                    </font>
                </center>
            </div>
        `,

        'camry': `
            <div class="geocities-page">
                <div class="geocities-header">🚙 My 1996 Toyota Camry - Daily Driver 🚙</div>
                <div class="geocities-marquee">★★★ RELIABLE TRANSPORTATION ★★★ Over 300,000 miles and still going! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <img src="https://i.imgur.com/placeholder.gif" alt="1996 Camry" style="border: 3px outset #FFFFFF;">
                                <br><br>
                                <font size="+2"><b>My Trusty 1996 Toyota Camry</b></font>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="60%">
                            <h2>📋 Vehicle Specs</h2>
                            <ul>
                                <li><b>Year:</b> 1996</li>
                                <li><b>Model:</b> Camry LE</li>
                                <li><b>Engine:</b> 2.2L I4</li>
                                <li><b>Transmission:</b> Automatic</li>
                                <li><b>Drivetrain:</b> FWD</li>
                                <li><b>Mileage:</b> 325,000+ miles</li>
                            </ul>

                            <h2>🔧 Maintenance History</h2>
                            <ul>
                                <li>Regular oil changes</li>
                                <li>Timing belt replaced at 200k</li>
                                <li>New tires every 50k miles</li>
                                <li>Brakes replaced as needed</li>
                                <li>Still runs like new!</li>
                            </ul>

                            <h2>🚗 Why I Love It</h2>
                            <p>This Camry has been my reliable daily driver for over 15 years. Toyota reliability at its finest!</p>
                        </td>
                        <td width="40%">
                            <div class="geocities-sidebar">
                                <center><b>Reliability Rating</b></center>
                                <hr>
                                ⭐⭐⭐⭐⭐<br>
                                <i>"Never lets me down!"</i><br><br>
                                <b>Best Features:</b><br>
                                • Toyota reliability<br>
                                • Comfortable ride<br>
                                • Great fuel economy<br>
                                • Easy to maintain<br>
                            </div>
                        </td>
                    </tr>
                </table>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('jeep')">Compare to Jeep</a>
                    </font>
                </center>
            </div>
        `,

        'links': `
            <div class="geocities-page">
                <div class="geocities-header">🔗 Cool Links & Webrings - Surf the Web! 🔗</div>
                <div class="geocities-marquee">★★★ NETSURFING CENTRAL ★★★ The best sites on the information superhighway! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <font size="+2"><b>🌐 My Favorite Websites 🌐</b></font>
                                <br><br>
                                <i>"The Web is a vast and wonderful place!"</i>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%">
                            <h2>🎮 Gaming Sites</h2>
                            <ul>
                                <li><a href="#" onclick="loadPage('gaming')">My Retro Gaming Gallery</a></li>
                                <li><a href="https://example.com" target="_blank">Classic Gaming Museum</a></li>
                                <li><a href="https://example.com" target="_blank">Retro Game Reviews</a></li>
                                <li><a href="https://example.com" target="_blank">Emulator Zone</a></li>
                            </ul>

                            <h2>🚗 Car Enthusiast Sites</h2>
                            <ul>
                                <li><a href="#" onclick="loadPage('jeep')">My Jeep XJ Page</a></li>
                                <li><a href="#" onclick="loadPage('camry')">My Camry Page</a></li>
                                <li><a href="https://example.com" target="_blank">Off-Road Adventures</a></li>
                                <li><a href="https://example.com" target="_blank">Classic Car Club</a></li>
                            </ul>
                        </td>
                        <td width="50%">
                            <h2>💻 Tech & Retro Sites</h2>
                            <ul>
                                <li><a href="https://neocities.org" target="_blank">Neocities</a></li>
                                <li><a href="https://example.com" target="_blank">Vintage Computing</a></li>
                                <li><a href="https://example.com" target="_blank">DOS Games Archive</a></li>
                                <li><a href="https://example.com" target="_blank">Web Design Museum</a></li>
                            </ul>

                            <h2>🎵 Music & Culture</h2>
                            <ul>
                                <li><a href="#" onclick="loadPage('music')">My MIDI Collection</a></li>
                                <li><a href="https://example.com" target="_blank">90s Music Archive</a></li>
                                <li><a href="https://example.com" target="_blank">Chiptune Radio</a></li>
                                <li><a href="https://example.com" target="_blank">Retro Culture Blog</a></li>
                            </ul>
                        </td>
                    </tr>
                </table>

                <div class="geocities-guestbook">
                    <center><b>Webring Membership</b></center>
                    <hr>
                    <center>
                        <a href="https://example.com" target="_blank">[Previous Site]</a> |
                        <a href="https://example.com" target="_blank">[Random Site]</a> |
                        <a href="https://example.com" target="_blank">[Next Site]</a>
                    </center>
                </div>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('guestbook')">Join the Community</a>
                    </font>
                </center>
            </div>
        `,

        'guestbook': `
            <div class="geocities-page">
                <div class="geocities-header">📝 Guestbook - Sign My Digital Guestbook! 📝</div>
                <div class="geocities-marquee">★★★ LEAVE YOUR MARK ★★★ Sign here and be immortalized! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <font size="+2"><b>Welcome to My Guestbook!</b></font>
                                <br><br>
                                <i>"Leave your thoughts for future visitors to see!"</i>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%">
                            <h2>✍️ Sign the Guestbook</h2>
                            <form id="guestbook-form">
                                <table class="geocities-table">
                                    <tr>
                                        <td><b>Name:</b></td>
                                        <td><input type="text" id="guest-name" style="width: 100%;"></td>
                                    </tr>
                                    <tr>
                                        <td><b>Email:</b></td>
                                        <td><input type="email" id="guest-email" style="width: 100%;"></td>
                                    </tr>
                                    <tr>
                                        <td><b>Homepage:</b></td>
                                        <td><input type="url" id="guest-url" style="width: 100%;"></td>
                                    </tr>
                                    <tr>
                                        <td colspan="2">
                                            <b>Message:</b><br>
                                            <textarea id="guest-message" rows="4" style="width: 100%;"></textarea>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" align="center">
                                            <button type="button" onclick="addGuestbookEntry()" style="background: #C0C0C0; border: 2px outset #FFFFFF; padding: 4px 12px;">Sign Guestbook!</button>
                                        </td>
                                    </tr>
                                </table>
                            </form>
                        </td>
                        <td width="50%">
                            <div class="geocities-sidebar">
                                <center><b>Guestbook Rules</b></center>
                                <hr>
                                • Be respectful<br>
                                • No spam please<br>
                                • Include your name<br>
                                • Keep it family-friendly<br>
                                • Have fun! 😊<br><br>
                                <b>Total Signatures:</b><br>
                                <span id="signature-count">15</span>
                            </div>
                        </td>
                    </tr>
                </table>

                <h2>📖 Recent Entries</h2>
                <div id="guestbook-entries">
                    <div class="geocities-guestbook">
                        <b>WebSurfer99</b> from <a href="https://example.com">CoolSite.com</a><br>
                        <i>03/15/2024</i><br>
                        "This site is totally radical! Keep up the awesome work!"<br><br>
                        <b>RetroGamer</b> from <a href="https://example.com">GameZone.net</a><br>
                        <i>03/10/2024</i><br>
                        "Love the retro gaming section! Any chance you'll add more arcade games?"<br><br>
                        <b>CarEnthusiast</b> from <a href="https://example.com">AutoBlog.org</a><br>
                        <i>03/05/2024</i><br>
                        "Your Jeep XJ page is awesome! I've got a similar setup on my Cherokee."
                    </div>
                </div>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('about')">About the Author</a>
                    </font>
                </center>
            </div>
        `,

        'downloads': `
            <div class="geocities-page">
                <div class="geocities-header">📥 Downloads & Free Stuff - Get Your Digital Goodies! 📥</div>
                <div class="geocities-marquee">★★★ FREE DOWNLOADS ★★★ Shareware, freeware, and more! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <font size="+2"><b>💾 Free Downloads Center 💾</b></font>
                                <br><br>
                                <i>"All downloads are virus-free and shareware!"</i>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="60%">
                            <h2>🎮 Gaming Downloads</h2>
                            <ul>
                                <li><b>Retro Game Emulators</b> - Play classic games on modern computers</li>
                                <li><b>ROM Collections</b> - Thousands of classic games</li>
                                <li><b>Save State Files</b> - Pre-saved game progress</li>
                                <li><b>Cheat Codes</b> - Unlock secrets in your favorite games</li>
                            </ul>

                            <h2>💻 Software Tools</h2>
                            <ul>
                                <li><b>System Utilities</b> - Keep your computer running smoothly</li>
                                <li><b>Image Editors</b> - Create and edit graphics</li>
                                <li><b>Text Editors</b> - Write and edit documents</li>
                                <li><b>Web Browsers</b> - Surf the internet</li>
                            </ul>

                            <h2>🎵 Media Files</h2>
                            <ul>
                                <li><b>MIDI Music</b> - Classic video game soundtracks</li>
                                <li><b>Sound Effects</b> - Enhance your projects</li>
                                <li><b>Wallpapers</b> - Retro desktop backgrounds</li>
                                <li><b>Icons</b> - Customize your desktop</li>
                            </ul>
                        </td>
                        <td width="40%">
                            <div class="geocities-sidebar">
                                <center><b>Download Stats</b></center>
                                <hr>
                                <b>Total Downloads:</b><br>
                                1,337<br><br>
                                <b>Popular This Week:</b><br>
                                • SNES Emulator<br>
                                • Retro Wallpapers<br>
                                • MIDI Player<br><br>
                                <b>File Sizes:</b><br>
                                Small: < 1MB<br>
                                Medium: 1-10MB<br>
                                Large: > 10MB<br>
                            </div>
                        </td>
                    </tr>
                </table>

                <div class="geocities-guestbook">
                    <center><b>Download Instructions</b></center>
                    <hr>
                    1. Click the download link<br>
                    2. Save the file to your computer<br>
                    3. Extract if it's a ZIP file<br>
                    4. Follow any included instructions<br>
                    5. Enjoy your new software!
                </div>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('gaming')">Gaming Section</a> |
                        <a href="#" onclick="loadPage('music')">Music Downloads</a>
                    </font>
                </center>
            </div>
        `,

        'news': `
            <div class="geocities-page">
                <div class="geocities-header">📰 News & Updates - What's New in Cyberspace! 📰</div>
                <div class="geocities-marquee">★★★ LATEST NEWS ★★★ Stay informed about the digital world! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <font size="+2"><b>📢 Latest Updates 📢</b></font>
                                <br><br>
                                <i>"All the news that's fit to hyperlink!"</i>
                            </center>
                        </td>
                    </tr>
                </table>

                <div style="background: #FFFFCC; border: 2px inset #808080; padding: 10px; margin: 10px 0;">
                    <h3>🚨 BREAKING: New Meme Generator Added!</h3>
                    <i>March 20, 2024</i><br>
                    <p>I've just added a brand new meme generator to the site! Create hilarious memes with classic 90s styling. Check it out in the meme generator section!</p>
                </div>

                <div style="background: #CCFFFF; border: 2px inset #808080; padding: 10px; margin: 10px 0;">
                    <h3>🎮 Retro Gaming Gallery Expanded</h3>
                    <i>March 15, 2024</i><br>
                    <p>Added more content to my retro gaming section, including detailed reviews of classic games and tips for emulation. More updates coming soon!</p>
                </div>

                <div style="background: #FFCCFF; border: 2px inset #808080; padding: 10px; margin: 10px 0;">
                    <h3>🚗 Vehicle Pages Updated</h3>
                    <i>March 10, 2024</i><br>
                    <p>Both my Jeep XJ and Camry pages have been updated with new photos, maintenance logs, and adventure stories. Stay tuned for more automotive content!</p>
                </div>

                <div style="background: #CCFFCC; border: 2px inset #808080; padding: 10px; margin: 10px 0;">
                    <h3>🎵 MIDI Music Collection Growing</h3>
                    <i>March 5, 2024</i><br>
                    <p>I've been collecting more MIDI files from classic video games. The music player section now has over 50 tracks! Let me know your favorites.</p>
                </div>

                <h2>📅 Upcoming Features</h2>
                <ul>
                    <li>💬 Real-time chat system</li>
                    <li>🎯 Online games section</li>
                    <li>📸 Photo gallery</li>
                    <li>📚 Resource library</li>
                    <li>🔧 Webmaster tools</li>
                </ul>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('guestbook')">Leave Comments</a>
                    </font>
                </center>
            </div>
        `,



        'chat': `
            <div class="geocities-page">
                <div class="geocities-header">💬 Chat Room - Join the Conversation! 💬</div>
                <div class="geocities-marquee">★★★ WELCOME TO THE CHAT ★★★ Meet fellow netizens! ★★★</div>

                <table class="geocities-table">
                    <tr>
                        <td colspan="2">
                            <center>
                                <font size="+2"><b>🌐 Toastyst's Chat Zone 🌐</b></font>
                                <br><br>
                                <i>"Where digital conversations happen!"</i>
                            </center>
                        </td>
                            </tr>
                            <tr>
                                <td width="70%">
                                    <h2>💭 Chat Messages</h2>
                                    <div id="chat-messages" style="border: 2px inset #808080; background: #000000; color: #00FF00; font-family: 'Courier New', monospace; height: 300px; overflow-y: auto; padding: 10px;">
                                        <div><b>System:</b> Welcome to the chat room!</div>
                                        <div><b>WebSurfer99:</b> Hey everyone! This site is awesome!</div>
                                        <div><b>RetroGamer:</b> Anyone up for some Mario Kart?</div>
                                        <div><b>Guest123:</b> First time here, loving the retro vibe!</div>
                                        <div><b>ChatMaster:</b> Welcome to all newcomers! Feel free to chat about anything retro.</div>
                                    </div>

                                    <h2>📝 Send a Message</h2>
                                    <table class="geocities-table">
                                        <tr>
                                            <td><b>Your Name:</b></td>
                                            <td><input type="text" id="chat-name" placeholder="Anonymous" style="width: 100%;"></td>
                                        </tr>
                                        <tr>
                                            <td><b>Message:</b></td>
                                            <td><input type="text" id="chat-message" placeholder="Type your message..." style="width: 100%;" onkeypress="if(event.key==='Enter') sendChatMessage()"></td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" align="center">
                                                <button onclick="sendChatMessage()" style="background: #C0C0C0; border: 2px outset #FFFFFF; padding: 4px 12px;">Send Message</button>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td width="30%">
                                    <div class="geocities-sidebar">
                                        <center><b>Who's Online</b></center>
                                        <hr>
                                        🟢 WebSurfer99<br>
                                        🟢 RetroGamer<br>
                                        🟢 ChatMaster<br>
                                        🟢 Guest123<br>
                                        🟡 You<br><br>
                                        <b>Users Online:</b> 5<br>
                                        <b>Messages Today:</b> 47
                                    </div>
                                </td>
                            </tr>
                        </table>

                        <div class="geocities-guestbook">
                            <center><b>Chat Rules</b></center>
                            <hr>
                            • Be respectful to others<br>
                            • No spam or flooding<br>
                            • Keep it family-friendly<br>
                            • Have fun chatting! 🎉
                        </div>

                        <center>
                            <font size="-1" color="#808080">
                                <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                                <a href="#" onclick="loadPage('guestbook')">Leave Feedback</a>
                            </font>
                        </center>
                    </div>
                `,

                'music': `
                    <div class="geocities-page">
                        <div class="geocities-header">🎵 MIDI Music Player - Tune Into the 90s! 🎵</div>
                        <div class="geocities-marquee">★★★ NOW PLAYING ★★★ Classic video game music! ★★★</div>

                        <table class="geocities-table">
                            <tr>
                                <td colspan="2">
                            <center>
                                <font size="+2"><b>🎼 My MIDI Collection 🎼</b></font>
                                <br><br>
                                <i>"Relive the golden age of video game music!"</i>
                            </center>
                        </td>
                    </tr>
                    <tr>
                        <td width="60%">
                            <h2>🎮 Console Music</h2>
                            <div id="midi-player">
                                <div style="background: #C0C0C0; border: 2px inset #808080; padding: 10px; margin: 10px 0;">
                                    <b>Now Playing:</b> <span id="current-track">Super Mario World - Overworld Theme</span><br>
                                    <audio id="midi-audio" controls style="width: 100%; margin: 10px 0;">
                                        <source src="https://example.com/placeholder.mid" type="audio/midi">
                                        Your browser doesn't support MIDI playback.
                                    </audio>
                                    <button onclick="playRandomMIDI()" style="background: #C0C0C0; border: 2px outset #FFFFFF; padding: 4px 12px;">🎲 Random Track</button>
                                </div>
                            </div>

                            <h2>📀 Playlist</h2>
                            <div id="midi-playlist" style="max-height: 300px; overflow-y: auto;">
                                <div class="midi-track" onclick="playMIDI('Super Mario World - Overworld Theme')" style="padding: 5px; border-bottom: 1px solid #C0C0C0; cursor: pointer;">🎵 Super Mario World - Overworld Theme</div>
                                <div class="midi-track" onclick="playMIDI('The Legend of Zelda - Hyrule Castle')" style="padding: 5px; border-bottom: 1px solid #C0C0C0; cursor: pointer;">🎵 The Legend of Zelda - Hyrule Castle</div>
                                <div class="midi-track" onclick="playMIDI('Sonic the Hedgehog - Green Hill Zone')" style="padding: 5px; border-bottom: 1px solid #C0C0C0; cursor: pointer;">🎵 Sonic the Hedgehog - Green Hill Zone</div>
                                <div class="midi-track" onclick="playMIDI('Street Fighter II - Guile Theme')" style="padding: 5px; border-bottom: 1px solid #C0C0C0; cursor: pointer;">🎵 Street Fighter II - Guile Theme</div>
                                <div class="midi-track" onclick="playMIDI('Final Fantasy VI - Terra Theme')" style="padding: 5px; border-bottom: 1px solid #C0C0C0; cursor: pointer;">🎵 Final Fantasy VI - Terra Theme</div>
                                <div class="midi-track" onclick="playMIDI('Chrono Trigger - Main Theme')" style="padding: 5px; border-bottom: 1px solid #C0C0C0; cursor: pointer;">🎵 Chrono Trigger - Main Theme</div>
                                <div class="midi-track" onclick="playMIDI('Mega Man 2 - Dr. Wily Stage 1')" style="padding: 5px; border-bottom: 1px solid #C0C0C0; cursor: pointer;">🎵 Mega Man 2 - Dr. Wily Stage 1</div>
                                <div class="midi-track" onclick="playMIDI('Tetris - Korobeiniki')" style="padding: 5px; border-bottom: 1px solid #C0C0C0; cursor: pointer;">🎵 Tetris - Korobeiniki</div>
                            </div>
                        </td>
                        <td width="40%">
                            <div class="geocities-sidebar">
                                <center><b>MIDI Info</b></center>
                                <hr>
                                <b>Format:</b> MIDI<br>
                                <b>Quality:</b> 16-bit<br>
                                <b>Tracks:</b> 50+<br>
                                <b>Genres:</b> Game Music<br><br>
                                <b>Popular Games:</b><br>
                                • Super Mario<br>
                                • Zelda<br>
                                • Final Fantasy<br>
                                • Sonic<br>
                                • Mega Man<br>
                            </div>
                        </td>
                    </tr>
                </table>

                <center>
                    <font size="-1" color="#808080">
                        <a href="#" onclick="loadPage('home')">← Back to Home</a> |
                        <a href="#" onclick="loadPage('downloads')">Download MIDI Files</a>
                    </font>
                </center>
            </div>
        `
    };

    content.innerHTML = pages[pageName] || '<h1>Page Not Found</h1><p>The page you requested does not exist.</p>';
    addressBar.value = pageName;

    // Play car horns if connected
    if ((pageName === 'jeep' || pageName === 'camry') && aolConnection.isConnected) {
        playSound('horn.wav');
    }

    // Update history
    if (pageName !== browserHistory[historyIndex]) {
        browserHistory = browserHistory.slice(0, historyIndex + 1);
        browserHistory.push(pageName);
        historyIndex = browserHistory.length - 1;
    }
}

// Navigate back
function navigateBack() {
    if (historyIndex > 0) {
        historyIndex--;
        loadPage(browserHistory[historyIndex]);
    }
}

// Navigate forward
function navigateForward() {
    if (historyIndex < browserHistory.length - 1) {
        historyIndex++;
        loadPage(browserHistory[historyIndex]);
    }
}

// Meme generator variables
let selectedMemeTemplate = null;
const memeTemplates = {
    'distracted-boyfriend': 'https://i.imgur.com/placeholder.gif',
    'this-is-fine': 'https://i.imgur.com/placeholder.gif',
    'success-kid': 'https://i.imgur.com/placeholder.gif'
};

// Select meme template
function selectMemeTemplate(template) {
    selectedMemeTemplate = template;
    const preview = document.getElementById('meme-preview');
    if (preview) {
        preview.innerHTML = `
            <img src="${memeTemplates[template]}" alt="${template}" style="max-width: 100%; max-height: 150px;">
            <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); color: white; font-size: 16px; font-weight: bold; text-shadow: 2px 2px 0px black; text-align: center;">TOP TEXT</div>
            <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); color: white; font-size: 16px; font-weight: bold; text-shadow: 2px 2px 0px black; text-align: center;">BOTTOM TEXT</div>
        `;
    }
}

// Generate meme
function generateMeme() {
    const topText = document.getElementById('meme-top-text')?.value || 'TOP TEXT';
    const bottomText = document.getElementById('meme-bottom-text')?.value || 'BOTTOM TEXT';

    if (!selectedMemeTemplate) {
        alert('Please select a meme template first!');
        return;
    }

    const memeHTML = `
        <div style="position: relative; display: inline-block; margin: 10px; border: 2px outset #FFFFFF; background: #C0C0C0; padding: 5px;">
            <img src="${memeTemplates[selectedMemeTemplate]}" alt="${selectedMemeTemplate}" style="max-width: 200px; max-height: 150px;">
            <div style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%); color: white; font-size: 12px; font-weight: bold; text-shadow: 2px 2px 0px black; text-align: center;">${topText}</div>
            <div style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); color: white; font-size: 12px; font-weight: bold; text-shadow: 2px 2px 0px black; text-align: center;">${bottomText}</div>
        </div>
    `;

    const history = document.getElementById('meme-history');
    if (history) {
        history.innerHTML += memeHTML;
    }

    // Clear inputs
    if (document.getElementById('meme-top-text')) document.getElementById('meme-top-text').value = '';
    if (document.getElementById('meme-bottom-text')) document.getElementById('meme-bottom-text').value = '';
}

// Open meme generator in separate window
function openMemeWindow() {
    openWindow('Meme Generator', `
        <div style="padding: 10px;">
            <h2>🎭 Meme Generator 🎭</h2>
            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <h3>Choose Template</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        <div onclick="window.selectMemeTemplate('distracted-boyfriend')" style="border: 2px outset #FFFFFF; padding: 5px; cursor: pointer;">
                            <img src="https://i.imgur.com/placeholder.gif" alt="Distracted Boyfriend" style="width: 80px; height: 60px;">
                            <br><small>Distracted Boyfriend</small>
                        </div>
                        <div onclick="window.selectMemeTemplate('this-is-fine')" style="border: 2px outset #FFFFFF; padding: 5px; cursor: pointer;">
                            <img src="https://i.imgur.com/placeholder.gif" alt="This is Fine" style="width: 80px; height: 60px;">
                            <br><small>This is Fine</small>
                        </div>
                        <div onclick="window.selectMemeTemplate('success-kid')" style="border: 2px outset #FFFFFF; padding: 5px; cursor: pointer;">
                            <img src="https://i.imgur.com/placeholder.gif" alt="Success Kid" style="width: 80px; height: 60px;">
                            <br><small>Success Kid</small>
                        </div>
                    </div>

                    <h3>Add Text</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td><b>Top Text:</b></td>
                            <td><input type="text" id="window-meme-top" placeholder="TOP TEXT" style="width: 100%;"></td>
                        </tr>
                        <tr>
                            <td><b>Bottom Text:</b></td>
                            <td><input type="text" id="window-meme-bottom" placeholder="BOTTOM TEXT" style="width: 100%;"></td>
                        </tr>
                        <tr>
                            <td colspan="2" style="text-align: center;">
                                <button onclick="window.generateMemeInWindow()" style="background: #C0C0C0; border: 2px outset #FFFFFF; padding: 4px 12px;">Generate Meme!</button>
                            </td>
                        </tr>
                    </table>
                </div>
                <div style="flex: 1;">
                    <h3>Preview</h3>
                    <div id="window-meme-preview" style="border: 2px inset #808080; background: #FFFFFF; min-height: 200px; display: flex; align-items: center; justify-content: center; color: #808080;">
                        Select a template and add text to generate your meme!
                    </div>
                </div>
            </div>
        </div>
    `, 200, 200, 600, 500);
}

// Make meme functions available globally for window
window.selectMemeTemplate = function(template) {
    selectedMemeTemplate = template;
    const preview = document.getElementById('window-meme-preview');
    if (preview) {
        preview.innerHTML = `
            <img src="${memeTemplates[selectedMemeTemplate]}" alt="${selectedMemeTemplate}" style="max-width: 100%; max-height: 150px;">
            <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); color: white; font-size: 16px; font-weight: bold; text-shadow: 2px 2px 0px black; text-align: center;">TOP TEXT</div>
            <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); color: white; font-size: 16px; font-weight: bold; text-shadow: 2px 2px 0px black; text-align: center;">BOTTOM TEXT</div>
        `;
    }
};

window.generateMemeInWindow = function() {
    const topText = document.getElementById('window-meme-top')?.value || 'TOP TEXT';
    const bottomText = document.getElementById('window-meme-bottom')?.value || 'BOTTOM TEXT';

    if (!selectedMemeTemplate) {
        alert('Please select a meme template first!');
        return;
    }

    const preview = document.getElementById('window-meme-preview');
    if (preview) {
        preview.innerHTML = `
            <img src="${memeTemplates[selectedMemeTemplate]}" alt="${selectedMemeTemplate}" style="max-width: 100%; max-height: 150px;">
            <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); color: white; font-size: 16px; font-weight: bold; text-shadow: 2px 2px 0px black; text-align: center;">${topText}</div>
            <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); color: white; font-size: 16px; font-weight: bold; text-shadow: 2px 2px 0px black; text-align: center;">${bottomText}</div>
        `;
    }
};

// Chat functionality
function sendChatMessage() {
    const name = document.getElementById('chat-name')?.value || 'Anonymous';
    const message = document.getElementById('chat-message')?.value;

    if (!message) return;

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = `<b>${name}:</b> ${message}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Clear message input
    if (document.getElementById('chat-message')) {
        document.getElementById('chat-message').value = '';
    }
}

// Guestbook functionality
function addGuestbookEntry() {
    const name = document.getElementById('guest-name')?.value;
    const email = document.getElementById('guest-email')?.value;
    const url = document.getElementById('guest-url')?.value;
    const message = document.getElementById('guest-message')?.value;

    if (!name || !message) {
        alert('Please enter your name and message!');
        return;
    }

    const entries = document.getElementById('guestbook-entries');
    if (entries) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'geocities-guestbook';
        entryDiv.innerHTML = `
            <b>${name}</b>${url ? ` from <a href="${url}" target="_blank">${url}</a>` : ''}<br>
            <i>${new Date().toLocaleDateString()}</i><br>
            ${message.replace(/\n/g, '<br>')}
        `;
        entries.insertBefore(entryDiv, entries.firstChild);

        // Update signature count
        const countEl = document.getElementById('signature-count');
        if (countEl) {
            countEl.textContent = parseInt(countEl.textContent) + 1;
        }
    }

    // Clear form
    document.getElementById('guest-name').value = '';
    document.getElementById('guest-email').value = '';
    document.getElementById('guest-url').value = '';
    document.getElementById('guest-message').value = '';
}

// MIDI player functionality
function playMIDI(trackName) {
    const currentTrack = document.getElementById('current-track');
    if (currentTrack) {
        currentTrack.textContent = trackName;
    }
    // In a real implementation, this would load and play the actual MIDI file
    console.log('Playing:', trackName);
}

function playRandomMIDI() {
    const tracks = [
        'Super Mario World - Overworld Theme',
        'The Legend of Zelda - Hyrule Castle',
        'Sonic the Hedgehog - Green Hill Zone',
        'Street Fighter II - Guile Theme',
        'Final Fantasy VI - Terra Theme',
        'Chrono Trigger - Main Theme',
        'Mega Man 2 - Dr. Wily Stage 1',
        'Tetris - Korobeiniki'
    ];
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    playMIDI(randomTrack);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initBootSequence);