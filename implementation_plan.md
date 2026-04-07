# Implementation Plan

[Overview]
This plan implements five specific improvements to the Retro Desktop OS project: adding support for complex multi-file pages, fixing broken internal page links, enhancing the browser window with maximize button and fixed toolbar, polishing the boot sequence display, and adjusting Solmerica Online window sizes for each screen. The changes maintain backward compatibility, preserve the retro aesthetic, and ensure all existing functionality remains intact.

The project is a vanilla JS/HTML/CSS Windows 95 emulation with draggable windows, taskbar, and apps. Pages are currently inline HTML strings in js/app.js loadPage function. Complex page support adds fetch for pages/${pageName}/index.html while keeping inline templates. Link fixes ensure onclick="loadPage" works reliably. Browser improvements add maximize functionality and ensure toolbar sticks. Boot sequence gets larger, centered text in a subtle textbox. Solmerica screens get precise sizing without layout breaks.

Approach: Targeted JS/CSS modifications using replace_in_file. Verify each change preserves window management, Solmerica, desktop icons. Test with browser interactions and resize.

[Types]
No new types or data structures required; leverage existing window/app interfaces and page content strings.

[Files]
Modify 4 files:
- js/app.js: Update loadPage for fetch support, add maximize to browser, move listeners.
- css/style.css: Boot screen textbox styles, browser maximize button.
- js/apps/solmerica.js: Set window sizes per screen.
- No new files; no deletions.

[Functions]
Modify 4 functions:
- js/app.js loadPage(pageName): Add check for pages/${pageName}/index.html, fetch if exists, fallback to inline.
- js/app.js openBrowser(url): Add maximize button listener, ensure toolbar sticky.
- js/app.js initBootSequence(): Update biosText styles for larger font, centered box.
- js/apps/solmerica.js buildScreen(): Set windowEl.style.width/height per screen.

No new functions; no removals.

[Classes]
No class changes; CSS class additions only (.boot-textbox, .browser-maximize).

[Dependencies]
No new dependencies; vanilla JS/CSS only.

[Testing]
Manual verification:
1. Load home, click sidebar link → navigates to about.
2. Open browser, maximize → fills screen, toolbar pinned, scrollbar works.
3. Boot sequence → larger centered text.
4. Solmerica: Welcome 640x570, Connecting 700x455, Login 433x274.
5. Complex page: Create pages/test/index.html, loadPage('test') → fetches.
6. Resize windows, check apps adapt.

[Implementation Order]
1. js/app.js: loadPage fetch support.
2. css/style.css: Boot textbox, browser maximize.
3. js/app.js: Browser maximize listener, toolbar sticky confirm.
4. js/apps/solmerica.js: Screen sizes.
5. Test all, including links, boot, Solmerica.
6. General review: taskbar, icons, no regressions.