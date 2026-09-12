# Testing strategy

## Commands

```bash
npm test
npm run build
```

## Required test layers

- Unit: normalization, address clients, comments, CURE records/state, import/export, intervention identity, selectors, reducers and lifecycle.
- Regression: undefined/null fields, NA normalization, leading zero, whitespace trimming, legacy CURE fields, structured address-client fallback, comment preservation.
- Integration: Redux persistence, Firebase adapters, reload/rehydration, duplicate-save protection, permission/network errors.
- UI: Current Intervention, OnHold tabs/counters/filtering, Today list, Historique, import dialog, copy actions and additional-information popup.
- E2E: create/save/reload intervention, CURE same-day rule, No CURE, address clients, import, history navigation and OnHold filtering.
- Release: TypeScript/Vite build and GitHub Pages deployment.

## Acceptance gates

- `npm test`: all tests pass.
- `npm run build`: production build passes.
- No new untested business rule is merged.
- Every bug fix adds a regression test.

## Priority order

1. CURE persistence and date rules
2. Address clients and NA normalization
3. Comment preservation/formatting
4. Redux/Firebase persistence
5. Import/legacy compatibility
6. Main UI workflows
7. End-to-end smoke tests
