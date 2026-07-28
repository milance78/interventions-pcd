TYPESCRIPT NORMALIZE FIX — v85

Root cause:
normalizeInterventionStrings required T extends Record<string, unknown>.
The Intervention interface does not declare a string index signature, so
TypeScript widened normalized Intervention objects to Record<string, unknown>.

Fix:
- Changed the generic constraint from:
    T extends Record<string, unknown>
  to:
    T extends object
- The function still returns the exact input type T.
- Intervention now remains Intervention after normalization.

This resolves the reported TS2345 / TS2740 errors in:
- CurrentInterventionPage.tsx
- createInterventionThunk.ts
- updateInterventionThunk.ts
- updateSearchInterventionThunk.ts

Only src/utils/textUtils.ts is changed.
