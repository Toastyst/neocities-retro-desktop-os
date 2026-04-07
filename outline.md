# Toastyst Neocities Retro Browser Project – Complete Outline

**Site URL:** https://neocities.com/toastyst  
**Theme:** Ultra-90s Windows 3.0 + Apple OS 8/9 hybrid fake desktop  
**Goal:** A fully functional, draggable, resizable retro “OS” that feels like 1995–1998 Geocities but is easy to expand forever.

## 1. Overall Architecture
- Single `index.html` (self-contained – all CSS/JS embedded)
- Fake Windows 3.0-style desktop background
- Desktop icons (left side, many placeholders)
- Bottom taskbar (shows open windows)
- Multiple draggable/resizable/minimizable/closable windows
- **Primary window:** “Browser” (Netscape/IE style chrome) that displays all website content
- All inner pages use heavy classic Geocities styling (tables, marquees, left sidebar nav, right sig/links box, counters, etc.)

## 2. Core Technologies (must be vanilla)
- Pure HTML5 + CSS3 + vanilla JavaScript (no frameworks)
- Window system: draggable, resizable, z-index stacking, minimize/maximize/close
- Page router: JS object of template literals (super easy to add new pages)
- Fake browser controls fully functional (back/forward/history, address bar, toolbar buttons)

## 3. Page List (all pre-built)
1. **Home** – Classic “Under Construction” welcome page with GIFs
2. **Meme Generator** – User’s existing meme generator (loads inside browser OR as separate window)
3. **About Me**
4. **Retro Gaming Gallery**
5. **Jeep XJ** (personal car page)
6. **1996 Camry** (personal car page)
7. **Cool Links / Webrings**
8. **Guestbook** (form + localStorage fake entries)
9. **Downloads / Free Stuff**
10. **News / Updates / Blog**
11. **My Computer** (fake file explorer window)
12. **Chat / Shoutbox** (fun fake window)
13. **AIM Messenger** (mini fake chat window)
14. **Music Player** (MIDI/90s playlist)
15. **Solmerica Online** (dial-up connection simulator)

## 4. Desktop Icons (minimum 15 placeholders)
Browser, Meme Generator, About Me, Retro Gaming, Jeep XJ, 96 Camry, Guestbook, Downloads, Cool Links, My Computer, Chat, Music, Games, Art, Secret Folder, Solmerica Online, Recycle Bin + 5 more generic ones.

## 5. Modularity Requirements
- Every new page must be added with **one copy-paste template** (JS object + simple router call)
- Full embedded Style Guide (Markdown) inside the HTML
- Consistent 90s Geocities inner styling rules
- Easy to add new desktop icons and new app windows

## 6. Visual Rules
- Color palette: Windows 3.0 gray/beige/blue title bars
- Heavy 3D bevels and buttons
- Classic system fonts
- Subtle dithering/scanlines optional
- Desktop-first (1024×768 feel) but mobile-usable

## 7. Deliverables from Cline
1. Complete `index.html`
2. Embedded Markdown Style Guide (at top of file in <script type="text/markdown">)
3. Clear comments on how to add pages/icons/windows