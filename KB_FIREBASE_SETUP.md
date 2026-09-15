# KB Firebase setup

The KB now reads from `knowledgeBase/main` with `onSnapshot`, so all authenticated users receive changes in real time.

Only the administrator UI can edit the KB. For actual database security, deploy `firestore.rules` and give your Firebase account the custom Auth claim:

```js
admin.auth().setCustomUserClaims("YOUR_ADMIN_UID", { admin: true });
```

After setting the claim, sign out and sign in again so the ID token refreshes.
