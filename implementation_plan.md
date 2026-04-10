# Implementation Plan

[Overview]
Comprehensive cleanup of post-refactor issues: fix non-functional apps (white screens), broken page navigation/formatting, code duplication/smells (eval, globals, privates), clock duplication, incomplete paint tools.

The refactor successfully modularized core logic into managers and configs, integrated pages via browser fetch/iframe, and apps via registry. However, CSP blocks inline dynamic imports causing app white screens; page sidebars use broken parent.loadPage; browser duplicates window logic; icons eval actions; apps use eval/globals; minor dups/leaks. Fixes preserve architecture, eliminate bugs/smells for robust base. Future success: incremental changes with git branches/tests, plan small PRs, use Cline Plan mode.

[Types]  
No type system changes (vanilla JS).

[Files]
Modify core JS files (app.js, browserManager.js, desktopManager.js, windowManager.js, taskbarManager.js), apps (calculator/index.js example, generalize), pages/* /index.html (nav links), configs unchanged.

New files: none.
Modified:
- js/app.js: openApp use registry async.
- js/core/browserManager.js: use windowManager.openWindow for browser, persistent state.
- js/core/desktopManager.js: action dispatcher replace new Function.
- js/core/windowManager.js: public methods nextZIndex(), addWindow().
- js/core/taskbarManager.js: remove clock dupe.
- js/apps/*/index.js: replace eval/globals with closures (e.g. calculator).
- pages/*/index.html: replace onclick parent.loadPage with custom event.
- js/apps/paint/index.js: implement basic tools.
Delete: none.

[Functions]
Modify openApp (app.js): async registry load, set _app/resizeObserver.
Modify BrowserManager.openBrowser/loadPage: create toolbar content once, use windowManager.openWindow('Browser', toolbarHTML + contentDiv).
Modify DesktopManager.createDesktopIcon click: parse action {type:'openBrowser', arg:'home'} dispatch.
Add WindowManager.nextZIndex(), addWindow(win).
Modify taskbarManager.init: remove setInterval clock.
Modify calculator functions: window.clearDisplay -> closure.
Modify paint tools: implement line/rect etc basics.

[Classes]
Modify BrowserManager: track browserWin id, loadPage update content only.
Modify DesktopManager: actionParser(actionStr).
Modify WindowManager: public nextZIndex(), addWindow(winEl).
Modify TaskbarManager: no clock.
No new/removed.

[Dependencies]
No changes (vanilla JS).

[Testing]
Manual: open apps (no white, functional), browser nav/back/forward/AOL gate, icon clicks, drag/resize windows/icons, start menu, boot sequence/sounds, page links work, formatting centers, paint tools draw.

Verify no console errors, mobile touch.

[Implementation Order]
1. Expose windowManager public methods (nextZIndex/addWindow), update usages.
2. Fix openApp/app loading with registry async.
3. Refactor apps examples (calculator no eval/globals, paint tools).
4. Fix desktopManager icon dispatcher (update config actions to JSON objects).
5. Integrate browserManager with windowManager.openWindow.
6. Fix pages nav: custom events for sidebar links.
7. Dedupe clock in taskbarManager.
8. Test all, polish resize/app destroy.