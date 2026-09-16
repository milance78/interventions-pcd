# Security deployment checklist

1. Install dependencies:
   `npm install`
   `npm --prefix functions install`
2. Deploy rules and callable functions:
   `firebase deploy --only functions,firestore:rules,storage`
3. Test locally:
   `firebase emulators:start --only auth,functions,firestore,storage`
4. Never grant public Firestore or Storage access.
5. Keep Admin SDK code exclusively inside `functions/`.
6. Verify every user-uploaded file is stored under `users/{uid}/`.
7. Enable Firebase App Check in the Firebase Console for production.
8. Configure billing/quotas and alerts, and restrict Cloud Functions invocation to authenticated users.
