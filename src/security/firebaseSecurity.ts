/**
 * Firebase security helpers.
 *
 * Keep all security-related browser code in this folder. Destructive account
 * deletion is delegated to a callable Cloud Function; the Admin SDK must
 * never be bundled into the frontend.
 */
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth, db } from "../firebase/firebaseConfig";

const sessionDocument = (uid: string) =>
  doc(db, "users", uid, "security", "session");

const requireUid = (uid: string) => {
  if (!uid.trim()) throw new Error("A valid user ID is required.");
};

export const revokeAllApplicationSessions = async (uid: string): Promise<void> => {
  requireUid(uid);
  await setDoc(
    sessionDocument(uid),
    { sessionVersion: crypto.randomUUID(), updatedAt: serverTimestamp() },
    { merge: true },
  );
};

export const subscribeToSessionRevocation = (
  uid: string,
  onRevoked: () => void,
  onError?: (error: Error) => void,
) => {
  requireUid(uid);
  const storageKey = `firebase-session-version:${uid}`;
  return onSnapshot(
    sessionDocument(uid),
    (snapshot) => {
      const version = snapshot.data()?.sessionVersion;
      const previousVersion = localStorage.getItem(storageKey);
      if (version && previousVersion && version !== previousVersion) onRevoked();
      if (version) localStorage.setItem(storageKey, version);
    },
    (error) => onError?.(error),
  );
};

/** Re-authenticate with the password before invoking the destructive backend. */
export const reauthenticateWithPassword = async (password: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser?.email) throw new Error("No authenticated email account found.");
  if (!password) throw new Error("Password is required.");

  const credential = EmailAuthProvider.credential(currentUser.email, password);
  await reauthenticateWithCredential(currentUser, credential);
  await currentUser.getIdToken(true);
};

/** Permanently deletes the authenticated account and its backend-owned data. */
export const deleteAccountAndData = async (): Promise<void> => {
  const functions = getFunctions();
  const callable = httpsCallable<{ confirmation: string }, { deleted: boolean }>(
    functions,
    "deleteAccountAndData",
  );
  const result = await callable({ confirmation: "DELETE_ACCOUNT" });
  if (!result.data.deleted) throw new Error("Account deletion was not confirmed.");
};
