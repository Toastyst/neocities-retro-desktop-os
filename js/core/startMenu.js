class StartMenu {
  constructor(startMenuItems) {
    this.startMenuItems = startMenuItems;
  }

  buildMenuHtml(items) {
    let html = '';
    items.forEach((item, index) => {
      if (item.name === '-') {
        html += '<hr>';
      } else if (item.submenu) {
        html += `<div class="menu-item has-submenu" data-index="${index}">${item.name} &#9654;</div>`;
      } else if (item.action) {
        html += `<div class="menu-item action-item" data-action="${item.action}">${item.name}</div>`;
      }
    });
    return html;
  }

  openSubmenu(parentItems, index, anchorRect, startBtnRect) {
    document.querySelectorAll('.start-menu.submenu').forEach(m => m.remove());
    const item = parentItems[index];
    if (!item?.submenu) return;

    const submenuEl = document.createElement('div');
    submenuEl.className = 'start-menu submenu';
    submenuEl.style.left = (startBtnRect.left + 150) + 'px';
    submenuEl.style.top = anchorRect.top + 'px';
    submenuEl.innerHTML = this.buildMenuHtml(item.submenu);
    submenuEl._items = item.submenu;
    document.body.appendChild(submenuEl);
  }

  closeAll() {
    document.querySelectorAll('.start-menu').forEach(m => m.remove());
  }

  toggle() {
    const existing = document.querySelector('.start-menu');
    if (existing) {
      this.closeAll();
      return;
    }

    const menu = document.createElement('div');
    menu.className = 'start-menu';
    menu.innerHTML = this.buildMenuHtml(this.startMenuItems);
    menu._items = this.startMenuItems;
    document.body.appendChild(menu);

    const startBtn = document.querySelector('.start-button');
    const rect = startBtn.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.setProperty('bottom', 'var(--taskbar-height)');

    menu.addEventListener('click', (e) => {
      const actionItem = e.target.closest('.action-item');
      if (actionItem) {
        e.stopPropagation();
        const action = actionItem.dataset.action;
        const handler = window.startMenuActions?.[action];
        if (typeof handler === 'function') {
          handler();
        } else {
          console.error('Start menu action not found:', action);
          alert(`Cannot run: ${action}`);
        }
        this.closeAll();
        return;
      }

      const submenuItem = e.target.closest('.has-submenu');
      if (submenuItem) {
        e.stopPropagation();
        const parentItems = submenuItem.closest('.start-menu')._items;
        const index = parseInt(submenuItem.dataset.index, 10);
        const itemRect = submenuItem.getBoundingClientRect();
        this.openSubmenu(parentItems, index, itemRect, rect);
      }
    });

    setTimeout(() => {
      const closeMenu = (e) => {
        if (!e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
          this.closeAll();
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 10);
  }
}

export { StartMenu };