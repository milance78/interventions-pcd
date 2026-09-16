# Firebase security

This folder contains application-level Firebase session security helpers.

- `firebaseSecurity.ts` revokes all application sessions by changing a per-user session version.
- Every browser should subscribe to that document and sign out when the version changes.
- `firebaseSecurity.test.ts` contains automated unit tests for UID validation and the revocation write.

## Important limitation

Firebase client SDK code cannot revoke Firebase refresh tokens. For high-assurance security, deploy a trusted Cloud Function using the Firebase Admin SDK and call `admin.auth().revokeRefreshTokens(uid)`. The current mechanism invalidates open application sessions, while Firebase Auth token revocation remains a backend responsibility.
