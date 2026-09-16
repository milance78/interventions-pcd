import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

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

/*
 * App Check is opt-in until the Enterprise site key is configured.
 * This keeps local development and the no-billing setup working.
 * The key must be the public reCAPTCHA Enterprise site key registered
 * in Firebase Console > App Check.
 */
const appCheckSiteKey =
  import.meta.env.VITE_FIREBASE_APPCHECK_ENTERPRISE_SITE_KEY?.trim();

if (appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

const db = getFirestore(app);
const auth = getAuth(app);

export { app, auth, db };
