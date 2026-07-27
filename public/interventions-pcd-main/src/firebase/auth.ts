import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
const registerUser = async (email, password) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};
const loginUser = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};
const logoutUser = async () => {
  await signOut(auth);
};
const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};
const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};
const getAuthenticatedUser = async () => {
  await auth.authStateReady();
  if (auth.currentUser) {
    return auth.currentUser;
  }
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      () => {
        unsubscribe();
        resolve(null);
      },
    );
  });
};
export {
  getAuthenticatedUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  subscribeToAuthChanges,
};
