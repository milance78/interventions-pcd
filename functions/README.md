# Firebase security functions

## Deployment

From the project root:

```bash
npm install
npm --prefix functions install
firebase login
firebase use taches-pcd
firebase deploy --only functions,firestore:rules
```

`deleteAccountAndData` requires an authenticated callable request, the exact
`DELETE_ACCOUNT` confirmation value, and a Firebase ID token whose
`auth_time` is no older than five minutes. The frontend re-authenticates with
the password before calling it.

The function recursively deletes `users/{uid}`, deletes Storage files under
`users/{uid}/`, and then deletes the Firebase Authentication account.

Keep all future Firebase security code in `src/security/` or `functions/`.
