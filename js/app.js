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
}

// Open app
async function openApp(appName) {
    const createApp = await registry[appName]();
    const windowEl = windowManager.openWindow(appName, '<div id="app-container"></div>');
    const container = windowEl.querySelector('#app-container');
    const app = createApp(container);
    windowEl._app = app;
    if (app.resize) {
        windowEl._resizeObserver = new ResizeObserver(() => app.resize());
        windowEl._resizeObserver.observe(windowEl);
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