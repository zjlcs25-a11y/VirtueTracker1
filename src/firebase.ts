import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Fill these in from Firebase Console > Project Settings > General > Your apps > SDK setup and configuration.
// These values are safe to expose in client code - they are not secrets. Access to your data is controlled by
// the Firestore Security Rules you set in the Firebase Console, not by hiding this config.
const firebaseConfig = {
  apiKey: "AIzaSyBmIDsm95IvKVDf-ogp6CBJOnnC06EFlTE",
  authDomain: "virtue-tracker-9ac13.firebaseapp.com",
  projectId: "virtue-tracker-9ac13",
  storageBucket: "virtue-tracker-9ac13.firebasestorage.app",
  messagingSenderId: "88357035021",
  appId: "1:88357035021:web:3a8a1e410641a637948944",
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (isFirebaseConfigured) {
  // Lets the app keep working offline and sync once back online. Safe no-op if unsupported
  // or if multiple tabs are open (falls back to network-only in that case).
  enableIndexedDbPersistence(db).catch(() => {});
}
