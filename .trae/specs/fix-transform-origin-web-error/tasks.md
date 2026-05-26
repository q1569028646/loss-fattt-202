# Tasks

- [x] Task 1: Fix MacroBar.tsx - Move transformOrigin from StyleSheet.create to inline style with Platform guard
  - [x] Remove transformOrigin from StyleSheet.create
  - [x] Add inline style with Platform.OS !== 'web' guard
- [x] Task 2: Clear Metro cache and restart dev server to serve fresh bundle
- [x] Task 3: Verify no transform-origin error in browser console

# Task Dependencies

- Task 1 has no dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2