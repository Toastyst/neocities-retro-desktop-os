# Toastyst Neocities Retro Desktop OS – Vision

**Site URL:** https://neocities.com/toastyst  
**Theme:** 1995 Windows 95/98 + Geocities hybrid desktop emulation.  
**Goal:** Fully functional retro “OS” with draggable windows, apps, browser – easy to expand.

## Core Architecture
- Multi-file structure: `index.html`, `js/app.js`, `css/`, `pages/`, `js/apps/`
- Desktop: Icons, taskbar, windows (draggable/resizable/min/close)
- Browser window: Displays Geocities-styled pages
- Apps: Modular JS components (Calculator, Paint, Solitaire, Notepad, Solmerica, Meme Gen)

## Technologies
- Vanilla HTML5/CSS3/JS (no frameworks)
- Window manager, page router, audio system
- 98.css for Win98 UI components

## Pages (in pages/)
Home, About, Gaming, Jeep/Camry, Links, Guestbook, Downloads, News, Chat, Music, Solmerica, etc.

## Desktop Icons
Browser, Apps, Pages – 15+ placeholders.

## Modularity
- Add pages: Template in `pages/`, route in `js/app.js`
- Add apps: `js/apps/newapp/index.js` with `createApp(container)`, register in `registry.js`
- Consistent 90s styling

## Visual
Windows 95/98 palette, pixel fonts, 3D effects, mobile-friendly.
