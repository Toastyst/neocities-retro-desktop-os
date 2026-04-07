# App Architecture - Clean & Future-Proof (Phase 1 Focus)

We are fixing Solitaire, Calculator, and Paint so they work perfectly inside resizable windows.
Sprite Generator and Tile Generator will be handled later (they are complex standalone pages).

## Core Principle
- Desktop apps = pure JS components (NO full HTML pages, NO iframes)
- Every app receives a container div and must provide a `resize(width, height)` method
- This eliminates scrollbars, lag, and inconsistent scaling

## Folder Structure to Create
js/
├── apps/
│   ├── registry.js
│   ├── solitaire.js
│   ├── paint.js
│   ├── calculator.js
│   ├── solmerica.js
│   └── (future apps go here)
├── window-manager.js   ← (already exists or will be updated)
└── app.js
## App Interface (every app must follow this)

 js
""" 
export function createApp(container) {
    // container = the .window-content div (retro styled)

    // Build UI here (canvas, elements, etc.)

    return {
        resize: (newWidth, newHeight) => {
            // Each app decides its own behavior
        },
        destroy: () => { /* optional cleanup */ }
    };
}
"""

## Specific Behavior for Each App
# Calculator → fixed-center
- Keep natural size (~220×280 px)
- Center perfectly inside any window size
- No stretching

# Paint → stretch-canvas

- Canvas fills the entire window content area
- No scrollbars ever
- Ready for future resize handles

# Solitaire → bounded-scale

- Cards and layout scale with window
- Sensible limits: cards never smaller than ~40px or larger than ~110px
- Always fully playable and centered

# Solmerica → state-machine

- 3-screen login flow with animation
- Screen1: Welcome screen with dropdown
- Screen2: Connecting animation (setInterval steps)
- Screen3: Login form with inputs
- State transitions: advanceScreen(), startAnim()
- Dynamic titlebar: "Welcome" → "Solmerica Online"
- Responsive flexbox layout with CRT scanlines

## What Cline Must Do (in order)

1. Create js/apps/registry.js that registers the four apps (including Solmerica).
2. Convert the current solitaire.html, calculator.html, and paint.html logic into the three new .js files above.
3. Implement solmerica.js with state machine, screens, animation, and events.
4. Update the window manager so opening an app calls createApp(container) and wires up resize + destroy.
5. Remove the old standalone HTML files once the new versions are working.

This architecture means adding any new app in the future will take ~5 minutes instead of fighting layout bugs.
Start with Phase 1 (the three apps) and show me the new solitaire.js first so we can verify it before doing the rest.

