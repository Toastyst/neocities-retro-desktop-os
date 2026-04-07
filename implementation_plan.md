# Implementation Plan

[Overview]
Refactor the snapToGridCursor function to use "Grab Offset" tracking and top-left anchoring with gutter clamping to eliminate grab bias, shivering, and edge positioning issues in desktop icon snapping.

The current snap logic uses raw mouse coordinates and center-point math, causing icons to jump relative to the cursor grab point and misalign near grid lines. This refactor introduces clickOffset tracking on mousedown to reconstruct the icon's true top-left position at drop time. It switches to top-left anchoring with Math.round for nearest-grid snapping, and enforces a hard gutter clamp to preserve the 30px padding visual. This ensures consistent, predictable snapping regardless of grab point, with perfect alignment to the visual grid.

The changes are isolated to js/app.js drag/mousedown/mouseup handlers and snapToGridCursor function. No new files, no external dependencies, no breaking changes to other systems. The refactor maintains cursor-center feel while eliminating all reported issues.

[Types]
No type system changes required. All variables remain number (px values), functions use existing signatures.

[Files]
Modify js/app.js only (drag system and snap functions).

No new files, no deletions.

[Functions]
Modify:
- `snapToGridCursor(mouseX, mouseY, element)` → renamed `snapIconToGrid(element)` (derive mouse from element offset, top-left anchoring)
- mousedown handler in createDesktopIcon: add `clickOffsetX = e.clientX - parseInt(icon.style.left); clickOffsetY = e.clientY - parseInt(icon.style.top);`
- mouseup document listener: `snapIconToGrid(draggedIcon);` (pass element, derive position)

Remove halfW/halfH constants (obsolete).

[Classes]
No class changes.

[Dependencies]
No dependency changes.

[Testing]
Manual testing:
1. Drag icon from different grab points (edge, center) - snap to same grid position
2. Drag near grid lines - no shivering
3. Drag to edge - clamps at 30px gutter
4. Verify init pos stable under snap

No automated tests required.

[Implementation Order]
1. Update mousedown to store clickOffsetX/Y
2. Refactor snapToGridCursor to snapIconToGrid(element), use top-left formula with Math.round((targetLeft - 30) / 128) * 128 + 30, clamp Math.max(30, ...)
3. Update mouseup to call snapIconToGrid(draggedIcon)
4. Remove halfW/halfH
5. Test drag from different grab points, edge clamps, grid alignment