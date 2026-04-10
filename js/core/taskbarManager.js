class TaskbarManager {
  constructor() {
    this.aolConnection = { isConnected: false, speed: 0, status: 'Disconnected' };
    window.aolConnection = this.aolConnection;
  }

  init() {
    // Add AOL taskbar button
    const aolBtn = document.createElement('div');
    aolBtn.className = 'taskbar-aol';
    aolBtn.style.cssText = 'background: #C0C0C0; border: 2px outset #FFFFFF; padding: 2px 8px; font-size: 12px; cursor: pointer; margin-left: 4px;';
    aolBtn.onclick = () => {
      // Import openApp dynamically or assume global
      if (window.openApp) window.openApp('solmerica');
    };
    document.getElementById('taskbar').appendChild(aolBtn);

    this.updateAolStatus = () => {
      aolBtn.innerHTML = '🌐 AOL: ' + (this.aolConnection.isConnected ? 'Online' : 'Offline');
      aolBtn.style.background = this.aolConnection.isConnected ? '#00FF00' : '#FF0000';
    };
    this.updateAolStatus();

    // Start clock update
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
  }

  updateClock() {
    const clockEl = document.getElementById('taskbar-clock');
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}

export { TaskbarManager };