/**
 * Trusted backend operations for the application.
 *
 * This callable function deliberately performs the destructive operation on
 * the server. The Admin SDK is never exposed to the browser.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

initializeApp();

const MAX_AUTH_AGE_SECONDS = 5 * 60;

exports.deleteAccountAndData = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  if (request.data?.confirmation !== "DELETE_ACCOUNT") {
    throw new HttpsError("invalid-argument", "Invalid deletion confirmation.");
  }

  const authTime = Number(request.auth.token?.auth_time);
  const now = Math.floor(Date.now() / 1000);
  if (!authTime || now - authTime > MAX_AUTH_AGE_SECONDS) {
    throw new HttpsError(
      "failed-precondition",
      "Recent password authentication is required.",
    );
  }

  const uid = request.auth.uid;
  const firestore = getFirestore();
  const userDocument = firestore.doc(`users/${uid}`);

  // Recursively remove the complete user document tree, including subcollections.
  await firestore.recursiveDelete(userDocument);

  // Delete files only from the user's private Storage namespace.
  await getStorage().bucket().deleteFiles({ prefix: `users/${uid}/` });

  // Finally remove the Firebase Authentication account.
  await getAuth().deleteUser(uid);

  return { deleted: true };
});
