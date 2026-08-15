import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export type UserProfile = {
  username?: string;
  email?: string;
};

const createUserProfile = async (
  uid: string,
  username: string,
  email: string,
) => {
  await setDoc(doc(db, "users", uid), {
    username,
    email,
    createdAt: new Date(),
  });
};

const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
};

export { createUserProfile, getUserProfile };
