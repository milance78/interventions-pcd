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

- `src/domain/intervention/search.ts` — pure search-value normalization helpers extracted from the Firebase service.

## v266 – history hydration domain extraction

- Extracted historical occurrence hydration into `src/domain/intervention/history.ts`.
- `interventionsService.ts` now re-exports the domain function instead of containing the merge algorithm.
- Historical day/document membership and view-state reset behavior are preserved.


## v267 – local date key extraction

- Extracted local `YYYY-MM-DD` date-key formatting into `src/domain/intervention/dateKey.ts`.
- Firebase service now imports the pure date helper instead of owning date formatting.
- Daily-summary timing behavior remains unchanged.


## v268 – Stored case ID extraction

- Centralized recovery of the persisted `caseId` from a Firestore snapshot in `interventionsRepository.ts`.
- Removed repeated snapshot-to-case-ID expressions from the service.
- No intentional business-logic change.

## v269 – Firebase reference cleanup

- Removed an unused active-reference import from the service layer.
- Normalized the repository module formatting and kept Firestore reference construction centralized.
- No business behavior was intentionally changed.

## v270 – search service cleanup

- Removed duplicate search type declarations and local helper implementations from `interventionsService.ts`.
- The service now consistently uses the extracted search domain helpers.
- Added the missing `interventionActivityValue` import used by search result ordering.

- v271: extracted daily summary calculation into domain/intervention/summary.ts.


## v272 – history date sorting extraction

- Extracted newest-first history date-key sorting into `domain/intervention/history.ts`.
- Firebase service now delegates date ordering to the history domain helper.
- No intentional business-logic change.


## v273 – resilient history loading

- A single failing historical day no longer prevents the complete archive from rendering.
- `loadCompleteHistory` now isolates errors per date and keeps all successfully loaded days available.
- Failed dates are logged for diagnosis while the history navigation remains usable.


## v274 – History loading isolation

- History loading no longer waits for `loadLatestInterventions`.
- A failure in the active/search index cannot make the historical archive show the generic loading error.
- Historical days remain loaded independently from Today/Search data.

## v280
- Restored exact v274 application state after reported regression.
- No v275-v279 changes included.

## v281 – isolated revision domain extraction

- Extracted pure revision merging, legacy matching, de-duplication and sorting into `domain/intervention/revisions.ts`.
- Firebase reads remain in `interventionsService.ts`.
- Revision output and matching rules are preserved.
- No history loading or repository behavior was changed.

## v282 – history type extraction
- Moved `HistoryDay` type to the history domain module.
- Firebase service keeps loading behavior unchanged.


## v283 – history day filtering extraction

- Extracted filtering of successfully loaded, non-empty history days into the history domain.
- History loading and error isolation remain unchanged.


## v284 – history day normalization

- Combined history-day filtering and newest-first sorting in `normalizeHistoryDays`.
- `interventionsService.ts` delegates the final history-day normalization to the domain.
- History loading, error isolation and Firebase access remain unchanged.

## v285 – history day construction

- Extracted pure `createHistoryDay()` helper into the history domain.
- `interventionsService.ts` delegates history-day object construction to the domain.
- Firebase loading and error isolation remain unchanged.


## v286 – safe history-day loader

Extracted the per-day error-isolated loader into the history domain. Firebase loading behavior remains unchanged.


## v287 – history days orchestration

- Added `loadHistoryDaysSafely()` to orchestrate per-day history loading in the history domain.
- `interventionsService.ts` now delegates the `Promise.all` orchestration to the domain.
- Firebase loading, per-day error isolation and normalization behavior remain unchanged.


## v288
- Extracted history date-key extraction into `domain/intervention/history.ts`.
- No Firebase loading behavior changed.

## v290 – centralizacija rešavanja caseId u Firebase servisu

- `loadInterventions` sada koristi zajednički `getStoredCaseId` helper umesto lokalnog fallback izraza.
- `updateSearchInterventionAndMoveToToday` koristi isti helper za očuvanje identiteta intervencije.
- Nije menjana logika učitavanja Historique-a, Firebase batch upisa, CURE-a ili komentara.

## v291 – shared intervention snapshot persistence
- Extracted the repeated update/active/version Firestore write sequence into `persistInterventionSnapshot`.
- Kept Historique loading, create batching, CURE logic, and search move logic unchanged.


## v292 – shared intervention deletion persistence
- Extracted the complete Firebase deletion workflow into `persistInterventionDeletion`.
- `deleteIntervention` now delegates to the shared workflow.
- Preserved deletion of the day snapshot, active index, and daily summary refresh.


## v293 – fix missing getActiveReference import

Restored the missing repository import used by `loadLatestInterventions`. This fixes the Search runtime error `getActiveReference is not defined`.


## v294 – optimistic Historique deletion

- Historique occurrence is removed from Redux immediately after deletion confirmation.
- Firebase deletion still runs and is awaited by the thunk.
- The delete confirmation dialog closes immediately instead of waiting for the network round trip.
- No changes to Historique loading, CURE logic, or Firebase deletion persistence.

## v295 – Kitnjasta slova assets

Added the supplied decorative alphabet PNG assets to `src/assets/kitnjasta-slova/` for upcoming UI work. No application logic was changed.


## v296 – Firebase persistence extraction
- Extracted deletion, normal snapshot persistence, and reviewed persistence into `src/firebase/interventionPersistence.ts`.
- Kept summary updates owned by the service through an injected callback.
- No changes to Historique loading, Search matching, CURE logic, or create-intervention batch flow.
