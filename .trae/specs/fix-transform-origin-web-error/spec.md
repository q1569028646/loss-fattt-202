# Fix transform-origin DOM Property Error

## Why

Browser console persistently shows `Invalid DOM property 'transform-origin'. Did you mean 'transformOrigin'?` error. Previous fix using `Platform.select` inside `StyleSheet.create` is still triggering the warning, likely because:
1. Metro may be serving a cached bundle
2. `Platform.select` inside `StyleSheet.create` may not fully prevent the property from leaking to DOM

## What Changes

1. **Remove `transformOrigin` from `StyleSheet.create`** in MacroBar.tsx
2. **Apply `transformOrigin` conditionally via inline styles** using `Platform.OS !== 'web'` guard
3. **Clear Metro cache** and restart dev server to ensure fresh bundle

## Impact

- Affected code: `/workspace/src/components/food/MacroBar.tsx`
- No visual changes on any platform
- Browser console warning eliminated

## ADDED Requirements

### Requirement: Eliminate transform-origin DOM warning

The system SHALL NOT produce React DOM property warnings for `transform-origin` when running in web mode.

#### Scenario: Web browser renders MacroBar component
- **WHEN** MacroBar component renders in web browser
- **THEN** no `Invalid DOM property 'transform-origin'` warning is logged

## MODIFIED Requirements

N/A

## REMOVED Requirements

N/A