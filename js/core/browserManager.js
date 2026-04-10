class BrowserManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.browserHistory = ['home'];
    this.historyIndex = 0;
    this.browserWin = null;
    // Expose for debugging
    window.browserHistory = this.browserHistory;
    window.historyIndex = this.historyIndex;
  }

  openBrowser(url) {
    if (!this.browserWin || !document.body.contains(this.browserWin)) {
      const toolbarHTML = `
        <div class="browser-toolbar" style="display:flex; flex-direction:column; width:100%; background:#C0C0C0; border-bottom:1px inset #FFFFFF;">
          <div class="menu-bar" style="width:100%; height:20px; background:#C0C0C0; border-bottom:1px outset #808080; padding:2px 4px; font-size:12px;">
            <span>File</span> <span>Edit</span> <span>View</span> <span>Favorites</span> <span>Tools</span> <span>Help</span>
          </div>
          <div class="button-bar" style="width:100%; height:26px; background:#C0C0C0; padding:2px 4px;">
            <button id="back-btn" title="Back" style="width:23px; height:22px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">←</button>
            <button id="forward-btn" title="Forward" style="width:23px; height:22px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">→</button>
            <button id="stop-btn" title="Stop" style="width:23px; height:22px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">■</button>
            <button id="refresh-btn" title="Refresh" style="width:23px; height:22px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">↻</button>
            <button id="home-btn" title="Home" style="width:23px; height:22px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">🏠</button>
            <button id="search-btn" title="Search" style="width:23px; height:22px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">🔍</button>
            <button id="favorites-btn" title="Favorites" style="width:23px; height:22px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">★</button>
            <button id="history-btn" title="History" style="width:23px; height:22px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">📜</button>
          </div>
          <div class="address-bar" style="width:100%; height:24px; background:#C0C0C0; padding:2px 4px; display:flex; align-items:center; gap:2px;">
            <label for="address-input" style="width:60px; font-size:12px;">Address:</label>
            <input type="text" id="address-input" placeholder="Enter URL or page name" style="flex:1; height:20px; border:1px inset #808080; background:#FFFFFF;">
            <button id="address-dropdown" title="Address dropdown" style="width:18px; height:20px; font-size:10px; border:1px outset #FFFFFF; background:#C0C0C0;">▼</button>
            <button id="go-btn" title="Go" style="width:40px; height:20px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">Go</button>
            <button id="links-btn" title="Links" style="width:40px; height:20px; font-size:12px; border:1px outset #FFFFFF; background:#C0C0C0;">Links</button>
          </div>
        </div>
      `;
      const contentDiv = '<div id="browser-content" class="browser-content"><!-- Page content --></div>';
      this.browserWin = this.windowManager.openWindow('NameOfThePageDisplayer - ' + url, toolbarHTML + contentDiv, 50, 50, 800, 600);

      // Ensure flex layout for browser
      const windowContent = this.browserWin.querySelector('.window-content');
      windowContent.style.display = 'flex';
      windowContent.style.flexDirection = 'column';
      windowContent.style.height = '100%';
      const browserContent = this.browserWin.querySelector('.browser-content');
      browserContent.style.flex = '1';
      browserContent.style.position = 'relative';
      browserContent.style.overflow = 'hidden';
      browserContent.style.padding = '0';
      browserContent.style.margin = '0';
      browserContent.style.width = '100%';
      browserContent.style.height = '100%';
      browserContent.style.boxSizing = 'border-box';

      // Add event listeners
      this.browserWin.querySelector('#back-btn').addEventListener('click', () => this.navigateBack());
      this.browserWin.querySelector('#forward-btn').addEventListener('click', () => this.navigateForward());
      this.browserWin.querySelector('#stop-btn').addEventListener('click', () => this.stopLoading());
      this.browserWin.querySelector('#refresh-btn').addEventListener('click', () => this.loadPage(this.browserWin.querySelector('#address-input').value));
      this.browserWin.querySelector('#home-btn').addEventListener('click', () => this.openBrowser('home'));
      this.browserWin.querySelector('#search-btn').addEventListener('click', () => this.search());
      this.browserWin.querySelector('#favorites-btn').addEventListener('click', () => this.showFavorites());
      this.browserWin.querySelector('#history-btn').addEventListener('click', () => this.showHistory());
      this.browserWin.querySelector('#go-btn').addEventListener('click', () => this.loadPage(this.browserWin.querySelector('#address-input').value));
      this.browserWin.querySelector('#address-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.loadPage(e.target.value);
        }
      });

      // Listen for page navigation messages from iframes
      window.addEventListener('message', (e) => {
        if (e.data.type === 'navigatePage') {
          this.loadPage(e.data.page);
        }
      });
    }
    this.browserWin.style.display = 'flex';
    this.windowManager.focusWindow(this.browserWin);
    this.loadPage(url);
  }

  async loadPage(pageName) {
    if (!this.browserWin || this.browserWin.style.display === 'none') {
      this.openBrowser(pageName);
      return;
    }
    const content = this.browserWin.querySelector('#browser-content');
    const addressBar = this.browserWin.querySelector('#address-input');

    addressBar.value = pageName;
    this.browserWin.querySelector('.window-titlebar span').textContent = 'NameOfThePageDisplayer - ' + pageName;

    if (!window.aolConnection.isConnected && pageName !== 'home') {
      content.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
          <h1>❌ No Internet Connection</h1>
          <p>You must connect to the internet first to browse web pages.</p>
          <button onclick="window.openApp && window.openApp('solmerica')" style="background: #C0C0C0; border: 2px outset #FFFFFF; padding: 10px 20px; font-size: 16px; cursor: pointer;">Launch Solmerica Online & Connect</button>
          <p style="font-size: 12px; color: #666; margin-top: 20px;">Status: ${window.aolConnection.status}</p>
        </div>
      `;
      return;
    }

    // Always use iframe for pages to scope styles
    content.innerHTML = `<iframe id="page-iframe" src="pages/${pageName}/index.html" style="width: 100%; height: 100%; border: none; display: block;"></iframe>`;
    content.style.background = '';
    content.style.color = '';
    content.style.padding = '';
    content.style.display = '';
    content.style.flexDirection = '';
    content.style.alignItems = '';
    content.style.justifyContent = '';
    content.style.minHeight = '';
    // Update history
    if (pageName !== this.browserHistory[this.historyIndex]) {
      this.browserHistory = this.browserHistory.slice(0, this.historyIndex + 1);
      this.browserHistory.push(pageName);
      this.historyIndex = this.browserHistory.length - 1;
    }
  }

  navigateBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.loadPage(this.browserHistory[this.historyIndex]);
    }
  }

  navigateForward() {
    if (this.historyIndex < this.browserHistory.length - 1) {
      this.historyIndex++;
      this.loadPage(this.browserHistory[this.historyIndex]);
    }
  }

  stopLoading() {
    // Stub: stop iframe loading
    const iframe = this.browserWin.querySelector('#page-iframe');
    if (iframe) {
      iframe.src = 'about:blank';
    }
  }

  search() {
    // Stub: open search page
    this.loadPage('search');
  }

  showFavorites() {
    // Stub: show favorites menu
    alert('Favorites not implemented');
  }

  showHistory() {
    // Stub: show history menu
    alert('History: ' + this.browserHistory.join(', '));
  }
}

export { BrowserManager };