import { eventBus } from './eventBus.js';

class WindowManager {
  constructor() {
    this.windows = [];
    this.activeWindow = null;
    this.zIndexCounter = 1;
  }

  openWindow(title, content, x = null, y = null, width = 400, height = 300, className = '') {
    if (x === null) x = Math.max(100, (window.innerWidth - width) / 2);
    if (y === null) y = Math.max(100, (window.innerHeight - height) / 2);
    const windowEl = document.createElement('div');
    windowEl.className = 'window';
    if (className) windowEl.classList.add(className);
    windowEl.style.left = x + 'px';
    windowEl.style.top = y + 'px';
    windowEl.style.width = width + 'px';
    windowEl.style.height = height + 'px';
    windowEl.style.zIndex = ++this.zIndexCounter;
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
    this.makeDraggable(windowEl);
    if (className !== 'calculator-window') {
        this.makeResizable(windowEl);
    }

    // Add event listeners for controls
    windowEl.querySelector('.minimize').addEventListener('click', () => this.minimizeWindow(windowEl));
    windowEl.querySelector('.maximize').addEventListener('click', () => this.maximizeWindow(windowEl));
    windowEl.querySelector('.close').addEventListener('click', () => this.closeWindow(windowEl));

    this.windows.push(windowEl);
    this.focusWindow(windowEl);
    this.updateTaskbar();
    eventBus.emit('windowOpened', windowEl);
    return windowEl;
  }

  makeDraggable(element) {
    const titlebar = element.querySelector('.window-titlebar');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    titlebar.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(element.style.left);
        startTop = parseInt(element.style.top);
        element.style.zIndex = ++this.zIndexCounter;
        this.focusWindow(element);
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

  makeResizable(element) {
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

  focusWindow(windowEl) {
    this.activeWindow = windowEl;
    this.windows.forEach(w => {
      w.classList.remove('active');
      w.style.boxShadow = 'none';
    });
    windowEl.classList.add('active');
    windowEl.style.boxShadow = '0 0 10px rgba(0,0,255,0.5)';
    windowEl.style.zIndex = ++this.zIndexCounter;
    this.updateTaskbar();
  }

  minimizeWindow(windowEl) {
    windowEl.style.display = 'none';
    this.updateTaskbar();
  }

  closeWindow(windowEl) {
    if (windowEl._app) {
        windowEl._app.destroy();
        if (windowEl._resizeObserver) {
            windowEl._resizeObserver.disconnect();
        }
    }
    windowEl.remove();
    this.windows = this.windows.filter(w => w !== windowEl);
    this.updateTaskbar();
  }

  maximizeWindow(windowEl) {
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

  updateTaskbar() {
    const taskbarWindows = document.getElementById('taskbar-windows');
    taskbarWindows.innerHTML = '';

    this.windows.forEach(windowEl => {
        const title = windowEl.querySelector('.window-titlebar span').textContent;
        const btn = document.createElement('div');
        btn.className = 'taskbar-window' + (windowEl === this.activeWindow ? ' active' : '');
        btn.textContent = title;
        btn.addEventListener('click', () => {
            if (windowEl.style.display === 'none') {
                windowEl.style.display = 'flex';
                this.focusWindow(windowEl);
            } else if (windowEl === this.activeWindow) {
                this.minimizeWindow(windowEl);
            } else {
                this.focusWindow(windowEl);
            }
        });
        taskbarWindows.appendChild(btn);
    });
  }

  nextZIndex() {
    return ++this.zIndexCounter;
  }

  addWindow(winEl) {
    this.windows.push(winEl);
    this.updateTaskbar();
  }
}

export { WindowManager };