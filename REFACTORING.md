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

## Draft state-machine (v249)

The brouillon lifecycle now has an explicit domain state instead of inferring
whether a draft is displayed by comparing the current form with a snapshot.

- `draftState.active`: the brouillon currently displayed in Current Intervention.
- `draftState.displaced`: a different brouillon temporarily hidden by another intervention.
- Navigating away captures the current draft into `displaced`.
- Starting a new intervention moves an active draft to `displaced`.
- Editing another intervention creates an active draft while preserving the displaced one.
- Restoring the saved baseline removes only the active edit draft.
- `resumeDraft` promotes the displaced draft to active and clears the displaced slot.
- Legacy `draftSnapshot` / `draftMode` / `draftEditSnapshot` fields remain as a compatibility boundary for old local sessions and are not the source of truth for new draft logic.

This keeps the UI selectors (`displayed` / `displaced`) simple and makes the
lifecycle independently testable in `draftState.test.ts`.


## v253 — Address Clients domain state
Address-client state transitions are now isolated in `src/domain/addressClients/state.ts`.
The Redux slice delegates add/update/remove/set operations to this domain module, while draft synchronization remains in Redux. This keeps address-client normalization, serialization and Commentaire synchronization together without changing the UI contract.


## v261 — Repository reference usage

Firestore document-reference construction for existing intervention and active-intervention records now goes through `interventionsRepository.ts`. The service keeps creation of new snapshot IDs local, while reads/updates/deletes reuse centralized repository path helpers. Repository imports are consolidated at the top of the module. No UI or data semantics were intentionally changed.


## v261 – Repository reference centralization

- Centralized document reference construction for dated interventions and active interventions.
- Removed direct nested `doc(collectionReference, id)` construction from service flows where repository helpers exist.
- Preserved Firestore write/read behavior and existing business rules.

- v263: daily summary persistence moved into the Firestore repository; service retains only summary calculation/business flow.
