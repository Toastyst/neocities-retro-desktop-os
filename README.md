# Neocities Retro Desktop OS

A fully functional 1995 Windows 3.0 / early AOL-era desktop emulation built with vanilla HTML5, CSS3, and JavaScript.

## Features

- **Boot Sequence**: Authentic BIOS-style startup with scrolling text and sounds
- **Desktop Environment**: Draggable/resizable windows, taskbar with clock, desktop icons with robust snap system
- **Browser**: Built-in Geocities-style web browser with 10+ pages
- **Applications**: Calculator, Paint, Solitaire (canvas-based), Solmerica Online, Notepad (modular with toolbar, textarea, word count), Meme Generator
- **Audio System**: HTML5 audio with ambient HDD loop, sound effects
- **Solmerica Online**: Simulated connection with progress bar and modem sounds
- **Start Menu**: Hierarchical menu system with programs and settings
- **Easter Eggs**: BSOD screen (Ctrl+Alt+Del), right-click context menus

## Installation

Clone the repository:

```bash
git clone https://github.com/Toastyst/neocities-retro-desktop-os.git
cd neocities-retro-desktop-os
```

## Usage

### Local Development

Serve the files locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

### Neocities Deployment

1. Upload the project files to your Neocities site
2. Add optimized audio files to `sounds/` directory:
   - `boot.wav` (Windows 3.1 startup chime, ~20KB)
   - `modem-handshake.mp3` (Solmerica Online dial-up sound, ~100KB)
   - `hdd-fan-loop.mp3` (ambient noise, ~50KB loop)
   - `floppy-read.wav` (app load sound, ~10KB)
3. Open your Neocities site URL

## File Structure

- `index.html` - Main desktop interface
- `js/app.js` - Core application logic
- `css/style.css` - 90s Windows styling
- `sounds/` - Audio assets
- `apps/` - Canvas-based applications
- `icons/` - Desktop icon images
- `pages/` - Additional HTML pages (currently inline)

## Technical Details

- **Vanilla JS**: No frameworks or libraries
- **Lightweight**: <2MB total, optimized for Neocities
- **Mobile-Friendly**: Responsive design with touch support
- **Authentic**: True to 1995 computing experience

## Browser Compatibility

Works in all modern browsers with HTML5 Audio support.

## Credits

Built for Neocities as a retro computing tribute.

Enjoy the nostalgia! 🚀