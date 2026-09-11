# Refactor foundation

This version starts a behavior-preserving refactor. The goal is to make business rules independently testable before further UI changes are made.

## Structure introduced

- `src/domain/intervention/types.ts` — shared intervention/domain types; UI and Redux are no longer the owner of these types.
- `src/domain/intervention/defaults.ts` — pristine intervention defaults and SMS preference loading.
- `src/domain/intervention/draft.ts` — draft predicates/snapshot helpers extracted from the Redux slice.
- `src/domain/comment/commentBlocks.ts` — reusable Commentaire block replacement logic.
- `src/domain/addressClients/normalize.ts` — address-client normalization predicates.
- `src/domain/addressClients/commentFormatter.ts` — the Cuivre/Fibre Commentaire rules for clients at the address.

Existing imports from `newInterventionSlice` are intentionally kept compatible through type/function re-exports while the codebase is migrated gradually.

## Tests introduced

The first regression suite covers:

- all Cuivre/Fibre single-client and multi-client Commentaire formats;
- Mobile Vikings and Autre OLO special cases;
- Commentaire block replacement;
- pristine/meaningful draft predicates and snapshot comparison;
- address parsing/composition and NA normalization;
- CURE formatting, insertion, removal and persistence normalization;
- intervention identity and activity ordering.

Run after installing dependencies:

```bash
npm install
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Important

No intentional UI behavior was changed as part of this refactor foundation. The next phase should tackle the Brouillon lifecycle as an explicit state machine, with reducer tests for every transition defined by the functional requirements.
