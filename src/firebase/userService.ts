import { setDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
const createUserProfile = async (uid, username, email) => {
  await setDoc(doc(db, "users", uid), {
    username,
    email,
    createdAt: new Date(),
  });
};
export { createUserProfile };
