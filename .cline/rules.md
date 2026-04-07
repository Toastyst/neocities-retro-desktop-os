# Project Rules & Guidelines

## Core Principles
- **Vanilla Technologies**: Pure HTML5, CSS3, vanilla JavaScript only (no frameworks, libraries, or build tools)
- **Lightweight**: Keep total bundle <2MB, especially audio assets
- **Mobile-Friendly**: Responsive design, touch support for drag/resize
- **90s Authentic**: Windows 3.0/AOL-era styling and behaviors
- **Modular**: Easy to add new pages, icons, apps without breaking existing

## Implementation Rules
- All new features in vanilla JS (no classes, use objects/arrays)
- Audio via HTML5 Audio API with preload
- Canvas for games/apps (Solitaire, Paint, Calculator)
- Connection state blocks pages realistically
- Icon grid snapping: Math.round(pos / 32) * 32
- Boot sequence: BIOS-style text scroll with delays/sounds

## File Organization
- `sounds/`: Optimized audio files (<2MB total)
- `apps/`: New app HTML files (canvas-based)
- `icons/`: Desktop icon images
- `pages/`: Optional separate HTML (currently inline JS)
- No deletions, only additions/modifications

## Testing
- Manual browser testing: boot, audio, drag, menu, connect, apps
- Console logs for states (connection, position)
- Mobile responsiveness check
- No breaking existing functionality