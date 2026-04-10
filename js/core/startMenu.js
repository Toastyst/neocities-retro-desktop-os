class StartMenu {
  constructor(startMenuItems) {
    this.startMenuItems = startMenuItems;
  }

  toggle() {
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

    menu.innerHTML = buildMenu(this.startMenuItems);
    document.body.appendChild(menu);

    // Position above taskbar
    const startBtn = document.querySelector('.start-button');
    const rect = startBtn.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.setProperty('bottom', 'var(--taskbar-height)');

    // Handle submenu clicks
    menu.addEventListener('click', (e) => {
      if (e.target.classList.contains('has-submenu')) {
        e.stopPropagation();
        const level = parseInt(e.target.dataset.level);
        const itemIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
        const submenu = this.startMenuItems[itemIndex]?.submenu;
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
      const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
          document.querySelectorAll('.start-menu').forEach(m => m.remove());
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 10);
  }
}

export { StartMenu };