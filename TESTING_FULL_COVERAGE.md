# Full application testing

This version adds a broad application-surface regression suite and the dependencies needed for DOM and coverage testing.

Run:

```bash
npm install
npm test
npx vitest --coverage
```

The remaining work is environment-dependent: Firebase must be tested against emulator/mocks, and browser workflows should run through Playwright against a running build. Those tests are not represented as passing until they are executed in the real project environment.
