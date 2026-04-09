# App Architecture - Implemented

All desktop apps are pure JS components (no HTML pages/iframes). Each receives a container div and provides a `resize(width, height)` method for seamless window integration.

## Current Structure
js/apps/
├── registry.js (loads app modules dynamically)
├── calculator/index.js
├── notepad/index.js
├── paint/index.js
├── solitaire/index.js
├── solmerica/index.js
└── (future apps)

## App Interface
Every app exports `createApp(container)` returning:
```
{
    resize: (newWidth, newHeight) => { /* app-specific resize */ },
    destroy: () => { /* optional cleanup */ }
}
```

## Implemented Apps
- **Calculator**: Fixed-center (~220×280px), centered in any window.
- **Notepad**: Toolbar + resizable textarea + word count, flex layout.
- **Paint**: Canvas fills window, no scrollbars.
- **Solitaire**: Scaled cards (40-110px), playable/centered.
- **Solmerica**: 3-screen state machine (welcome/connect/login), animations.

Registry.js handles dynamic imports (tries index.js, falls back to .js).

Old HTML files (apps/*.html) can be deleted as apps are now modular.

