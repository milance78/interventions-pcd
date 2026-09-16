# Security testing

Run the frontend tests with:

```bash
npm install
npm test
```

Run the Firestore rules tests against the emulator:

```bash
firebase emulators:exec --only firestore "npm test -- tests/firestore.rules.test.ts"
```

Run all checks:

```bash
npm run test:all
npm --prefix functions test
```

The emulator tests verify ownership isolation, unauthenticated denial, and
session-marker field restrictions. Production security also requires deploying
both `firestore.rules` and `storage.rules`.
