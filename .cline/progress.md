# Implementation Progress

## Current Status
Implementing Neocities Retro Desktop OS Expansion Plan (4 phases, 12 steps).

## Todo Checklist
- [ ] Phase 1: Boot & Audio Basics
  - [ ] Create sounds/ dir with placeholders (user provides optimized .wav/mp3 <2MB total)
  - [ ] index.html: Add #boot-screen overlay (BIOS green text), <audio> preloads
  - [ ] js/app.js: initBootSequence() (BIOS steps scroll + timings/sounds), playSound() mgr, ambient hdd-loop, taskbar clock
  - [ ] css/style.css: Boot screen styles (monospace green, flicker)
- [ ] Phase 2: Desktop Enhancements
  - [ ] js/app.js: Make desktop icons draggable with snapToGrid(32px), showContextMenu() on right-click
  - [ ] css/style.css: Icon drag styles, context menu popup
- [ ] Phase 3: Start Menu & AOL Dial-up
  - [ ] js/app.js: toggleStartMenu() hierarchical, AOLConnection state, connectAOL() (progress + modem sound)
  - [ ] js/app.js: Update openBrowser/loadPage for connection check (block pages if !connected)
  - [ ] css/style.css: Start menu cascading popup, AOL connection window
- [ ] Phase 4: Apps & Polish
  - [ ] js/app.js: loadAppWithDelay() (400-900ms + floppy sound), update My Computer specs, easterEggBSOD(ALT+WIN), car page horns?
  - [ ] Create apps/solitaire.html, apps/paint.html, apps/calculator.html (canvas implementations)
  - [ ] Polish: tests, mobile verify, no breaks
- [ ] Final: Create small README.md

## Notes
- Fix initDesktop bug: Remove makeDraggable on non-existent #browser-window
- Keep pages inline JS for lightweight (add connection guard there)
- Audio external: boot.wav, modem-handshake.mp3, hdd-fan-loop.mp3, floppy-read.wav
- Test: boot timing/sounds, icon drag/snap, menu nav, connect logic, app delays, BSOD egg