import { eventBus } from './eventBus.js';

class DesktopManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.draggedIcon = null;
    this.isDraggingIcon = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.clickOffsetX = 0;
    this.clickOffsetY = 0;
    this.justDragged = false;
    this.hasDragged = false;
  }

  init(desktopIcons) {
    // Add desktop icons
    desktopIcons.forEach(icon => {
      const x = 30 + icon.col * 128;
      const y = 30 + icon.row * 128;
      this.createDesktopIcon(icon.name, x, y, icon.action, icon.icon);
    });

    // Add desktop right-click context menu
    document.getElementById('desktop').addEventListener('contextmenu', (e) => this.showContextMenu(e));

    // Add global desktop drag listeners
    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingIcon && this.draggedIcon) {
        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          this.hasDragged = true;
          let newLeft = this.dragStartLeft + dx;
          let newTop = this.dragStartTop + dy;
          // Clamp to desktop bounds during drag (match snap/icon 103x95 taskbar40)
          const desktop = document.getElementById('desktop');
          const desktopRect = desktop.getBoundingClientRect();
          newLeft = Math.max(0, Math.min(newLeft, desktopRect.width - 103));
          newTop = Math.max(0, Math.min(newTop, desktopRect.height - 95));
          this.draggedIcon.style.left = newLeft + 'px';
          this.draggedIcon.style.top = newTop + 'px';
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDraggingIcon && this.draggedIcon) {
        if (this.hasDragged) {
          this.snapToGridCursor(this.draggedIcon);
          this.justDragged = true;
        }
        this.draggedIcon = null;
        this.isDraggingIcon = false;
      }
    });
  }

  createDesktopIcon(name, x, y, action, iconPath = null) {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.style.position = 'absolute';
    icon.style.left = x + 'px';
    icon.style.top = y + 'px';
    const iconStyle = iconPath ? `background-image: url(${iconPath}); background-size: cover; background-position: center;` : '';
    icon.innerHTML = `
      <div class="icon-image" style="${iconStyle}">${iconPath ? '' : name.charAt(0)}</div>
      <div class="icon-label">${name}</div>
    `;
    icon.addEventListener('click', (e) => {
      if (this.justDragged) {
        this.justDragged = false;
        return;
      }
      this.actionParser(action);
    });

    // Make draggable with global system
    icon.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.draggedIcon = icon;
        this.isDraggingIcon = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragStartLeft = parseInt(icon.style.left || '0');
        this.dragStartTop = parseInt(icon.style.top || '0');
        this.clickOffsetX = e.clientX - this.dragStartLeft;
        this.clickOffsetY = e.clientY - this.dragStartTop;
        this.hasDragged = false;
        icon.style.zIndex = this.windowManager.nextZIndex();
        e.preventDefault();
      }
    });

    document.getElementById('desktop').appendChild(icon);
  }

  snapToGridCursor(element) {
    const desktop = document.getElementById('desktop');
    const desktopRect = desktop.getBoundingClientRect();
    const targetLeft = parseInt(element.style.left);
    const targetTop = parseInt(element.style.top);
    const gridSize = 128;
    const iconWidth = 103;
    const iconHeight = 95;
    const allIcons = document.querySelectorAll('.desktop-icon');

    function isOverlapping(left, top) {
      for (let icon of allIcons) {
        if (icon === element) continue;
        const otherLeft = parseInt(icon.style.left);
        const otherTop = parseInt(icon.style.top);
        if (Math.abs(left - otherLeft) < iconWidth && Math.abs(top - otherTop) < iconHeight) {
          return true;
        }
      }
      return false;
    }

    let candidateLeft = Math.round((targetLeft - 30) / gridSize) * gridSize + 30;
    let candidateTop = Math.round((targetTop - 30) / gridSize) * gridSize + 30;
    candidateLeft = Math.max(30, Math.min(candidateLeft, desktopRect.width - iconWidth));
    candidateTop = Math.max(30, Math.min(candidateTop, desktopRect.height - iconHeight));

    console.log('Candidate:', candidateLeft, candidateTop, 'overlapping:', isOverlapping(candidateLeft, candidateTop));

    if (!isOverlapping(candidateLeft, candidateTop)) {
      element.style.left = candidateLeft + 'px';
      element.style.top = candidateTop + 'px';
      console.log('Snapped to candidate');
      return;
    }

    // Spiral search for free position
    let offset = 1;
    while (offset <= 10) {
      for (let dx = -offset; dx <= offset; dx++) {
        for (let dy = -offset; dy <= offset; dy++) {
          if (Math.abs(dx) !== offset && Math.abs(dy) !== offset) continue; // Only edges
          const newLeft = candidateLeft + dx * gridSize;
          const newTop = candidateTop + dy * gridSize;
          if (newLeft >= 30 && newLeft <= desktopRect.width - iconWidth &&
              newTop >= 30 && newTop <= desktopRect.height - iconHeight &&
              !isOverlapping(newLeft, newTop)) {
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
            console.log('Snapped to:', newLeft, newTop);
            return;
          }
        }
      }
      offset++;
    }

    // Fallback
    element.style.left = candidateLeft + 'px';
    element.style.top = candidateTop + 'px';
    console.warn('No free position, using candidate');
  }

  actionParser(action) {
    console.log('Action:', action);
    if (action.type === 'openBrowser') {
      if (window.openBrowser) {
        window.openBrowser(action.arg);
      } else {
        console.error('window.openBrowser not defined');
      }
    } else if (action.type === 'openApp') {
      if (window.openApp) {
        window.openApp(action.arg);
      } else {
        console.error('window.openApp not defined');
      }
    } else if (action.type === 'openWindow') {
      if (window.openWindow) {
        window.openWindow(action.arg.title, action.arg.content);
      } else {
        console.error('window.openWindow not defined');
      }
    } else {
      console.error('Unknown action type:', action.type);
    }
  }

  showContextMenu(e) {
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
}

export { DesktopManager };