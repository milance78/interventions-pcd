import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDQOpVCd95wCiLzZ759rULX8eWAGiDtleM",
  authDomain: "taches-pcd.firebaseapp.com",
  projectId: "taches-pcd",
  storageBucket: "taches-pcd.firebasestorage.app",
  messagingSenderId: "817411208363",
  appId: "1:817411208363:web:eb599408f1987d399373ee",
  measurementId: "G-80FP37DMJT",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { auth, db };
