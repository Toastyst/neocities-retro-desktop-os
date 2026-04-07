# Implementation Plan

[Overview]
Establish a robust, persistent desktop icons system to prevent recurring issues with dragging, stacking, click triggering, and positioning. The system will use localStorage for persistence, collision detection in snapToGrid, drag threshold to prevent click on drop, and absolute positioning with 128px grid to avoid overlap.

The current system uses absolute positioning with 64px grid (too small for 103px icons, causes overlap), drag threshold but click still fires sometimes, no persistence (positions reset on reload). This plan creates a data-driven system with Icon objects, load/save to localStorage, collision-aware snapping, reliable drag/click separation.

[Types]
Define Icon interface with name, x, y, action, iconPath.

Icon = {
  name: string,
  x: number,
  y: number,
  action: function,
  iconPath: string
}

icons: Icon[]

[Files]
Modify 2 files:
- js/app.js: Add icons array, loadIcons/saveIcons functions, modify createDesktopIcon to use data, update snapToGrid with collision, initDesktop loads from storage.
- css/style.css: Confirm .desktop position:relative, .desktop-icon position:absolute width:103px height:127px.

No new files.

[Functions]
Modify 4 functions:
- js/app.js createDesktopIcon(name, x, y, action, iconPath): Use provided x/y, add to icons array, saveIcons().
- js/app.js snapToGrid(element): Check for collision with other icons, find free grid slot if overlap, snap to 128px grid.
- js/app.js initDesktop(): Load icons from localStorage, createDesktopIcon for each.
- New js/app.js loadIcons(): Get from localStorage or default icons array.
- New js/app.js saveIcons(): JSON.stringify icons to localStorage.

[Classes]
No class changes.

[Dependencies]
No new dependencies.

[Testing]
Manual verification:
1. Reload page - icons positions persist.
2. Drag icon - moves, snaps to 128px grid, no overlap with others.
3. Drag to overlap position - snaps to next free slot.
4. Drag short distance - click triggers action.
5. Drag long distance - no click, snaps without stack.
6. Resize window - icons clamp to bounds.

[Implementation Order]
1. js/app.js: Add icons array with default positions/actions.
2. js/app.js: Add loadIcons/saveIcons functions.
3. js/app.js: Modify initDesktop to load and create icons.
4. js/app.js: Modify createDesktopIcon to save after create.
5. js/app.js: Update snapToGrid with 128px grid and collision detection.
6. Test all, including reload persistence, drag/click separation, no stacking.