# Implementation Plan

## [Overview]
The browser history buttons are not functional because the AOL connection check in loadPage blocks navigation to pages other than 'home' when aolConnection.isConnected is false (default). Removing this check will allow page navigation and history to work properly.

The AOL check shows an error page for non-home pages if not connected, preventing history push. Solmerica app sets connected=true, but default blocks sidebar links. Removing the check fixes history without affecting retro theme (connect still works for My Computer status, horn).

## [Types]  
No type system changes required.

## [Files]
Modify js/app.js (remove AOL check in loadPage).

## [Functions]
Modify loadPage (remove lines 886-889 AOL check).

## [Classes]
No classes.

## [Dependencies]
No changes.

## [Testing]
Test: Open browser → home → sidebar 'about' → back button → home.

## [Implementation Order]
1. replace_in_file js/app.js remove AOL check block.
2. Verify no other AOL dependencies.
3. Test navigation/history.