/**
 * Security-sensitive Firebase callable functions.
 * The Admin SDK is server-only and must never be bundled into the frontend.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

initializeApp();

const MAX_AUTH_AGE_SECONDS = 5 * 60;
const requireRecentAuth = (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Authentication is required.');
  const authTime = Number(request.auth.token?.auth_time);
  const now = Math.floor(Date.now() / 1000);
  if (!authTime || now - authTime > MAX_AUTH_AGE_SECONDS) {
    throw new HttpsError('failed-precondition', 'Recent authentication is required.');
  }
};

exports.revokeAllSessions = onCall({ enforceAppCheck: true }, async (request) => {
  requireRecentAuth(request);
  if (request.data && Object.keys(request.data).length !== 0) {
    throw new HttpsError('invalid-argument', 'No arguments are accepted.');
  }
  const uid = request.auth.uid;
  await getAuth().revokeRefreshTokens(uid);
  await getFirestore().doc(`users/${uid}/security/session`).set({
    sessionVersion: require('crypto').randomUUID(),
    updatedAt: new Date(),
  }, { merge: true });
  return { revoked: true };
});

exports.deleteAccountAndData = onCall({ enforceAppCheck: true }, async (request) => {
  requireRecentAuth(request);
  if (!request.data || request.data.confirmation !== 'DELETE_ACCOUNT' || Object.keys(request.data).length !== 1) {
    throw new HttpsError('invalid-argument', 'Invalid deletion confirmation.');
  }

  const uid = request.auth.uid;
  const firestore = getFirestore();
  const bucket = getStorage().bucket();

  // Revoke tokens first so other sessions lose access immediately.
  await getAuth().revokeRefreshTokens(uid);
  await firestore.recursiveDelete(firestore.doc(`users/${uid}`));
  await bucket.deleteFiles({ prefix: `users/${uid}/` });
  await getAuth().deleteUser(uid);

  return { deleted: true };
});
