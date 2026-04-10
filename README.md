# Neocities Retro Desktop OS

A fully functional 1995 Windows 95/98 desktop emulation built with vanilla HTML5, CSS3, and JavaScript.

## Important Notes

- **AOL Gate Feature**: The browser includes an AOL-style connection gate that requires "connecting" to access web pages. This is a core retro authenticity feature and should NOT be removed.
- **Modular Architecture**: The codebase has been refactored into managers (BootManager, WindowManager, DesktopManager, etc.) for better maintainability.
- **Configuration**: Desktop icons, start menu, and boot sequence are now configurable via JSON files in `js/config/`.

## Features

- **Boot Sequence**: Authentic BIOS-style startup with scrolling text and sounds
- **Desktop Environment**: Draggable/resizable windows, taskbar with clock, desktop icons with snap system
- **Browser**: Built-in web browser
- **Applications**: Calculator, Paint, Solitaire, Notepad (toolbar/textarea/word count), Meme Generator, Solmerica Online (dial-up simulator)
- **Audio System**: HTML5 audio with ambient HDD loop, sound effects
- **Start Menu**: Hierarchical menu system with programs and settings
- **Easter Eggs**: BSOD screen (Ctrl+Alt+Del), right-click context menus

## Quick Start

### Local Development

Serve locally:

```bash
python -m http.server 8000
```

Open `http://localhost:8000` in browser.

### Neocities Deployment

1. Upload project files to Neocities site
2. Add optimized audio to `sounds/`:
    - `boot.wav` (Windows 3.1 chime, ~20KB)
    - `modem-handshake.mp3` (dial-up sound, ~100KB)
    - `hdd-fan-loop.mp3` (ambient loop, ~50KB)
    - `floppy-read.wav` (app load, ~10KB)
3. Open site URL

## File Structure

- `index.html` - Main desktop
- `js/app.js` - Core logic
- `js/apps/` - Modular apps (calculator/, paint/, etc.)
- `css/{style,theme,98}.css` - Styling (98.css for Win98 UI)
- `pages/` - Browser pages (home, about, etc.)
- `icons/` - Desktop icons
- `sounds/` - Audio assets
- `fonts/` - Pixel fonts

## Technical Details

- **Vanilla JS/CSS**: No frameworks
- **Lightweight**: <2MB, Neocities-optimized
- **Mobile-Friendly**: Touch support
- **Authentic**: 1995 experience

## Browser Compatibility

Modern browsers with HTML5 Audio.

## Credits

Retro computing tribute for Neocities.

Enjoy the nostalgia! 🚀
