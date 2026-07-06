// Retro Desktop OS - Main Application
// Modular architecture with managers handling all logic

import { BootManager } from './core/bootManager.js';
import { WindowManager } from './core/windowManager.js';
import { DesktopManager } from './core/desktopManager.js';
import { TaskbarManager } from './core/taskbarManager.js';
import { StartMenu } from './core/startMenu.js';
import { BrowserManager } from './core/browserManager.js';
import { eventBus } from './core/eventBus.js';
import { registry } from './apps/registry.js';

// Global state
let bootManager, windowManager, desktopManager, taskbarManager, startMenu, browserManager;
let aolConnection = { isConnected: false, status: 'Offline' };

// Load configurations
async function loadConfig() {
    const [bootResp, iconsResp, menuResp] = await Promise.all([
        fetch('js/config/boot.json'),
        fetch('js/config/desktopIcons.json'),
        fetch('js/config/startMenu.json')
    ]);
    const bootConfig = await bootResp.json();
    const desktopIcons = await iconsResp.json();
    const startMenuItems = await menuResp.json();
    return { bootConfig, desktopIcons, startMenuItems };
}

// Initialize desktop
function initDesktop(desktopIcons, startMenuItems) {
    desktopManager.init(desktopIcons);
    taskbarManager.init();
    const startBtn = document.querySelector('.start-button');
    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startMenu.toggle();
        });
    }
}

const APP_CONFIG = {
    solitaire: { title: 'Solitaire', width: 700, height: 560, className: 'solitaire-window' },
    paint: { title: 'Paint', width: 520, height: 480, className: 'paint-window' },
    calculator: { title: 'Calculator', width: 240, height: 320, className: 'calculator-window' },
    notepad: { title: 'Notepad', width: 480, height: 360 },
    solmerica: { title: 'Solmerica Online', width: 640, height: 480 }
};

// Open app
async function openApp(appName) {
    if (!registry[appName]) {
        console.error('Unknown app:', appName);
        alert(`Application not found: ${appName}`);
        return;
    }
    try {
        const config = APP_CONFIG[appName] || { title: appName, width: 400, height: 300 };
        const createApp = await registry[appName]();
        const windowEl = windowManager.openWindow(
            config.title,
            '<div id="app-container" style="width:100%;height:100%;"></div>',
            null,
            null,
            config.width,
            config.height,
            config.className || ''
        );
        const container = windowEl.querySelector('#app-container');
        const app = createApp(container);
        windowEl._app = app;
        if (app.resize) {
            const content = windowEl.querySelector('.window-content');
            const doResize = () => {
                app.resize(content.clientWidth, content.clientHeight);
            };
            windowEl._resizeObserver = new ResizeObserver(doResize);
            windowEl._resizeObserver.observe(windowEl);
            doResize();
        }
    } catch (err) {
        console.error(`Failed to open app "${appName}":`, err);
        alert(`Could not open ${appName}.\n\n${err.message}`);
    }
}

// Play sound
function playSound(soundName) {
    const audio = new Audio(`sounds/${soundName}.wav`);
    audio.play().catch(() => {}); // Ignore errors
}

// Update clock
function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();
    const clockEl = document.getElementById('taskbar-clock');
    if (clockEl) {
        clockEl.textContent = `${time} ${date}`;
    }
}

// Easter egg
function easterEggBSOD() {
    document.body.innerHTML = `
        <div style="background:#000080; color:#FFFFFF; font-family:monospace; padding:20px; height:100vh;">
            <h1>Windows</h1>
            <p>A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) + 00010E36. The current application will be terminated.</p>
            <p>* Press any key to terminate the current application.<br>* Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.</p>
            <p>Press any key to continue _</p>
        </div>
    `;
    document.addEventListener('keydown', () => location.reload());
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { bootConfig, desktopIcons, startMenuItems } = await loadConfig();

        // Initialize managers
        bootManager = new BootManager(bootConfig);
        windowManager = new WindowManager();
        desktopManager = new DesktopManager(windowManager);
        taskbarManager = new TaskbarManager();
        startMenu = new StartMenu(startMenuItems);
        browserManager = new BrowserManager(windowManager);

        // Set globals for desktop icon actions
        window.browserManager = browserManager;
        window.openApp = openApp;
        window.openBrowser = browserManager.openBrowser.bind(browserManager);
        window.openWindow = windowManager.openWindow.bind(windowManager);
        window.loadPage = browserManager.loadPage.bind(browserManager);
        window.startMenuActions = {
            'Notepad': () => openApp('notepad'),
            'Calculator': () => openApp('calculator'),
            'Solitaire': () => openApp('solitaire'),
            'Solmerica Online': () => openApp('solmerica'),
            'Minesweeper': () => alert('Minesweeper is not installed yet.'),
            'Documents': () => alert('No documents found.'),
            'Settings': () => alert('Display settings are not available.'),
            'Find': () => alert('Find: Files or Folders'),
            'Help': () => alert('Help is on the way... eventually.'),
            'Run...': () => alert('Run dialog is not available.'),
            'Shut Down...': () => location.reload(),
            'openApp': (app) => openApp(app),
            'openBrowser': (page) => browserManager.openBrowser(page),
            'run': (cmd) => console.log('Run:', cmd),
            'shutdown': () => location.reload(),
            'restart': () => location.reload()
        };

        eventBus.on('bootComplete', () => initDesktop(desktopIcons, startMenuItems));

        bootManager.run();
    } catch (e) {
        console.error('Initialization failed:', e);
        easterEggBSOD();
    }
});